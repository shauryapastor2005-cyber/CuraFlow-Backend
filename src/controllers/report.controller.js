import { v2 as cloudinary } from "cloudinary";
import { Report } from "../models/report.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { verifyPatientOwnership } from "../utils/verifyPatientOwnership.js";

const ALLOWED_UPDATE_FIELDS = [
  "category",
  "reportName",
  "remarks",
  "reportDate",
];

const createReport = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const { category, reportName, remarks, reportDate } = req.body;

  if (!reportName?.trim()) {
    throw new ApiError(400, "Report name is required");
  }

  const reportLocalPath = req.files?.reportFile?.[0]?.path;

  if (!reportLocalPath) {
    throw new ApiError(400, "Report file is required");
  }

  const uploadedReport = await uploadOnCloudinary(reportLocalPath);

  if (!uploadedReport) {
    throw new ApiError(500, "Failed to upload report");
  }

  try {
    const report = await Report.create({
      patient: patientId,
      uploadedBy: req.user._id,
      category,
      reportName,
      reportFile: uploadedReport.secure_url,
      reportPublicId: uploadedReport.public_id,
      remarks,
      reportDate,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, report, "Report uploaded successfully"));
  } catch (error) {
    await cloudinary.uploader.destroy(uploadedReport.public_id);
    throw new ApiError(500, error.message);
  }
});

const getPatientReports = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  await verifyPatientOwnership(patientId, req.user._id);

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const { category, startDate, endDate } = req.query;

  const filter = {
    patient: patientId,
    isActive: true,
  };

  if (category) {
    filter.category = category;
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);

    filter.reportDate = {
      $gte: start,
      $lte: end,
    };

    const reports = await Report.find(filter).sort({ reportDate: -1 });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          reports,
          reports.length ? "Reports fetched successfully" : "No report found"
        )
      );
  }

  const reports = await Report.find(filter)
    .sort({ reportDate: -1 })
    .skip(skip)
    .limit(limit);

  const totalReports = await Report.countDocuments(filter);
  const totalPages = Math.ceil(totalReports / limit);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        reports,
        pagination: {
          totalReports,
          currentPage: page,
          totalPages,
        },
      },
      reports.length ? "Reports fetched successfully" : "No report found"
    )
  );
});

const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await Report.findOne({
    _id: reportId,
    isActive: true,
  });

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  await verifyPatientOwnership(report.patient, req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        report,
        "Report fetched successfully"
      )
    );
});

const updateReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await Report.findOne({
    _id: reportId,
    isActive: true,
  });

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  await verifyPatientOwnership(report.patient, req.user._id);

  let hasUpdate = false;

  ALLOWED_UPDATE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      report[field] = req.body[field];
      hasUpdate = true;
    }
  });

  const reportLocalPath = req.files?.reportFile?.[0]?.path;
  let oldReportPublicId = null;

  if (reportLocalPath) {
    const uploadedReport = await uploadOnCloudinary(reportLocalPath);

    if (!uploadedReport) {
      throw new ApiError(500, "Failed to upload report");
    }
    // Store old Cloudinary public_id before replacing it
    oldReportPublicId = report.reportPublicId;
    report.reportFile = uploadedReport.secure_url;
    report.reportPublicId = uploadedReport.public_id;
    hasUpdate = true;
  }

  if (!hasUpdate) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  try {
    await report.save();
  } catch (error) {
    // If database save fails after uploading a new file,
    // delete the newly uploaded file to avoid orphaned files.
    if (reportLocalPath && report.reportPublicId) {
      await cloudinary.uploader.destroy(report.reportPublicId);
    }

    throw error;
  }
  // Database updated successfully.
  // Now remove the old Cloudinary file.
  if (oldReportPublicId) {
    try {
      await cloudinary.uploader.destroy(oldReportPublicId);
    } catch (error) {
      console.error(error);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, report, "Report updated successfully"));
});

const deleteReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  const report = await Report.findOne({
    _id: reportId,
    isActive: true,
  });

  if (!report) {
    throw new ApiError(404, "Report not found");
  }

  await verifyPatientOwnership(report.patient, req.user._id);

  if (report.reportPublicId) {
    try {
      await cloudinary.uploader.destroy(report.reportPublicId);
    } catch (error) {
      console.error(error);
      throw new ApiError(
        500,
        error?.message || "Failed to delete report from Cloudinary"
      );
    }
  }

  report.isActive = false;
  await report.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Report deleted successfully"));
});

export {
  createReport,
  getPatientReports,
  getReportById,
  updateReport,
  deleteReport,
};
