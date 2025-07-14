import mongoose from "mongoose";

const goodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Good name is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    items: [
      {
        type: String,
        required: true,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const goods = mongoose.model("Good", goodSchema);
