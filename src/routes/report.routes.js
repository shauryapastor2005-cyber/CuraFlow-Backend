import { Router } from "express";
import {
  createReport,
  getPatientReports,
  getReportById,
  updateReport,
  deleteReport,
} from "../controllers/report.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

// Individual Report CRUD
const reportRouter = Router();

reportRouter.use(verifyJWT);

reportRouter
  .route("/:reportId")
  .get(getReportById)
  .patch(
    upload.fields([
      {
        name: "reportFile",
        maxCount: 1,
      },
    ]),
    updateReport
  )
  .delete(deleteReport);

const patientReportRouter = Router({ mergeParams: true });

patientReportRouter.use(verifyJWT);

// Patient Reports collection (supports category and date-range queries)
patientReportRouter
  .route("/")
  .post(
    upload.fields([
      {
        name: "reportFile",
        maxCount: 1,
      },
    ]),
    createReport
  )
  .get(getPatientReports);

export { reportRouter, patientReportRouter };
