import mongoose from "mongoose";

const localitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
  status: { type: Boolean, default: true },
});

export const Locality = mongoose.model("Locality", localitySchema);
