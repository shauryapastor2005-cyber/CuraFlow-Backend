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
nestedRouter.get("/search", searchMedicine);
nestedRouter.get("/current", getCurrentMedicines);
nestedRouter.get("/history", getMedicineTimeline);
nestedRouter.get("/expiring", getExpiringMedicines);

export { router as default, nestedRouter as prescriptionNestedRouter };
