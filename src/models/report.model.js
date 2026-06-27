import mongoose, { Schema } from "mongoose";
import { normalizeToMidnightUTC } from "../utils/normalizeToMidnightUTC.js";

const reportSchema = new Schema(
  {
    patient: {
      type: Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: [
        "MRI",
        "CT",
        "XRay",
        "ECG",
        "CBC",
        "LFT",
        "KFT",
        "RBS",
        "Prescription",
        "Discharge Summary",
        "Other",
      ],
      required: true,
    },
    reportName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    reportFile: {
      type: String,
      required: true,
    },
    reportPublicId: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    reportDate: {
      type: Date,
      required: true,
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

reportSchema.pre("validate", function () {
  if (this.reportDate) {
    this.reportDate = normalizeToMidnightUTC(this.reportDate);
  }
});

reportSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate();

  if (update?.reportDate) {
    update.reportDate = normalizeToMidnightUTC(update.reportDate);
  }

  if (update?.$set?.reportDate) {
    update.$set.reportDate = normalizeToMidnightUTC(update.$set.reportDate);
  }
});

reportSchema.index({
  patient: 1,
  reportDate: -1,
});

export const Report = mongoose.model("Report", reportSchema);
