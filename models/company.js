import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    companyLogoUrl: {
      type: String,
      default: "",
    },
    companyLogoUrlPublicId: {
      type: String,
      default: "",
    },
    companyCode: {
      type: String,
      required: true,
      unique: true,
    },
    emailId: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
    gstNumber: {
      type: String,
      required: true,
    },
    gstNo: {
      type: String,
    },
    gstValue: {
      type: Number,
      required: true,
    },
    pan: {
      type: String,
      required: true,
    },
    sacHsnCode: {
      type: String,
      required: true,
    },
    companyType: {
      type: String,
      required: true,
      enum: ["counter company", "logistic company", "transport company", "warehouse company"],
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
      match: [/^\d{10}$/, "Invalid mobile number"],
    },
    bankDetails: {
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
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
      },
      mobile: {
        type: String,
        trim: true,
        match: [/^\d{10}$/, "Invalid mobile number"],
      },
    },
    status: {
      type: Boolean,
      default: true,
    },
    region: {
      country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Country",
      },
      state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "State",
      },
      city: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "City",
      },
      locality: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Locality",
      },
      pincode: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Pincode",
      },
    },
  },
  { timestamps: true }
);

export const Company = mongoose.model("Company", companySchema);
