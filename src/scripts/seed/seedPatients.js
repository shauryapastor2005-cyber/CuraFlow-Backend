import { Patient } from "../../models/patients.model.js";

const seedPatients = async (patientProfiles) => {
  try {
    console.log("Creating patients...");

    const patients = [];

    for (const profile of patientProfiles) {
      const dateOfBirth = new Date();
      dateOfBirth.setUTCFullYear(dateOfBirth.getUTCFullYear() - profile.age);

      const patient = await Patient.create({
        caregiver: profile.caregiver._id,
        fullname: profile.fullname,
        dateOfBirth,
        gender: profile.gender,
        bloodGroup: "O+",
        profilePhoto: "",
        contactNumber: profile.phone,
        emergencyContact: profile.emergencyContact,
        address: profile.address,
        allergies: [],
        notes: `${profile.strokeType} stroke, ${profile.severity} severity, ${profile.recoveryTrend} recovery trend.`,
        isActive: true,
      });

      patients.push(patient);
    }

    console.log("20 patients created successfully.");

    return patients;
  } catch (error) {
    console.error("Failed to create patients:", error.message);
    throw error;
  }
};

export { seedPatients };
