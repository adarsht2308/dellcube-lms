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
  console.log("=== Add Vehicle Request ===");
  console.log("Body:", req.body);
  console.log("Files:", req.files);
  console.log("Content-Type:", req.get('Content-Type'));
  
  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID is required",
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

    // Extract vehicle data from form fields
    const vehicleData = {
      vehicleNumber: req.body.vehicleNumber,
      type: req.body.type,
      brand: req.body.brand,
      model: req.body.model,
      yearOfManufacture: req.body.yearOfManufacture ? parseInt(req.body.yearOfManufacture) : undefined,
      registrationDate: req.body.registrationDate ? new Date(req.body.registrationDate) : undefined,
      fitnessCertificateExpiry: req.body.fitnessCertificateExpiry ? new Date(req.body.fitnessCertificateExpiry) : undefined,
      insuranceExpiry: req.body.insuranceExpiry ? new Date(req.body.insuranceExpiry) : undefined,
      pollutionCertificateExpiry: req.body.pollutionCertificateExpiry ? new Date(req.body.pollutionCertificateExpiry) : undefined,
      vehicleInsuranceNo: req.body.vehicleInsuranceNo || "",
      fitnessNo: req.body.fitnessNo || "",
      status: req.body.status || "active",
    };

    console.log("Extracted vehicle data:", vehicleData);
    console.log("Raw req.body keys:", Object.keys(req.body));
    console.log("Raw req.body values:", Object.values(req.body));

    // Validate required fields
    if (!vehicleData.vehicleNumber || !vehicleData.type || !vehicleData.brand || !vehicleData.model) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields. Received: vehicleNumber=${vehicleData.vehicleNumber}, type=${vehicleData.type}, brand=${vehicleData.brand}, model=${vehicleData.model}`,
      });
    }

    // Handle certificate image uploads if present
    const certFields = [
      "fitnessCertificateImage",
      "pollutionCertificateImage",
      "registrationCertificateImage",
      "insuranceImage",
    ];

    for (const field of certFields) {
      if (req.files && req.files[`vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`] && req.files[`vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`][0]) {
        vehicleData[field] = {
          url: req.files[`vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`][0].path,
          public_id: req.files[`vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`][0].filename,
        };
      } else {
        // Set default empty values if no image
        vehicleData[field] = { url: "", public_id: "" };
      }
    }

    // Initialize maintenance history array
    vehicleData.maintenanceHistory = [];

    console.log("Final vehicle data to be saved:", JSON.stringify(vehicleData, null, 2));

    // Create a new vehicle document using the schema
    const newVehicle = {
      vehicleNumber: vehicleData.vehicleNumber,
      type: vehicleData.type,
      brand: vehicleData.brand,
      model: vehicleData.model,
      yearOfManufacture: vehicleData.yearOfManufacture,
      registrationDate: vehicleData.registrationDate,
      fitnessCertificateExpiry: vehicleData.fitnessCertificateExpiry,
      insuranceExpiry: vehicleData.insuranceExpiry,
      pollutionCertificateExpiry: vehicleData.pollutionCertificateExpiry,
      vehicleInsuranceNo: vehicleData.vehicleInsuranceNo,
      fitnessNo: vehicleData.fitnessNo,
      status: vehicleData.status,
      fitnessCertificateImage: vehicleData.fitnessCertificateImage,
      pollutionCertificateImage: vehicleData.pollutionCertificateImage,
      registrationCertificateImage: vehicleData.registrationCertificateImage,
      insuranceImage: vehicleData.insuranceImage,
      maintenanceHistory: vehicleData.maintenanceHistory,
    };

    console.log("New vehicle object:", JSON.stringify(newVehicle, null, 2));

    // Try using updateOne with $push to ensure proper schema validation
    const result = await Vendor.updateOne(
      { _id: vendorId },
      { $push: { availableVehicles: newVehicle } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to add vehicle to vendor",
      });
    }

    // Fetch the updated vendor to return
    const updatedVendor = await Vendor.findById(vendorId);

    res.status(200).json({
      success: true,
      message: "Vehicle added to vendor successfully",
      vendor: updatedVendor,
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

// Add maintenance record to a vendor vehicle
export const addVendorVehicleMaintenance = async (req, res) => {
  console.log("=== Add Vendor Vehicle Maintenance Request ===");
  console.log("Body:", req.body);
  console.log("Files:", req.files);
  console.log("Content-Type:", req.get('Content-Type'));
  
  const { vendorId, vehicleId } = req.body;

  if (!vendorId || !vehicleId) {
    console.log("Missing data - vendorId:", vendorId, "vehicleId:", vehicleId);
    return res.status(400).json({
      success: false,
      message: "Vendor ID and vehicle ID are required",
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

    // Find the specific vehicle in the vendor's availableVehicles array
    const vehicleIndex = vendor.availableVehicles.findIndex(v => v._id.toString() === vehicleId);
    
    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found in vendor's available vehicles",
      });
    }

    // Extract maintenance data from form fields
    const maintenanceData = {
      serviceDate: req.body.serviceDate || undefined,
      serviceType: req.body.serviceType,
      cost: req.body.cost ? parseFloat(req.body.cost) : undefined,
      description: req.body.description,
      servicedBy: req.body.servicedBy || "",
    };

    // Validate required fields
    if (!maintenanceData.serviceDate || !maintenanceData.serviceType || !maintenanceData.description) {
      return res.status(400).json({
        success: false,
        message: "Service date, type, and description are required",
      });
    }

    // Handle bill image upload if present
    if (req.files && req.files.vendorVehicleBillImage && req.files.vendorVehicleBillImage[0]) {
      maintenanceData.billImage = {
        url: req.files.vendorVehicleBillImage[0].path,
        public_id: req.files.vendorVehicleBillImage[0].filename,
      };
    } else {
      // Set default empty values if no image
      maintenanceData.billImage = { url: "", public_id: "" };
    }

    // Add maintenance record to the specific vehicle
    vendor.availableVehicles[vehicleIndex].maintenanceHistory.push(maintenanceData);
    await vendor.save();

    res.status(200).json({
      success: true,
      message: "Maintenance record added successfully to vendor vehicle",
      vendor,
    });
  } catch (error) {
    console.error("Add Vendor Vehicle Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while adding maintenance record",
      error: error.message,
    });
  }
};
