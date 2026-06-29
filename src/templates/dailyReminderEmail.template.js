import { escapeHtml } from "../utils/escapeHtml.js";

const dailyReminderEmail = ({ careGiverName, patientName }) => {
  const safeCaregiverName = escapeHtml(careGiverName || "Caregiver");

  const safePatientName = escapeHtml(patientName || "Patient");

  return `
    <!DOCTYPE html>
<html>
  <body
    style="font-family:Arial,sans-serif;background:#f4f7fb;padding:30px;"
  >
    <div
      style="max-width:600px;margin:auto;background:white;padding:30px;border-radius:8px;"
    >

      <div style="text-align:center;">
        <img
          src="https://res.cloudinary.com/dna6rpwb6/image/upload/v1782670990/Designer_orgak6.png"
          alt="CuraFlow AI"
          width="120"
        />

        <h2>Daily Care Reminder</h2>
      </div>

      <p>Hi ${safeCaregiverName},</p>

      <p>
        This is a friendly reminder that today's daily log for
        <strong>${safePatientName}</strong> has not been recorded yet.
      </p>

      <p>
        Recording daily updates helps maintain an accurate recovery history and
        improves future AI-generated summaries.
      </p>

      <p>
        Please log today's care information when convenient.
      </p>

      <hr>

      <small>
        CuraFlow AI • Helping caregivers stay organized.
      </small>

    </div>
  </body>
</html>`;
};

export { dailyReminderEmail };
