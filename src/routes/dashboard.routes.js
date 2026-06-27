import { Router } from "express";
import {
  getDashboard,
  getPatientDashboard,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").get(getDashboard);

const patientDashboardRouter = Router({ mergeParams: true });

patientDashboardRouter.use(verifyJWT);

patientDashboardRouter.route("/").get(getPatientDashboard);

export default router;
export { patientDashboardRouter };
