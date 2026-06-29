import cron from "node-cron";
import { User } from "../models/users.model.js";
import { Patient } from "../models/patients.model.js";
import { generatePatientSummary } from "../services/summary.service.js";
import { summaryEmailTemplate } from "../templates/summaryEmail.template.js";
import { sendEmail } from "../services/email.service.js";

const MONTHLY_SUMMARY_CRON = "0 9 1 * * "; //runs at 9 am every month* * * * *

const startMonthlySummaryCron = () => {
  cron.schedule(MONTHLY_SUMMARY_CRON, async () => {
    console.log("Monthly summary job started");

    try {
      const caregivers = await User.find({ role: "caregiver" })
        .select("_id fullname email")
        .lean();

      for (const caregiver of caregivers) {
        try {
          console.log(`Processing caregiver: ${caregiver.email}`);

          const patients = await Patient.find({
            caregiver: caregiver._id,
            isActive: true,
          })
            .select("_id fullname")
            .lean();

          for (const patient of patients) {
            try {
              console.log(`Processing patient: ${patient.fullname}`);

              const summaryResult = await generatePatientSummary(
                patient._id,
                caregiver._id,
                "month"
              );

              const summaryEmailHtml = summaryEmailTemplate({
                summary: summaryResult.summary,
                patientName: patient.fullname,
                generatedAt: summaryResult.generatedAt,
              });

              await sendEmail({
                to: caregiver.email,
                subject: "CuraFlow AI • Monthly Progress Report",
                html: summaryEmailHtml,
              });

              console.log(
                `Summary email sent for patient: ${patient.fullname}`
              );
            } catch (error) {
              console.error(
                `Failed to process patient ${patient.fullname}:`,
                error.message
              );
            }
          }
        } catch (error) {
          console.error(
            `Failed to process caregiver ${caregiver.email}:`,
            error.message
          );
        }
      }
    } catch (error) {
      console.error("Monthly summary job failed:", error.message);
    }

    console.log("Monthly summary job completed");
  });

  console.log("Monthly summary cron scheduled");
};

export { startMonthlySummaryCron };
