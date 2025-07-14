import { Vehicle } from "../models/vehicle.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

// Create a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const {
      vehicleNumber,
      type,
      brand,
      model,
      yearOfManufacture,
      registrationDate,
      fitnessCertificateExpiry,
      insuranceExpiry,
      pollutionCertificateExpiry,
      status,
      currentDriver,
      branch,
      company,
      maintenanceHistory,
      createdBy,
    } = req.body;

    if (!vehicleNumber || !type || !branch || !company) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number, type, branch, and company are required",
      });
    }

    const existing = await Vehicle.findOne({ vehicleNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this number already exists",
      });
    }

    const vehicle = await Vehicle.create({
      vehicleNumber,
      type,
      brand,
      model,
      yearOfManufacture,
      registrationDate,
      fitnessCertificateExpiry,
      insuranceExpiry,
      pollutionCertificateExpiry,
      status,
      currentDriver,
      branch,
      company,
      maintenanceHistory,
      createdBy,
      // Certificate images from file uploads (Cloudinary)
      fitnessCertificateImage: req.files?.fitnessCertificateImage?.[0]
        ? {
            url: req.files.fitnessCertificateImage[0].path,
            public_id: req.files.fitnessCertificateImage[0].filename,
          }
        : { url: "", public_id: "" },
      pollutionCertificateImage: req.files?.pollutionCertificateImage?.[0]
        ? {
            url: req.files.pollutionCertificateImage[0].path,
            public_id: req.files.pollutionCertificateImage[0].filename,
          }
        : { url: "", public_id: "" },
      registrationCertificateImage: req.files?.registrationCertificateImage?.[0]
        ? {
            url: req.files.registrationCertificateImage[0].path,
            public_id: req.files.registrationCertificateImage[0].filename,
          }
        : { url: "", public_id: "" },
      insuranceImage: req.files?.insuranceImage?.[0]
        ? {
            url: req.files.insuranceImage[0].path,
            public_id: req.files.insuranceImage[0].filename,
          }
        : { url: "", public_id: "" },
    });

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the vehicle",
    });
  }
};

// Get all vehicles with optional filters
export const getAllVehicles = async (req, res) => {
  try {
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
    if (search) query.vehicleNumber = { $regex: search, $options: "i" };
    if (status) query.status = status;
    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    const vehicles = await Vehicle.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .populate("currentDriver", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Vehicle.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Vehicles fetched successfully",
      vehicles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching vehicles",
    });
  }
};

// Get vehicle by ID
export const getVehicleById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid vehicle ID is required",
      });
    }

    const vehicle = await Vehicle.findById(id)
      .populate("company", "name")
      .populate("branch", "name")
    .populate("currentDriver", "name");

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vehicle fetched successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error fetching vehicle by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vehicle",
    });
  }
};

// Update vehicle
export const updateVehicle = async (req, res) => {
  try {
    const { vehicleId, ...updates } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    // Handle certificate image updates
    const certFields = [
      "fitnessCertificateImage",
      "pollutionCertificateImage",
      "registrationCertificateImage",
      "insuranceImage",
    ];
    for (const field of certFields) {
      if (req.files && req.files[field] && req.files[field][0]) {
        // Delete old image from Cloudinary if exists
        const oldPublicId = vehicle[field]?.public_id;
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (err) {
            console.error(`Failed to delete old image for ${field}:`, err);
          }
        }
        // Set new image
        vehicle[field] = {
          url: req.files[field][0].path,
          public_id: req.files[field][0].filename,
        };
      }
    }

    // Update other fields
    Object.keys(updates).forEach((key) => {
      if (
        updates[key] !== undefined &&
        !certFields.includes(key) // skip cert fields, handled above
      ) {
        vehicle[key] = updates[key];
      }
    });

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the vehicle",
    });
  }
};

// Delete vehicle
export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    await Vehicle.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the vehicle",
    });
  }
};

// Get vehicles by company ID (optional)
export const getVehiclesByCompany = async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const vehicles = await Vehicle.find({ company: companyId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Vehicles fetched successfully",
      vehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles by company:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vehicles by company",
    });
  }
};

// Get vehicles by branch ID (optional)
export const getVehiclesByBranch = async (req, res) => {
  try {
    const { branchId } = req.body;

    if (!branchId) {
      return res.status(400).json({
        success: false,
        message: "Branch ID is required",
      });
    }

    const vehicles = await Vehicle.find({ branch: branchId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Vehicles fetched successfully",
      vehicles,
    });
  } catch (error) {
    console.error("Error fetching vehicles by branch:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vehicles by branch",
    });
  }
};

export const addMaintenanceController = async (req, res) => {
  const { vehicleId, maintenance } = req.body;

  if (!vehicleId || !maintenance) {
    return res.status(400).json({
      success: false,
      message: "Vehicle ID and maintenance data are required",
    });
  }

  try {
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    vehicle.maintenanceHistory.push(maintenance);
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: "Maintenance record added successfully",
      vehicle,
    });
  } catch (error) {
    console.error("Add Maintenance Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while adding maintenance record",
      error: error.message,
    });
  }
};
