import "dotenv/config";
import mongoose from "mongoose";
import connectDB from "../../db/index.js";
import { clearDatabase } from "./clearDatabase.js";
import { seedAdmin } from "./seedAdmin.js";
import { seedCaregivers } from "./seedCaregivers.js";
import { generatePatientProfiles } from "./generatePatientProfiles.js";
import { seedPatients } from "./seedPatients.js";
import { medicationBundles } from "../profiles/medicationBundles.js";
import { seedPrescriptions } from "./seedPrescriptions.js";
import { recoveryCurves } from "../profiles/recoveryCurves.js";
import { seedDailyLogs } from "./seedDailyLogs.js";
import { seedVitals } from "./seedVitals.js";
import { seedPhysiotherapySessions } from "./seedPhysiotherapySessions.js";
import { seedReports } from "./seedReports.js";

const seedDatabase = async () => {
  let exitCode = 0;

  try {
    await connectDB();
    await clearDatabase();

    const admin = await seedAdmin();
    const caregivers = await seedCaregivers();
    const patientProfiles = generatePatientProfiles(caregivers);
    const patients = await seedPatients(patientProfiles);
    const prescriptions = await seedPrescriptions(
      patientProfiles,
      patients,
      medicationBundles
    );
    const dailyLogs = await seedDailyLogs(
      patientProfiles,
      patients,
      caregivers,
      recoveryCurves
    );
    const vitals = await seedVitals(
      patientProfiles,
      patients,
      dailyLogs,
      recoveryCurves
    );
    const physiotherapySessions = await seedPhysiotherapySessions(
      patientProfiles,
      patients,
      recoveryCurves
    );
    const reports = await seedReports(patientProfiles, patients);

    console.log("");
    console.log("Seed summary:");
    console.log(`Admin users: ${admin ? 1 : 0}`);
    console.log(`Caregivers: ${caregivers.length}`);
    console.log(`Patient profiles: ${patientProfiles.length}`);
    console.log(`Patients: ${patients.length}`);
    console.log(`Prescriptions: ${prescriptions.length}`);
    console.log(`Daily logs: ${dailyLogs.length}`);
    console.log(`Vitals: ${vitals.length}`);
    console.log(`Physiotherapy sessions: ${physiotherapySessions.length}`);
    console.log(`Reports: ${reports.length}`);
    console.log("");
    console.log("Database seeded successfully.");
  } catch (error) {
    exitCode = 1;
    console.error("Database seeding failed:", error.message);
  } finally {
    try {
      await mongoose.disconnect();
      console.log("Database connection closed.");
    } catch (error) {
      console.error("Failed to disconnect:", error.message);
    }

    process.exit(exitCode);
  }
};

seedDatabase();
