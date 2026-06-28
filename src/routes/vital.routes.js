import { Router } from "express";
import {
  createVital,
  getPatientVitals,
  getVitalById,
  updateVital,
  deleteVital,
  getTodayVital,
  getWeeklyVitals,
  getVitalAnalytics,
} from "../controllers/vital.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const vitalRouter = Router();

vitalRouter.use(verifyJWT);

vitalRouter
  .route("/:vitalId")
  .get(getVitalById)
  .patch(updateVital)
  .delete(deleteVital);

const patientVitalRouter = Router({ mergeParams: true }); //important field to select so as to merge request param from previous paths

patientVitalRouter.use(verifyJWT);

patientVitalRouter.route("/today").get(getTodayVital);
patientVitalRouter.route("/weekly").get(getWeeklyVitals);
patientVitalRouter.route("/analytics").get(getVitalAnalytics);

patientVitalRouter.route("/").post(createVital).get(getPatientVitals);

export { vitalRouter, patientVitalRouter };
