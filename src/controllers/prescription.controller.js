import { Prescription } from "../models/prescription.model.js";
import { Patient } from "../models/patients.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//helper function to verify patient ownership
const verifyPatientOwnership = async (patientId, caregiverId) => {
  const patient = await Patient.findOne({
    _id: patientId,
    caregiver: caregiverId,
    isActive: true,
  });

  if (!patient) {
    throw new ApiError(404, "Patient not found or access denied");
  }

  return patient;
};

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
  } = req.body;

  if (!medicineName || !dosage || !frequency || !startDate) {
    throw new ApiError(
      400,
      "medicineName, dosage, frequency, and startDate are required"
    );
  }

  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;

  if (end && end < start) {
    throw new ApiError(400, "End date cannot be earlier than start date");
  }

  await verifyPatientOwnership(patientId, req.user._id);

  const prescription = await Prescription.create({
    patient: patientId,
    medicineName,
    dosage,
    frequency,
    route,
    startDate,
    endDate,
    instructions,
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

  await verifyPatientOwnership(patientId, req.user._id);

  const filter = { patient: patientId, isActive: true };

  const prescriptions = await Prescription.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select("-patient");

  const total = await Prescription.countDocuments(filter);

  if (prescriptions.length === 0) {
    throw new ApiError(400, "no prescription found.");
  }

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
      "Prescriptions fetched successfully"
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

  await verifyPatientOwnership(prescription.patient, req.user._id); //to authenticate caregiver access

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

  await verifyPatientOwnership(prescription.patient, req.user._id);

  const {
    medicineName,
    dosage,
    frequency,
    route,
    startDate,
    endDate,
    instructions,
  } = req.body;

  const resolvedStartDate = startDate
    ? new Date(startDate)
    : prescription.startDate;
  const resolvedEndDate = endDate ? new Date(endDate) : prescription.endDate;

  if (resolvedEndDate && resolvedEndDate < resolvedStartDate) {
    throw new ApiError(400, "End date cannot be earlier than start date");
  }

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

  await verifyPatientOwnership(prescription.patient, req.user._id);

  prescription.isActive = false;
  await prescription.save();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Prescription deleted successfully"));
});

export {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
};
