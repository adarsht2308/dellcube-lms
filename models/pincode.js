import mongoose from "mongoose";

const pincodeSchema = new mongoose.Schema({
  code: { type: String, required: true },
  locality: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Locality",
    required: true,
  },
  status: { type: Boolean, default: true },
});

export const Pincode = mongoose.model("Pincode", pincodeSchema);
