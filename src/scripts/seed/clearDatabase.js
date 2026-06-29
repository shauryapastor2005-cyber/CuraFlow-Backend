import { User } from "../../models/users.model.js";
import { Patient } from "../../models/patients.model.js";
import { Prescription } from "../../models/prescription.model.js";
import { DailyLog } from "../../models/dailyLog.model.js";
import { Vital } from "../../models/vital.model.js";
import { Physiotherapy } from "../../models/physiotherapy.model.js";
import { Report } from "../../models/report.model.js";

const clearDatabase = async () => {
  try {
    console.log("Clearing database...");

    await Report.deleteMany({});
    await Physiotherapy.deleteMany({});
    await Vital.deleteMany({});
    await DailyLog.deleteMany({});
    await Prescription.deleteMany({});
    await Patient.deleteMany({});
    await User.deleteMany({});

    console.log("Database cleared successfully.");
  } catch (error) {
    console.error("Failed to clear database:", error.message);
    throw error;
  }
};

export { clearDatabase };
