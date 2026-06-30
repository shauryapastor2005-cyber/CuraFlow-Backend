import mongoose from "mongoose";

import { User } from "../../models/users.model.js";
import { Patient } from "../../models/patients.model.js";
import { Vital } from "../../models/vital.model.js";

const BENCHMARK_VITAL_COUNT = 10000;

const createBenchmarkVitals = async () => {
  try {
    console.log("Creating benchmark caregiver...");

    const caregiver = await User.create({
      username: "benchmark_caregiver",
      email: "benchmark.caregiver@curaflow.dev",
      fullname: "Benchmark Caregiver",
      avatar: "https://dummyimage.com/200x200",
      password: "Benchmark@123",
      role: "caregiver",
    });

    console.log("Benchmark caregiver created.");

    console.log("Creating benchmark patient...");

    const patient = await Patient.create({
      caregiver: caregiver._id,
      fullname: "Benchmark Patient",
      dateOfBirth: new Date("1965-05-18"),
      gender: "male",
      bloodGroup: "O+",
      contactNumber: "9999999999",
      emergencyContact: {
        name: "Benchmark Relative",
        phone: "8888888888",
        relation: "Son",
      },
      address: {
        street: "Benchmark Street",
        city: "Jhansi",
        state: "Uttar Pradesh",
        pincode: "284001",
      },
      allergies: [],
      notes: "Synthetic patient created for aggregation/index benchmarking.",
    });

    console.log("Benchmark patient created.");

    console.log(`Generating ${BENCHMARK_VITAL_COUNT} vital records...`);

    const vitals = [];

    const startDate = new Date("1998-01-01");

    for (let i = 0; i < BENCHMARK_VITAL_COUNT; i++) {
      const date = new Date(startDate);
      date.setUTCDate(startDate.getUTCDate() + i);

      vitals.push({
        patient: patient._id,
        recordedBy: caregiver._id,
        date,

        bloodPressureSystolic: Math.floor(Math.random() * 31) + 110,

        bloodPressureDiastolic: Math.floor(Math.random() * 21) + 70,

        heartRate: Math.floor(Math.random() * 31) + 60,

        temperature: Number((36 + Math.random() * 2).toFixed(1)),

        oxygenSaturation: Math.floor(Math.random() * 4) + 96,

        bloodSugar: Math.floor(Math.random() * 61) + 90,

        weight: Number((65 + Math.random() * 10).toFixed(1)),

        notes: "Benchmark vital record",

        isActive: true,
      });
    }

    await Vital.insertMany(vitals, {
      ordered: false,
    });

    console.log("Benchmark dataset created successfully.\n");

    console.log("========== BENCHMARK DETAILS ==========");
    console.log(`Caregiver ID : ${caregiver._id}`);
    console.log(`Patient ID   : ${patient._id}`);
    console.log(`Vital Count  : ${BENCHMARK_VITAL_COUNT}`);
    console.log("=======================================");
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export { createBenchmarkVitals };
