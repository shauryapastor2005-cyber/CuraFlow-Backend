import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Patient } from "../models/patients.model.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";
const createPatient = asyncHandler(async (req, res) => {
  const {
    fullname,
    dateOfBirth,
    gender,
    bloodGroup,
    contactNumber,
    emergencyContact,
    address,
    allergies,
    notes,
  } = req.body;

  if (!fullname?.trim() || !dateOfBirth || !gender) {
    throw new ApiError(400, "fullname, dateOfBirth, and gender are required");
  }
  //checking if user exists
  const existingPatient = await Patient.findOne({
    caregiver: req.user._id,
    fullname,
    dateOfBirth,
    isActive: true,
  });

  if (existingPatient) {
    throw new ApiError(409, "Patient already exists");
  }

  const patient = await Patient.create({
    caregiver: req.user._id,
    fullname,
    dateOfBirth,
    gender,
    bloodGroup,
    contactNumber,
    emergencyContact,
    address,
    allergies,
    notes,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, patient, "Patient created successfully"));
});

//pagination and search patients
const getAllPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "" } = req.query; //page and limit are the page number and the number of patients per page

  const pageNum = Math.max(1, parseInt(page)); //page number is the page number to display
  const limitNum = Math.min(50, Math.max(1, parseInt(limit))); //limit number is the number of patients per page
  const skip = (pageNum - 1) * limitNum; //skip is the number of patients to skip

  const query = {
    caregiver: req.user._id, //caregiver is the user who is creating the patient
    isActive: true, //isActive is the status of the patient
  };
  //if search is a string and search is not empty, then search for the patient by name
  if (typeof search === "string" && search.trim()) {
    query.fullname = { $regex: search.trim(), $options: "i" };
  }

  const patients = await Patient.find(query) //find the patients by the query
    .sort({ createdAt: -1 }) //sort the patients by the created at date in descending order
    .skip(skip) //skip the number of patients to skip
    .limit(limitNum); //limit the number of patients to display

  const total = await Patient.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        patients,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
      patients.length ? "Patients fetched successfully" : "No patients found"
    )
  );
});

// Fetch complete details of a specific patient.
const getPatientById = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const patient = await verifyPatientOwnership(patientId, req.user._id);

  return res
    .status(200)
    .json(new ApiResponse(200, patient, "Patient fetched successfully"));
});

// Update patient details.
const updatePatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params; //
  const {
    fullname,
    dateOfBirth,
    gender,
    bloodGroup,
    contactNumber,
    emergencyContact,
    address,
    allergies,
    notes,
  } = req.body;

  const patient = await verifyPatientOwnership(patientId, req.user._id);

  if (fullname !== undefined) patient.fullname = fullname;
  if (dateOfBirth !== undefined) patient.dateOfBirth = dateOfBirth;
  if (gender !== undefined) patient.gender = gender;
  if (bloodGroup !== undefined) patient.bloodGroup = bloodGroup;
  if (contactNumber !== undefined) patient.contactNumber = contactNumber;
  if (emergencyContact !== undefined)
    patient.emergencyContact = emergencyContact;
  if (address !== undefined) patient.address = address;
  if (allergies !== undefined) patient.allergies = allergies;
  if (notes !== undefined) patient.notes = notes;

  await patient.save();

  return res
    .status(200)
    .json(new ApiResponse(200, patient, "Patient updated successfully"));
});

const deletePatient = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const patient = await verifyPatientOwnership(patientId, req.user._id);

  patient.isActive = false;
  await patient.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Patient deleted successfully"));
});

export {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};
