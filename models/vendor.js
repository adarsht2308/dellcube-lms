import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    accountNumber: {
      type: String,
      trim: true,
    },
    ifsc: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
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
    availableVehicles: [
      {
        vehicleNumber: {
          type: String,
          required: true,
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
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Vendor = mongoose.model("Vendor", vendorSchema);
