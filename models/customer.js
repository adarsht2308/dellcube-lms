import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },

    // New Company Information Fields
    companyName: {
      type: String,
      trim: true,
    },
    companyContactName: {
      type: String,
      trim: true,
    },
    companyContactInfo: {
      type: String,
      trim: true,
    },

    // New Tax Information Fields
    taxType: {
      type: String,
      trim: true,
      enum: ["GST", "CGST+SGST", "IGST", "Exempt", "Other"],
    },
    taxValue: {
      type: Number,
      min: 0,
      max: 100,
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required"],
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "Branch is required"],
    },

    // New Consignee and Consignor Fields
    consignees: [
      {
        siteId: {
          type: String,
          required: true,
          trim: true,
        },
        consignee: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    consignors: [
      {
        consignor: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],

    status: {
      type: Boolean,
      default: true,
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
export const Customer = mongoose.model("Customers", customerSchema);
