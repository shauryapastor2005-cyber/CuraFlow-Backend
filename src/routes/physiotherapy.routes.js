import { Router } from "express";
import {
  createPhysiotherapy,
  getPatientPhysiotherapy,
  getPhysiotherapyById,
  updatePhysiotherapy,
  deletePhysiotherapy,
  getTodayPhysiotherapy,
  getWeeklyPhysiotherapy,
} from "../controllers/physiotherapy.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Individual Physiotherapy CRUD
const physiotherapyRouter = Router();

physiotherapyRouter.use(verifyJWT);

physiotherapyRouter
  .route("/:physiotherapyId")
  .get(getPhysiotherapyById)
  .patch(updatePhysiotherapy)
  .delete(deletePhysiotherapy);

const patientPhysiotherapyRouter = Router({ mergeParams: true });

patientPhysiotherapyRouter.use(verifyJWT);

// Patient-specific query endpoints
patientPhysiotherapyRouter.route("/today").get(getTodayPhysiotherapy);
patientPhysiotherapyRouter.route("/weekly").get(getWeeklyPhysiotherapy);

// Patient Physiotherapy collection (supports date-range queries)
patientPhysiotherapyRouter
  .route("/")
  .post(createPhysiotherapy)
  .get(getPatientPhysiotherapy);

export { physiotherapyRouter, patientPhysiotherapyRouter };
