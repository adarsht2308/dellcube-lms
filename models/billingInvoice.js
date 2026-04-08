import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    paidAt: { type: Date, default: Date.now },
    mode: { type: String, trim: true, default: "" },
    reference: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true }
);

const billingInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, trim: true },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customers",
      required: true,
    },
    docketIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Invoice" }],
    dateFrom: { type: Date },
    dateTo: { type: Date },
    billingFieldsSnapshot: { type: Array, default: [] },
    billingData: { type: mongoose.Schema.Types.Mixed, default: {} },
    totalWeight: { type: Number, default: 0 },
    totalFreight: { type: Number, default: 0 },
    docketCount: { type: Number, default: 0 },
    extraCharges: { type: Number, default: 0 },
    taxPercent: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Draft", "Generated", "Sent", "Paid", "Partially Paid"],
      default: "Generated",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Partially Paid", "Paid"],
      default: "Unpaid",
    },
    payments: [paymentSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

billingInvoiceSchema.index({ company: 1, branch: 1, customer: 1, createdAt: -1 });

export const BillingInvoice = mongoose.model("BillingInvoice", billingInvoiceSchema);
