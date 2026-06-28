import { Prescription } from "../models/prescription.model.js";
import { DailyLog } from "../models/dailyLog.model.js";
import { Vital } from "../models/vital.model.js";
import { Physiotherapy } from "../models/physiotherapy.model.js";
import { Report } from "../models/report.model.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";
import { buildSummaryPrompt } from "../utils/promptBuilder.js";
import { generateGeminiResponse } from "./gemini.service.js";

const PROMPT_VERSION = "curaflow-summary-v1";
const MAX_REPORTS = 5;

//helpers for date related functionality
const getDateRangeStart = (range) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (range === "week") {
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setUTCDate(today.getUTCDate() - 6);
    return sixDaysAgo;
  }

  if (range === "month") {
    const twentyNineDaysAgo = new Date(today);
    twentyNineDaysAgo.setUTCDate(today.getUTCDate() - 29);
    return twentyNineDaysAgo;
  }

  if (range === "6months") {
    const oneHundredEightyDaysAgo = new Date(today);
    oneHundredEightyDaysAgo.setUTCDate(today.getUTCDate() - 180);
    return oneHundredEightyDaysAgo;
  }

  if (range === "all") {
    return null;
  }

  throw new ApiError(400, "Invalid range");
};

const getAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return null;
  }

  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();

  const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth();
  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
};

const buildDateFilter = (dateFrom, fieldName = "date") => {
  return dateFrom
    ? {
        [fieldName]: { $gte: dateFrom },
      }
    : {};
};

// helper for analytics
const getDailyLogAnalytics = async (patientId, dateFrom) => {
  const analytics = await DailyLog.aggregate([
    {
      $match: {
        patient: patientId,
        isActive: true,
        ...buildDateFilter(dateFrom),
      },
    },
    {
      $group: {
        _id: null,
        totalLogs: { $sum: 1 },
        medicineTakenCount: {
          $sum: { $cond: ["$medicinesTaken", 1, 0] },
        },
        missedMedicineCount: {
          $sum: { $cond: ["$medicinesTaken", 0, 1] },
        },
        exerciseDoneCount: {
          $sum: { $cond: ["$exerciseDone", 1, 0] },
        },
        averageSleep: { $avg: "$sleepHours" },
        averageWaterIntake: { $avg: "$waterIntake" },
      },
    },
    {
      $project: {
        _id: 0,
        totalLogs: 1,
        medicineTakenCount: 1,
        missedMedicineCount: 1,
        medicineAdherencePercentage: {
          $multiply: [{ $divide: ["$medicineTakenCount", "$totalLogs"] }, 100],
        },
        exerciseCompletionPercentage: {
          $multiply: [{ $divide: ["$exerciseDoneCount", "$totalLogs"] }, 100],
        },
        averageSleep: 1,
        averageWaterIntake: 1,
      },
    },
  ]);

  return analytics[0] || null;
};

const getVitalAnalytics = async (patientId, dateFrom) => {
  const analytics = await Vital.aggregate([
    {
      $match: {
        patient: patientId,
        isActive: true,
        ...buildDateFilter(dateFrom),
      },
    },
    {
      $group: {
        _id: null,
        totalMeasurements: { $sum: 1 },
        averageBloodPressureSystolic: { $avg: "$bloodPressureSystolic" },
        minimumBloodPressureSystolic: { $min: "$bloodPressureSystolic" },
        maximumBloodPressureSystolic: { $max: "$bloodPressureSystolic" },
        averageBloodPressureDiastolic: { $avg: "$bloodPressureDiastolic" },
        minimumBloodPressureDiastolic: { $min: "$bloodPressureDiastolic" },
        maximumBloodPressureDiastolic: { $max: "$bloodPressureDiastolic" },
        averageHeartRate: { $avg: "$heartRate" },
        minimumHeartRate: { $min: "$heartRate" },
        maximumHeartRate: { $max: "$heartRate" },
        averageBloodSugar: { $avg: "$bloodSugar" },
        minimumBloodSugar: { $min: "$bloodSugar" },
        maximumBloodSugar: { $max: "$bloodSugar" },
        averageWeight: { $avg: "$weight" },
        averageTemperature: { $avg: "$temperature" },
        averageOxygenSaturation: { $avg: "$oxygenSaturation" },
      },
    },
    {
      $project: {
        _id: 0,
        totalMeasurements: 1,
        bloodPressure: {
          systolic: {
            average: "$averageBloodPressureSystolic",
            minimum: "$minimumBloodPressureSystolic",
            maximum: "$maximumBloodPressureSystolic",
          },
          diastolic: {
            average: "$averageBloodPressureDiastolic",
            minimum: "$minimumBloodPressureDiastolic",
            maximum: "$maximumBloodPressureDiastolic",
          },
        },
        heartRate: {
          average: "$averageHeartRate",
          minimum: "$minimumHeartRate",
          maximum: "$maximumHeartRate",
        },
        bloodSugar: {
          average: "$averageBloodSugar",
          minimum: "$minimumBloodSugar",
          maximum: "$maximumBloodSugar",
        },
        weight: {
          average: "$averageWeight",
        },
        temperature: {
          average: "$averageTemperature",
        },
        oxygenSaturation: {
          average: "$averageOxygenSaturation",
        },
      },
    },
  ]);

  return analytics[0] || null;
};

const getPhysiotherapyAnalytics = async (patientId, dateFrom) => {
  const sessionCompletedExpression = {
    $not: [{ $in: [false, "$exercises.completed"] }], //returns true if not false is present in exercises.completed array i.e session is said to  be complete
  };

  const analytics = await Physiotherapy.aggregate([
    {
      $match: {
        patient: patientId,
        isActive: true,
        ...buildDateFilter(dateFrom),
      },
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        sessionsCompleted: {
          $sum: { $cond: [sessionCompletedExpression, 1, 0] },
        },
        averageDuration: { $avg: { $sum: "$exercises.duration" } }, // averaging the total duration aggregated over all sessions i.e simple avg duration per session
      },
    },
    {
      $project: {
        _id: 0,
        totalSessions: 1,
        sessionsCompleted: 1,
        sessionsMissed: {
          $subtract: ["$totalSessions", "$sessionsCompleted"],
        },
        completionPercentage: {
          $multiply: [
            { $divide: ["$sessionsCompleted", "$totalSessions"] },
            100,
          ],
        },
        averageDuration: 1,
      },
    },
  ]);

  return analytics[0] || null;
};

const generatePatientSummary = async (
  patientId,
  caregiverId,
  range = "month"
) => {
  const dateFrom = getDateRangeStart(range);

  //authorization
  const patient = await verifyPatientOwnership(patientId, caregiverId);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [
    dailyLogAnalytics,
    vitalAnalytics,
    physiotherapyAnalytics,
    prescriptions,
    reports,
  ] = await Promise.all([
    getDailyLogAnalytics(patient._id, dateFrom),
    getVitalAnalytics(patient._id, dateFrom),
    getPhysiotherapyAnalytics(patient._id, dateFrom),
    Prescription.find({
      patient: patient._id,
      isActive: true,
      startDate: { $lte: today },
      $or: [{ endDate: { $gte: today } }, { endDate: null }],
    })
      .select("-_id medicineName dosage frequency")
      .sort({ createdAt: -1 })
      .lean(),
    Report.find({
      patient: patient._id,
      isActive: true,
      ...buildDateFilter(dateFrom, "reportDate"),
    })
      .select("-_id category reportName remarks reportDate")
      .sort({ reportDate: -1 })
      .limit(MAX_REPORTS)
      .lean(),
  ]);

  const context = {
    patient: {
      fullname: patient.fullname,
      age: getAge(patient.dateOfBirth),
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      allergies: patient.allergies,
      notes: patient.notes,
    },
    dailyLogAnalytics,
    vitalAnalytics,
    physiotherapyAnalytics,
    prescriptions: prescriptions.map((prescription) => ({
      medicine: prescription.medicineName,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
    })),
    reports,
  };

  const prompt = buildSummaryPrompt(context);
  const summary = await generateGeminiResponse(prompt);

  return {
    patientId,
    summary,
    generatedAt: new Date(),
    promptVersion: PROMPT_VERSION,
  };
};

export { generatePatientSummary };
