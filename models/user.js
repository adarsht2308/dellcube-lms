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
// user.index({ email: 1 }, { unique: true });
  
export const User = mongoose.model("User", user);
