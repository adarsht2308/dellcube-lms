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
        // Site ID (Only if Exist | Otherwise keep it Blank)
        siteId: {
          type: String,
          required: true,
          trim: true,
        },
        // ConsigneeName
        consignee: {
          type: String,
          required: true,
          trim: true,
        },
        // Address (Keep it short)
        address: {
          type: String,
          trim: true,
        },
        // State (stored in uppercase from UI/backend)
        state: {
          type: String,
          trim: true,
        },
        // City (stored in uppercase from UI/backend)
        city: {
          type: String,
          trim: true,
        },
        // PostCode | Pincode
        postCode: {
          type: String,
          trim: true,
        },
        // SITE / WAREHOUSE label
        siteCategory: {
          type: String,
          trim: true,
        },
      },
    ],

    consignors: [
      {
        siteId: {
          type: String,
          trim: true,
        },
        consignor: {
          type: String,
          required: true,
          trim: true,
        },
        address: {
          type: String,
          trim: true,
        },
        state: {
          type: String,
          trim: true,
        },
        city: {
          type: String,
          trim: true,
        },
        postCode: {
          type: String,
          trim: true,
        },
        siteCategory: {
          type: String,
          trim: true,
        },
      },
    ],

    misFields: [
      {
        fieldName: {
          type: String,
          required: true,
          trim: true,
        },
        fieldType: {
          type: String,
          enum: ["text", "number", "date", "textarea", "dropdown"],
          default: "text",
        },
        fieldLabel: {
          type: String,
          required: true,
          trim: true,
        },
        isRequired: {
          type: Boolean,
          default: false,
        },
        options: [String],
        order: {
          type: Number,
          default: 0,
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
