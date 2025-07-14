// Import your Vendor model

import { Vendor } from "../models/vendor.js";
import mongoose from "mongoose";
// Import your VendorVehicle model

// Controller to create a new vendor
export const createVendor = async (req, res) => {
  try {
    const { name, phone, email, address, gstNumber, status, branch, company, panNumber, bankName, accountNumber, ifsc } =
      req.body;

    const createdBy = req.user._id;

    // Basic validation
    if (!name || !email || !phone || !branch || !company) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and phone are required fields for a vendor.",
      });
    }

    // Check if vendor with this email or name already exists
    const existingVendor = await Vendor.findOne({ $or: [{ email }, { name }] });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: "Vendor with this email or name already exists.",
      });
    }

    const newVendor = new Vendor({
      name,
      branch,
      company,
      phone,
      email,
      address,
      gstNumber,
      panNumber,
      bankName,
      accountNumber,
      ifsc,
      status,
      createdBy,
    });

    await newVendor.save();

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      vendor: newVendor,
    });
  } catch (error) {
    console.error("Error creating vendor:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the vendor",
      error: error.message, // Include error message for debugging
    });
  }
};

// Controller to get all vendors
export const getAllVendors = async (req, res) => {
  try {
    // You can add pagination, search, and filtering logic here if needed,
    // similar to your getAllVehicles. For now, it fetches all.
    let {
      page = 1,
      limit = 50,
      search = "",
      status,
      companyId,
      branchId,
    } = req.query;

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const query = {};
    if (search) query.name = { $regex: search, $options: "i" }; // Search by vendor name
    if (status) query.status = status;
    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const vendors = await Vendor.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Vendor.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Vendors fetched successfully",
      vendors,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching vendors",
      error: error.message,
    });
  }
};

// Controller to get a single vendor by ID
export const getVendorById = async (req, res) => {
  try {
    // Consistent with your vehicleController.js, expecting ID in body for POST /view
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid vendor ID is required",
      });
    }

    const vendor = await Vendor.findById(id)
      .populate("company", "name")
      .populate("branch", "name");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor fetched successfully",
      vendor,
    });
  } catch (error) {
    console.error("Error fetching vendor by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vendor",
      error: error.message,
    });
  }
};

// Controller to update a vendor by ID
export const updateVendor = async (req, res) => {
  try {
    const { vendorId, ...updates } = req.body; // Expecting vendorId in body

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Valid vendor ID is required for update",
      });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(vendorId, updates, {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators on update
    });

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor updated successfully",
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the vendor",
      error: error.message,
    });
  }
};

// Controller to delete a vendor by ID
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.body; // Consistent with your vehicleController.js

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid vendor ID is required for deletion",
      });
    }

    const deletedVendor = await Vendor.findByIdAndDelete(id);

    if (!deletedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the vendor",
      error: error.message,
    });
  }
};

export const addVehicleController = async (req, res) => {
  const { vendorId, vehicle } = req.body;

  if (!vendorId || !vehicle) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID and vehicle data are required",
    });
  }

  try {
    const vendor = await Vendor.findById(vendorId);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.availableVehicles.push(vehicle);
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Vehicle added to vendor successfully",
      vendor,
    });
  } catch (error) {
    console.error("Add Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while adding vehicle",
      error: error.message,
    });
  }
};

export const getVendorsByCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const vendors = await Vendor.find({ company: companyId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Vendors fetched successfully by company",
      vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors by company:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vendors by company",
      error: error.message,
    });
  }
};

export const getVendorsByBranch = async (req, res) => {
  try {
    const { branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const vendors = await Vendor.find({ branch: branchId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Vendors fetched successfully by branch",
      vendors,
    });
  } catch (error) {
    console.error("Error fetching vendors by branch:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vendors by branch",
      error: error.message,
    });
  }
};

// Update a vehicle's status in a vendor's availableVehicles array
export const updateVendorVehicleStatus = async (req, res) => {
  try {
    const { vendorId, vehicleId, status } = req.body;
    if (!vendorId || !vehicleId || !status) {
      return res.status(400).json({
        success: false,
        message: "vendorId, vehicleId, and status are required",
      });
    }
    const updatedVendor = await Vendor.findOneAndUpdate(
      { _id: vendorId, "availableVehicles._id": vehicleId },
      { $set: { "availableVehicles.$.status": status } },
      { new: true }
    );
    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor or vehicle not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Vehicle status updated successfully",
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating vehicle status",
      error: error.message,
    });
  }
};
