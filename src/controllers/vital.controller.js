import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";
import { Vital } from "../models/vital.model.js";
import { validateDateNotInFuture } from "../utils/validateDateNotInFuture.js";

const ALLOWED_UPDATE_FIELDS = [
  "date",
  "bloodPressureSystolic",
  "bloodPressureDiastolic",
  "heartRate",
  "temperature",
  "oxygenSaturation",
  "bloodSugar",
  "weight",
  "notes",
];

const createVital = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const {
    date,
    bloodPressureSystolic,
    bloodPressureDiastolic,
    heartRate,
    temperature,
    oxygenSaturation,
    bloodSugar,
    weight,
    notes,
  } = req.body;

  if (!date) {
    throw new ApiError(400, "Date is required");
  }

  validateDateNotInFuture(date, "Vital record date cannot be in the future.");

  try {
    const vital = await Vital.create({
      patient: patientId,
      recordedBy: req.user._id,
      date,
      bloodPressureSystolic,
      bloodPressureDiastolic,
      heartRate,
      temperature,
      oxygenSaturation,
      bloodSugar,
      weight,
      notes,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, vital, "Vital record created successfully"));
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "A vital record already exists for this patient on this date"
      );
    }
    throw error;
  }
});

const getPatientVitals = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const { page = 1, limit = 10, startDate, endDate } = req.query;

  if (startDate && endDate) {
    validateDateNotInFuture(startDate, "Start date cannot be in the future.");

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);
    const vital = await Vital.find({
      patient: patientId,
      isActive: true,
      date: {
        $gte: start,
        $lte: end,
      },
    }).sort({ date: -1 });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          vital,
          vital.length ? "Vitals fetched successfully" : "No vitals found"
        )
      );
  }

  const pageNumber = Math.max(parseInt(page, 10) || 1, 1); //parse string from beginning and stops at first non int char and convert it to decimal as parseint(string,radix),radix =10 or base =10
  const pageLimit = Math.max(parseInt(limit, 10) || 10, 1);

  const skip = (pageNumber - 1) * pageLimit;

  const totalVitals = await Vital.countDocuments({
    patient: patientId,
    isActive: true,
  });

  const vitals = await Vital.find({
    patient: patientId,
    isActive: true,
  })
    .sort({ date: -1 })
    .skip(skip)
    .limit(pageLimit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        vitals,
        pagination: {
          totalVitals,
          currentPage: pageNumber,
        },
      },
      vitals.length ? "Vitals fetched successfully" : "No vitals found"
    )
  );
});

const getVitalById = asyncHandler(async (req, res) => {
  const { vitalId } = req.params;

  const query = {
    _id: vitalId,
    isActive: true,
  };

  const vital = await Vital.findOne(query);

  if (!vital) {
    throw new ApiError(404, "Vital record not found");
  }

  await verifyPatientOwnership(vital.patient, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, vital, "Vital record fetched successfully"));
});

const updateVital = asyncHandler(async (req, res) => {
  const { vitalId } = req.params;

  const query = {
    _id: vitalId,
    isActive: true,
  };

  const vital = await Vital.findOne(query);

  if (!vital) {
    throw new ApiError(404, "Vital record not found");
  }

  await verifyPatientOwnership(vital.patient, req.user._id);

  if (req.body.date !== undefined) {
    validateDateNotInFuture(
      req.body.date,
      "Vital record date cannot be in the future."
    );
  }

  let hasUpdate = false;

  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      vital[field] = req.body[field];
      hasUpdate = true;
    }
  });

  if (!hasUpdate) {
    throw new ApiError(400, "No valid fields provided for update");
  }
  // save() triggers pre("validate") — runs date normalization middleware
  try {
    await vital.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "A vital record already exists for this patient on this date"
      );
    }
    throw error;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, vital, "Vital record updated successfully"));
});

const deleteVital = asyncHandler(async (req, res) => {
  const { vitalId } = req.params;

  const vital = await Vital.findOne({ _id: vitalId, isActive: true });

  if (!vital) {
    throw new ApiError(404, "Vital record not found");
  }

  await verifyPatientOwnership(vital.patient, req.user._id);

  vital.isActive = false;
  await vital.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Vital record deleted successfully"));
});

const getTodayVital = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  // Dates are stored normalized to midnight UTC, so an equality match is enough
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const vital = await Vital.findOne({
    patient: patientId,
    date: today,
    isActive: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        vital,
        vital
          ? "Today's vital record fetched successfully"
          : "No vital records found today"
      )
    );
});

const getWeeklyVitals = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sixDaysAgo = new Date(today);
  sixDaysAgo.setUTCDate(today.getUTCDate() - 6);

  const vitals = await Vital.find({
    patient: patientId,
    date: { $gte: sixDaysAgo, $lte: today },
    isActive: true,
  }).sort({ date: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        vitals,
        vitals.length
          ? "Weekly vitals fetched successfully"
          : "No weekly vitals found"
      )
    );
});

const getVitalAnalytics = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { range = "week" } = req.query; //default query is week

  const patient = await verifyPatientOwnership(patientId, req.user._id);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const dateFilter = {
    $lte: today,
  };

  if (range === "week") {
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setUTCDate(today.getUTCDate() - 6);
    dateFilter.$gte = sixDaysAgo;
  } else if (range === "month") {
    const twentyNineDaysAgo = new Date(today);
    twentyNineDaysAgo.setUTCDate(today.getUTCDate() - 29);
    dateFilter.$gte = twentyNineDaysAgo;
  } else if (range === "6months") {
    const oneHundredEightyDaysAgo = new Date(today);
    oneHundredEightyDaysAgo.setUTCDate(today.getUTCDate() - 180);
    dateFilter.$gte = oneHundredEightyDaysAgo;
  } else if (range !== "all") {
    throw new ApiError(400, "Invalid range");
  }

  const matchFilter = {
    patient: patient._id,
    isActive: true,
    date: dateFilter,
  };

  const [summaryResult, history] = await Promise.all([
    Vital.aggregate([
      {
        $match: matchFilter,
      },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          averageBloodPressureSystolic: { $avg: "$bloodPressureSystolic" },
          averageBloodPressureDiastolic: { $avg: "$bloodPressureDiastolic" },
          averageHeartRate: { $avg: "$heartRate" },
          averageTemperature: { $avg: "$temperature" },
          averageOxygenSaturation: { $avg: "$oxygenSaturation" },
          averageBloodSugar: { $avg: "$bloodSugar" },
          averageWeight: { $avg: "$weight" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRecords: 1,
          averageBloodPressure: {
            systolic: "$averageBloodPressureSystolic",
            diastolic: "$averageBloodPressureDiastolic",
          },
          averageHeartRate: 1,
          averageTemperature: 1,
          averageOxygenSaturation: 1,
          averageBloodSugar: 1,
          averageWeight: 1,
        },
      },
    ]),
    Vital.find(matchFilter).sort({ date: -1 }),
  ]);

  const analytics = {
    range,
    summary: summaryResult[0] || null,
    history, //it is purely frontend design decision to return history for future frontend integration
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, analytics, "Vital analytics fetched successfully")
    );
});

export {
  createVital,
  getPatientVitals,
  getVitalById,
  updateVital,
  deleteVital,
  getTodayVital,
  getWeeklyVitals,
  getVitalAnalytics,
};
