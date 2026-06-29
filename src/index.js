import "dotenv/config";
import app from "./app.js";
import connectDB from "./db/index.js";
import { startMonthlySummaryCron } from "./cron/monthlySummary.cron.js";
import { startDailyReminderCron } from "./cron/dailyReminer.cron.js";
const startServer = async () => {
  try {
    await connectDB();
    startMonthlySummaryCron();
    startDailyReminderCron();

    app.listen(process.env.PORT, () => {
      console.log(`CuraFlow server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
