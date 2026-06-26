import { Router } from "express";
import {
  createPrescription,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  searchMedicine,
  getCurrentMedicines,
  getMedicineTimeline,
  getExpiringMedicines,
} from "../controllers/prescription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Mounted at /api/v1/prescriptions  for individual prescription routes
const prescriptionRouter = Router();
prescriptionRouter.use(verifyJWT);

prescriptionRouter
  .route("/:prescriptionId")
  .get(getPrescriptionById)
  .patch(updatePrescription)
  .delete(deletePrescription);

// Mounted at /api/v1/patients/:patientId/prescriptions   for patient's prescription routes
const prescriptionNestedRouter = Router({ mergeParams: true });
prescriptionNestedRouter.use(verifyJWT);

prescriptionNestedRouter
  .route("/")
  .post(createPrescription)
  .get(getAllPrescriptions);
prescriptionNestedRouter.get("/search", searchMedicine);
prescriptionNestedRouter.get("/current", getCurrentMedicines);
prescriptionNestedRouter.get("/history", getMedicineTimeline);
prescriptionNestedRouter.get("/expiring", getExpiringMedicines);

export { prescriptionRouter, prescriptionNestedRouter };
