import { Patient } from "../models/patients.model.js";
import { ApiError } from "./ApiError.js";
//utility function to verify patient ownership
const verifyPatientOwnership = async (patientId, user) => {
  if (user?.role === "admin") {
    const patient = await Patient.findOne({
      _id: patientId,
      isActive: true,
    });

    if (!patient) {
      throw new ApiError(404, "Patient not found or access denied");
    }

    return patient;
  }

  const patient = await Patient.findOne({
    _id: patientId,
    caregiver: user?._id || user,
    isActive: true,
  });

  if (!patient) {
    throw new ApiError(404, "Patient not found or access denied");
  }

  return patient;
};

export { verifyPatientOwnership };
