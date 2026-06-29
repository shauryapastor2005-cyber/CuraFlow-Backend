import { Physiotherapy } from "../../models/physiotherapy.model.js";

const observations = [
  "Improved sitting balance with fewer verbal cues.",
  "Practiced assisted standing with good effort.",
  "Completed gentle range of motion exercises with mild fatigue.",
  "Worked on gait training and weight shifting with caregiver support.",
  "Showed better shoulder control during upper limb exercises.",
  "Needed rest breaks but remained engaged throughout therapy.",
  "Improved transfer practice from bed to chair.",
  "Focused on ankle mobility and lower limb strengthening.",
  "Practiced hand grip and release with gradual improvement.",
  "Maintained posture longer during seated trunk control exercises.",
];

const missedSessionObservations = [
  "Session missed due to fatigue; caregiver advised to resume gently.",
  "Session missed because patient was not comfortable enough for therapy.",
];

const exercisePlans = {
  Critical: [
    "Passive range of motion",
    "Bed positioning",
    "Breathing exercises",
  ],
  Severe: [
    "Assisted sitting balance",
    "Supported standing",
    "Transfer practice",
  ],
  Moderate: ["Gait training", "Lower limb strengthening", "Balance training"],
  Mild: ["Walking practice", "Step training", "Fine motor exercises"],
};

const getTotalDays = (profile) => {
  if (profile.historyLength === "7 days") return 7;
  if (profile.historyLength === "30 days") return 30;
  if (profile.historyLength === "6 months") return 180;
  if (profile.historyLength === "1 year") return 365;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const recoveryStartDate = new Date(profile.recoveryStartDate);
  recoveryStartDate.setUTCHours(0, 0, 0, 0);

  const days =
    Math.floor((today - recoveryStartDate) / (1000 * 60 * 60 * 24)) + 1;

  return Math.max(days, 1);
};

const getStageName = (day) => {
  let stageName = "firstWeek";

  if (day > 7 && day <= 30) stageName = "firstMonth";
  if (day > 30 && day <= 180) stageName = "sixMonths";
  if (day > 180) stageName = "oneYear";

  return stageName;
};

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getImprovementStatus = (stageName, attended) => {
  if (!attended) return "Missed";
  if (stageName === "firstWeek") return "Needs support";
  if (stageName === "firstMonth") return "Gradual improvement";
  if (stageName === "sixMonths") return "Improving";

  return "Maintaining progress";
};

const buildExercises = (profile, duration, attended) => {
  const plan = exercisePlans[profile.severity] || exercisePlans.Moderate;
  const exerciseDuration = attended ? Math.max(Math.floor(duration / 3), 5) : 0;

  return plan.map((exerciseName) => {
    let painLevel = "Mild";
    let difficulty = "Moderate";

    if (profile.severity === "Critical" || profile.severity === "Severe") {
      painLevel = attended ? "Moderate" : "Mild";
      difficulty = "Difficult";
    }

    if (profile.severity === "Mild") {
      painLevel = attended ? "None" : "Mild";
      difficulty = "Easy";
    }

    return {
      exerciseName,
      duration: exerciseDuration,
      completed: attended,
      painLevel,
      difficulty,
    };
  });
};

const seedPhysiotherapySessions = async (
  patientProfiles,
  patients,
  recoveryCurves
) => {
  try {
    console.log("Creating physiotherapy sessions...");

    const physiotherapySessions = [];

    for (let i = 0; i < patientProfiles.length; i += 1) {
      const profile = patientProfiles[i];
      const patient = patients[i];
      const totalDays = getTotalDays(profile);

      for (let day = 1; day <= totalDays; day += 1) {
        const dayOfWeekInRecovery = (day - 1) % 7;
        const shouldScheduleSession =
          dayOfWeekInRecovery === 0 ||
          dayOfWeekInRecovery === 2 ||
          dayOfWeekInRecovery === 4;

        if (!shouldScheduleSession) {
          continue;
        }

        const stageName = getStageName(day);
        const curve = recoveryCurves[profile.severity][stageName];
        const attendanceChance = getRandomNumber(
          curve.physiotherapyAttendance.min,
          curve.physiotherapyAttendance.max
        );
        const attended = Math.random() * 100 <= attendanceChance;
        const averageDuration = getRandomNumber(
          curve.averageSessionDuration.min,
          curve.averageSessionDuration.max
        );
        const duration = attended ? averageDuration : 0;

        const date = new Date();
        date.setUTCHours(0, 0, 0, 0);
        date.setUTCDate(date.getUTCDate() - (totalDays - day));

        const observationList = attended
          ? observations
          : missedSessionObservations;
        const observation =
          observationList[Math.floor(Math.random() * observationList.length)];
        const improvementStatus = getImprovementStatus(stageName, attended);

        const physiotherapySession = await Physiotherapy.create({
          patient: patient._id,
          recordedBy: profile.caregiver._id,
          date,
          exercises: buildExercises(profile, duration, attended),
          notes: `${observation} Improvement status: ${improvementStatus}.`,
          isActive: true,
        });

        physiotherapySessions.push(physiotherapySession);
      }
    }

    console.log(
      `${physiotherapySessions.length} physiotherapy sessions created.`
    );

    return physiotherapySessions;
  } catch (error) {
    console.error("Failed to create physiotherapy sessions:", error.message);
    throw error;
  }
};

export { seedPhysiotherapySessions };
