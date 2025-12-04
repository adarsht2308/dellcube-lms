import { Invoice } from "../models/invoice.js";

// Track Invoice by Docket Number (Public endpoint - no auth required)
export const trackInvoiceByDocketNumber = async (req, res) => {
  try {
    // Set CORS headers explicitly for public access
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    const { docketNumber } = req.params;

    if (!docketNumber) {
      return res.status(400).json({
        success: false,
        message: "Docket number is required",
      });
    }

    // Find invoice by docket number (supports both numeric format: 10000, 10001, etc. and old format)
    // New invoices use numeric docket numbers starting from 10000
    const invoice = await Invoice.findOne({ docketNumber })
      .populate("company", "name email contactPhone address website")
      .populate("branch", "name address contactPhone")
      .populate("customer", "name email phone")
      .populate("driver", "name email phone")
      .populate("vehicle", "registrationNumber type")
      .select("-deliveryProof.signature"); // Exclude signature for security

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found with this docket number",
      });
    }

    // Return simplified tracking information
    const trackingInfo = {
      docketNumber: invoice.docketNumber, // Numeric format for new invoices (10000, 10001, etc.)
      docketPrefix: invoice.docketPrefix || null, // CompanyCode-BranchCode-Date format
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      invoiceDate: invoice.invoiceDate,
      from: {
        address: invoice.pickupAddress,
        pincode: invoice.fromAddress?.pincode?.code || invoice.fromAddress?.pincode,
        city: invoice.fromAddress?.city?.name,
        state: invoice.fromAddress?.state?.name,
      },
      to: {
        address: invoice.deliveryAddress,
        pincode: invoice.toAddress?.pincode?.code || invoice.toAddress?.pincode,
        city: invoice.toAddress?.city?.name,
        state: invoice.toAddress?.state?.name,
      },
      customer: invoice.customer ? {
        name: invoice.customer.name,
        phone: invoice.customer.phone,
      } : null,
      driver: invoice.driver ? {
        name: invoice.driver.name,
        phone: invoice.driver.phone,
      } : null,
      vehicle: invoice.vehicle ? {
        registrationNumber: invoice.vehicle.registrationNumber,
        type: invoice.vehicle.type,
      } : null,
      company: invoice.company ? {
        name: invoice.company.name,
        contactPhone: invoice.company.contactPhone,
      } : null,
      deliveryProof: invoice.deliveryProof ? {
        receiverName: invoice.deliveryProof.receiverName,
        receiverMobile: invoice.deliveryProof.receiverMobile,
        floor: invoice.deliveryProof.floor,
        remarks: invoice.deliveryProof.remarks,
        deliveredAt: invoice.deliveryProof.deliveredAt,
      } : null,
      consignee: invoice.consignee,
      consignor: invoice.consignor,
      packageDetails: {
        numberOfPackages: invoice.numberOfPackages,
        weight: invoice.weight,
        goodsType: invoice.goodsType,
        goodsValue: invoice.goodsValue,
      },
    deliveryAttempts: invoice.deliveryAttempts || [],
    undeliveredReason: invoice.undeliveredReason || "",
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };

    return res.status(200).json({
      success: true,
      message: "Invoice tracking information retrieved successfully",
      invoice: trackingInfo,
    });
  } catch (error) {
    console.error("Error tracking invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while tracking the invoice",
      error: error.message,
    });
  }
};

// Track Invoice by ID (Authenticated - for internal use)
export const trackInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const invoice = await Invoice.findById(id)
      .populate("company", "name email contactPhone address website")
      .populate("branch", "name address contactPhone")
      .populate("customer", "name email phone")
      .populate("driver", "name email phone")
      .populate("vehicle", "registrationNumber type");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice retrieved successfully",
      invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the invoice",
      error: error.message,
    });
  }
};

