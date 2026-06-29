import { escapeHtml } from "../utils/escapeHtml.js";

const summaryEmailTemplate = ({ summary, patientName, generatedAt }) => {
  const safeSummary = escapeHtml(
    summary || "No summary content was generated."
  );

  const safePatientName = escapeHtml(patientName || "Patient");

  const formattedDate = new Date(generatedAt || Date.now()).toLocaleString(
    "en-IN"
  );

  return `
<!DOCTYPE html>
<html>
  <body
    style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;"
  >
    <div
      style="max-width:650px;margin:auto;background:white;padding:30px;border-radius:8px;"
    >

      <div style="text-align:center;">
        <img
          src="https://res.cloudinary.com/dna6rpwb6/image/upload/v1782670990/Designer_orgak6.png"
          alt="CuraFlow AI"
          width="140"
        />

        <h2>AI Patient Summary</h2>
      </div>

      <p><strong>Patient:</strong> ${safePatientName}</p>

      <p><strong>Generated:</strong> ${formattedDate}</p>

      <hr>

      <div style="white-space:pre-line;">
        ${safeSummary}
      </div>

      <hr>

      <small>
        This AI-generated summary is intended to assist caregivers and should
        not replace professional medical advice.
      </small>

    </div>
  </body>
</html>
`;
};

export { summaryEmailTemplate };
