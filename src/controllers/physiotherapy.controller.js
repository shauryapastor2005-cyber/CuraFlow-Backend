import { Physiotherapy } from "../models/physiotherapy.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";
import { validateDateNotInFuture } from "../utils/validateDateNotInFuture.js";

const ALLOWED_UPDATE_FIELDS = ["date", "exercises", "notes"];

const createPhysiotherapy = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify the requesting user owns this patient record
  await verifyPatientOwnership(patientId, req.user._id);

  const { date, exercises, notes } = req.body;

  if (!date) {
    throw new ApiError(400, "Date is required");
  }

  validateDateNotInFuture(
    date,
    "Physiotherapy session date cannot be in the future."
  );

  try {
    const physiotherapy = await Physiotherapy.create({
      patient: patientId,
      recordedBy: req.user._id,
      date,
      exercises,
      notes,
    });
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          physiotherapy,
          "Physiotherapy session created successfully"
        )
      );
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "A physiotherapy session already exists for this patient on this date"
      );
    }
    throw error;
  }
});

const getPatientPhysiotherapy = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify ownership
  await verifyPatientOwnership(patientId, req.user._id);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const { startDate, endDate } = req.query;
  // Build date range filter
  if (startDate && endDate) {
    validateDateNotInFuture(startDate, "Start date cannot be in the future.");

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);

    const physiotherapySessions = await Physiotherapy.find({
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
          physiotherapySessions,
          physiotherapySessions.length
            ? "Physiotherapy sessions fetched successfully"
            : "no sessions found"
        )
      );
  }

  const physiotherapySessions = await Physiotherapy.find({
    patient: patientId,
    isActive: true,
  })
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit);

  const totalSessions = await Physiotherapy.countDocuments({
    patient: patientId,
    isActive: true,
  });
  const totalPages = Math.ceil(totalSessions / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        sessions: physiotherapySessions,
        pagination: {
          totalSessions,
          currentPage: page,
          totalPages,
        },
      },
      physiotherapySessions.length
        ? "Physiotherapy sessions fetched successfully"
        : "No sessions found"
    )
  );
});

const getPhysiotherapyById = asyncHandler(async (req, res) => {
  const { physiotherapyId } = req.params;

  const physiotherapy = await Physiotherapy.findOne({
    _id: physiotherapyId,
    isActive: true,
  });

  if (!physiotherapy) {
    throw new ApiError(404, "Physiotherapy session not found");
  }

  //verify ownership
  await verifyPatientOwnership(physiotherapy.patient, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        physiotherapy,
        "Physiotherapy session fetched successfully"
      )
    );
});

const updatePhysiotherapy = asyncHandler(async (req, res) => {
  const { physiotherapyId } = req.params;

  const physiotherapy = await Physiotherapy.findOne({
    _id: physiotherapyId,
    isActive: true,
  });

  if (!physiotherapy) {
    throw new ApiError(404, "Physiotherapy session not found");
  }

  // Verify ownership
  await verifyPatientOwnership(physiotherapy.patient, req.user._id);

  if (req.body.date !== undefined) {
    validateDateNotInFuture(
      req.body.date,
      "Physiotherapy session date cannot be in the future."
    );
  }

  // Apply only allowed fields
  let hasUpdate = false;
  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      physiotherapy[field] = req.body[field];
      hasUpdate = true;
    }
  });

  if (!hasUpdate) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  try {
    await physiotherapy.save();
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "A physiotherapy session already exists for this patient on this date"
      );
    }
    throw error;
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        physiotherapy,
        "Physiotherapy session updated successfully"
      )
    );
});

const deletePhysiotherapy = asyncHandler(async (req, res) => {
  const { physiotherapyId } = req.params;

  const physiotherapy = await Physiotherapy.findOne({
    _id: physiotherapyId,
    isActive: true,
  });

  if (!physiotherapy) {
    throw new ApiError(404, "Physiotherapy session not found");
  }

  // Verify ownership
  await verifyPatientOwnership(physiotherapy.patient, req.user._id);

  // Soft delete
  physiotherapy.isActive = false;
  await physiotherapy.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Physiotherapy session deleted successfully")
    );
});

const getTodayPhysiotherapy = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify ownership
  await verifyPatientOwnership(patientId, req.user._id);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const physiotherapy = await Physiotherapy.findOne({
    patient: patientId,
    date: today,
    isActive: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        physiotherapy,
        physiotherapy
          ? "Today's physiotherapy session fetched successfully"
          : "No physiotherapy session recorded for today"
      )
    );
});

const getWeeklyPhysiotherapy = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Verify ownership
  await verifyPatientOwnership(patientId, req.user._id);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const sixDaysAgo = new Date(today);
  sixDaysAgo.setUTCDate(today.getUTCDate() - 6);

  const physiotherapySessions = await Physiotherapy.find({
    patient: patientId,
    isActive: true,
    date: {
      $gte: sixDaysAgo,
      $lte: today,
    },
  }).sort({ date: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        physiotherapySessions,
        physiotherapySessions.length
          ? "Weekly physiotherapy sessions fetched successfully"
          : "no sessions found"
      )
    );
});

export {
  createPhysiotherapy,
  getPatientPhysiotherapy,
  getPhysiotherapyById,
  updatePhysiotherapy,
  deletePhysiotherapy,
  getTodayPhysiotherapy,
  getWeeklyPhysiotherapy,
};
