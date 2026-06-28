import { Router } from "express";
import { createPatientSummary } from "../controllers/summary.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true });

router.use(verifyJWT);

router.route("/").post(createPatientSummary);

export default router;
