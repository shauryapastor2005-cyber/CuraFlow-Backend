import { DailyLog } from "../models/dailyLog.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";

const ALLOWED_UPDATE_FIELDS = [
  "date",
  "exerciseDone",
  "physiotherapyDone",
  "medicinesTaken",
  "waterIntake",
  "sleepHours",
  "bowelMovement",
  "appetite",
  "mood",
  "notes",
];

const createDailyLog = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const {
    date,
    exerciseDone,
    physiotherapyDone,
    medicinesTaken,
    waterIntake,
    sleepHours,
    bowelMovement,
    appetite,
    mood,
    notes,
  } = req.body;

  if (!date) {
    throw new ApiError(400, "Date is required to create a daily log");
  }

  let dailyLog;

  //important: we need to use try catch as if user tries to create multiple
  //logs on same day it must be shown as error
  try {
    dailyLog = await DailyLog.create({
      patient: patientId,
      loggedBy: req.user._id,
      date,
      exerciseDone,
      physiotherapyDone,
      medicinesTaken,
      waterIntake,
      sleepHours,
      bowelMovement,
      appetite,
      mood,
      notes,
    });
  } catch (error) {
    if (error.code === 11000) {
      //duplicate key error , remember while indexing we set index to be true
      throw new ApiError(
        409,
        "A daily log already exists for this patient on this date"
      );
    }
    throw error;
  }

  return res
    .status(201)
    .json(new ApiResponse(201, dailyLog, "Daily log created successfully"));
});

const getPatientLogs = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const { startDate, endDate, page = 1, limit = 10 } = req.query;

  // range query handling
  if (startDate && endDate) {
    const logs = await DailyLog.find({
      patient: patientId,
      isActive: true,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, logs, "Daily logs fetched successfully"));
  }

  // default paginated response
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1); //parse string from beginning and stops at first non int char and convert it to decimal as parseint(string,radix),radix =10 or base =10
  const pageLimit = Math.max(parseInt(limit, 10) || 10, 1);

  const logs = await DailyLog.find({ patient: patientId, isActive: true })
    .sort({ date: -1 })
    .skip((pageNumber - 1) * pageLimit)
    .limit(pageLimit);
  const totalLogs = await DailyLog.countDocuments({
    patient: patientId,
    isActive: true,
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        logs,
        pagination: {
          totalLogs,
          currentPage: pageNumber,
          totalPages: Math.ceil(totalLogs / pageLimit),
        },
      },
      "Daily logs fetched successfully"
    )
  );
});

const getDailyLogById = asyncHandler(async (req, res) => {
  const { logId } = req.params;

  const filter = {
    _id: logId,
    isActive: true,
  };

  const dailyLog = await DailyLog.findOne(filter);

  if (!dailyLog) {
    throw new ApiError(404, "Daily log not found");
  }

  await verifyPatientOwnership(dailyLog.patient, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, dailyLog, "Daily log fetched successfully"));
});

const updateDailyLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;

  const filter = {
    _id: logId,
    isActive: true,
  };

  const dailyLog = await DailyLog.findOne(filter);

  if (!dailyLog) {
    throw new ApiError(404, "Daily log not found");
  }

  await verifyPatientOwnership(dailyLog.patient, req.user._id);

  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      dailyLog[field] = req.body[field];
    }
  });

  try {
    await dailyLog.save(); //DB WILL SAVE THIS AND OUR HOOKS WILL HANDLE IF DUPLICATE DATE IS ENTERED
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(
        409,
        "A daily log already exists for this patient on this date"
      );
    }
    throw error;
  }

  return res
    .status(200)
    .json(new ApiResponse(200, dailyLog, "Daily log updated successfully"));
});

const deleteDailyLog = asyncHandler(async (req, res) => {
  const { logId } = req.params;

  const filter = {
    _id: logId,
    isActive: true,
  };

  const dailyLog = await DailyLog.findOne(filter);

  if (!dailyLog) {
    throw new ApiError(404, "Daily log not found");
  }

  await verifyPatientOwnership(dailyLog.patient, req.user._id);

  dailyLog.isActive = false;
  await dailyLog.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Daily log deleted successfully"));
});

const getTodayLog = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const todayLog = await DailyLog.findOne({
    patient: patientId,
    isActive: true,
    date: today,
  });

  if (!todayLog) {
    throw new ApiError(404, "No daily log found for today");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, todayLog, "Today's daily log fetched successfully")
    );
});

const getWeeklyLogs = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const endOfToday = new Date();
  endOfToday.setUTCHours(0, 0, 0, 0);

  const startOfRange = new Date();
  startOfRange.setUTCDate(startOfRange.getUTCDate() - 6);

  const weeklyLogs = await DailyLog.find({
    patient: patientId,
    isActive: true,
    date: { $gte: startOfRange, $lte: endOfToday },
  }).sort({ date: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, weeklyLogs, "Weekly logs fetched successfully"));
});

const getMissedMedicines = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const missedLogs = await DailyLog.find({
    patient: patientId,
    isActive: true,
    medicinesTaken: false,
  }).sort({ date: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        missedLogs,
        "Missed medicine logs fetched successfully"
      )
    );
});

export {
  createDailyLog,
  getPatientLogs,
  getDailyLogById,
  updateDailyLog,
  deleteDailyLog,
  getTodayLog,
  getWeeklyLogs,
  getMissedMedicines,
};
