import mongoose from "mongoose";
import { User } from "./user.js";

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "14 Feet",
        "17 Feet",
        "19 Feet",
        "20 Feet",
        "22 Feet",
        "24 Feet",
        "32FTMXL-14MT",
        "Biker",
        "BYHAND",
        "FLAT BED TRAILER 20FT",
        "Pickup",
        "TAURUS 16 TON",
        "Tata 407",
        "TRUCK/LORRY",
        "SFBT40",
        "TATA/EICHER 709",
        "32FTMXL-18MT",
        "32FTSXL-7MT",
        "32FTSXL-9MT",
        "FLAT BED TRAILER 40FT",
        "SEMI FLAT BED TRAILER 40FT",
        "TAURUS 18 TON",
        "TAURUS 21 TON",
        "TAURUS 25 TON",
        "TAURUS 30 TON",
        "TATA ACE"
      ],
    },
    cargoType: {
      type: String,
      enum: ["Dry", "Refrigerated", "Container", "Open", "Closed", "Flatbed", "Tanker", "Other"],
      trim: true,
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
    // Owner: dellcube (in Vehicle collection) or vendor (stored in User.availableVehicles)
    ownerType: {
      type: String,
      enum: ["dellcube", "vendor"],
      default: "dellcube",
    },
    // When ownerType is vendor, reference the vendor (User with role vendor)
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // One vehicle can operate for multiple company-branch pairs
    companyBranchAssignments: [
      {
        company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
        branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
      },
    ],
    // Kept for backward compatibility; set from companyBranchAssignments[0]
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
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

// Add indexes for better query performance
vehicleSchema.index({ company: 1, branch: 1 }); // Compound index for common query pattern
vehicleSchema.index({ "companyBranchAssignments.company": 1, "companyBranchAssignments.branch": 1 });
vehicleSchema.index({ status: 1 }); // Index for status filtering
vehicleSchema.index({ createdBy: 1 }); // Index for vendor filtering
vehicleSchema.index({ vendor: 1 }); // Index for vendor vehicles
vehicleSchema.index({ createdAt: -1 }); // Index for sorting by creation date

export const Vehicle = mongoose.model("Vehicle", vehicleSchema);
