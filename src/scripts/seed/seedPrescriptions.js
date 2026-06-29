import { Prescription } from "../../models/prescription.model.js";

const seedPrescriptions = async (
  patientProfiles,
  patients,
  medicationBundles
) => {
  try {
    console.log("Creating prescriptions...");

    const prescriptions = [];
    const startDate = new Date();

    for (let i = 0; i < patientProfiles.length; i += 1) {
      const profile = patientProfiles[i];
      const patient = patients[i];
      let bundleName = "criticalStroke";

      if (profile.severity !== "Critical") {
        const bundleNames = {
          "Mild-Ischemic": "mildIschemicStroke",
          "Moderate-Ischemic": "moderateIschemicStroke",
          "Severe-Ischemic": "severeIschemicStroke",
          Hemorrhagic: "hemorrhagicStroke",
          TIA: "tia",
          Brainstem: "brainstemStroke",
          Cerebellar: "cerebellarStroke",
        };

        bundleName =
          bundleNames[`${profile.severity}-${profile.strokeType}`] ||
          bundleNames[profile.strokeType] ||
          "criticalStroke";
      }

      const medicines = medicationBundles[bundleName];

      for (const medicine of medicines) {
        const prescription = await Prescription.create({
          patient: patient._id,
          doctorName: "Dr. Meera Sharma",
          medicineName: medicine.medicineName,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          route: "Oral",
          startDate,
          instructions: `Take ${medicine.timing}.`,
          isActive: true,
        });

        prescriptions.push(prescription);
      }
    }

    console.log(`${prescriptions.length} prescriptions created successfully.`);

    return prescriptions;
  } catch (error) {
    console.error("Failed to create prescriptions:", error.message);
    throw error;
  }
};

export { seedPrescriptions };
