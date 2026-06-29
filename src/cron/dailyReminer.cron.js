import cron from "node-cron";
import { User } from "../models/users.model.js";
import { Patient } from "../models/patients.model.js";
import { DailyLog } from "../models/dailyLog.model.js";
import { dailyReminderEmail } from "../templates/dailyReminderEmail.template.js";
import { sendEmail } from "../services/email.service.js";

const DAILY_REMINDER_CRON = "0 21 * * *"; //runs at 21 hrs 0 mins every day

const startDailyReminderCron = () => {
  cron.schedule(DAILY_REMINDER_CRON, async () => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log("Daily reminder cron started");
    try {
      const caregivers = await User.find({
        role: "caregiver",
      })
        .select("_id email fullname")
        .lean();
      for (const caregiver of caregivers) {
        try {
          console.log(`Processing caregiver : ${caregiver.email}`);

          const patients = await Patient.find({
            caregiver: caregiver._id,
            isActive: true,
          })
            .select("_id fullname")
            .lean();

          for (const patient of patients) {
            try {
              console.log(`Processing patient : ${patient.fullname}`);
              const dailyLog = await DailyLog.findOne({
                patient: patient._id,
                loggedBy: caregiver._id,
                date: today,
                isActive: true,
              });
              if (!dailyLog) {
                const dailyReminderHtml = dailyReminderEmail({
                  careGiverName: caregiver.fullname,
                  patientName: patient.fullname,
                });

                await sendEmail({
                  to: caregiver.email,
                  subject: "CuraFlow AI • Daily reminder",
                  html: dailyReminderHtml,
                });

                console.log(
                  `Reminder email sent for patient: ${patient.fullname}`
                );
              }
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
      console.error("Daily reminder job failed:", error.message);
    }

    console.log("Daily reminder job completed");
  });
  console.log("Daily reminder cron scheduled");
};

export { startDailyReminderCron };
