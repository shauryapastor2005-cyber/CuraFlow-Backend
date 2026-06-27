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
    duration: {
      type: Number,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    painLevel: {
      type: String,
      enum: ["None", "Mild", "Moderate", "Severe"],
    },
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
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    exercises: {
      type: [exerciseSchema],
      required: true,
      validate: {
        validator: (value) => value.length > 0,
        message: "At least one exercise is required.",
      },
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
