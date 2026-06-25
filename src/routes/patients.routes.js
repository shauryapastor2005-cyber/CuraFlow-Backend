import { Router } from "express";
import {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} from "../controllers/patients.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createPatient).get(getAllPatients);

router
  .route("/:patientId")
  .get(getPatientById)
  .patch(updatePatient)
  .delete(deletePatient);

export default router;
