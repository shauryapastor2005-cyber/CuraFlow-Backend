import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CuraFlow Backend Running",
  });
});

//routes declaration using middleware
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users", userRouter);

import patientRouter from "./routes/patients.routes.js";
app.use("/api/v1/patients", patientRouter);

import {
  prescriptionRouter,
  prescriptionNestedRouter,
} from "./routes/prescription.routes.js";

app.use("/api/v1/prescriptions", prescriptionRouter);
app.use("/api/v1/patients/:patientId/prescriptions", prescriptionNestedRouter);

import {
  dailyLogRouter,
  patientDailyLogRouter,
} from "./routes/dailyLog.routes.js";
app.use("/api/v1/logs", dailyLogRouter);
app.use("/api/v1/patients/:patientId/logs", patientDailyLogRouter);

import { vitalRouter, patientVitalRouter } from "./routes/vital.routes.js";

app.use("/api/v1/vitals", vitalRouter);
app.use("/api/v1/patients/:patientId/vitals", patientVitalRouter);

import {
  physiotherapyRouter,
  patientPhysiotherapyRouter,
} from "./routes/physiotherapy.routes.js";

app.use("/api/v1/physiotherapy", physiotherapyRouter);
app.use(
  "/api/v1/patients/:patientId/physiotherapy",
  patientPhysiotherapyRouter
);

import { reportRouter, patientReportRouter } from "./routes/report.routes.js";

app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/patients/:patientId/reports", patientReportRouter);
export default app;
