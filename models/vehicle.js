import mongoose from "mongoose";
import { User } from "./user.js";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["7ft","10ft", "14ft", "18ft", "24ft", "32ft"],
    },
    brand: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    yearOfManufacture: {
      type: Number,
    },
    registrationDate: {
      type: Date,
    },
    fitnessCertificateExpiry: {
      type: Date,
    },
    insuranceExpiry: {
      type: Date,
    },
    pollutionCertificateExpiry: {
      type: Date,
    },
    // Added new fields for document numbers
    vehicleInsuranceNo: {
      type: String,
      trim: true,
    },
    fitnessNo: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "under_maintenance", "inactive", "decommissioned"],
      default: "active",
    },
    currentDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    maintenanceHistory: [
      {
        serviceDate: Date,
        serviceType: String,
        cost: Number,
        description: String,
        servicedBy: {
          type: String,
          trim: true,
        },
        files: [String],
        // Added bill upload field
        billImage: {
          url: { type: String, default: "" },
          public_id: { type: String, default: "" },
        },
      },
    ],
    // Certificate images
    fitnessCertificateImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    pollutionCertificateImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    registrationCertificateImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    insuranceImage: {
      url: { type: String, default: "" },
      public_id: { type: String, default: "" },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
