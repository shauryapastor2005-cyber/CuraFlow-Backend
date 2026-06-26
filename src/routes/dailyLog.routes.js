import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createDailyLog,
  getPatientLogs,
  getDailyLogById,
  updateDailyLog,
  deleteDailyLog,
  getTodayLog,
  getWeeklyLogs,
  getMissedMedicines,
} from "../controllers/dailyLog.controller.js";

// Mounted at /api/v1/logs
const dailyLogRouter = Router({
  mergeParams: true,
});

dailyLogRouter.use(verifyJWT);

dailyLogRouter
  .route("/:logId")
  .get(getDailyLogById)
  .patch(updateDailyLog)
  .delete(deleteDailyLog);

// Mounted at /api/v1/patients/:patientId/logs
const patientDailyLogRouter = Router({
  mergeParams: true, //very important to merge param to fetch details from req.param
});

patientDailyLogRouter.use(verifyJWT);

// Specific query routes
patientDailyLogRouter.route("/today").get(getTodayLog);
patientDailyLogRouter.route("/weekly").get(getWeeklyLogs);
patientDailyLogRouter.route("/missed-medicines").get(getMissedMedicines);

// GET supports range based queries also
patientDailyLogRouter.route("/").post(createDailyLog).get(getPatientLogs);

export { dailyLogRouter, patientDailyLogRouter };
