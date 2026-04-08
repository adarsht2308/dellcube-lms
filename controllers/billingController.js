import mongoose from "mongoose";
import { BillingRate } from "../models/billingRate.js";
import { BillingInvoice } from "../models/billingInvoice.js";
import { Invoice } from "../models/invoice.js";
import { Customer } from "../models/customer.js";

const NO_DRIVER_ROLES = ["superAdmin", "branchAdmin", "operation"];
const MUTATE_ROLES = ["superAdmin", "branchAdmin"];
const INVOICE_MUTATE_ROLES = ["superAdmin", "branchAdmin", "operation"];
const PAYMENT_MUTATE_ROLES = ["superAdmin", "branchAdmin"];

const ensureRole = (res, role, allowed) => {
  if (!allowed.includes(role)) {
    res.status(403).json({ success: false, message: "Access denied" });
    return false;
  }
  return true;
};

const applyOrgScope = (query, req, includeBranch = true) => {
  if (req.user?.role === "superAdmin") {
    return query;
  }
  if (req.companyId) query.company = req.companyId;
  if (includeBranch && req.branchId) query.branch = req.branchId;
  return query;
};

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const makeInvoiceNumber = () =>
  `BILL-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

export const createRate = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, MUTATE_ROLES)) return;
    const { customer, fromLocation, toLocation, vehicleType, rateType, rateValue, rateData = {} } =
      req.body;
    if (!customer || !rateType || rateValue === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "customer, rateType and rateValue are required" });
    }

    const payload = {
      customer,
      fromLocation: fromLocation || "",
      toLocation: toLocation || "",
      vehicleType: vehicleType || "",
      rateType,
      rateValue: toNum(rateValue),
      rateData: typeof rateData === "object" && rateData !== null ? rateData : {},
      createdBy: req.user?.userId,
      company: req.user?.role === "superAdmin" ? req.body.company : req.companyId,
      branch: req.user?.role === "superAdmin" ? req.body.branch : req.branchId,
    };

    if (!payload.company || !payload.branch) {
      return res
        .status(400)
        .json({ success: false, message: "Company and branch are required" });
    }

    const rate = await BillingRate.create(payload);
    return res.status(201).json({ success: true, rate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getRates = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, NO_DRIVER_ROLES)) return;
    const { customerId, companyId, branchId } = req.query;
    const query = {};
    applyOrgScope(query, req);
    if (req.user?.role === "superAdmin") {
      if (companyId) query.company = companyId;
      if (branchId) query.branch = branchId;
    }
    if (customerId) query.customer = customerId;

    const rates = await BillingRate.find(query)
      .populate("customer", "name")
      .populate("company", "name")
      .populate("branch", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, rates });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateRate = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, MUTATE_ROLES)) return;
    const { id } = req.params;
    const rate = await BillingRate.findById(id);
    if (!rate) return res.status(404).json({ success: false, message: "Rate not found" });

    if (req.user?.role !== "superAdmin") {
      if (String(rate.company) !== String(req.companyId) || String(rate.branch) !== String(req.branchId)) {
        return res.status(403).json({ success: false, message: "Not allowed for this org scope" });
      }
    }

    Object.assign(rate, {
      customer: req.body.customer ?? rate.customer,
      fromLocation: req.body.fromLocation ?? rate.fromLocation,
      toLocation: req.body.toLocation ?? rate.toLocation,
      vehicleType: req.body.vehicleType ?? rate.vehicleType,
      rateType: req.body.rateType ?? rate.rateType,
      rateValue: req.body.rateValue !== undefined ? toNum(req.body.rateValue) : rate.rateValue,
      rateData:
        req.body.rateData !== undefined &&
        typeof req.body.rateData === "object" &&
        req.body.rateData !== null
          ? req.body.rateData
          : rate.rateData,
      status: req.body.status !== undefined ? Boolean(req.body.status) : rate.status,
    });
    await rate.save();
    return res.status(200).json({ success: true, rate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteRate = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, MUTATE_ROLES)) return;
    const { id } = req.params;
    const rate = await BillingRate.findById(id);
    if (!rate) return res.status(404).json({ success: false, message: "Rate not found" });
    if (req.user?.role !== "superAdmin") {
      if (String(rate.company) !== String(req.companyId) || String(rate.branch) !== String(req.branchId)) {
        return res.status(403).json({ success: false, message: "Not allowed for this org scope" });
      }
    }
    await BillingRate.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Rate deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const listDocketsForBilling = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, NO_DRIVER_ROLES)) return;
    const {
      fromDate,
      toDate,
      customerId,
      companyId,
      branchId,
      status,
      search = "",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    applyOrgScope(query, req);
    if (req.user?.role === "superAdmin") {
      if (companyId) query.company = companyId;
      if (branchId) query.branch = branchId;
    }
    if (customerId) query.customer = customerId;
    if (status) query.status = status;
    if (fromDate || toDate) {
      query.invoiceDate = {};
      if (fromDate) query.invoiceDate.$gte = new Date(fromDate);
      if (toDate) query.invoiceDate.$lte = new Date(toDate);
    }
    if (search?.trim()) {
      query.$or = [
        { docketNumber: { $regex: search.trim(), $options: "i" } },
        { consignor: { $regex: search.trim(), $options: "i" } },
        { consignee: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [rows, total] = await Promise.all([
      Invoice.find(query)
        .populate("customer", "name")
        .populate("company", "name")
        .populate("branch", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Invoice.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      dockets: rows,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const generateBillingInvoice = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, INVOICE_MUTATE_ROLES)) return;
    const {
      docketIds = [],
      customerId,
      companyId,
      branchId,
      dateFrom,
      dateTo,
      extraCharges = 0,
      taxPercent = 0,
      billingData = {},
      status = "Generated",
    } = req.body;

    if (!Array.isArray(docketIds) || docketIds.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one docket" });
    }

    const query = { _id: { $in: docketIds } };
    applyOrgScope(query, req);
    if (req.user?.role === "superAdmin") {
      if (companyId) query.company = companyId;
      if (branchId) query.branch = branchId;
    }
    if (customerId) query.customer = customerId;

    const dockets = await Invoice.find(query);
    if (!dockets.length) {
      return res.status(404).json({ success: false, message: "No dockets found in scope" });
    }

    const finalCustomer = customerId || String(dockets[0].customer || "");
    const finalCompany =
      req.user?.role === "superAdmin"
        ? companyId || String(dockets[0].company || "")
        : req.companyId;
    const finalBranch =
      req.user?.role === "superAdmin"
        ? branchId || String(dockets[0].branch || "")
        : req.branchId;

    const customer = await Customer.findById(finalCustomer).select("billingFields");
    const totalWeight = dockets.reduce((s, d) => s + toNum(d.totalWeight), 0);
    const totalFreight = dockets.reduce((s, d) => s + toNum(d.freightCharges), 0);
    const taxAmount = (totalFreight + toNum(extraCharges)) * (toNum(taxPercent) / 100);
    const totalAmount = totalFreight + toNum(extraCharges) + taxAmount;

    const billingInvoice = await BillingInvoice.create({
      invoiceNumber: makeInvoiceNumber(),
      company: finalCompany,
      branch: finalBranch,
      customer: finalCustomer,
      docketIds,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      billingFieldsSnapshot: customer?.billingFields || [],
      billingData,
      totalWeight,
      totalFreight,
      docketCount: dockets.length,
      extraCharges: toNum(extraCharges),
      taxPercent: toNum(taxPercent),
      taxAmount,
      totalAmount,
      paidAmount: 0,
      pendingAmount: totalAmount,
      status,
      paymentStatus: "Unpaid",
      createdBy: req.user?.userId,
    });

    return res.status(201).json({ success: true, invoice: billingInvoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBillingInvoices = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, NO_DRIVER_ROLES)) return;
    const {
      fromDate,
      toDate,
      customerId,
      companyId,
      branchId,
      status,
      paymentStatus,
      search = "",
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};
    applyOrgScope(query, req);
    if (req.user?.role === "superAdmin") {
      if (companyId) query.company = companyId;
      if (branchId) query.branch = branchId;
    }
    if (customerId) query.customer = customerId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }
    if (search?.trim()) {
      query.invoiceNumber = { $regex: search.trim(), $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [rows, total] = await Promise.all([
      BillingInvoice.find(query)
        .populate("customer", "name")
        .populate("company", "name")
        .populate("branch", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      BillingInvoice.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      invoices: rows,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getBillingInvoiceById = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, NO_DRIVER_ROLES)) return;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid invoice id" });
    }
    const invoice = await BillingInvoice.findById(id)
      .populate("customer", "name")
      .populate("company", "name")
      .populate("branch", "name")
      .populate("docketIds", "docketNumber freightCharges totalWeight status customer")
      .populate("payments.addedBy", "name");
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    if (req.user?.role !== "superAdmin") {
      if (String(invoice.company?._id || invoice.company) !== String(req.companyId)) {
        return res.status(403).json({ success: false, message: "Not in your company scope" });
      }
      if (req.branchId && String(invoice.branch?._id || invoice.branch) !== String(req.branchId)) {
        return res.status(403).json({ success: false, message: "Not in your branch scope" });
      }
    }

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBillingInvoiceStatus = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, PAYMENT_MUTATE_ROLES)) return;
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await BillingInvoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (req.user?.role !== "superAdmin") {
      if (String(invoice.company) !== String(req.companyId) || String(invoice.branch) !== String(req.branchId)) {
        return res.status(403).json({ success: false, message: "Not in your scope" });
      }
    }
    invoice.status = status || invoice.status;
    await invoice.save();
    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addBillingPayment = async (req, res) => {
  try {
    if (!ensureRole(res, req.user?.role, PAYMENT_MUTATE_ROLES)) return;
    const { id } = req.params;
    const { amount, mode = "", reference = "", notes = "", paidAt } = req.body;
    if (!amount || toNum(amount) <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }
    const invoice = await BillingInvoice.findById(id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    if (req.user?.role !== "superAdmin") {
      if (String(invoice.company) !== String(req.companyId) || String(invoice.branch) !== String(req.branchId)) {
        return res.status(403).json({ success: false, message: "Not in your scope" });
      }
    }

    invoice.payments.push({
      amount: toNum(amount),
      mode,
      reference,
      notes,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      addedBy: req.user?.userId,
    });
    invoice.paidAmount = toNum(invoice.payments.reduce((s, p) => s + toNum(p.amount), 0));
    invoice.pendingAmount = Math.max(0, toNum(invoice.totalAmount) - toNum(invoice.paidAmount));
    invoice.paymentStatus =
      invoice.pendingAmount <= 0
        ? "Paid"
        : invoice.paidAmount > 0
        ? "Partially Paid"
        : "Unpaid";
    if (invoice.paymentStatus === "Paid") invoice.status = "Paid";
    else if (invoice.paymentStatus === "Partially Paid" && invoice.status === "Generated")
      invoice.status = "Partially Paid";

    await invoice.save();
    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
