import mongoose from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    branchCode: {
      type: String,
      required: true,
      unique: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
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
    address: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
    gstNo: {
      type: String,
      default: "",
    },
    branchNo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Branch = mongoose.model("Branch", branchSchema);
