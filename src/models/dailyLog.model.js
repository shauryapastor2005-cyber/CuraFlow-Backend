import mongoose, { Schema } from "mongoose";
import { normalizeToMidnightUTC } from "../utils/normalizeToMidnightUTC.js";
import { validateDateNotInFuture } from "../utils/validateDateNotInFuture.js";

const dailyLogSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    loggedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    exerciseDone: {
      type: Boolean,
      default: false,
    },
    physiotherapyDone: {
      type: Boolean,
      default: false,
    },
    medicinesTaken: {
      type: Boolean,
      default: false,
    },
    waterIntake: {
      type: Number,
      min: 0,
      default: 0,
    },
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
      default: 0,
    },
    bowelMovement: {
      type: Boolean,
      default: false,
    },
    appetite: {
      type: String,
      enum: ["Poor", "Normal", "Good"],
    },
    mood: {
      type: String,
      enum: ["Very Bad", "Bad", "Neutral", "Good", "Very Good"],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

dailyLogSchema.pre("validate", function () {
  if (this.date) {
    this.date = normalizeToMidnightUTC(this.date);
    validateDateNotInFuture(
      this.date,
      "Daily log date cannot be in the future."
    );
  }
});

/*
Also normalize on findOneAndUpdate / findByIdAndUpdate paths,
since pre("validate") on the document does not run for query-based updates.
*/
dailyLogSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.date) {
    update.date = normalizeToMidnightUTC(update.date);
    validateDateNotInFuture(
      update.date,
      "Daily log date cannot be in the future."
    );
  } else if (update?.$set?.date) {
    update.$set.date = normalizeToMidnightUTC(update.$set.date);
    validateDateNotInFuture(
      update.$set.date,
      "Daily log date cannot be in the future."
    );
  }
});

/*
One Daily Log per patient per calendar day
we have used indexing so that mongoDB itself organises logs
based on patient and date
eg : indexed logs 
     patient A : date 01-06-2026
     patient A : date 02-06-2026
     WRONG: patient A : date 01-06-2026 this would be invalid as indexing allows only unique fields combination
this save massive time while quering logs ,otherwise normally we 
would have done collection scan i.e we searcg entire documents and then 
match against date and timestamps.But with indexing we can directlty jump
to index and respond to query
*/
dailyLogSchema.index({ patient: 1, date: 1 }, { unique: true }); // 1 just tell store index based on increasing order
// unique is passed as a parameter so that it ensures only one log a day is created
export const DailyLog = mongoose.model("DailyLog", dailyLogSchema);
