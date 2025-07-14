import mongoose from "mongoose";

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  state: { type: mongoose.Schema.Types.ObjectId, ref: "State", required: true },
  status: { type: Boolean, default: true },
});

export const City = mongoose.model("City", citySchema);
