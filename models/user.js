import mongoose from "mongoose";

const user = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      sparse: true,
      required: function () {
        return this.role !== "driver";
      },
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superAdmin", "branchAdmin", "operation", "driver"],
      default: "superAdmin",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: function () {
        return this.role !== "superAdmin";
      },
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: function () {
        return this.role !== "superAdmin";
      },
    },
    mobile: {
      type: String,
      required: function () {
        return this.role === "driver";
      },
      unique: true,
       sparse: true,
    },
    licenseNumber: {
      type: String,
      required: function () {
        return this.role === "driver";
      },
        unique: true,
         sparse: true,
    },
    experienceYears: {
      type: Number,
      required: function () {
        return this.role === "driver";
      },
    },
    driverType: {
      type: String,
      enum: ["dellcube", "vendor", "temporary"],
      required: function () {
        return this.role === "driver";
      },
      default: "dellcube",
    },

    // Branch Admin specific fields
    aadharNumber: {
      type: String,
      required: function () {
        return this.role === "branchAdmin";
      },
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          return /^\d{12}$/.test(v);
        },
        message: 'Aadhar number must be exactly 12 digits'
      }
    },
    panNumber: {
      type: String,
      required: function () {
        return this.role === "branchAdmin";
      },
      unique: true,
      sparse: true,
      validate: {
        validator: function(v) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'PAN number must be in format: ABCDE1234F'
      }
    },
    bankDetails: {
      accountNumber: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        },
        validate: {
          validator: function(v) {
            return /^\d{9,18}$/.test(v);
          },
          message: 'Account number must be between 9-18 digits'
        }
      },
      ifscCode: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        },
        validate: {
          validator: function(v) {
            return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
          },
          message: 'IFSC code must be in format: ABCD0123456'
        }
      },
      bankName: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        }
      },
      accountHolderName: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        }
      }
    },

    // assignedOrders: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Order",
    //   },
    // ],

    currentLocation: {
      type: {
        lat: { type: Number },
        lng: { type: Number },
      },
      default: null,
    },

    photoUrl: {
      type: String,
      default: "",
    },
    bannerUrl: {
      type: String,
      default: "",
    },
    photoUrlPublicId: {
      type: String,
      default: "",
    },
    bannerUrlPublicId: {
      type: String,
      default: "",
    },
    status: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

user.index({ company: 1, branch: 1 });
user.index({ aadharNumber: 1 }, { unique: true, sparse: true });
user.index({ panNumber: 1 }, { unique: true, sparse: true });
// user.index({ email: 1 }, { unique: true });
  
export const User = mongoose.model("User", user);
