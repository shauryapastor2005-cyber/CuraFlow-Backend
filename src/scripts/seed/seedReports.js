import { Report } from "../../models/report.model.js";

const reportNames = [
  "MRI Brain",
  "CT Brain",
  "Blood Investigation",
  "CBC Report",
  "Lipid Profile",
  "Physiotherapy Assessment",
  "Neurology Follow-up",
  "Speech Therapy Evaluation",
  "Progress Review",
];

const remarks = [
  "Mild improvement noted.",
  "Continue physiotherapy.",
  "Residual weakness persists.",
  "Speech improving.",
  "Stable neurological findings.",
  "Continue medications.",
  "No acute deterioration.",
];

const placeholderReportUrl =
  "https://res.cloudinary.com/dna6rpwb6/image/upload/v1782715190/Sample-MRI-Dictations_vbtsqr.pdf";
const placeholderReportPublicId = "seed-reports/sample-report";

const getReportCount = (historyLength) => {
  if (historyLength === "7 days") return 1;
  if (historyLength === "30 days") return 2;
  if (historyLength === "6 months") return 6;
  if (historyLength === "1 year") return 12;

  return 1;
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

const getReportCategory = (reportName) => {
  if (reportName === "MRI Brain") return "MRI";
  if (reportName === "CT Brain") return "CT";
  if (reportName === "CBC Report") return "CBC";

  return "Other";
};

const getRandomItem = (items) => {
  return items[Math.floor(Math.random() * items.length)];
};

const seedReports = async (patientProfiles, patients) => {
  try {
    console.log("Creating reports...");

    const reports = [];

    for (let i = 0; i < patientProfiles.length; i += 1) {
      const profile = patientProfiles[i];
      const patient = patients[i];
      const totalDays = getTotalDays(profile);
      const reportCount = getReportCount(profile.historyLength);
      const reportGap = Math.floor(totalDays / reportCount);

      for (
        let reportNumber = 1;
        reportNumber <= reportCount;
        reportNumber += 1
      ) {
        const reportName = getRandomItem(reportNames);
        const reportDate = new Date();
        const daysAgo = totalDays - reportGap * reportNumber;

        reportDate.setUTCHours(0, 0, 0, 0);
        reportDate.setUTCDate(reportDate.getUTCDate() - Math.max(daysAgo, 0));

        const report = await Report.create({
          patient: patient._id,
          uploadedBy: profile.caregiver._id,
          category: getReportCategory(reportName),
          reportName,
          reportFile: placeholderReportUrl,
          reportPublicId: placeholderReportPublicId,
          remarks: getRandomItem(remarks),
          reportDate,
          isActive: true,
        });

        reports.push(report);
      }
    }

    console.log(`${reports.length} reports created.`);

    return reports;
  } catch (error) {
    console.error("Failed to create reports:", error.message);
    throw error;
  }
};

export { seedReports };
