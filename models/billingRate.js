import mongoose from "mongoose";

const billingRateSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customers",
      required: true,
    },
    fromLocation: { type: String, trim: true, default: "" },
    toLocation: { type: String, trim: true, default: "" },
    vehicleType: { type: String, trim: true, default: "" },
    rateType: {
      type: String,
      enum: ["Fixed", "Per KG", "Per KM", "Slab-based"],
      required: true,
    },
    rateValue: { type: Number, required: true, min: 0 },
    rateData: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

billingRateSchema.index({ company: 1, branch: 1, customer: 1 });

export const BillingRate = mongoose.model("BillingRate", billingRateSchema);
