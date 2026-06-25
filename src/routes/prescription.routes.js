import { Router } from "express";
import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
} from "../controllers/prescription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Mounted at /api/v1/prescriptions  for individual prescription routes
const router = Router();
router.use(verifyJWT);

router
  .route("/:prescriptionId")
  .get(getPrescriptionById)
  .patch(updatePrescription)
  .delete(deletePrescription);

// Mounted at /api/v1/patients/:patientId/prescriptions   for patient's prescription routes
const nestedRouter = Router({ mergeParams: true });
nestedRouter.use(verifyJWT);

nestedRouter.route("/").post(createPrescription).get(getAllPrescriptions);

export { router as default, nestedRouter as prescriptionNestedRouter };
