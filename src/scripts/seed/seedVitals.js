import { Vital } from "../../models/vital.model.js";

const seedVitals = async (
  patientProfiles,
  patients,
  dailyLogs,
  recoveryCurves
) => {
  try {
    console.log("Creating vitals...");

    const vitals = [];
    const notes = [
      "Vitals reviewed and within expected recovery range.",
      "Patient remained clinically stable during assessment.",
      "Caregiver reported no new vital concerns today.",
      "Vitals show steady post-stroke monitoring progress.",
      "Routine vital check completed without urgent findings.",
    ];

    for (const dailyLog of dailyLogs) {
      const patientIndex = patients.findIndex(
        (patient) => String(patient._id) === String(dailyLog.patient)
      );
      const profile = patientProfiles[patientIndex];
      const patient = patients[patientIndex];
      const logDate = new Date(dailyLog.date);
      const recoveryStartDate = new Date(profile.recoveryStartDate);
      recoveryStartDate.setUTCHours(0, 0, 0, 0);

      const daysSinceRecoveryStart =
        Math.floor((logDate - recoveryStartDate) / (1000 * 60 * 60 * 24)) + 1;

      let stageName = "firstWeek";

      if (daysSinceRecoveryStart > 7 && daysSinceRecoveryStart <= 30) {
        stageName = "firstMonth";
      }
      if (daysSinceRecoveryStart > 30 && daysSinceRecoveryStart <= 180) {
        stageName = "sixMonths";
      }
      if (daysSinceRecoveryStart > 180) {
        stageName = "oneYear";
      }

      const curve = recoveryCurves[profile.severity][stageName];
      const bloodPressure = curve.bloodPressure;

      const vital = await Vital.create({
        patient: patient._id,
        recordedBy: dailyLog.loggedBy,
        date: dailyLog.date,
        bloodPressureSystolic:
          Math.floor(
            Math.random() *
              (bloodPressure.systolicMax - bloodPressure.systolicMin + 1)
          ) + bloodPressure.systolicMin,
        bloodPressureDiastolic:
          Math.floor(
            Math.random() *
              (bloodPressure.diastolicMax - bloodPressure.diastolicMin + 1)
          ) + bloodPressure.diastolicMin,
        heartRate:
          Math.floor(
            Math.random() * (curve.heartRate.max - curve.heartRate.min + 1)
          ) + curve.heartRate.min,
        oxygenSaturation:
          Math.floor(
            Math.random() *
              (curve.oxygenSaturation.max - curve.oxygenSaturation.min + 1)
          ) + curve.oxygenSaturation.min,
        bloodSugar:
          Math.floor(
            Math.random() * (curve.bloodSugar.max - curve.bloodSugar.min + 1)
          ) + curve.bloodSugar.min,
        notes: notes[Math.floor(Math.random() * notes.length)],
        isActive: true,
      });

      vitals.push(vital);
    }

    console.log(`${vitals.length} vital records created.`);

    return vitals;
  } catch (error) {
    console.error("Failed to create vitals:", error.message);
    throw error;
  }
};

export { seedVitals };
