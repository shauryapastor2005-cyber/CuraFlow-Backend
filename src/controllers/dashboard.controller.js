import { Patient } from "../models/patients.model.js";
import { Prescription } from "../models/prescription.model.js";
import { DailyLog } from "../models/dailyLog.model.js";
import { Vital } from "../models/vital.model.js";
import { Physiotherapy } from "../models/physiotherapy.model.js";
import { Report } from "../models/report.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";

const getDashboard = asyncHandler(async (req, res) => {
  const caregiverId = req.user._id;

  // Dates across health modules are compared at midnight UTC.
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const [totalPatients, activePatients, activePatientRecords, recentPatients] =
    await Promise.all([
      Patient.countDocuments({ caregiver: caregiverId }),
      Patient.countDocuments({ caregiver: caregiverId, isActive: true }),
      Patient.find({ caregiver: caregiverId, isActive: true }).select("_id"),
      Patient.find({ caregiver: caregiverId, isActive: true })
        .select("fullname age gender")
        .sort({ createdAt: -1 })
        .limit(5), // recently added 5 patients
    ]);

  const patientIds = activePatientRecords.map((patient) => patient._id); //tranforming array of objects into array of ids

  const medicineScheduleFilter = {
    patient: { $in: patientIds },
    isActive: true,
    startDate: { $lt: tomorrow }, //we can have used lte:today but it makes code flexible if we later plan to allow un-normalised dates
    $or: [{ endDate: { $gte: today } }, { endDate: null }],
  };

  const [
    medicineSchedules,
    completedMedicineLogs,
    reportsUploadedToday,
    vitalsRecorded,
    physiotherapySessions,
    recentReports,
  ] = await Promise.all([
    Prescription.countDocuments(medicineScheduleFilter),
    DailyLog.find({
      patient: { $in: patientIds },
      loggedBy: caregiverId,
      date: today,
      medicinesTaken: true,
      isActive: true,
    }).select("patient"),
    Report.countDocuments({
      patient: { $in: patientIds },
      uploadedBy: caregiverId,
      createdAt: { $gte: today, $lt: tomorrow },
      isActive: true,
    }),
    Vital.countDocuments({
      patient: { $in: patientIds },
      recordedBy: caregiverId,
      date: today,
      isActive: true,
    }),
    Physiotherapy.countDocuments({
      patient: { $in: patientIds },
      recordedBy: caregiverId,
      date: today,
      isActive: true,
    }),
    Report.find({
      patient: { $in: patientIds },
      uploadedBy: caregiverId,
      isActive: true,
    })
      .sort({ reportDate: -1 })
      .limit(5)
      .populate("patient", "fullname"),
  ]);

  const completedPatientIds = completedMedicineLogs.map((log) => log.patient);

  const medicineCompleted = await Prescription.countDocuments({
    ...medicineScheduleFilter, // Reuse the base prescription filter but replace
    // the patient list with patients who completed today's medicines.
    patient: { $in: completedPatientIds },
  });

  const dashboard = {
    overview: {
      totalPatients,
      activePatients,
      reportsUploadedToday,
    },
    today: {
      medicineSchedules,
      medicineCompleted,
      medicinePending: Math.max(medicineSchedules - medicineCompleted, 0),
      vitalsRecorded,
      physiotherapySessions,
    },
    recentPatients,
    recentReports,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, dashboard, "Dashboard fetched successfully"));
});

const getPatientDashboard = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const patient = await verifyPatientOwnership(patientId, req.user._id);

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(today.getUTCDate() + 1);

  const sixDaysBefore = new Date(today);
  sixDaysBefore.setUTCDate(today.getUTCDate() - 6);

  const prescriptionFilter = {
    patient: patientId,
    isActive: true,
    startDate: { $lt: tomorrow },
    $or: [{ endDate: { $gte: today } }, { endDate: null }],
  };

  const [
    weeklyLog,
    currentPrescription,
    weeklyVitals,
    weeklyPhysiotherapy,
    weeklyReports,
  ] = await Promise.all([
    DailyLog.find({
      patient: patientId,
      loggedBy: req.user._id,
      date: {
        $gte: sixDaysBefore,
        $lt: tomorrow,
      },
      isActive: true,
    })
      .sort({ date: -1 })
      .select(
        "medicinesTaken physiotherapyDone exerciseDone waterIntake sleepHours bowelMovement appetite mood"
      ),
    Prescription.find(prescriptionFilter).sort({ createdAt: -1 }),
    Vital.find({
      patient: patientId,
      recordedBy: req.user._id,
      isActive: true,
      date: {
        $gte: sixDaysBefore,
        $lt: tomorrow,
      },
    }).sort({ date: -1 }),
    Physiotherapy.find({
      patient: patientId,
      recordedBy: req.user._id,
      isActive: true,
      date: {
        $gte: sixDaysBefore,
        $lt: tomorrow,
      },
    }).sort({ date: -1 }),
    Report.find({
      patient: patientId,
      uploadedBy: req.user._id,
      isActive: true,
      reportDate: {
        $gte: sixDaysBefore,
        $lt: tomorrow,
      },
    }).sort({ reportDate: -1 }),
  ]);

  const dashboard = {
    patient: {
      fullname: patient.fullname,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
    },
    weeklySummary: {
      weeklyLog,
      currentPrescription,
      weeklyVitals,
      weeklyPhysiotherapy,
      weeklyReports,
    },
  };

  return res
    .status(200)
    .json(
      new ApiResponse(200, dashboard, "Patient dashboard fetched successfully")
    );
});

export { getDashboard, getPatientDashboard };
