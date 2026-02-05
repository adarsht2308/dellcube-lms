import { Vehicle } from "../models/vehicle.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import { User } from "../models/user.js"; // Vendors are Users with role 'vendor'
// Import User model to find recipients
import { sendVehicleExpiryNotification } from "../utils/common/sendMail.js"; // Import email function

// Helper function to get recipients for vehicle notifications
const getVehicleNotificationRecipients = async (vehicle) => {
  try {
    const recipients = [];

    // Get super admin users
    const superAdmins = await User.find({ role: "superAdmin" }).select(
      "email name"
    );
    recipients.push(...superAdmins);

    // Get branch admin users for this vehicle's company and branch
    if (vehicle.company && vehicle.branch) {
      const branchAdmins = await User.find({
        role: "branchAdmin",
        company: vehicle.company,
        branch: vehicle.branch,
      }).select("email name");
      recipients.push(...branchAdmins);
    }

    // Get operation users for this vehicle's company and branch
    if (vehicle.company && vehicle.branch) {
      const operationUsers = await User.find({
        role: "operation",
        company: vehicle.company,
        branch: vehicle.branch,
      }).select("email name");
      recipients.push(...operationUsers);
    }

    // Get driver if they have an email
    if (vehicle.currentDriver) {
      const driver = await User.findById(vehicle.currentDriver).select(
        "email name"
      );
      if (driver && driver.email) {
        recipients.push(driver);
      }
    }

    // Remove duplicates based on email
    const uniqueRecipients = recipients.filter(
      (recipient, index, self) =>
        index === self.findIndex((r) => r.email === recipient.email)
    );

    return uniqueRecipients;
  } catch (error) {
    console.error("Error getting vehicle notification recipients:", error);
    return [];
  }
};

// Helper function to check document expiry and send notifications
const checkDocumentExpiryForNotifications = async (vehicles) => {
  const today = new Date();
  const thirtyDaysFromNow = new Date(
    today.getTime() + 30 * 24 * 60 * 60 * 1000
  );
  const notifications = [];

  for (const vehicle of vehicles) {
    const checks = [
      {
        type: "Fitness Certificate",
        date: vehicle.fitnessCertificateExpiry,
        field: "fitnessCertificateExpiry",
      },
      {
        type: "Insurance",
        date: vehicle.insuranceExpiry,
        field: "insuranceExpiry",
      },
      {
        type: "Pollution Certificate",
        date: vehicle.pollutionCertificateExpiry,
        field: "pollutionCertificateExpiry",
      },
    ];

    for (const check of checks) {
      if (check.date) {
        const expiryDate = new Date(check.date);
        const daysUntilExpiry = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24)
        );

        // Send notifications for documents expiring within 30 days or already expired
        if (daysUntilExpiry <= 30) {
          try {
            // Get recipients for this vehicle
            const recipients = await getVehicleNotificationRecipients(vehicle);

            if (recipients.length > 0) {
              // Send email notification
              const emailResult = await sendVehicleExpiryNotification(
                recipients,
                vehicle,
                check.type,
                expiryDate,
                daysUntilExpiry
              );

              notifications.push({
                vehicleNumber: vehicle.vehicleNumber,
                documentType: check.type,
                expiryDate: expiryDate,
                daysUntilExpiry: daysUntilExpiry,
                status: daysUntilExpiry <= 0 ? "expired" : "expiring_soon",
                company: vehicle.company?.name || "Unknown",
                branch: vehicle.branch?.name || "Unknown",
                emailSent: emailResult.success,
                recipientsCount: recipients.length,
              });

              console.log(
                `Email notification sent for ${vehicle.vehicleNumber} - ${check.type}: ${emailResult.message}`
              );
            }
          } catch (error) {
            console.error(
              `Error sending notification for ${vehicle.vehicleNumber} - ${check.type}:`,
              error
            );
            notifications.push({
              vehicleNumber: vehicle.vehicleNumber,
              documentType: check.type,
              expiryDate: expiryDate,
              daysUntilExpiry: daysUntilExpiry,
              status: daysUntilExpiry <= 0 ? "expired" : "expiring_soon",
              company: vehicle.company?.name || "Unknown",
              branch: vehicle.branch?.name || "Unknown",
              emailSent: false,
              error: error.message,
            });
          }
        }
      }
    }
  }

  return notifications;
};

// Create a new vehicle
export const createVehicle = async (req, res) => {
  try {
    const {
      vehicleNumber,
      type,
      cargoType,
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
      vehicleInsuranceNo,
      fitnessNo,
    } = req.body;

    // Use companyId/branchId from token if not provided in body (for non-superAdmin users)
    const finalCompany = company || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranch = branch || (req.user?.role !== "superAdmin" ? req.branchId : null);

    if (!vehicleNumber || !type || !finalBranch || !finalCompany) {
      return res.status(400).json({
        success: false,
        message: "Vehicle number, type, branch, and company are required",
      });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(finalCompany)) {
      return res.status(400).json({
        success: false,
        message: "Invalid company ID format",
      });
    }
    if (!mongoose.Types.ObjectId.isValid(finalBranch)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID format",
      });
    }
    
    // Handle empty string for optional currentDriver field
    // Convert empty string to null/undefined so Mongoose doesn't try to cast it
    const finalCurrentDriver = currentDriver && currentDriver.trim() !== "" 
      ? (mongoose.Types.ObjectId.isValid(currentDriver) ? currentDriver : null)
      : null;
    
    if (currentDriver && currentDriver.trim() !== "" && !mongoose.Types.ObjectId.isValid(currentDriver)) {
      return res.status(400).json({
        success: false,
        message: "Invalid driver ID format",
      });
    }

    // Use cleaned vehicle number for duplicate check and storage
    const finalVehicleNumber = cleanedVehicleNumber;

    const existing = await Vehicle.findOne({ vehicleNumber: finalVehicleNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this number already exists",
      });
    }

    // Prepare vehicle data
    const vehicleData = {
      vehicleNumber: finalVehicleNumber,
      type,
      cargoType: cargoType || undefined,
      brand: brand || undefined,
      model: model || undefined,
      yearOfManufacture: yearOfManufacture || undefined,
      registrationDate: registrationDate || undefined,
      fitnessCertificateExpiry: fitnessCertificateExpiry || undefined,
      insuranceExpiry: insuranceExpiry || undefined,
      pollutionCertificateExpiry: pollutionCertificateExpiry || undefined,
      status: status || "active",
      branch: finalBranch,
      company: finalCompany,
      maintenanceHistory: maintenanceHistory || [],
      // Always set createdBy from authenticated user when available
      createdBy: req?.user?.userId || createdBy || undefined,
      vehicleInsuranceNo: vehicleInsuranceNo || undefined,
      fitnessNo: fitnessNo || undefined,
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
    };

    // Only add currentDriver if it's a valid ObjectId (not empty string)
    if (finalCurrentDriver) {
      vehicleData.currentDriver = finalCurrentDriver;
    }

    const vehicle = await Vehicle.create(vehicleData);

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
      error: error.message || error.toString(),
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
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
    // Use companyId/branchId from token if not provided in query (for non-superAdmin users)
    const finalCompanyId = companyId || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranchId = branchId || (req.user?.role !== "superAdmin" ? req.branchId : null);
    if (finalCompanyId) query.company = finalCompanyId;
    if (finalBranchId) query.branch = finalBranchId;

    // If a vendor is logged in, restrict to vehicles created by that vendor
    if (req.user?.role === "vendor") {
      query.createdBy = req.user.userId;
    }

    const vehicles = await Vehicle.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .populate("currentDriver", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Vehicle.countDocuments(query);

    // Note: Expiry notifications are handled by the background scheduler
    // This endpoint only returns vehicle data for fast response times

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

    // Validate vehicle number if being updated
    if (updates.vehicleNumber) {
      const cleanedVehicleNumber = updates.vehicleNumber.trim().toUpperCase();
      
      // Check for duplicate if vehicle number is being changed
      if (cleanedVehicleNumber !== vehicle.vehicleNumber) {
        const existing = await Vehicle.findOne({ vehicleNumber: cleanedVehicleNumber });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: "Vehicle with this number already exists",
          });
        }
      }
      
      updates.vehicleNumber = cleanedVehicleNumber;
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
  console.log("=== Add Maintenance Request ===");
  console.log("Body:", req.body);
  console.log("Files:", req.files);
  console.log("Content-Type:", req.get("Content-Type"));

  const { vehicleId, maintenance } = req.body;

  if (!vehicleId || !maintenance) {
    console.log(
      "Missing data - vehicleId:",
      vehicleId,
      "maintenance:",
      maintenance
    );
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

    // Parse maintenance data if it's a JSON string
    let maintenanceData = maintenance;
    if (typeof maintenance === "string") {
      try {
        maintenanceData = JSON.parse(maintenance);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid maintenance data format",
        });
      }
    }

    // Handle bill image upload if present - using the same pattern as createVehicle
    if (req.files && req.files.billImage && req.files.billImage[0]) {
      maintenanceData.billImage = {
        url: req.files.billImage[0].path,
        public_id: req.files.billImage[0].filename,
      };
    } else {
      // Set default empty values if no image
      maintenanceData.billImage = { url: "", public_id: "" };
    }

    vehicle.maintenanceHistory.push(maintenanceData);
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

export const searchVehicles = async (req, res) => {
  try {
    const { vehicleNumber, companyId, branchId } = req.query;

    if (!vehicleNumber) {
      return res
        .status(400)
        .json({ success: false, message: "Vehicle number is required" });
    }

    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }

    if (!branchId) {
      return res
        .status(400)
        .json({ success: false, message: "Branch ID is required" });
    }

    const sanitizedSearchTerm = vehicleNumber.replace(/\s+/g, "").toUpperCase();

    // Fetch all vehicles and vendors for the company and branch
    const allDellcubeVehicles = await Vehicle.find({
      company: companyId,
      branch: branchId,
    }).populate("currentDriver", "name mobile");
    const allVendors = await User.find({
      company: companyId,
      branch: branchId,
      role: "vendor",
    });

    // Filter Dellcube vehicles in code for flexibility
    const filteredDellcube = allDellcubeVehicles.filter((v) =>
      v.vehicleNumber
        .replace(/\s+/g, "")
        .toUpperCase()
        .startsWith(sanitizedSearchTerm)
    );

    // Filter vendor vehicles in code
    const filteredVendorVehicles = allVendors.flatMap((vendor) =>
      vendor.availableVehicles
        .filter(
          (v) =>
            v.vehicleNumber &&
            v.vehicleNumber
              .replace(/\s+/g, "")
              .toUpperCase()
              .startsWith(sanitizedSearchTerm)
        )
        .map((v) => ({
          ...v.toObject(),
          ownerType: "Vendor",
          vendor: {
            _id: vendor._id,
            name: vendor.name,
          },
        }))
    );

    const combinedResults = [
      ...filteredDellcube.map((v) => ({
        ...v.toObject(),
        ownerType: "Dellcube",
      })),
      ...filteredVendorVehicles,
    ];

    if (combinedResults.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No vehicles found" });
    }

    return res.status(200).json({
      success: true,
      vehicles: combinedResults,
    });
  } catch (error) {
    console.error("Error searching vehicle:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while searching vehicle",
      error: error.message,
    });
  }
};
