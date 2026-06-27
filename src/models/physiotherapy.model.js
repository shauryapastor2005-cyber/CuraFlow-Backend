import mongoose, { Schema } from "mongoose";
import { normalizeToMidnightUTC } from "../utils/normalizeToMidnightUTC.js";

//sub schema for exercise
const exerciseSchema = new Schema(
  {
    exerciseName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    // Duration (in minutes)
    duration: {
      type: Number,
      min: 0,
    },
    //completion status
    completed: {
      type: Boolean,
      default: false,
    },
    painLevel: {
      type: String,
      enum: ["None", "Mild", "Moderate", "Severe"],
    },
    //difficulty of exercise
    difficulty: {
      type: String,
      enum: ["Easy", "Moderate", "Difficult"],
    },
  },
  { _id: false }
);

//schema for physio
const physiotherapySchema = new Schema(
  {
    // The patient this session belongs to
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },

    // The care-giver / user who recorded the session
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Calendar day of the session (always stored as midnight UTC)
    date: {
      type: Date,
      required: true,
    },
    // Exercises performed during this session
    // Each object represents one exercise on the day
    exercises: {
      type: [exerciseSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one exercise is required.",
      },
    },
    // remarks
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    // soft delete
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

//Pre-validate hook normalize date on create
physiotherapySchema.pre("validate", function () {
  if (this.date) {
    this.date = normalizeToMidnightUTC(this.date);
  }
});

//findoneandupdate() hook for normalisation of date
physiotherapySchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.date) {
    update.date = normalizeToMidnightUTC(update.date);
  }

  if (update?.$set?.date) {
    update.$set.date = normalizeToMidnightUTC(update.$set.date);
  }
});

//compound indexing for one session record per patient per calendar day
physiotherapySchema.index({ patient: 1, date: 1 }, { unique: true });

export const Physiotherapy = mongoose.model(
  "Physiotherapy",
  physiotherapySchema
);
