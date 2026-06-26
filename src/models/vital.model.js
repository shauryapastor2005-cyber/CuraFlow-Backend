import mongoose, { Schema } from "mongoose";
import { normalizeToMidnightUTC } from "../utils/normalizeToMidnightUTC.js";

const vitalSchema = new Schema(
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
    bloodPressureSystolic: {
      type: Number,
      min: 0,
      default: null,
    },

    bloodPressureDiastolic: {
      type: Number,
      min: 0,
      default: null,
    },

    heartRate: {
      type: Number,
      min: 0,
      default: null,
    },

    // Stored in Celsius
    temperature: {
      type: Number,
      min: 25,
      max: 50,
      default: null,
    },

    // Stored as percentage (e.g. 98)
    oxygenSaturation: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // Stored in mg/dL
    bloodSugar: {
      type: Number,
      min: 0,
      default: null,
    },

    // Stored in kg
    weight: {
      type: Number,
      min: 0,
      default: null,
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

vitalSchema.pre("validate", function () {
  if (this.date) {
    this.date = normalizeToMidnightUTC(this.date);
  }
});

vitalSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.date) {
    update.date = normalizeToMidnightUTC(update.date);
  } else if (update?.$set?.date) {
    update.$set.date = normalizeToMidnightUTC(update.$set.date);
  }
});

vitalSchema.index({ patient: 1, date: 1 }, { unique: true });

export const Vital = mongoose.model("Vital", vitalSchema);
