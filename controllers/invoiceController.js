import { Invoice } from "../models/invoice.js";
import mongoose from "mongoose";
import { Company } from "../models/company.js";
import { Branch } from "../models/branch.js";
import path from "path";
import fs from "fs";
import { Vendor } from "../models/vendor.js";
import { Parser as Json2CsvParser } from 'json2csv';
import { fileURLToPath } from 'url';
import os from "os";
import { renderToStream } from '@react-pdf/renderer';
// import { InvoicePDFDocument } from './InvoicePDFDocument.js';
import React from 'react';
import { Vehicle } from "../models/vehicle.js";

export const createInvoice = async (req, res) => {
  try {
    const user = req.user;

    let companyId = req.body.company;
    let branchId = req.body.branch;

    // Role-based control
    if (user.role === "branchAdmin" || user.role === "operation") {
      companyId = user.company;
      branchId = user.branch;
    }

    if (!companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Company and Branch information is required.",
      });
    }

    // Fetch company and branch documents
    const companyDoc = await mongoose
      .model("Company")
      .findById(companyId)
      .select("name");
    const branchDoc = await mongoose
      .model("Branch")
      .findById(branchId)
      .select("name");

    if (!companyDoc || !branchDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid company or branch selected",
      });
    }

    // Generate companyCode and branchCode
    const companyCode = companyDoc.name
      ?.toUpperCase()
      .slice(0, 3)
      .replace(/\s/g, "");
    const branchCode = branchDoc.name
      ?.toUpperCase()
      .slice(0, 5)
      .replace(/\s/g, "");

    // Generate date string
    const now = new Date();
    const yy = now.getFullYear().toString().slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;

    // Calculate daily counter
    const dayStart = new Date(now.setHours(0, 0, 0, 0));
    const dayEnd = new Date(now.setHours(23, 59, 59, 999));

    const dailyCount = await Invoice.countDocuments({
      company: companyId,
      branch: branchId,
      createdAt: { $gte: dayStart, $lte: dayEnd },
    });

    const runningCounter = String(dailyCount + 1).padStart(4, "0");
    const docketNumber = `DLC-${companyCode}-${branchCode}-${dateStr}-${runningCounter}`;

    const { vehicleNumber } = req.body;
    let vehicleData = null;
    let ownerType = '';

    if (vehicleNumber) {
      // Search in Dellcube's vehicles
      const vehicle = await Vehicle.findOne({ vehicleNumber }).populate("currentDriver");
      if (vehicle) {
        vehicleData = vehicle;
        ownerType = "Dellcube";
      } else {
        // Search in vendors' vehicles
        const vendor = await Vendor.findOne({ "availableVehicles.vehicleNumber": vehicleNumber });
        if (vendor) {
          const vendorVehicle = vendor.availableVehicles.find(v => v.vehicleNumber === vehicleNumber);
          vehicleData = { ...vendorVehicle, vendor: vendor._id };
          ownerType = "Vendor";
        }
      }
    }

    if (vehicleNumber && !vehicleData) {
      return res.status(404).json({ success: false, message: "Vehicle not found." });
    }

    // The following fields are now supported: pickupAddress, deliveryAddress, consignor, consignee, address, invoiceNumber, invoiceBill, ewayBillNo, driverContactNumber, siteId, sealNo, vehicleSize, orderNumber, transportMode
    const invoicePayload = {
      ...req.body,
      company: companyId,
      branch: branchId,
      docketNumber,
      orderNumber: req.body.orderNumber || "",
      transportMode: req.body.transportMode,
    };

    if (vehicleData) {
      invoicePayload.vehicleType = ownerType;
      if (ownerType === 'Dellcube') {
        invoicePayload.vehicle = vehicleData._id;
        invoicePayload.driver = vehicleData.currentDriver?._id;
        invoicePayload.vehicleSize = vehicleData.type;
        delete invoicePayload.vendor;
        delete invoicePayload.vendorVehicle;
      } else if (ownerType === 'Vendor') {
        invoicePayload.vendor = vehicleData.vendor;
        invoicePayload.vendorVehicle = vehicleData;
        delete invoicePayload.vehicle;
      }
    }


    const invoice = await Invoice.create(invoicePayload);

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the invoice",
      error: error.message,
    });
  }
};

export const createReservedInvoices = async (req, res) => {
  try {
    const user = req.user;
    let companyId = req.body.company;
    let branchId = req.body.branch;

    // Role-based control
    if (user.role === "branchAdmin" || user.role === "operation") {
      companyId = user.company;
      branchId = user.branch;
    }

    if (!companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Company and Branch information is required.",
      });
    }

    const { customer, fromAddress, toAddress, quantity = 1, ...rest } = req.body;
    if (!customer || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Customer and quantity are required.",
      });
    }

    // Fetch company and branch documents
    const companyDoc = await mongoose
      .model("Company")
      .findById(companyId)
      .select("name");
    const branchDoc = await mongoose
      .model("Branch")
      .findById(branchId)
      .select("name");

    if (!companyDoc || !branchDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid company or branch selected",
      });
    }

    // Generate companyCode and branchCode
    const companyCode = companyDoc.name
      ?.toUpperCase()
      .slice(0, 3)
      .replace(/\s/g, "");
    const branchCode = branchDoc.name
      ?.toUpperCase()
      .slice(0, 5)
      .replace(/\s/g, "");

    // Generate date string
    const now = new Date();
    const yy = now.getFullYear().toString().slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yy}${mm}${dd}`;

    // Calculate daily counter
    const dayStart = new Date(now.setHours(0, 0, 0, 0));
    const dayEnd = new Date(now.setHours(23, 59, 59, 999));
    const dailyCount = await Invoice.countDocuments({
      company: companyId,
      branch: branchId,
      createdAt: { $gte: dayStart, $lte: dayEnd },
    });

    let runningCounter = dailyCount;
    const reservedInvoices = [];
    for (let i = 1; i <= quantity; i++) {
      runningCounter++;
      const docketNumber = `DLC-${companyCode}-${branchCode}-${dateStr}-${String(runningCounter).padStart(4, "0")}`;
      reservedInvoices.push({
        company: companyId,
        branch: branchId,
        customer,
        fromAddress,
        toAddress,
        docketNumber,
        status: "Reserved",
        ...rest,
      });
    }

    const created = await Invoice.insertMany(reservedInvoices);
    return res.status(201).json({
      success: true,
      message: `${quantity} reserved dockets created successfully`,
      invoices: created,
    });
  } catch (error) {
    console.error("Error creating reserved invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating reserved dockets",
      error: error.message,
    });
  }
};

export const getAllInvoices = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      companyId,
      branchId,
      customerId,
      paymentType,
      vehicleType,
      status,
      invoiceDate,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const query = {};
    if (search) query.docketNumber = { $regex: search, $options: "i" };
    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;
    if (customerId) query.customer = customerId;
    if (paymentType) query.paymentType = paymentType;
    if (vehicleType) query.vehicleType = vehicleType;
    if (status && status !== "all") query.status = status;
    // Date range filtering
    if (req.query.fromDate || req.query.toDate) {
      const dateQuery = {};
      if (req.query.fromDate) {
        const from = new Date(req.query.fromDate);
        from.setHours(0, 0, 0, 0);
        dateQuery.$gte = from;
      }
      if (req.query.toDate) {
        const to = new Date(req.query.toDate);
        to.setHours(23, 59, 59, 999);
        dateQuery.$lte = to;
      }
      query.invoiceDate = dateQuery;
    } else if (invoiceDate) {
      // Fallback: single day filter for backward compatibility
      const start = new Date(invoiceDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(invoiceDate);
      end.setHours(23, 59, 59, 999);
      query.invoiceDate = { $gte: start, $lte: end };
    }

    const invoices = await Invoice.find(query)
      .populate("company", "name address contactPhone gstNumber pan")
      .populate("branch", "name")
      .populate("customer", "name phone email")
      .populate("goodsType", "name items")
      .populate("vehicle", "vehicleNumber")
      .populate("vendor", "name availableVehicles")
      .populate("driver", "name phone")
      .populate(
        "fromAddress.country fromAddress.state fromAddress.city fromAddress.locality"
      )
      .populate(
        "toAddress.country toAddress.state toAddress.city toAddress.locality"
      )
      .populate("siteType", "name desc")
      .populate("transportMode", "name desc")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching invoices",
      error: error.message,
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Valid invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(invoiceId)
      .populate("goodsType", "name items")
      .populate("company branch customer  vehicle vendor driver")
      .populate("siteType", "name desc")
      .populate("transportMode", "name desc")
      .populate(
        "fromAddress.country fromAddress.state fromAddress.city fromAddress.locality"
      )
      .populate(
        "toAddress.country toAddress.state toAddress.city toAddress.locality"
      );

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching invoice",
      error: error.message,
    });
  }
};

export const updateInvoice = async (req, res) => {
  try {
    const { invoiceId, ...updates } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        message: "Valid invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Vehicle logic (same as createInvoice)
    if (updates.vehicleNumber) {
      let vehicleData = null;
      let ownerType = '';
      // Search in Dellcube's vehicles
      const vehicle = await Vehicle.findOne({ vehicleNumber: updates.vehicleNumber }).populate("currentDriver");
      if (vehicle) {
        vehicleData = vehicle;
        ownerType = "Dellcube";
      } else {
        // Search in vendors' vehicles
        const vendor = await Vendor.findOne({ "availableVehicles.vehicleNumber": updates.vehicleNumber });
        if (vendor) {
          const vendorVehicle = vendor.availableVehicles.find(v => v.vehicleNumber === updates.vehicleNumber);
          vehicleData = { ...vendorVehicle, vendor: vendor._id };
          ownerType = "Vendor";
        }
      }
      if (!vehicleData) {
        return res.status(404).json({ success: false, message: "Vehicle not found." });
      }
      // Set vehicle-related fields
      invoice.vehicleType = ownerType;
      if (ownerType === 'Dellcube') {
        invoice.vehicle = vehicleData._id;
        invoice.driver = vehicleData.currentDriver?._id;
        invoice.vehicleSize = vehicleData.type;
        invoice.vendor = undefined;
        invoice.vendorVehicle = undefined;
      } else if (ownerType === 'Vendor') {
        invoice.vendor = vehicleData.vendor;
        invoice.vendorVehicle = vehicleData;
        invoice.vehicle = undefined;
      }
    }

    Object.keys(updates).forEach((key) => {
      // Don't overwrite vehicle fields if vehicleNumber was handled above
      if (updates[key] !== undefined && key !== 'vehicleNumber') {
        invoice[key] = updates[key];
      }
    });
    // Ensure orderNumber is updated if provided
    if (updates.orderNumber !== undefined) {
      invoice.orderNumber = updates.orderNumber;
    }
    // Ensure transportMode is updated if provided
    if (updates.transportMode !== undefined) {
      invoice.transportMode = updates.transportMode;
    }

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the invoice",
      error: error.message,
    });
  }
};

export const deleteInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.body;

    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid invoice ID is required" });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    await Invoice.findByIdAndDelete(invoiceId);

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the invoice",
      error: error.message,
    });
  }
};


export const generateInvoicePDF = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    if (!invoiceId || !mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({ success: false, message: "Valid invoice ID is required" });
    }
    const invoice = await Invoice.findById(invoiceId)
      .populate("company branch customer goodsType vehicle vendor driver")
      .populate("siteType", "name desc")
      .populate("fromAddress.country fromAddress.state fromAddress.city fromAddress.locality")
      .populate("toAddress.country toAddress.state toAddress.city toAddress.locality");
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }
    res.json({ success: true, invoice });
  } catch (err) {
    console.error("Invoice fetch error:", err);
    res.status(500).json({ error: 'Failed to fetch invoice', details: err.message });
  }
};

// Export Invoices as CSV
export const exportInvoicesCSV = async (req, res) => {
  try {
    let {
      search = "",
      companyId,
      branchId,
      customerId,
      paymentType,
      vehicleType,
      fromDate,
      toDate,
      ids,
    } = req.query;

    const query = {};
    if (ids) {
      // Export only selected invoices
      const idArr = ids.split(',').map((id) => id.trim());
      query._id = { $in: idArr };
    } else {
      if (search) query.docketNumber = { $regex: search, $options: "i" };
      if (companyId) query.company = companyId;
      if (branchId) query.branch = branchId;
      if (customerId) query.customer = customerId;
      if (paymentType) query.paymentType = paymentType;
      if (vehicleType) query.vehicleType = vehicleType;
      if (fromDate || toDate) {
        const dateQuery = {};
        if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          dateQuery.$gte = from;
        }
        if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          dateQuery.$lte = to;
        }
        query.invoiceDate = dateQuery;
      }
    }

    const invoices = await Invoice.find(query)
      .populate("company", "name address contactPhone gstNumber pan")
      .populate("branch", "name")
      .populate("customer", "name phone email")
      .populate("goodsType", "name items")
      .populate("vehicle", "vehicleNumber")
      .populate("vendor", "name availableVehicles")
      .populate("driver", "name mobile")
      .populate("fromAddress.country fromAddress.state fromAddress.city fromAddress.locality")
      .populate("toAddress.country toAddress.state toAddress.city toAddress.locality");

    // Flatten and map fields for CSV
    const data = invoices.map((inv) => ({
      DocketNumber: inv.docketNumber,
      Company: inv.company?.name || "",
      CompanyAddress: inv.company?.address || "",
      CompanyGST: inv.company?.gstNumber || "",
      CompanyPAN: inv.company?.pan || "",
      Branch: inv.branch?.name || "",
      Customer: inv.customer?.name || "",
      CustomerPhone: inv.customer?.phone || "",
      CustomerEmail: inv.customer?.email || "",
      GoodsType: inv.goodsType?.name || "",
      GoodsItems: inv.goodsType?.items?.join('; ') || "",
      VehicleType: inv.vehicleType,
      VehicleNumber: inv.vehicle?.vehicleNumber || inv.vendorVehicle?.vehicleNumber || "",
      Vendor: inv.vendor?.name || "",
      Driver: inv.driver?.name || "",
      DriverPhone: inv.driver?.mobile || "",
      Status: inv.status,
      InvoiceDate: inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleString() : "",
      DispatchDateTime: inv.dispatchDateTime ? new Date(inv.dispatchDateTime).toLocaleString() : "",
      FromCountry: inv.fromAddress?.country?.name || "",
      FromState: inv.fromAddress?.state?.name || "",
      FromCity: inv.fromAddress?.city?.name || "",
      FromLocality: inv.fromAddress?.locality?.name || "",
      FromPincode: inv.fromAddress?.pincode || "",
      ToCountry: inv.toAddress?.country?.name || "",
      ToState: inv.toAddress?.state?.name || "",
      ToCity: inv.toAddress?.city?.name || "",
      ToLocality: inv.toAddress?.locality?.name || "",
      ToPincode: inv?.toAddress?.pincode || "",
      TotalWeight: inv?.totalWeight,
      NumberOfPackages: inv?.numberOfPackages,
      FreightCharges: inv?.freightCharges,
      PaymentType: inv?.paymentType,
      Remarks: inv?.remarks,
      DeliveredAt: inv.deliveredAt ? new Date(inv.deliveredAt).toLocaleString() : "",
      DeliveryProofReceiverName: inv.deliveryProof?.receiverName || "",
      DeliveryProofReceiverMobile: inv.deliveryProof?.receiverMobile || "",
      DeliveryProofRemarks: inv.deliveryProof?.remarks || "",
      CreatedAt: inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "",
      UpdatedAt: inv.updatedAt ? new Date(inv.updatedAt).toLocaleString() : "",
    }));

    const fields = Object.keys(data[0] || {});
    const json2csv = new Json2CsvParser({ fields });
    const csv = json2csv.parse(data);

    res.header('Content-Type', 'text/csv');
    res.attachment('invoices_export.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Error exporting invoices as CSV:', error);
    return res.status(500).json({ success: false, message: 'Failed to export invoices as CSV', error: error.message });
  }
};



