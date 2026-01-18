import { Invoice } from "../models/invoice.js";
import mongoose from "mongoose";
import { Company } from "../models/company.js";
import { Branch } from "../models/branch.js";
import path from "path";
import fs from "fs";
import { User } from "../models/user.js";
import { Parser as Json2CsvParser } from "json2csv";
import { fileURLToPath } from "url";
import os from "os";
import { renderToStream } from "@react-pdf/renderer";
// import { InvoicePDFDocument } from './InvoicePDFDocument.js';
import React from "react";
import { Vehicle } from "../models/vehicle.js";
import { Customer } from "../models/customer.js";

const fetchImageAsBase64 = async (url) => {
  if (!url) {
    console.warn("fetchImageAsBase64: No URL provided");
    return "";
  }
  try {
    console.log("fetchImageAsBase64: Fetching image from:", url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `fetchImageAsBase64: Response not OK. Status: ${response.status}`
      );
      return "";
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get("content-type") || "image/png";
    const base64 = `data:${contentType};base64,${buffer.toString("base64")}`;
    console.log(
      `fetchImageAsBase64: Successfully converted to base64 (length: ${base64.length})`
    );
    return base64;
  } catch (error) {
    console.error("Error converting signature to base64:", error.message);
    return "";
  }
};

const getUserSignatureBase64 = async (userId) => {
  if (!userId) {
    console.warn("getUserSignatureBase64: No userId provided");
    return "";
  }
  try {
    console.log("getUserSignatureBase64: Fetching user signature for:", userId);
    const creator = await User.findById(userId).select("signature");
    if (!creator) {
      console.warn("getUserSignatureBase64: User not found");
      return "";
    }
    if (!creator?.signature?.url) {
      console.warn("getUserSignatureBase64: User has no signature URL");
      return "";
    }
    console.log(
      "getUserSignatureBase64: Found signature URL:",
      creator.signature.url
    );
    const base64 = await fetchImageAsBase64(creator.signature.url);
    if (base64) {
      console.log("getUserSignatureBase64: Successfully converted signature");
    } else {
      console.warn("getUserSignatureBase64: Failed to convert signature");
    }
    return base64;
  } catch (error) {
    console.error("Failed to fetch user signature:", error.message);
    return "";
  }
};

const normalizeMultiValueField = (input) => {
  if (input === undefined || input === null) return [];
  const list = Array.isArray(input)
    ? input
    : typeof input === "string"
    ? input.split(",")
    : [input];
  return list
    .map((value) =>
      typeof value === "string" ? value.trim() : String(value || "").trim()
    )
    .filter((value) => value.length > 0);
};

const formatMultiValueField = (input) => {
  const values = normalizeMultiValueField(input);
  return values.length ? values.join(", ") : "";
};

export const createInvoice = async (req, res) => {
  try {
    const userToken = req.user;
    const actingUser = await User.findById(userToken?.userId).select(
      "role company branch"
    );

    if (!actingUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Use companyId/branchId from token if not provided in body (for non-superAdmin users)
    let companyId = req.body.company || (req.user?.role !== "superAdmin" ? req.companyId : null);
    let branchId = req.body.branch || (req.user?.role !== "superAdmin" ? req.branchId : null);

    // Role-based control - use token values (selected company/branch) if available, otherwise use first from user's array
    if (
      actingUser.role === "branchAdmin" ||
      actingUser.role === "operation"
    ) {
      // Priority: 1. req.body.company (explicit), 2. req.companyId (token/selected), 3. user's company array
      if (!companyId) {
        if (req.companyId) {
          companyId = req.companyId;
        } else {
          // Fallback to user's company (handle both array and single value)
          if (Array.isArray(actingUser.company) && actingUser.company.length > 0) {
            companyId = actingUser.company[0].toString();
          } else if (actingUser.company) {
            companyId = actingUser.company.toString();
          }
        }
      }
      
      // Priority: 1. req.body.branch (explicit), 2. req.branchId (token/selected), 3. user's branch array
      if (!branchId) {
        if (req.branchId) {
          branchId = req.branchId;
        } else {
          // Fallback to user's branch (handle both array and single value)
          if (Array.isArray(actingUser.branch) && actingUser.branch.length > 0) {
            branchId = actingUser.branch[0].toString();
          } else if (actingUser.branch) {
            branchId = actingUser.branch.toString();
          }
        }
      }
    }

    if (!companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Company and Branch information is required.",
      });
    }

    // Fetch company and branch documents with their codes
    const companyDoc = await mongoose
      .model("Company")
      .findById(companyId)
      .select("companyCode name");
    const branchDoc = await mongoose
      .model("Branch")
      .findById(branchId)
      .select("branchCode");

    if (!companyDoc || !branchDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid company or branch selected",
      });
    }

    // Use the actual companyCode and branchCode from database
    const companyCode = companyDoc.companyCode;
    const branchCode = branchDoc.branchCode;
    const companyIdStr = companyId.toString();
    const companyName = companyDoc.name || "";

    // Helper function to determine starting docket number based on company ID or code
    const getStartingDocketNumber = (companyId, companyCode, companyName) => {
      // Check by company ID first (most reliable) - handle both ObjectId and string
      const idStr = companyId?.toString() || companyIdStr || "";
      if (idStr === "693128338bcc0d6a2f75d16a") {
        return 196451; // DISPL - Dellcube Integrated Solutions Pvt Ltd
      } else if (idStr === "69312a928bcc0d6a2f75d1ac") {
        return 5389; // DSCS - Dellcube Supply Chain
      }
      
      // Fallback to company code check
      const codeUpper = (companyCode || "").toUpperCase();
      if (codeUpper === "DISPL") {
        return 196451; // Dellcube Integrated Solutions Pvt Ltd
      } else if (codeUpper === "DSCS") {
        return 5389; // Dellcube Supply Chain
      }
      
      // Fallback to name check (for backward compatibility)
      const nameLower = (companyName || "").toLowerCase();
      if (nameLower.includes("dellcube") && nameLower.includes("integrated")) {
        return 196451; // Dellcube Integrated Solutions Pvt Ltd
      } else if (nameLower.includes("supply chain")) {
        return 5389; // Supply Chain
      }
      
      return 10000; // Default starting number
    };

    const startingDocketNumber = getStartingDocketNumber(companyId, companyCode, companyName);
    
    // Debug logging
    console.log(`Company ID: ${companyId}, Company Code: ${companyCode}, Starting Number: ${startingDocketNumber}`);

    // Generate date string (DDMMYYYY)
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${dd}${mm}${yyyy}`;

    // Generate docketPrefix (CompanyCode-BranchCode-Date)
    const docketPrefix = `${companyCode}-${branchCode}-${dateStr}`;

    // Find the highest numeric docket number for this specific company
    // Only consider invoices from the same company to maintain separate series
    const invoices = await Invoice.find({ company: companyId })
      .select("docketNumber")
      .lean();

    let maxDocketNumber = startingDocketNumber - 1; // Start from one less than starting number
    
    // For companies with specific starting numbers, ignore old docket numbers (>= 10000)
    // that were created before this logic was implemented
    const shouldIgnoreOldNumbers = startingDocketNumber < 10000;
    const oldNumberThreshold = 10000;
    
    for (const invoice of invoices) {
      if (invoice?.docketNumber) {
        // Try to parse the docket number as a numeric value (must be pure number, no dashes)
        const parsedNumber = parseInt(invoice.docketNumber, 10);
        if (!isNaN(parsedNumber)) {
          // Only consider numbers that are >= starting number for this company
          // For companies with specific starting numbers (like DSCS: 5389), ignore old numbers (>= 10000)
          if (parsedNumber >= startingDocketNumber) {
            if (shouldIgnoreOldNumbers && parsedNumber >= oldNumberThreshold) {
              // Ignore old docket numbers that were created before this logic
              continue;
            }
            if (parsedNumber > maxDocketNumber) {
          maxDocketNumber = parsedNumber;
            }
          }
        }
      }
    }

    // Ensure we don't go below the starting number
    // If no invoices exist with numbers >= starting number (and < 10000 for specific companies), start from starting number
    const nextDocketNumber = Math.max(maxDocketNumber + 1, startingDocketNumber);
    
    console.log(`Company: ${companyCode}, Starting: ${startingDocketNumber}, Max found: ${maxDocketNumber}, Next: ${nextDocketNumber}`);
    const docketNumber = String(nextDocketNumber);

    const invoiceNumberValues = normalizeMultiValueField(
      req.body.invoiceNumber
    );
    const ewayBillNumberValues = normalizeMultiValueField(req.body.ewayBillNo);
    
    // Validate e-way bill numbers (must be exactly 12 digits each)
    if (ewayBillNumberValues.length > 0) {
      for (const ewayBill of ewayBillNumberValues) {
        if (!/^\d{12}$/.test(ewayBill)) {
          return res.status(400).json({
            success: false,
            message: `E-way bill number "${ewayBill}" must be exactly 12 digits.`,
          });
        }
      }
    }

    const { vehicleNumber } = req.body;
    const consignorSiteId =
      req.body.siteId1 || req.body.consignorSiteId || "";
    const consigneeSiteId =
      req.body.siteId2 || req.body.siteId || req.body.consigneeSiteId || "";

    let consignorDetailsForResponse = null;
    let consigneeDetailsForResponse = null;
    let vehicleData = null;
    let ownerType = "";

    if (vehicleNumber) {
      // Search in Dellcube's vehicles
      const vehicle = await Vehicle.findOne({ vehicleNumber }).populate(
        "currentDriver"
      );
      if (vehicle) {
        vehicleData = vehicle;
        ownerType = "Dellcube";
      } else {
        // Search in vendors' vehicles (vendors are Users with role 'vendor')
        const vendor = await User.findOne({
          role: "vendor",
          "availableVehicles.vehicleNumber": vehicleNumber,
        });
        if (vendor) {
          const vendorVehicle = vendor.availableVehicles.find(
            (v) => v.vehicleNumber === vehicleNumber
          );
          vehicleData = { ...vendorVehicle, vendor: vendor._id };
          ownerType = "Vendor";
        }
      }
    }

    if (vehicleNumber && !vehicleData) {
      return res
        .status(404)
        .json({ success: false, message: "Vehicle not found." });
    }

    // Auto-create consignee/consignor if siteId provided but not found in customer
    if (
      req.body.customer &&
      (consigneeSiteId || req.body.consignee || req.body.consignor || consignorSiteId)
    ) {
      try {
        const customer = await Customer.findById(req.body.customer);
        
        if (customer) {
          let customerUpdated = false;

          // Auto-create/update consignee if siteId and consignee provided
          if (consigneeSiteId && req.body.consignee) {
            let existingConsignee = customer.consignees.find(
              (c) => c.siteId === consigneeSiteId
            );

            if (!existingConsignee) {
              const newConsignee = {
                siteId: consigneeSiteId,
                consignee: req.body.consignee,
                address:
                  req.body.consigneeAddress || req.body.deliveryAddress || "",
              };
              customer.consignees.push(newConsignee);
              existingConsignee = newConsignee;
              customerUpdated = true;
              console.log(
                `Auto-created consignee: ${req.body.consignee} (${consigneeSiteId})`
              );
            } else if (
              !existingConsignee.address &&
              (req.body.consigneeAddress || req.body.deliveryAddress)
            ) {
              existingConsignee.address =
                req.body.consigneeAddress || req.body.deliveryAddress;
              customerUpdated = true;
            }

            if (existingConsignee) {
              consigneeDetailsForResponse = {
                siteId: existingConsignee.siteId || "",
                siteName: existingConsignee.consignee,
                address:
                  existingConsignee.address ||
                  req.body.consigneeAddress ||
                  req.body.deliveryAddress ||
                  "",
              };
            }
          }

          // Auto-create/update consignor if provided and not exists
          if (req.body.consignor) {
            let existingConsignor = null;
            if (consignorSiteId) {
              existingConsignor = customer.consignors.find(
                (c) => c.siteId === consignorSiteId
              );
            }
            if (!existingConsignor) {
              existingConsignor = customer.consignors.find(
                (c) => c.consignor === req.body.consignor
              );
            }

            if (!existingConsignor) {
              const newConsignor = {
                siteId: consignorSiteId || "",
                consignor: req.body.consignor,
                address:
                  req.body.consignorAddress || req.body.pickupAddress || "",
              };
              customer.consignors.push(newConsignor);
              existingConsignor = newConsignor;
              customerUpdated = true;
              console.log(`Auto-created consignor: ${req.body.consignor}`);
            } else if (
              !existingConsignor.address &&
              (req.body.consignorAddress || req.body.pickupAddress)
            ) {
              existingConsignor.address =
                req.body.consignorAddress || req.body.pickupAddress;
              customerUpdated = true;
            }

            if (existingConsignor) {
              consignorDetailsForResponse = {
                siteId: existingConsignor.siteId || "",
                siteName: existingConsignor.consignor,
                address:
                  existingConsignor.address ||
                  req.body.consignorAddress ||
                  req.body.pickupAddress ||
                  "",
              };
            }
          }

          // Save customer if updated
          if (customerUpdated) {
            await customer.save();
          }
        }
      } catch (error) {
        console.error("Error auto-creating consignee/consignor:", error);
        // Don't fail the invoice creation if consignee/consignor auto-creation fails
      }
    }

    const creatorSignatureBase64 = await getUserSignatureBase64(
      req.user?.userId
    );

    // The following fields are now supported: pickupAddress, deliveryAddress, consignor, consignee, address, invoiceNumber, invoiceBill, ewayBillNo, driverContactNumber, siteId, sealNo, vehicleSize, orderNumber, transportMode
    const invoicePayload = {
      ...req.body,
      company: companyId,
      branch: branchId,
      docketNumber,
      docketPrefix,
      invoiceNumber: invoiceNumberValues,
      ewayBillNo: ewayBillNumberValues,
      orderNumber: req.body.orderNumber || "",
      transportMode: req.body.transportMode,
      ...(creatorSignatureBase64 && {
        dellcubeSignature: creatorSignatureBase64,
      }),
    };

    if (vehicleData) {
      invoicePayload.vehicleType = ownerType;
      if (ownerType === "Dellcube") {
        invoicePayload.vehicle = vehicleData._id;
        // Only set driver from vehicle if not already provided in request body
        if (!req.body.driver) {
          invoicePayload.driver = vehicleData.currentDriver?._id;
        }
        invoicePayload.vehicleSize = vehicleData.type;
        delete invoicePayload.vendor;
        delete invoicePayload.vendorVehicle;
      } else if (ownerType === "Vendor") {
        invoicePayload.vendor = vehicleData.vendor;
        invoicePayload.vendorVehicle = vehicleData;
        delete invoicePayload.vehicle;

        // If using a vendor vehicle, validate customer is in vendor's assigned clients
        if (vehicleData.vendor) {
          const vendor = await User.findById(vehicleData.vendor).populate(
            "assignedClients"
          );
          if (vendor && vendor.assignedClients && vendor.assignedClients.length > 0) {
            const assignedCustomerIds = vendor.assignedClients.map(
              (client) => client._id?.toString() || client.toString()
            );
            
            // If customer is not provided and vendor has only one assigned client, auto-set it
            if (!invoicePayload.customer && vendor.assignedClients.length === 1) {
              invoicePayload.customer = vendor.assignedClients[0]._id || vendor.assignedClients[0];
              console.log(
                "Auto-setting customer to vendor's only assigned client:",
                vendor.assignedClients[0].name
              );
            } else if (invoicePayload.customer) {
              // Validate that the selected customer is in vendor's assigned clients
              const customerIdStr = invoicePayload.customer.toString();
              if (!assignedCustomerIds.includes(customerIdStr)) {
                return res.status(403).json({
                  success: false,
                  message: "You can only create dockets for your assigned customers.",
                });
              }
            } else {
              // Multiple assigned clients but no customer selected
              return res.status(400).json({
                success: false,
                message: "Please select a customer from your assigned customers.",
              });
            }
          }
        }
      }
    }

    if (
      !consigneeDetailsForResponse &&
      (consigneeSiteId || req.body.consignee || req.body.consigneeAddress)
    ) {
      consigneeDetailsForResponse = {
        siteId: consigneeSiteId || "",
        siteName: req.body.consignee || "",
        address:
          req.body.consigneeAddress || req.body.deliveryAddress || "",
      };
    }

    if (
      !consignorDetailsForResponse &&
      (consignorSiteId || req.body.consignor || req.body.consignorAddress)
    ) {
      consignorDetailsForResponse = {
        siteId: consignorSiteId || "",
        siteName: req.body.consignor || "",
        address:
          req.body.consignorAddress || req.body.pickupAddress || "",
      };
    }

    const invoice = await Invoice.create(invoicePayload);
    const invoiceData = invoice.toObject();
    const formattedConsignor =
      consignorDetailsForResponse && (consignorDetailsForResponse.siteName || consignorDetailsForResponse.siteId)
        ? {
            siteId: consignorDetailsForResponse.siteId || "",
            siteName: consignorDetailsForResponse.siteName || "",
            address: consignorDetailsForResponse.address || "",
          }
        : null;
    const formattedConsignee =
      consigneeDetailsForResponse && (consigneeDetailsForResponse.siteName || consigneeDetailsForResponse.siteId)
        ? {
            siteId: consigneeDetailsForResponse.siteId || "",
            siteName: consigneeDetailsForResponse.siteName || "",
            address: consigneeDetailsForResponse.address || "",
          }
        : null;

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: {
        ...invoiceData,
        siteId1: formattedConsignor,
        siteId2: formattedConsignee,
        consignorAddress:
          (formattedConsignor && formattedConsignor.address) ||
          req.body.consignorAddress ||
          "",
        consigneeAddress:
          (formattedConsignee && formattedConsignee.address) ||
          req.body.consigneeAddress ||
          "",
      },
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
    const userToken = req.user;
    const actingUser = await User.findById(userToken?.userId).select(
      "role company branch"
    );

    if (!actingUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
      });
    }

    // Use companyId/branchId from token if not provided in body (for non-superAdmin users)
    let companyId = req.body.company || (req.user?.role !== "superAdmin" ? req.companyId : null);
    let branchId = req.body.branch || (req.user?.role !== "superAdmin" ? req.branchId : null);

    // Role-based control - use token values (selected company/branch) if available, otherwise use first from user's array
    if (
      actingUser.role === "branchAdmin" ||
      actingUser.role === "operation"
    ) {
      // Priority: 1. req.body.company (explicit), 2. req.companyId (token/selected), 3. user's company array
      if (!companyId) {
        if (req.companyId) {
          companyId = req.companyId;
        } else {
          // Fallback to user's company (handle both array and single value)
          if (Array.isArray(actingUser.company) && actingUser.company.length > 0) {
            companyId = actingUser.company[0].toString();
          } else if (actingUser.company) {
            companyId = actingUser.company.toString();
          }
        }
      }
      
      // Priority: 1. req.body.branch (explicit), 2. req.branchId (token/selected), 3. user's branch array
      if (!branchId) {
        if (req.branchId) {
          branchId = req.branchId;
        } else {
          // Fallback to user's branch (handle both array and single value)
          if (Array.isArray(actingUser.branch) && actingUser.branch.length > 0) {
            branchId = actingUser.branch[0].toString();
          } else if (actingUser.branch) {
            branchId = actingUser.branch.toString();
          }
        }
      }
    }

    if (!companyId || !branchId) {
      return res.status(400).json({
        success: false,
        message: "Company and Branch information is required.",
      });
    }

    const {
      customer,
      fromAddress,
      toAddress,
      quantity = 1,
      invoiceNumber: requestedInvoiceNumber,
      ewayBillNo: requestedEwayBillNo,
      ...rest
    } = req.body;
    if (!customer || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Customer and quantity are required.",
      });
    }

    // Fetch company and branch documents with their codes
    const companyDoc = await mongoose
      .model("Company")
      .findById(companyId)
      .select("companyCode name");
    const branchDoc = await mongoose
      .model("Branch")
      .findById(branchId)
      .select("branchCode");

    if (!companyDoc || !branchDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid company or branch selected",
      });
    }

    // Use the actual companyCode and branchCode from database
    const companyCode = companyDoc.companyCode;
    const branchCode = branchDoc.branchCode;
    const companyIdStr = companyId.toString();
    const companyName = companyDoc.name || "";

    // Helper function to determine starting docket number based on company ID or code
    const getStartingDocketNumber = (companyId, companyCode, companyName) => {
      // Check by company ID first (most reliable) - handle both ObjectId and string
      const idStr = companyId?.toString() || companyIdStr || "";
      if (idStr === "693128338bcc0d6a2f75d16a") {
        return 196451; // DISPL - Dellcube Integrated Solutions Pvt Ltd
      } else if (idStr === "69312a928bcc0d6a2f75d1ac") {
        return 5389; // DSCS - Dellcube Supply Chain
      }
      
      // Fallback to company code check
      const codeUpper = (companyCode || "").toUpperCase();
      if (codeUpper === "DISPL") {
        return 196451; // Dellcube Integrated Solutions Pvt Ltd
      } else if (codeUpper === "DSCS") {
        return 5389; // Dellcube Supply Chain
      }
      
      // Fallback to name check (for backward compatibility)
      const nameLower = (companyName || "").toLowerCase();
      if (nameLower.includes("dellcube") && nameLower.includes("integrated")) {
        return 196451; // Dellcube Integrated Solutions Pvt Ltd
      } else if (nameLower.includes("supply chain")) {
        return 5389; // Supply Chain
      }
      
      return 10000; // Default starting number
    };

    const startingDocketNumber = getStartingDocketNumber(companyId, companyCode, companyName);

    // Generate date string (DDMMYYYY)
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${dd}${mm}${yyyy}`;

    // Generate docketPrefix (CompanyCode-BranchCode-Date)
    const docketPrefix = `${companyCode}-${branchCode}-${dateStr}`;

    // Find the highest numeric docket number for this specific company
    // Only consider invoices from the same company to maintain separate series
    const invoices = await Invoice.find({ company: companyId })
      .select("docketNumber")
      .lean();

    let maxDocketNumber = startingDocketNumber - 1; // Start from one less than starting number
    
    // For companies with specific starting numbers, ignore old docket numbers (>= 10000)
    // that were created before this logic was implemented
    const shouldIgnoreOldNumbers = startingDocketNumber < 10000;
    const oldNumberThreshold = 10000;
    
    for (const invoice of invoices) {
      if (invoice?.docketNumber) {
        // Try to parse the docket number as a numeric value (must be pure number, no dashes)
        const parsedNumber = parseInt(invoice.docketNumber, 10);
        if (!isNaN(parsedNumber)) {
          // Only consider numbers that are >= starting number for this company
          // For companies with specific starting numbers (like DSCS: 5389), ignore old numbers (>= 10000)
          if (parsedNumber >= startingDocketNumber) {
            if (shouldIgnoreOldNumbers && parsedNumber >= oldNumberThreshold) {
              // Ignore old docket numbers that were created before this logic
              continue;
            }
            if (parsedNumber > maxDocketNumber) {
          maxDocketNumber = parsedNumber;
            }
          }
        }
      }
    }

    // Ensure we don't go below the starting number
    // If no invoices exist with numbers >= starting number (and < 10000 for specific companies), start from starting number
    let nextDocketNumber = Math.max(maxDocketNumber + 1, startingDocketNumber);
    
    console.log(`Reserved - Company: ${companyCode}, Starting: ${startingDocketNumber}, Max found: ${maxDocketNumber}, Next: ${nextDocketNumber}`);
    const creatorSignatureBase64 = await getUserSignatureBase64(
      req.user?.userId
    );

    const invoiceNumberValues = normalizeMultiValueField(
      requestedInvoiceNumber
    );
    const ewayBillValues = normalizeMultiValueField(requestedEwayBillNo);
    
    // Validate e-way bill numbers (must be exactly 12 digits each)
    if (ewayBillValues.length > 0) {
      for (const ewayBill of ewayBillValues) {
        if (!/^\d{12}$/.test(ewayBill)) {
          return res.status(400).json({
            success: false,
            message: `E-way bill number "${ewayBill}" must be exactly 12 digits.`,
          });
        }
      }
    }

    const reservedInvoices = [];
    for (let i = 1; i <= quantity; i++) {
      const docketNumber = String(nextDocketNumber);
      reservedInvoices.push({
        company: companyId,
        branch: branchId,
        customer,
        fromAddress,
        toAddress,
        docketNumber,
        docketPrefix,
        invoiceNumber: invoiceNumberValues,
        ewayBillNo: ewayBillValues,
        status: "Reserved",
        ...rest,
        ...(creatorSignatureBase64 && {
          dellcubeSignature: creatorSignatureBase64,
        }),
      });
      nextDocketNumber++;
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
    // Use companyId/branchId from token if not provided in query (for non-superAdmin users)
    const finalCompanyId = companyId || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranchId = branchId || (req.user?.role !== "superAdmin" ? req.branchId : null);
    if (finalCompanyId) query.company = finalCompanyId;
    if (finalBranchId) query.branch = finalBranchId;
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

    // Vendor access control
    if (req.user?.role === "vendor") {
      // If UI provides customerId (for assigned client), honor that and do not force vendor filter
      if (!customerId) {
        // If no explicit customer filter, default to invoices for the vendor's assigned client if available
        const vendorDoc = await User.findById(req.user.userId).select(
          "assignedClients"
        ).populate("assignedClients");
        if (vendorDoc?.assignedClients && vendorDoc.assignedClients.length > 0) {
          const customerIds = vendorDoc.assignedClients.map(
            (client) => client._id || client
          );
          query.customer = { $in: customerIds };
        } else {
          // Fallback: restrict to invoices explicitly tagged with this vendor
          query.vendor = req.user.userId;
        }
      }
    }

    // Use aggregation with allowDiskUse to handle large sorts efficiently
    // Convert string IDs in query to ObjectIds for proper matching
    const mongoQuery = {};
    Object.keys(query).forEach(key => {
      if (key === '_id' && query[key].$in) {
        mongoQuery[key] = {
          $in: query[key].$in.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id)
        };
      } else if (mongoose.Types.ObjectId.isValid(query[key])) {
        mongoQuery[key] = new mongoose.Types.ObjectId(query[key]);
      } else {
        mongoQuery[key] = query[key];
      }
    });
    
    // First, get the invoice IDs with sorting and pagination
    // Get total count first (no sorting needed)
    const total = await Invoice.countDocuments(mongoQuery);
    
    // Get invoice IDs without sorting to avoid memory limits
    // We'll fetch all matching IDs, sort in memory, then paginate
    const allInvoiceIds = await Invoice.find(mongoQuery)
      .select('_id createdAt')
      .lean();
    
    // Sort in memory by createdAt descending
    allInvoiceIds.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA; // Descending order
    });
    
    // Apply pagination after sorting
    const paginatedIds = allInvoiceIds.slice(skip, skip + limit);
    
    // If no IDs found, return empty array
    if (!paginatedIds || paginatedIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Invoices fetched successfully",
        invoices: [],
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      });
    }
    
    const ids = paginatedIds.map(doc => doc._id);
    
    // Create a map to preserve order
    const orderMap = new Map();
    paginatedIds.forEach((doc, index) => {
      orderMap.set(doc._id.toString(), index);
    });
    
    // Now fetch the invoices with all populates
    const invoices = await Invoice.find({ _id: { $in: ids } })
      .populate("company", "name address contactPhone gstNumber pan")
      .populate("branch", "name")
      .populate("customer", "name phone email consignors consignees")
      .populate("goodsType", "name items")
      .populate("vehicle", "vehicleNumber")
      .populate("vendor", "name")
      .populate("driver", "name phone")
      .populate(
        "fromAddress.country fromAddress.state fromAddress.city fromAddress.locality"
      )
      .populate(
        "toAddress.country toAddress.state toAddress.city toAddress.locality"
      )
      .populate("siteType", "name desc")
      .populate("transportMode", "name desc")
      .lean();
    
    // Sort the results to match the original order (by createdAt descending)
    invoices.sort((a, b) => {
      const orderA = orderMap.get(a._id.toString());
      const orderB = orderMap.get(b._id.toString());
      if (orderA && orderB) {
        return orderA.index - orderB.index;
      }
      // Fallback to createdAt if order map doesn't have entry
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    // Helper function to build full formatted address from components
    const buildFullAddress = (addressObj) => {
      if (!addressObj) return "";
      const parts = [];
      if (addressObj.locality?.name) parts.push(addressObj.locality.name);
      if (addressObj.city?.name) parts.push(addressObj.city.name);
      if (addressObj.district) parts.push(addressObj.district);
      if (addressObj.taluk) parts.push(addressObj.taluk);
      if (addressObj.state?.name || addressObj.stateName) parts.push(addressObj.state?.name || addressObj.stateName);
      if (addressObj.country?.name || addressObj.countryName) parts.push(addressObj.country?.name || addressObj.countryName);
      if (addressObj.pincode) parts.push(addressObj.pincode);
      return parts.join(", ");
    };

    // Helper function to get consignor/consignee address from customer
    const getConsignorAddress = (inv) => {
      if (inv.pickupAddress) return inv.pickupAddress;
      if (inv.customer?.consignors && Array.isArray(inv.customer.consignors) && inv.consignor) {
        let consignor = inv.customer.consignors.find(c => c.consignor === inv.consignor);
        if (!consignor && inv.siteId) {
          consignor = inv.customer.consignors.find(c => c.siteId === inv.siteId);
        }
        if (consignor?.address) return consignor.address;
      }
      return buildFullAddress(inv.fromAddress);
    };

    const getConsigneeAddress = (inv) => {
      if (inv.deliveryAddress) return inv.deliveryAddress;
      if (inv.customer?.consignees && Array.isArray(inv.customer.consignees) && inv.consignee) {
        let consignee = inv.customer.consignees.find(c => c.consignee === inv.consignee);
        if (!consignee && inv.siteId) {
          consignee = inv.customer.consignees.find(c => c.siteId === inv.siteId);
        }
        if (consignee?.address) return consignee.address;
      }
      return buildFullAddress(inv.toAddress);
    };

    // Add computed fields to each invoice
    // Note: invoices are already plain objects (lean), so no need for toObject()
    const invoicesWithComputedFields = invoices.map(inv => {
      const invObj = { ...inv }; // Create a copy
      invObj.consignorAddress = getConsignorAddress(inv);
      invObj.consigneeAddress = getConsigneeAddress(inv);
      invObj.fromFullAddress = buildFullAddress(inv.fromAddress);
      invObj.toFullAddress = buildFullAddress(inv.toAddress);
      return invObj;
    });

    return res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      invoices: invoicesWithComputedFields,
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

    // Permission check for vendors:
    // - Allow if this invoice belongs to the vendor (invoice.vendor matches logged-in vendor)
    // - OR if the invoice's customer is one of the vendor's assignedClients
    if (req.user?.role === "vendor") {
      const loggedInVendorId = String(req.user.userId);

      const isVendorOwner =
        invoice.vendor && String(invoice.vendor._id || invoice.vendor) === loggedInVendorId;

      let isAssignedClient = false;
      if (invoice.customer) {
        try {
          const vendorDoc = await User.findById(loggedInVendorId).select(
            "assignedClients"
          );
          if (vendorDoc?.assignedClients?.length) {
            const customerId = String(
              invoice.customer._id || invoice.customer
            );
            isAssignedClient = vendorDoc.assignedClients.some(
              (id) => String(id) === customerId
            );
          }
        } catch (permErr) {
          console.error(
            "Error checking vendor permissions for invoice:",
            permErr
          );
        }
      }

      if (!isVendorOwner && !isAssignedClient) {
        return res
          .status(403)
          .json({ success: false, message: "Forbidden" });
      }
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

    const previousStatus = invoice.status;
    const attemptStatuses = ["Undelivered", "Delivered"];

    if (updates.invoiceNumber !== undefined) {
      invoice.invoiceNumber = normalizeMultiValueField(updates.invoiceNumber);
      delete updates.invoiceNumber;
    }

    if (updates.ewayBillNo !== undefined) {
      const ewayBillValues = normalizeMultiValueField(updates.ewayBillNo);
      
      // Validate e-way bill numbers (must be exactly 12 digits each)
      if (ewayBillValues.length > 0) {
        for (const ewayBill of ewayBillValues) {
          if (!/^\d{12}$/.test(ewayBill)) {
            return res.status(400).json({
              success: false,
              message: `E-way bill number "${ewayBill}" must be exactly 12 digits.`,
            });
          }
        }
      }
      
      invoice.ewayBillNo = ewayBillValues;
      delete updates.ewayBillNo;
    }

    // Vehicle logic (same as createInvoice)
    if (updates.vehicleNumber) {
      let vehicleData = null;
      let ownerType = "";
      // Search in Dellcube's vehicles
      const vehicle = await Vehicle.findOne({
        vehicleNumber: updates.vehicleNumber,
      }).populate("currentDriver");
      if (vehicle) {
        vehicleData = vehicle;
        ownerType = "Dellcube";
      } else {
        // Search in vendors' vehicles
        const vendor = await User.findOne({
          role: "vendor",
          "availableVehicles.vehicleNumber": updates.vehicleNumber,
        });
        if (vendor) {
          const vendorVehicle = vendor.availableVehicles.find(
            (v) => v.vehicleNumber === updates.vehicleNumber
          );
          vehicleData = { ...vendorVehicle, vendor: vendor._id };
          ownerType = "Vendor";
        }
      }
      if (!vehicleData) {
        return res
          .status(404)
          .json({ success: false, message: "Vehicle not found." });
      }
      // Set vehicle-related fields
      invoice.vehicleType = ownerType;
      if (ownerType === "Dellcube") {
        invoice.vehicle = vehicleData._id;
        invoice.driver = vehicleData.currentDriver?._id;
        invoice.vehicleSize = vehicleData.type;
        invoice.vendor = undefined;
        invoice.vendorVehicle = undefined;
      } else if (ownerType === "Vendor") {
        invoice.vendor = vehicleData.vendor;
        invoice.vendorVehicle = vehicleData;
        invoice.vehicle = undefined;

        // If using a vendor vehicle, validate customer is in vendor's assigned clients
        if (vehicleData.vendor) {
          const vendor = await User.findById(vehicleData.vendor).populate(
            "assignedClients"
          );
          if (vendor && vendor.assignedClients && vendor.assignedClients.length > 0) {
            const assignedCustomerIds = vendor.assignedClients.map(
              (client) => client._id?.toString() || client.toString()
            );
            
            // If customer is not provided and vendor has only one assigned client, auto-set it
            if (!invoice.customer && vendor.assignedClients.length === 1) {
              invoice.customer = vendor.assignedClients[0]._id || vendor.assignedClients[0];
              console.log(
                "Auto-setting customer to vendor's only assigned client:",
                vendor.assignedClients[0].name
              );
            } else if (invoice.customer) {
              // Validate that the selected customer is in vendor's assigned clients
              const customerIdStr = invoice.customer.toString();
              if (!assignedCustomerIds.includes(customerIdStr)) {
                return res.status(403).json({
                  success: false,
                  message: "You can only update dockets for your assigned customers.",
                });
              }
            }
          }
        }
      }
    }

    const pendingUndeliveredReason = updates.undeliveredReason;
    delete updates.undeliveredReason;

    Object.keys(updates).forEach((key) => {
      // Don't overwrite vehicle fields if vehicleNumber was handled above
      if (updates[key] !== undefined && key !== "vehicleNumber") {
        // Special handling: arrays and nested structures
        if (key === "goodItems" && Array.isArray(updates[key])) {
          invoice.goodItems = updates[key];
        } else if (
          (key === "fromAddress" || key === "toAddress") &&
          typeof updates[key] === "object"
        ) {
          invoice[key] = { ...(invoice[key] || {}), ...updates[key] };
        } else if (key === "misData" && typeof updates[key] === "object") {
          invoice.misData = { ...(invoice.misData || {}), ...updates[key] };
        } else {
          invoice[key] = updates[key];
        }
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

    if (
      updates.status &&
      attemptStatuses.includes(updates.status) &&
      updates.status !== previousStatus
    ) {
      const attemptEntry = {
        status: updates.status,
        attemptedAt: new Date(),
      };

      if (updates.status === "Undelivered") {
        const reason =
          pendingUndeliveredReason ||
          invoice.undeliveredReason ||
          updates.reason ||
          "";
        if (!reason.trim()) {
          return res.status(400).json({
            success: false,
            message: "Reason is required when marking a docket as Undelivered.",
          });
        }
        attemptEntry.reason = reason.trim();
        invoice.undeliveredReason = reason.trim();
      } else if (updates.status === "Delivered") {
        invoice.undeliveredReason = "";
      }

      invoice.deliveryAttempts = invoice.deliveryAttempts || [];
      invoice.deliveryAttempts.push(attemptEntry);
    } else if (pendingUndeliveredReason) {
      invoice.undeliveredReason = pendingUndeliveredReason.trim();
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
      return res
        .status(400)
        .json({ success: false, message: "Valid invoice ID is required" });
    }
    const invoice = await Invoice.findById(invoiceId)
      .populate("company branch customer goodsType vehicle vendor driver")
      .populate("siteType", "name desc")
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
    res.json({ success: true, invoice });
  } catch (err) {
    console.error("Invoice fetch error:", err);
    res
      .status(500)
      .json({ error: "Failed to fetch invoice", details: err.message });
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
      const idArr = ids.split(",").map((id) => id.trim());
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

    // Use lean() and cursor to avoid memory issues with large datasets
    // Convert ObjectIds in query to proper format for MongoDB
    const mongoQuery = {};
    Object.keys(query).forEach(key => {
      if (key === '_id' && query[key].$in) {
        mongoQuery[key] = {
          $in: query[key].$in.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id)
        };
      } else if (mongoose.Types.ObjectId.isValid(query[key])) {
        mongoQuery[key] = new mongoose.Types.ObjectId(query[key]);
      } else {
        mongoQuery[key] = query[key];
      }
    });

    // Use aggregation with allowDiskUse to handle large datasets efficiently
    // This avoids memory limits when sorting/populating large result sets
    // Execute aggregation using cursor to process in batches and avoid memory issues
    const invoices = [];
    const invoicesAggregation = Invoice.aggregate([
      { $match: mongoQuery },
      // Lookup company
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company",
        },
      },
      // Lookup branch
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      // Lookup customer
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "customer",
        },
      },
      // Lookup goodsType
      {
        $lookup: {
          from: "goods",
          localField: "goodsType",
          foreignField: "_id",
          as: "goodsType",
        },
      },
      // Lookup vehicle
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicle",
        },
      },
      // Lookup vendor
      {
        $lookup: {
          from: "users",
          localField: "vendor",
          foreignField: "_id",
          as: "vendor",
        },
      },
      // Lookup driver
      {
        $lookup: {
          from: "users",
          localField: "driver",
          foreignField: "_id",
          as: "driver",
        },
      },
      // Lookup siteType
      {
        $lookup: {
          from: "sitetypes",
          localField: "siteType",
          foreignField: "_id",
          as: "siteType",
        },
      },
      // Lookup transportMode
      {
        $lookup: {
          from: "transportmodes",
          localField: "transportMode",
          foreignField: "_id",
          as: "transportMode",
        },
      },
      // Lookup fromAddress fields
      {
        $lookup: {
          from: "countries",
          localField: "fromAddress.country",
          foreignField: "_id",
          as: "fromAddressCountry",
        },
      },
      {
        $lookup: {
          from: "states",
          localField: "fromAddress.state",
          foreignField: "_id",
          as: "fromAddressState",
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "fromAddress.city",
          foreignField: "_id",
          as: "fromAddressCity",
        },
      },
      {
        $lookup: {
          from: "localities",
          localField: "fromAddress.locality",
          foreignField: "_id",
          as: "fromAddressLocality",
        },
      },
      // Lookup toAddress fields
      {
        $lookup: {
          from: "countries",
          localField: "toAddress.country",
          foreignField: "_id",
          as: "toAddressCountry",
        },
      },
      {
        $lookup: {
          from: "states",
          localField: "toAddress.state",
          foreignField: "_id",
          as: "toAddressState",
        },
      },
      {
        $lookup: {
          from: "cities",
          localField: "toAddress.city",
          foreignField: "_id",
          as: "toAddressCity",
        },
      },
      {
        $lookup: {
          from: "localities",
          localField: "toAddress.locality",
          foreignField: "_id",
          as: "toAddressLocality",
        },
      },
      // Reshape the data to match populate format
      {
        $addFields: {
          company: { $arrayElemAt: ["$company", 0] },
          branch: { $arrayElemAt: ["$branch", 0] },
          customer: { $arrayElemAt: ["$customer", 0] },
          goodsType: { $arrayElemAt: ["$goodsType", 0] },
          vehicle: { $arrayElemAt: ["$vehicle", 0] },
          vendor: { $arrayElemAt: ["$vendor", 0] },
          driver: { $arrayElemAt: ["$driver", 0] },
          siteType: { $arrayElemAt: ["$siteType", 0] },
          transportMode: { $arrayElemAt: ["$transportMode", 0] },
          "fromAddress.country": { $arrayElemAt: ["$fromAddressCountry", 0] },
          "fromAddress.state": { $arrayElemAt: ["$fromAddressState", 0] },
          "fromAddress.city": { $arrayElemAt: ["$fromAddressCity", 0] },
          "fromAddress.locality": { $arrayElemAt: ["$fromAddressLocality", 0] },
          "toAddress.country": { $arrayElemAt: ["$toAddressCountry", 0] },
          "toAddress.state": { $arrayElemAt: ["$toAddressState", 0] },
          "toAddress.city": { $arrayElemAt: ["$toAddressCity", 0] },
          "toAddress.locality": { $arrayElemAt: ["$toAddressLocality", 0] },
        },
      },
    ], {
      allowDiskUse: true
    });
    
    // Process results using cursor to stream data and avoid memory issues
    const cursor = invoicesAggregation.cursor({ batchSize: 100 });
    for await (const invoice of cursor) {
      invoices.push(invoice);
    }

    // Collect all unique MIS field names and labels across all invoices
    const allMisFields = new Map(); // Map of fieldName -> fieldLabel
    
    // First pass: Collect from customer misFields configuration (to get proper labels)
    // This ensures we have the correct fieldLabel for each fieldName
    invoices.forEach((inv) => {
      if (inv.customer?.misFields && Array.isArray(inv.customer.misFields)) {
        inv.customer.misFields.forEach((field) => {
          if (field.fieldName) {
            const fieldLabel = field.fieldLabel || field.fieldName;
            // Store with fieldName as key and fieldLabel as value
            allMisFields.set(field.fieldName, fieldLabel);
          }
        });
      }
    });
    
    // Second pass: Collect from actual misData in invoices (ensures we get all fields that have data)
    // This catches any fields that exist in misData but might not be in customer misFields config
    invoices.forEach((inv) => {
      if (inv.misData && typeof inv.misData === 'object') {
        Object.keys(inv.misData).forEach((fieldName) => {
          if (!allMisFields.has(fieldName)) {
            // Try to find the field label from customer misFields config
            const customer = inv.customer;
            if (customer?.misFields && Array.isArray(customer.misFields)) {
              const field = customer.misFields.find(f => f.fieldName === fieldName);
              if (field && field.fieldLabel) {
                allMisFields.set(fieldName, field.fieldLabel);
              } else {
                // Use fieldName as label if not found in misFields config
                // Convert camelCase to Title Case for better readability
                const formattedLabel = fieldName
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())
                  .trim();
                allMisFields.set(fieldName, formattedLabel);
              }
            } else {
              // Use fieldName as label if customer misFields not available
              // Convert camelCase to Title Case for better readability
              const formattedLabel = fieldName
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .trim();
              allMisFields.set(fieldName, formattedLabel);
            }
          }
        });
      }
    });
    
    

    const attemptStatuses = ["Undelivered", "Delivered"];

    // Helper function to build full formatted address from components
    const buildFullAddress = (addressObj) => {
      if (!addressObj) return "";
      const parts = [];
      if (addressObj.locality?.name) parts.push(addressObj.locality.name);
      if (addressObj.city?.name) parts.push(addressObj.city.name);
      if (addressObj.district) parts.push(addressObj.district);
      if (addressObj.taluk) parts.push(addressObj.taluk);
      if (addressObj.state?.name || addressObj.stateName) parts.push(addressObj.state?.name || addressObj.stateName);
      if (addressObj.country?.name || addressObj.countryName) parts.push(addressObj.country?.name || addressObj.countryName);
      if (addressObj.pincode) parts.push(addressObj.pincode);
      return parts.join(", ");
    };

    // Helper function to get consignor/consignee address from customer
    const getConsignorAddress = (inv) => {
      // First try to get from invoice's pickupAddress field
      if (inv.pickupAddress) return inv.pickupAddress;
      
      // Then try to get from customer's consignors array
      if (inv.customer?.consignors && Array.isArray(inv.customer.consignors) && inv.consignor) {
        // Try to match by consignor name first
        let consignor = inv.customer.consignors.find(c => c.consignor === inv.consignor);
        // If not found, try to match by siteId
        if (!consignor && inv.siteId) {
          consignor = inv.customer.consignors.find(c => c.siteId === inv.siteId);
        }
        if (consignor?.address) return consignor.address;
      }
      return "";
    };

    const getConsigneeAddress = (inv) => {
      // First try to get from invoice's deliveryAddress field
      if (inv.deliveryAddress) return inv.deliveryAddress;
      
      // Then try to get from customer's consignees array
      if (inv.customer?.consignees && Array.isArray(inv.customer.consignees) && inv.consignee) {
        // Try to match by consignee name first
        let consignee = inv.customer.consignees.find(c => c.consignee === inv.consignee);
        // If not found, try to match by siteId
        if (!consignee && inv.siteId) {
          consignee = inv.customer.consignees.find(c => c.siteId === inv.siteId);
        }
        if (consignee?.address) return consignee.address;
      }
      return "";
    };

    // Flatten and map fields for CSV
    const rows = [];

    const buildBaseRow = (inv, attempt) => ({
        DocketNumber: inv.docketNumber || "",
        DocketPrefix: inv.docketPrefix || "",
        OrderNumber: inv.orderNumber || "",
        SiteId: inv.siteId || "",
        SealNo: inv.sealNo || "",
        SiteType: inv.siteType?.name || "",
        SiteTypeDescription: inv.siteType?.desc || "",
        TransportMode: inv.transportMode?.name || "",
        TransportModeDescription: inv.transportMode?.desc || "",
        InvoiceNumbers: formatMultiValueField(inv.invoiceNumber),
        InvoiceBill: inv.invoiceBill || "",
        EwayBillNumbers: formatMultiValueField(inv.ewayBillNo),
        AttemptStatus: attempt?.status || inv.status,
        AttemptReason: attempt?.reason || "",
        AttemptedAt: attempt?.attemptedAt
          ? new Date(attempt.attemptedAt).toLocaleString()
          : "",
        // Company Information
        Company: inv.company?.name || "",
        CompanyCode: inv.company?.companyCode || "",
        CompanyAddress: inv.company?.address || "",
        CompanyContactPhone: inv.company?.contactPhone || "",
        CompanyEmail: inv.company?.emailId || "",
        CompanyWebsite: inv.company?.website || "",
        CompanyGST: inv.company?.gstNumber || "",
        CompanyGSTValue: inv.company?.gstValue || "",
        CompanyPAN: inv.company?.pan || "",
        CompanySACHSNCode: inv.company?.sacHsnCode || "",
        CompanyType: inv.company?.companyType || "",
        // Branch Information
        Branch: inv.branch?.name || "",
        BranchCode: inv.branch?.branchCode || "",
        BranchAddress: inv.branch?.address || "",
        BranchGST: inv.branch?.gstNo || "",
        BranchNumber: inv.branch?.branchNo || "",
        // Customer Information
        Customer: inv.customer?.name || "",
        CustomerPhone: inv.customer?.phone || "",
        CustomerEmail: inv.customer?.email || "",
        CustomerGST: inv.customer?.gstNumber || "",
        CustomerAddress: inv.customer?.address || "",
        CustomerCompanyName: inv.customer?.companyName || "",
        CustomerCompanyContactName: inv.customer?.companyContactName || "",
        CustomerCompanyContactInfo: inv.customer?.companyContactInfo || "",
        CustomerTaxType: inv.customer?.taxType || "",
        CustomerTaxValue: inv.customer?.taxValue || "",
        // Goods Information
        GoodsType: inv.goodsType?.name || "",
        GoodsItems: inv.goodsType?.items?.join("; ") || "",
        GoodItems: inv.goodItems?.map(item => item.name).join("; ") || "",
        // Vehicle Information
        VehicleType: inv.vehicleType || "",
        VehicleNumber: inv.vehicle?.vehicleNumber || inv.vendorVehicle?.vehicleNumber || "",
        VehicleModel: inv.vehicle?.model || "",
        VehicleBrand: inv.vehicle?.brand || "",
        VehicleSize: inv.vehicle?.type || inv.vehicleSize || "",
        VehicleCargoType: inv.vehicle?.cargoType || "",
        VehicleYearOfManufacture: inv.vehicle?.yearOfManufacture || "",
        // Vendor Information
        Vendor: inv.vendor?.name || "",
        VendorPhone: inv.vendor?.phone || "",
        VendorEmail: inv.vendor?.email || "",
        VendorVehicle: inv.vendorVehicle?.vehicleNumber || "",
        // Driver Information
        Driver: inv.driver?.name || "",
        DriverPhone: inv.driverContactNumber || inv.driver?.mobile || "",
        DriverEmail: inv.driver?.email || "",
        DriverContactNumber: inv.driverContactNumber || inv.driver?.mobile || "",
        // Status and Dates
        Status: inv.status || "",
        InvoiceDate: inv.invoiceDate
          ? new Date(inv.invoiceDate).toLocaleString()
          : "",
        DispatchDateTime: inv.dispatchDateTime
          ? new Date(inv.dispatchDateTime).toLocaleString()
          : "",
        // From Address (Pickup Location) - Using new fields (taluk, district, post office)
        FromPincode: inv.fromAddress?.pincode || "",
        FromPostOffice: inv.fromAddress?.postOfficeName || "",
        FromDistrict: inv.fromAddress?.district || "",
        FromTaluk: inv.fromAddress?.taluk || "",
        FromFullAddress: buildFullAddress(inv.fromAddress) || inv.pickupAddress || "",
        // To Address (Delivery Location) - Using new fields (taluk, district, post office)
        ToPincode: inv?.toAddress?.pincode || "",
        ToPostOffice: inv.toAddress?.postOfficeName || "",
        ToDistrict: inv.toAddress?.district || "",
        ToTaluk: inv.toAddress?.taluk || "",
        ToFullAddress: buildFullAddress(inv.toAddress) || inv.deliveryAddress || "",
        // Financial Information
        TotalWeight: inv?.totalWeight || "",
        NumberOfPackages: inv?.numberOfPackages || "",
        FreightCharges: inv?.freightCharges || "",
        PaymentType: inv?.paymentType || "",
        Remarks: inv?.remarks || "",
        // Address Fields - Full formatted addresses
        PickupAddress: inv.pickupAddress || buildFullAddress(inv.fromAddress) || "",
        DeliveryAddress: inv.deliveryAddress || buildFullAddress(inv.toAddress) || "",
        // Consignor Information
        Consignor: inv.consignor || "",
        ConsignorAddress: getConsignorAddress(inv) || buildFullAddress(inv.fromAddress) || "",
        ConsignorSiteId: inv.siteId || "",
        // Consignee Information
        Consignee: inv.consignee || "",
        ConsigneeAddress: getConsigneeAddress(inv) || buildFullAddress(inv.toAddress) || "",
        ConsigneeSiteId: inv.siteId || "",
        // General Address Field
        Address: inv.address || "",
        // Contact Information
        LoadingContactName: inv.loadingContact?.name || "",
        LoadingContactMobile: inv.loadingContact?.mobile || "",
        UnloadingContactName: inv.unloadingContact?.name || "",
        UnloadingContactMobile: inv.unloadingContact?.mobile || "",
        // Delivery Information
        UndeliveredReason: inv.undeliveredReason || "",
        DeliveredAt: inv.deliveredAt
          ? new Date(inv.deliveredAt).toLocaleString()
          : "",
        DeliveryProofReceiverName: inv.deliveryProof?.receiverName || "",
        DeliveryProofReceiverMobile: inv.deliveryProof?.receiverMobile || "",
        DeliveryProofFloor: inv.deliveryProof?.floor || "",
        DeliveryProofRemarks: inv.deliveryProof?.remarks || "",
        DeliveryProofSignature: inv.deliveryProof?.signature ? "Yes" : "",
        // Additional Data
        DeliveryAttempts: JSON.stringify(inv.deliveryAttempts || []),
        DriverUpdates: JSON.stringify(inv.driverUpdates || []),
        CreatedAt: inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "",
        UpdatedAt: inv.updatedAt ? new Date(inv.updatedAt).toLocaleString() : "",
      });

    invoices.forEach((inv) => {
      const misDataRow = {};
      
      console.log(`\n=== Processing Invoice ${inv.docketNumber} ===`);
      console.log("Invoice misData:", JSON.stringify(inv.misData, null, 2));
      console.log("Customer misFields:", inv.customer?.misFields ? JSON.stringify(inv.customer.misFields, null, 2) : "No misFields");
      console.log("All MIS Fields Map:", Array.from(allMisFields.entries()));
      
      // First, initialize ALL MIS fields from allMisFields map with empty strings
      // This ensures all columns are present in CSV for all invoices
      allMisFields.forEach((fieldLabel, fieldName) => {
        misDataRow[fieldLabel] = "";
      });
      
      console.log("Initialized misDataRow:", Object.keys(misDataRow));
      
      // Now populate with actual MIS data from this invoice
      if (inv.misData && typeof inv.misData === 'object') {
        Object.keys(inv.misData).forEach((fieldName) => {
          // Get the field label from allMisFields map
          let fieldLabel = allMisFields.get(fieldName);
          
          console.log(`Processing fieldName: ${fieldName}, found label: ${fieldLabel}`);
          
          // If not found in map, try to get from customer misFields config
          if (!fieldLabel && inv.customer?.misFields && Array.isArray(inv.customer.misFields)) {
            const field = inv.customer.misFields.find(f => f.fieldName === fieldName);
            if (field && field.fieldLabel) {
              fieldLabel = field.fieldLabel;
              // Also add to map for future use
              allMisFields.set(fieldName, fieldLabel);
              console.log(`Found label from customer config: ${fieldLabel}`);
            }
          }
          
          // Fallback to formatted fieldName if still not found
          if (!fieldLabel) {
            fieldLabel = fieldName
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
            allMisFields.set(fieldName, fieldLabel);
            // Initialize this field in misDataRow if not already there
            if (!misDataRow.hasOwnProperty(fieldLabel)) {
              misDataRow[fieldLabel] = "";
            }
            console.log(`Using formatted label: ${fieldLabel}`);
          }
          
          const fieldValue = inv.misData[fieldName];
          
          // Set the value (convert to string, handle null/undefined)
          if (fieldValue !== null && fieldValue !== undefined) {
            misDataRow[fieldLabel] = String(fieldValue);
            console.log(`Set ${fieldLabel} = ${fieldValue}`);
          }
        });
      }
      
      // Also ensure we're using the correct field labels from customer misFields config
      // This handles cases where customer has misFields configured but no data yet
      if (inv.customer?.misFields && Array.isArray(inv.customer.misFields)) {
        inv.customer.misFields.forEach((field) => {
          if (field.fieldName) {
            const fieldLabel = field.fieldLabel || field.fieldName;
            // Initialize if not already there
            if (!misDataRow.hasOwnProperty(fieldLabel)) {
              misDataRow[fieldLabel] = "";
            }
            // Set value if it exists in misData
            if (inv.misData && inv.misData[field.fieldName] !== null && inv.misData[field.fieldName] !== undefined) {
              misDataRow[fieldLabel] = String(inv.misData[field.fieldName]);
              console.log(`Set from customer config: ${fieldLabel} = ${inv.misData[field.fieldName]}`);
            }
          }
        });
      }
      
      console.log("Final misDataRow:", JSON.stringify(misDataRow, null, 2));

      const attempts = inv.deliveryAttempts?.filter((attempt) =>
        attemptStatuses.includes(attempt.status)
      );

      if (attempts && attempts.length > 0) {
        attempts.forEach((attempt) => {
          rows.push({ ...buildBaseRow(inv, attempt), ...misDataRow });
        });
      } else {
        rows.push({ ...buildBaseRow(inv), ...misDataRow });
      }
    });

    const data = rows;

    console.log("\n=== Building CSV Field List ===");
    console.log("Number of rows:", data.length);
    console.log("All MIS Fields Map:", Array.from(allMisFields.entries()));
    
    // Build complete field list to ensure all MIS fields are included
    const allFieldsSet = new Set();
    
    // Collect all field labels from allMisFields map
    const allMisFieldLabels = new Set();
    allMisFields.forEach((fieldLabel, fieldName) => {
      allMisFieldLabels.add(fieldLabel);
    });
    
    console.log("All MIS Field Labels:", Array.from(allMisFieldLabels));
    
    // Add all fields from all rows (to catch any fields that might be missing)
    data.forEach((row, index) => {
      const rowKeys = Object.keys(row);
      console.log(`Row ${index} keys:`, rowKeys);
      rowKeys.forEach(key => allFieldsSet.add(key));
    });
    
    // Also explicitly add all MIS field labels (even if they don't appear in any row)
    allMisFieldLabels.forEach(label => allFieldsSet.add(label));
    
    console.log("All fields set:", Array.from(allFieldsSet));
    
    // Convert to array and sort for consistent column order
    // Base fields first, then MIS fields
    const baseFields = [];
    const misFields = [];
    
    allFieldsSet.forEach(field => {
      if (allMisFieldLabels.has(field)) {
        misFields.push(field);
      } else {
        baseFields.push(field);
      }
    });
    
    console.log("Base fields:", baseFields.sort());
    console.log("MIS fields:", misFields.sort());
    
    // Ensure all MIS fields are included even if no data exists
    const fields = [...baseFields.sort(), ...misFields.sort()];
    
    console.log("Final CSV fields:", fields);
    console.log("Total fields count:", fields.length);
    
    // If no data rows, create a sample row with all fields to ensure CSV has headers
    if (data.length === 0 && fields.length > 0) {
      const emptyRow = {};
      fields.forEach(field => {
        emptyRow[field] = "";
      });
      data.push(emptyRow);
    }
    
    const json2csv = new Json2CsvParser({ fields });
    const csv = json2csv.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("invoices_export.csv");
    return res.send(csv);
  } catch (error) {
    console.error("Error exporting invoices as CSV:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export invoices as CSV",
      error: error.message,
    });
  }
};
