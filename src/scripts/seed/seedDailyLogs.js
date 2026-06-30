import { DailyLog } from "../../models/dailyLog.model.js";

const seedDailyLogs = async (
  patientProfiles,
  patients,
  caregivers,
  recoveryCurves
) => {
  try {
    console.log("Creating daily logs...");

    const dailyLogs = [];
    const notes = [
      "Patient completed routine care with caregiver support.",
      "Patient appeared comfortable and followed the daily plan.",
      "Caregiver reported steady participation today.",
      "Patient needed encouragement but completed key activities.",
      "No major concerns reported during the daily check-in.",
    ];

    for (let i = 0; i < patientProfiles.length; i += 1) {
      const profile = patientProfiles[i];
      const patient = patients[i];
      const caregiver = profile.caregiver || caregivers[0];
      let totalDays = 30;

      if (profile.historyLength === "7 days") totalDays = 7;
      if (profile.historyLength === "6 months") totalDays = 180;
      if (profile.historyLength === "1 year") totalDays = 365;

      for (let day = 1; day <= totalDays; day += 1) {
        let stageName = "firstWeek";

        if (day > 7 && day <= 30) stageName = "firstMonth";
        if (day > 30 && day <= 180) stageName = "sixMonths";
        if (day > 180 && day < 366) stageName = "oneYear";

        const curve = recoveryCurves[profile.severity][stageName];
        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCDate(date.getUTCDate() - (totalDays - day));

        const medicineChance =
          Math.floor(
            Math.random() *
              (curve.medicineAdherence.max - curve.medicineAdherence.min + 1)
          ) + curve.medicineAdherence.min;
        const physiotherapyChance =
          Math.floor(
            Math.random() *
              (curve.physiotherapyAdherence.max -
                curve.physiotherapyAdherence.min +
                1)
          ) + curve.physiotherapyAdherence.min;
        const exerciseChance =
          Math.floor(
            Math.random() *
              (curve.exerciseAdherence.max - curve.exerciseAdherence.min + 1)
          ) + curve.exerciseAdherence.min;
        const sleepHours =
          Math.floor(Math.random() * (curve.sleep.max - curve.sleep.min + 1)) +
          curve.sleep.min;

        let appetite = "Normal";
        if (curve.appetite === "Poor" || curve.appetite === "Low") {
          appetite = "Poor";
        }
        if (curve.appetite === "Good") {
          appetite = "Good";
        }

        let mood = "Neutral";
        if (curve.mood === "Low") mood = "Bad";
        if (curve.mood === "Anxious") mood = "Neutral";
        if (curve.mood === "Improving") mood = "Good";
        if (curve.mood === "Positive") mood = "Very Good";

        const dailyLog = await DailyLog.create({
          patient: patient._id,
          loggedBy: caregiver._id,
          date,
          exerciseDone: Math.random() * 100 <= exerciseChance,
          physiotherapyDone: Math.random() * 100 <= physiotherapyChance,
          medicinesTaken: Math.random() * 100 <= medicineChance,
          waterIntake: appetite === "Poor" ? 1.5 : 2.5,
          sleepHours,
          bowelMovement: Math.random() * 100 <= 80,
          appetite,
          mood,
          notes: notes[Math.floor(Math.random() * notes.length)],
          isActive: true,
        });

        dailyLogs.push(dailyLog);
      }
    }

    console.log(`${dailyLogs.length} daily logs created.`);

    return dailyLogs;
  } catch (error) {
    console.error("Failed to create daily logs:", error.message);
    throw error;
  }
};

export { seedDailyLogs };
