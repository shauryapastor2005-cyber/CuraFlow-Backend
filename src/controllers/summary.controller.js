import { generatePatientSummary } from "../services/summary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPatientSummary = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  const summary = await generatePatientSummary(
    patientId,
    req.user,
    req.query.range,
    req.user.email
  );

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "AI summary generated successfully"));
});

export { createPatientSummary };
