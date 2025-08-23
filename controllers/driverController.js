import { Invoice } from "../models/invoice.js";

export const getDriverInvoices = async (req, res) => {
  try {
    let { page = 1, limit = 50, search = "" } = req.query;
    const { driverId, fromDate, toDate } = req.body;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "driverId is required",
      });
    }

    const query = {
      driver: driverId,
    };

    // ✅ Add date filter to the query if both dates are provided
    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // include full toDate

      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return res.status(400).json({ message: "Invalid date range" });
      }

      query.createdAt = {
        $gte: from,
        $lte: to,
      };
    }

    // ✅ Add search filter if present
    if (search) {
      query.docketNumber = { $regex: search, $options: "i" };
    }

    const invoices = await Invoice.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .populate("customer", "name")
      .populate("goodsType", "name items")
      .populate("vehicle", "vehicleNumber")
      .populate("vendor", "name availableVehicles")
      .populate("driver", "name")
      .populate(
        "fromAddress.country fromAddress.state fromAddress.city fromAddress.locality"
      )
      .populate(
        "toAddress.country toAddress.state toAddress.city toAddress.locality"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Driver's invoices fetched successfully",
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching driver's invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching driver's invoices",
      error: error.message,
    });
  }
};

export const getRecentDriverInvoices = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "" } = req.query;
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: "driverId is required",
      });
    }

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24 hrs

    const query = {
      driver: driverId,
      createdAt: { $gte: since },
    };

    if (search) {
      query.docketNumber = { $regex: search, $options: "i" };
    }

    const invoices = await Invoice.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .populate("customer", "name")
      .populate("goodsType", "name items")
      .populate("vehicle", "vehicleNumber")
      .populate("vendor", "name")
      .populate("driver", "name")
      .populate(
        "fromAddress.country fromAddress.state fromAddress.city fromAddress.locality"
      )
      .populate(
        "toAddress.country toAddress.state toAddress.city toAddress.locality"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Invoice.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Recent driver invoices fetched successfully",
      invoices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching recent driver invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent invoices",
      error: error.message,
    });
  }
};

export const updateInvoiceByDriver = async (req, res) => {
  try {
    const {
      driverId,
      invoiceId,
      status,
      location,
      note,
      deliveryProof,
      deliveredAt,
    } = req.body;

    if (!driverId || !invoiceId) {
      return res.status(400).json({
        success: false,
        message: "driverId and invoiceId are required",
      });
    }

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    if (String(invoice.driver) !== String(driverId)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this invoice",
      });
    }

    let orderPhotoUrl = "";
    let signatureImageUrl = "";

    // Handle order photo upload
    if (req.files?.orderPhoto && req.files.orderPhoto.length > 0) {
      orderPhotoUrl = req.files.orderPhoto[0].path;
    }

    // Handle receiver signature image upload
    if (
      req.files?.receiverSignature &&
      req.files.receiverSignature.length > 0
    ) {
      signatureImageUrl = req.files.receiverSignature[0].path;
    }

    // Update status
    if (status) {
      invoice.status = status;
    }

    // Add driver update
    if (location || note || orderPhotoUrl) {
      invoice.driverUpdates.push({
        location: location ? JSON.parse(location) : undefined,
        note,
        orderPhotoUrl,
        timestamp: new Date(),
      });
    }

    // Update delivery proof
    if (deliveryProof) {
      const parsedProof =
        typeof deliveryProof === "string"
          ? JSON.parse(deliveryProof)
          : deliveryProof;

      invoice.deliveryProof = {
        ...invoice.deliveryProof,
        ...parsedProof,
        ...(signatureImageUrl && { signature: signatureImageUrl }), 
      };
    }

    // Delivered at time
    if (deliveredAt) {
      invoice.deliveredAt = deliveredAt;
    }

    const updatedInvoice = await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error("Update Invoice Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update invoice",
    });
  }
};
