import { Prescription } from "../models/prescription.model.js";
import { Patient } from "../models/patients.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";

const createPrescription = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const {
    medicineName,
    dosage,
    frequency,
    route,
    startDate,
    endDate,
    instructions,
    doctorName,
  } = req.body;

  if (!medicineName || !dosage || !frequency || !startDate || !doctorName) {
    throw new ApiError(
      400,
      "medicineName, dosage, frequency, doctor's name and startDate are required"
    );
  }

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (end && end < start) {
    throw new ApiError(400, "End date cannot be earlier than start date");
  }

  await verifyPatientOwnership(patientId, req.user);

  const prescription = await Prescription.create({
    patient: patientId,
    medicineName,
    dosage,
    frequency,
    route,
    startDate,
    endDate,
    instructions,
    doctorName,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, prescription, "Prescription created successfully")
    );
});

//Retrieve all precription of queried patients to authenticated caregiver
const getAllPrescriptions = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const pageNum = Math.max(1, parseInt(req.query.page) || 1); //extract page number from query params
  const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10)); //extract limit number from query params or setting to default 10
  const skip = (pageNum - 1) * limitNum; //calculate skip number

  await verifyPatientOwnership(patientId, req.user);

  const filter = { patient: patientId, isActive: true };

  const prescriptions = await Prescription.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select("-patient");

  const total = await Prescription.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        prescriptions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      prescriptions.length
        ? "Prescriptions fetched successfully"
        : "No prescriptions found"
    )
  );
});

// Retrieve a single prescription belonging to the authenticated caregiver
const getPrescriptionById = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;

  const filter = {
    _id: prescriptionId,
    isActive: true,
  };
  const prescription = await Prescription.findOne(filter);

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  await verifyPatientOwnership(prescription.patient, req.user); //to authenticate caregiver access

  return res
    .status(200)
    .json(
      new ApiResponse(200, prescription, "Prescription fetched successfully")
    );
});

const updatePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;

  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    isActive: true,
  });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  await verifyPatientOwnership(prescription.patient, req.user);

  const {
    medicineName,
    dosage,
    frequency,
    route,
    startDate,
    endDate,
    instructions,
    doctorName,
  } = req.body;

  const resolvedStartDate = startDate
    ? new Date(startDate)
    : prescription.startDate;
  const resolvedEndDate = endDate ? new Date(endDate) : prescription.endDate;

  if (resolvedEndDate && resolvedEndDate < resolvedStartDate) {
    throw new ApiError(400, "End date cannot be earlier than start date");
  }

  if (doctorName !== undefined) prescription.doctorName = doctorName;
  if (medicineName !== undefined) prescription.medicineName = medicineName;
  if (dosage !== undefined) prescription.dosage = dosage;
  if (frequency !== undefined) prescription.frequency = frequency;
  if (route !== undefined) prescription.route = route;
  if (startDate !== undefined) prescription.startDate = startDate;
  if (endDate !== undefined) prescription.endDate = endDate;
  if (instructions !== undefined) prescription.instructions = instructions;

  await prescription.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, prescription, "Prescription updated successfully")
    );
});

const deletePrescription = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;

  const prescription = await Prescription.findOne({
    _id: prescriptionId,
    isActive: true,
  });

  if (!prescription) {
    throw new ApiError(404, "Prescription not found");
  }

  await verifyPatientOwnership(prescription.patient, req.user);

  prescription.isActive = false;
  await prescription.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Prescription deleted successfully"));
});

//can search whether given patient has this prescription or not
const searchMedicine = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { medicine } = req.query;

  if (!medicine) {
    throw new ApiError(400, "medicine query parameter is required");
  }

  await verifyPatientOwnership(patientId, req.user);

  const prescriptions = await Prescription.find({
    patient: patientId,
    medicineName: { $regex: medicine, $options: "i" },
    isActive: true,
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        prescriptions,
        prescriptions.length
          ? "Search results fetched successfully"
          : "No search results found"
      )
    );
});

//returns all active prescription going on
const getCurrentMedicines = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user);

  const today = new Date();

  const prescriptions = await Prescription.find({
    patient: patientId,
    isActive: true,
    startDate: { $lte: today },
    $or: [{ endDate: { $gte: today } }, { endDate: null }],
  }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        prescriptions,
        prescriptions.length
          ? "Current medicines fetched successfully"
          : "No current medicines found"
      )
    );
});

//gives timeline of a medicine i.e past history
const getMedicineTimeline = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { medicine } = req.query;

  if (!medicine) {
    throw new ApiError(400, "medicine query parameter is required");
  }

  await verifyPatientOwnership(patientId, req.user);

  const prescriptions = await Prescription.find({
    patient: patientId,
    medicineName: { $regex: medicine, $options: "i" },
    isActive: true,
  }).sort({ startDate: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        prescriptions,
        prescriptions.length
          ? "Medicine timeline fetched successfully"
          : "No medicine timeline found"
      )
    );
});

//returns medicines expiring in next N days
const getExpiringMedicines = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const days = Math.max(1, parseInt(req.query.days) || 7);

  const today = new Date();
  const cutoff = new Date();
  cutoff.setDate(today.getDate() + days);

  await verifyPatientOwnership(patientId, req.user);

  const prescriptions = await Prescription.find({
    patient: patientId,
    isActive: true,
    endDate: { $gte: today, $lte: cutoff },
  }).sort({ endDate: 1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        prescriptions,
        prescriptions.length
          ? "Expiring medicines fetched successfully"
          : "No expiring medicines found"
      )
    );
});

export {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  searchMedicine,
  getCurrentMedicines,
  getMedicineTimeline,
  getExpiringMedicines,
};
