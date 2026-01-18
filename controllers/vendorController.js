import { User } from "../models/user.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

// Controller to create a new vendor
export const createVendor = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      gstNumber,
      status,
      branch,
      company,
      panNumber,
      bankName,
      accountNumber,
      ifsc,
      assignedClients,
      password,
    } = req.body;

    // Handle assignedClients - can be array or single value from FormData
    let assignedClientsArray = [];
    if (assignedClients) {
      assignedClientsArray = Array.isArray(assignedClients)
        ? assignedClients
        : [assignedClients];
    }

    const signatureFile = req.files?.signature?.[0];
    const signaturePayload = signatureFile
      ? { url: signatureFile.path, public_id: signatureFile.filename }
      : null;

    const createdBy = req.user._id;

    // Use companyId/branchId from token if not provided in body (for non-superAdmin users)
    const finalCompany = company || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranch = branch || (req.user?.role !== "superAdmin" ? req.branchId : null);

    // Basic validation
    if (!name || !email || !phone || !finalBranch || !finalCompany) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, branch, and company are required fields for a vendor.",
      });
    }

    // Check if vendor with this email or name already exists
    const existingVendor = await User.findOne({
      $or: [{ email }, { phone }],
      role: "vendor",
    });
    if (existingVendor) {
      return res.status(400).json({
        success: false,
        message: "Vendor with this email or phone already exists.",
      });
    }

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : await bcrypt.hash("Vendor@123", 10);

    // Convert company and branch to arrays (User model expects arrays)
    const companyArray = Array.isArray(finalCompany) ? finalCompany : [finalCompany].filter(Boolean);
    const branchArray = Array.isArray(finalBranch) ? finalBranch : [finalBranch].filter(Boolean);

    const vendorDoc = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "vendor",
      company: companyArray,
      branch: branchArray,
      phone,
      address,
      gstNumber,
      panNumber,
      bankName,
      accountNumber,
      ifsc,
      vendorStatus: status || "active",
      assignedClients: assignedClientsArray, // Array of customer IDs
      createdAt: new Date(),
      status: true,
      ...(signaturePayload && { signature: signaturePayload }),
    });

    return res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      vendor: vendorDoc,
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

    const query = { role: "vendor" };
    // Vendor can only see self
    if (req.user?.role === "vendor") {
      query._id = req.user.userId;
    }
    if (search) query.name = { $regex: search, $options: "i" }; // Search by vendor name
    if (status) query.vendorStatus = status;
    
    // Use companyId/branchId from token if not provided in query (for non-superAdmin users)
    const finalCompanyId = companyId || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranchId = branchId || (req.user?.role !== "superAdmin" ? req.branchId : null);
    
    // Query for array fields - use $in operator to find vendors with matching company/branch in their arrays
    if (finalCompanyId) query.company = { $in: [finalCompanyId] };
    if (finalBranchId) query.branch = { $in: [finalBranchId] };

    const vendors = await User.find(query)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .populate("assignedClients", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

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

    // Vendor can only view self
    if (req.user?.role === "vendor" && String(req.user.userId) !== String(id)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const vendor = await User.findOne({ _id: id, role: "vendor" })
      .populate("company", "name")
      .populate("branch", "name")
      .populate("assignedClients", "name email");

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
    // Handle FormData - multer parses all fields into req.body
    // vendorId might be a string or array depending on how it's sent
    let vendorId = req.body.vendorId;
    
    // If vendorId is an array (can happen with FormData), take the first element
    if (Array.isArray(vendorId)) {
      vendorId = vendorId[0];
    }
    
    // Convert to string if it's an ObjectId
    if (vendorId && typeof vendorId !== 'string') {
      vendorId = String(vendorId);
    }
    
    console.log("Update Vendor - vendorId:", vendorId);
    console.log("Update Vendor - vendorId type:", typeof vendorId);
    console.log("Update Vendor - req.body keys:", Object.keys(req.body));
    console.log("Update Vendor - req.body.vendorId:", req.body.vendorId);

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required for update",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({
        success: false,
        message: "Valid vendor ID is required for update",
      });
    }

    // Extract updates, excluding vendorId
    const updates = { ...req.body };
    delete updates.vendorId;

    // Use companyId/branchId from token if not provided in body (for non-superAdmin users)
    // Only use token values if company/branch are not explicitly provided
    if (!updates.company && req.user?.role !== "superAdmin" && req.companyId) {
      updates.company = req.companyId;
    }
    if (!updates.branch && req.user?.role !== "superAdmin" && req.branchId) {
      updates.branch = req.branchId;
    }

    // Vendor can only update self
    if (
      req.user?.role === "vendor" &&
      String(req.user.userId) !== String(vendorId)
    ) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const vendorDoc = await User.findOne({ _id: vendorId, role: "vendor" });
    if (!vendorDoc) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const signatureFile = req.files?.signature?.[0];
    const mapped = { ...updates };
    if (mapped.status) {
      mapped.vendorStatus = mapped.status;
      delete mapped.status;
    }
    if (mapped.password) {
      mapped.password = await bcrypt.hash(mapped.password, 10);
    }
    
    // Handle company field - ensure it's an array or omit if not provided
    if (mapped.company !== undefined) {
      if (Array.isArray(mapped.company)) {
        // Filter out any empty strings and validate ObjectIds
        mapped.company = mapped.company
          .filter(Boolean)
          .filter(id => mongoose.Types.ObjectId.isValid(id));
      } else if (mapped.company) {
        // Single value case - convert to array
        const companyId = String(mapped.company).trim();
        if (mongoose.Types.ObjectId.isValid(companyId)) {
          mapped.company = [companyId];
        } else {
          delete mapped.company; // Invalid, don't update
        }
      } else {
        // Empty or undefined - don't update (keep existing value)
        delete mapped.company;
      }
    } else {
      // Not provided - don't update (keep existing value)
      delete mapped.company;
    }
    
    // Handle branch field - ensure it's an array or omit if not provided
    if (mapped.branch !== undefined) {
      if (Array.isArray(mapped.branch)) {
        // Filter out any empty strings and validate ObjectIds
        mapped.branch = mapped.branch
          .filter(Boolean)
          .filter(id => mongoose.Types.ObjectId.isValid(id));
      } else if (mapped.branch) {
        // Single value case - convert to array
        const branchId = String(mapped.branch).trim();
        if (mongoose.Types.ObjectId.isValid(branchId)) {
          mapped.branch = [branchId];
        } else {
          delete mapped.branch; // Invalid, don't update
        }
      } else {
        // Empty or undefined - don't update (keep existing value)
        delete mapped.branch;
      }
    } else {
      // Not provided - don't update (keep existing value)
      delete mapped.branch;
    }
    
    // Handle assignedClients - FormData sends multiple values with same key as array
    // Multer parses FormData arrays correctly, but we need to handle both cases
    if (mapped.assignedClients !== undefined) {
      if (Array.isArray(mapped.assignedClients)) {
        // Filter out any empty strings
        mapped.assignedClients = mapped.assignedClients.filter(Boolean);
      } else if (mapped.assignedClients) {
        // Single value case
        mapped.assignedClients = [mapped.assignedClients].filter(Boolean);
      } else {
        // Empty or undefined - set to empty array
        mapped.assignedClients = [];
      }
    }
    
    console.log("Update Vendor - assignedClients:", mapped.assignedClients);
    console.log("Update Vendor - company:", mapped.company);
    console.log("Update Vendor - branch:", mapped.branch);

    if (signatureFile) {
      if (vendorDoc.signature?.public_id) {
        await cloudinary.uploader.destroy(vendorDoc.signature.public_id);
      }
      mapped.signature = {
        url: signatureFile.path,
        public_id: signatureFile.filename,
      };
    }

    const updatedVendor = await User.findOneAndUpdate(
      { _id: vendorId, role: "vendor" },
      mapped,
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators on update
      }
    );

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

    // Vendor cannot delete themselves via this route
    if (req.user?.role === "vendor") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const deletedVendor = await User.findOneAndDelete({
      _id: id,
      role: "vendor",
    });

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
  console.log("Content-Type:", req.get("Content-Type"));

  const { vendorId } = req.body;

  if (!vendorId) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID is required",
    });
  }

  try {
    const vendor = await User.findOne({ _id: vendorId, role: "vendor" });

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
      yearOfManufacture: req.body.yearOfManufacture
        ? parseInt(req.body.yearOfManufacture)
        : undefined,
      registrationDate: req.body.registrationDate
        ? new Date(req.body.registrationDate)
        : undefined,
      fitnessCertificateExpiry: req.body.fitnessCertificateExpiry
        ? new Date(req.body.fitnessCertificateExpiry)
        : undefined,
      insuranceExpiry: req.body.insuranceExpiry
        ? new Date(req.body.insuranceExpiry)
        : undefined,
      pollutionCertificateExpiry: req.body.pollutionCertificateExpiry
        ? new Date(req.body.pollutionCertificateExpiry)
        : undefined,
      vehicleInsuranceNo: req.body.vehicleInsuranceNo || "",
      fitnessNo: req.body.fitnessNo || "",
      status: req.body.status || "active",
    };

    console.log("Extracted vehicle data:", vehicleData);
    console.log("Raw req.body keys:", Object.keys(req.body));
    console.log("Raw req.body values:", Object.values(req.body));

    // Validate required fields
    if (
      !vehicleData.vehicleNumber ||
      !vehicleData.type ||
      !vehicleData.brand ||
      !vehicleData.model
    ) {
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
      if (
        req.files &&
        req.files[
          `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
        ] &&
        req.files[
          `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
        ][0]
      ) {
        vehicleData[field] = {
          url: req.files[
            `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
          ][0].path,
          public_id:
            req.files[
              `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
            ][0].filename,
        };
      } else {
        // Set default empty values if no image
        vehicleData[field] = { url: "", public_id: "" };
      }
    }

    // Initialize maintenance history array
    vehicleData.maintenanceHistory = [];

    console.log(
      "Final vehicle data to be saved:",
      JSON.stringify(vehicleData, null, 2)
    );

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
    const result = await User.updateOne(
      { _id: vendorId, role: "vendor" },
      { $push: { availableVehicles: newVehicle } }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to add vehicle to vendor",
      });
    }

    // Fetch the updated vendor to return
    const updatedVendor = await User.findById(vendorId);

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

    const vendors = await User.find({
      company: companyId,
      role: "vendor",
    }).sort({
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

    const vendors = await User.find({ branch: branchId, role: "vendor" }).sort({
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
    const updatedVendor = await User.findOneAndUpdate(
      { _id: vendorId, role: "vendor", "availableVehicles._id": vehicleId },
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
  console.log("Content-Type:", req.get("Content-Type"));

  const { vendorId, vehicleId } = req.body;

  if (!vendorId || !vehicleId) {
    console.log("Missing data - vendorId:", vendorId, "vehicleId:", vehicleId);
    return res.status(400).json({
      success: false,
      message: "Vendor ID and vehicle ID are required",
    });
  }

  try {
    const vendor = await User.findOne({ _id: vendorId, role: "vendor" });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Find the specific vehicle in the vendor's availableVehicles array
    const vehicleIndex = vendor.availableVehicles.findIndex(
      (v) => v._id.toString() === vehicleId
    );

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
    if (
      !maintenanceData.serviceDate ||
      !maintenanceData.serviceType ||
      !maintenanceData.description
    ) {
      return res.status(400).json({
        success: false,
        message: "Service date, type, and description are required",
      });
    }

    // Handle bill image upload if present
    if (
      req.files &&
      req.files.vendorVehicleBillImage &&
      req.files.vendorVehicleBillImage[0]
    ) {
      maintenanceData.billImage = {
        url: req.files.vendorVehicleBillImage[0].path,
        public_id: req.files.vendorVehicleBillImage[0].filename,
      };
    } else {
      // Set default empty values if no image
      maintenanceData.billImage = { url: "", public_id: "" };
    }

    // Add maintenance record to the specific vehicle
    vendor.availableVehicles[vehicleIndex].maintenanceHistory.push(
      maintenanceData
    );
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

// Get vendor's own vehicles
export const getVendorVehicles = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    if (req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only vendors can access this endpoint.",
      });
    }

    const vendor = await User.findOne({ _id: vendorId, role: "vendor" })
      .populate("company", "name")
      .populate("branch", "name")
      .populate("assignedClients", "name email");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor vehicles fetched successfully",
      vehicles: vendor.availableVehicles || [],
      vendor: {
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        company: vendor.company,
        branch: vendor.branch,
        assignedClient: vendor.assignedClient,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor vehicles:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vendor vehicles",
      error: error.message,
    });
  }
};

// Get vendor's invoices
export const getVendorInvoices = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    if (req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only vendors can access this endpoint.",
      });
    }

    // Get vendor details to check assigned client
    const vendor = await User.findOne({
      _id: vendorId,
      role: "vendor",
    }).populate("assignedClients", "name email");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Import Invoice model
    const { Invoice } = await import("../models/invoice.js");

    // Build query to get invoices for this vendor
    let query = { vendor: vendorId };

    // If vendor has assigned clients, show invoices for those clients
    // (even if vendor field is not set in the invoice)
    if (vendor.assignedClients && vendor.assignedClients.length > 0) {
      const customerIds = vendor.assignedClients.map((client) => client._id || client);
      query = { customer: { $in: customerIds } };
    }

    console.log("Vendor ID:", vendorId);
    console.log("Vendor assigned clients:", vendor.assignedClients);
    console.log("Query for invoices:", query);

    // First, let's check all invoices for this vendor without any filters
    const allVendorInvoices = await Invoice.find({ vendor: vendorId })
      .populate("customer", "name email")
      .select("docketNumber customer vendor vehicleType createdAt")
      .limit(10);

    console.log(
      "All invoices for this vendor (first 10):",
      allVendorInvoices.map((inv) => ({
        docketNumber: inv.docketNumber,
        customer: inv.customer,
        customerId: inv.customer?._id,
        vendor: inv.vendor,
        vendorId: inv.vendor,
        createdAt: inv.createdAt,
      }))
    );

    // Check if there are any invoices for the assigned clients
    if (vendor.assignedClients && vendor.assignedClients.length > 0) {
      const customerIds = vendor.assignedClients.map((client) => client._id || client);
      const clientInvoices = await Invoice.find({
        customer: { $in: customerIds },
      })
        .populate("customer", "name email")
        .populate("vendor", "name email")
        .select("docketNumber customer vendor vehicleType createdAt")
        .limit(10);

      console.log(
        "All invoices for assigned client (first 10):",
        clientInvoices.map((inv) => ({
          docketNumber: inv.docketNumber,
          customer: inv.customer,
          customerId: inv.customer?._id,
          vendor: inv.vendor,
          vendorId: inv.vendor,
          createdAt: inv.createdAt,
        }))
      );
    }

    let invoices = await Invoice.find(query)
      .populate("customer", "name email")
      .populate("company", "name")
      .populate("branch", "name")
      .populate("goodsType", "name")
      .populate("siteType", "name")
      .populate("transportMode", "name")
      .sort({ createdAt: -1 });

    console.log("Found invoices count:", invoices.length);
    console.log(
      "Raw invoices:",
      invoices.map((inv) => ({
        id: inv._id,
        docketNumber: inv.docketNumber,
        vendor: inv.vendor,
        customer: inv.customer,
        vehicleType: inv.vehicleType,
      }))
    );

    // If no invoices found with customer filter, show all vendor invoices as fallback
    if (
      invoices.length === 0 &&
      vendor.assignedClients &&
      vendor.assignedClients.length > 0
    ) {
      console.log(
        "No invoices found with customer filter, showing all vendor invoices as fallback..."
      );
      const fallbackQuery = { vendor: vendorId };
      const fallbackInvoices = await Invoice.find(fallbackQuery)
        .populate("customer", "name email")
        .populate("company", "name")
        .populate("branch", "name")
        .populate("goodsType", "name")
        .populate("siteType", "name")
        .populate("transportMode", "name")
        .sort({ createdAt: -1 });

      console.log(
        "Fallback query found invoices count:",
        fallbackInvoices.length
      );
      console.log(
        "Fallback invoices:",
        fallbackInvoices.map((inv) => ({
          id: inv._id,
          docketNumber: inv.docketNumber,
          vendor: inv.vendor,
          customer: inv.customer,
          vehicleType: inv.vehicleType,
        }))
      );

      // Use fallback invoices if no filtered invoices found
      invoices = fallbackInvoices;
    }

    // Transform invoices to match frontend expectations
    const transformedInvoices = invoices.map((invoice) => ({
      id: invoice._id,
      invoiceNumber: invoice.docketNumber,
      docketNumber: invoice.docketNumber,
      clientName: invoice.customer?.name || "Unknown Client",
      company: invoice.company?.name || "N/A",
      branch: invoice.branch?.name || "N/A",
      amount: invoice.freightCharges || invoice.totalAmount || 0,
      status: invoice.status || "pending",
      date: invoice.createdAt,
      vehicleNumber: invoice.vendorVehicle?.vehicleNumber || "N/A",
      description: `Transportation from ${
        invoice.fromAddress?.city?.name || "N/A"
      } to ${invoice.toAddress?.city?.name || "N/A"}`,
      orderNumber: invoice.orderNumber,
      goodsType: invoice.goodsType?.name,
      siteType: invoice.siteType?.name,
      transportMode: invoice.transportMode?.name,
    }));

    return res.status(200).json({
      success: true,
      message: "Vendor invoices fetched successfully",
      invoices: transformedInvoices,
      debug: {
        vendorId,
        assignedClients: vendor.assignedClients,
        totalInvoicesFound: transformedInvoices.length,
        queryUsed: query,
        filteringByAssignedClients: vendor.assignedClients?.length > 0 ? true : false,
        queryStrategy: vendor.assignedClients?.length > 0 ? "customer-only" : "vendor-only",
        usingFallbackInvoices:
          invoices.length === 0 && vendor.assignedClients?.length > 0 ? true : false,
      },
    });
  } catch (error) {
    console.error("Error fetching vendor invoices:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vendor invoices",
      error: error.message,
    });
  }
};

// Test endpoint to debug vendor invoices
export const testVendorInvoices = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    // Import Invoice model
    const { Invoice } = await import("../models/invoice.js");

    // Get all invoices for this vendor
    const allVendorInvoices = await Invoice.find({ vendor: vendorId })
      .populate("customer", "name email")
      .populate("vendor", "name email")
      .select("docketNumber customer vendor vehicleType createdAt");

    // Get vendor details
    const vendor = await User.findOne({ _id: vendorId, role: "vendor" })
      .populate("assignedClients", "name email")
      .select("name email assignedClients");

    // Also check if there are any invoices at all in the database
    const totalInvoices = await Invoice.countDocuments();
    const totalVendorInvoices = await Invoice.countDocuments({
      vendor: vendorId,
    });
    const customerIds = vendor.assignedClients?.map((client) => client._id || client) || [];
    const totalCustomerInvoices = customerIds.length > 0
      ? await Invoice.countDocuments({ customer: { $in: customerIds } })
      : 0;

    return res.status(200).json({
      success: true,
      message: "Debug info for vendor invoices",
      vendor: {
        id: vendor._id,
        name: vendor.name,
        email: vendor.email,
        assignedClients: vendor.assignedClients,
      },
      allVendorInvoices: allVendorInvoices.map((inv) => ({
        id: inv._id,
        docketNumber: inv.docketNumber,
        customer: inv.customer,
        vendor: inv.vendor,
        vehicleType: inv.vehicleType,
        createdAt: inv.createdAt,
      })),
      totalCount: allVendorInvoices.length,
      debug: {
        totalInvoicesInDB: totalInvoices,
        totalVendorInvoices: totalVendorInvoices,
        totalCustomerInvoices: totalCustomerInvoices,
        assignedClientIds: customerIds,
      },
    });
  } catch (error) {
    console.error("Error in testVendorInvoices:", error);
    return res.status(500).json({
      success: false,
      message: "Server error in test endpoint",
      error: error.message,
    });
  }
};

// Get vendor's profile
export const getVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    if (req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only vendors can access this endpoint.",
      });
    }

    const vendor = await User.findOne({ _id: vendorId, role: "vendor" })
      .populate("company", "name")
      .populate("branch", "name")
      .populate("assignedClients", "name email")
      .select("-password");

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor profile fetched successfully",
      vendor,
    });
  } catch (error) {
    console.error("Error fetching vendor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching vendor profile",
      error: error.message,
    });
  }
};

// Update vendor's profile
export const updateVendorProfile = async (req, res) => {
  try {
    const vendorId = req.user.userId;

    if (req.user.role !== "vendor") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only vendors can access this endpoint.",
      });
    }

    const vendor = await User.findOne({ _id: vendorId, role: "vendor" });
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const {
      name,
      phone,
      email,
      address,
      gstNumber,
      panNumber,
      bankName,
      accountNumber,
      ifsc,
      currentPassword,
      newPassword,
    } = req.body;

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (email) updateData.email = email;
    if (address) updateData.address = address;
    if (gstNumber) updateData.gstNumber = gstNumber;
    if (panNumber) updateData.panNumber = panNumber;
    if (bankName) updateData.bankName = bankName;
    if (accountNumber) updateData.accountNumber = accountNumber;
    if (ifsc) updateData.ifsc = ifsc;

    // Handle password update
    if (currentPassword && newPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(
        currentPassword,
        vendor.password
      );
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // Hash the new password
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (req.files?.signature?.[0]) {
      if (vendor.signature?.public_id) {
        await cloudinary.uploader.destroy(vendor.signature.public_id);
      }
      updateData.signature = {
        url: req.files.signature[0].path,
        public_id: req.files.signature[0].filename,
      };
    }

    const updatedVendor = await User.findOneAndUpdate(
      { _id: vendorId, role: "vendor" },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("company", "name")
      .populate("branch", "name")
      .populate("assignedClients", "name email")
      .select("-password");

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Vendor profile updated successfully",
      vendor: updatedVendor,
    });
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating vendor profile",
      error: error.message,
    });
  }
};

// Update a vendor vehicle
export const updateVendorVehicle = async (req, res) => {
  console.log("=== Update Vendor Vehicle Request ===");
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  const { vendorId, vehicleId } = req.body;

  if (!vendorId || !vehicleId) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID and vehicle ID are required",
    });
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(vehicleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid vendor ID or vehicle ID format",
    });
  }

  try {
    const vendor = await User.findOne({ _id: vendorId, role: "vendor" });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Find the specific vehicle in the vendor's availableVehicles array
    const vehicleIndex = vendor.availableVehicles.findIndex(
      (v) => v._id && v._id.toString() === vehicleId.toString()
    );

    if (vehicleIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found in vendor's available vehicles",
      });
    }

    // Map old enum values to new ones for backward compatibility
    const mapOldVehicleType = (type) => {
      if (!type) return "14 Feet"; // Default fallback
      
      const typeMapping = {
        "7ft": "14 Feet",
        "10ft": "14 Feet",
        "14ft": "14 Feet",
        "18ft": "19 Feet",
        "24ft": "24 Feet",
        "32ft": "32FTMXL-14MT",
      };
      
      // If it's an old value, map it; otherwise return as-is (assuming it's already a new value)
      return typeMapping[type.toLowerCase()] || type;
    };

    // Valid enum values for vehicle type
    const validVehicleTypes = [
      "14 Feet", "17 Feet", "19 Feet", "20 Feet", "22 Feet", "24 Feet",
      "32FTMXL-14MT", "Biker", "BYHAND", "FLAT BED TRAILER 20FT", "Pickup",
      "TAURUS 16 TON", "Tata 407", "TRUCK/LORRY", "SFBT40", "TATA/EICHER 709",
      "32FTMXL-18MT", "32FTSXL-7MT", "32FTSXL-9MT", "FLAT BED TRAILER 40FT",
      "SEMI FLAT BED TRAILER 40FT", "TAURUS 18 TON", "TAURUS 21 TON",
      "TAURUS 25 TON", "TAURUS 30 TON", "TATA ACE"
    ];

    // Map and validate the vehicle type
    const mappedType = mapOldVehicleType(req.body.type);
    if (!validVehicleTypes.includes(mappedType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid vehicle type: ${req.body.type}. Valid types are: ${validVehicleTypes.join(", ")}`,
      });
    }

    // Extract vehicle data from form fields
    const vehicleData = {
      vehicleNumber: req.body.vehicleNumber,
      type: mappedType, // Use the mapped and validated type
      brand: req.body.brand,
      model: req.body.model,
      yearOfManufacture: req.body.yearOfManufacture
        ? parseInt(req.body.yearOfManufacture)
        : undefined,
      registrationDate: req.body.registrationDate
        ? new Date(req.body.registrationDate)
        : undefined,
      fitnessCertificateExpiry: req.body.fitnessCertificateExpiry
        ? new Date(req.body.fitnessCertificateExpiry)
        : undefined,
      insuranceExpiry: req.body.insuranceExpiry
        ? new Date(req.body.insuranceExpiry)
        : undefined,
      pollutionCertificateExpiry: req.body.pollutionCertificateExpiry
        ? new Date(req.body.pollutionCertificateExpiry)
        : undefined,
      vehicleInsuranceNo: req.body.vehicleInsuranceNo || "",
      fitnessNo: req.body.fitnessNo || "",
      status: req.body.status || vendor.availableVehicles[vehicleIndex].status,
    };

    // Handle certificate image uploads if present
    const certFields = [
      "fitnessCertificateImage",
      "pollutionCertificateImage",
      "registrationCertificateImage",
      "insuranceImage",
    ];

    for (const field of certFields) {
      if (
        req.files &&
        req.files[
          `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
        ] &&
        req.files[
          `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
        ][0]
      ) {
        // Delete old image if exists
        const oldPublicId = vendor.availableVehicles[vehicleIndex][field]?.public_id;
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId);
          } catch (err) {
            console.error(`Failed to delete old image for ${field}:`, err);
          }
        }
        vehicleData[field] = {
          url: req.files[
            `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
          ][0].path,
          public_id:
            req.files[
              `vendorVehicle${field.charAt(0).toUpperCase() + field.slice(1)}`
            ][0].filename,
        };
      }
    }

    // Use findOneAndUpdate with $set and positional operator to update only the specific vehicle
    // This avoids validating other vehicles in the array that might have old enum values
    const updateFields = {};
    Object.keys(vehicleData).forEach((key) => {
      if (vehicleData[key] !== undefined) {
        updateFields[`availableVehicles.$.${key}`] = vehicleData[key];
      }
    });

    // Also handle certificate images
    for (const field of certFields) {
      if (vehicleData[field]) {
        updateFields[`availableVehicles.$.${field}`] = vehicleData[field];
      }
    }

    // Convert vehicleId to ObjectId for the query
    const vehicleObjectId = mongoose.Types.ObjectId.isValid(vehicleId) 
      ? new mongoose.Types.ObjectId(vehicleId) 
      : vehicleId;

    const updateResult = await User.findOneAndUpdate(
      { _id: vendorId, role: "vendor", "availableVehicles._id": vehicleObjectId },
      { $set: updateFields },
      { new: true, runValidators: false } // Disable validators to avoid issues with other vehicles
    );

    if (!updateResult) {
      return res.status(404).json({
        success: false,
        message: "Vendor or vehicle not found",
      });
    }

    // Fetch updated vendor with populated fields
    const finalVendor = await User.findById(vendorId)
      .populate("company", "name")
      .populate("branch", "name");

    res.status(200).json({
      success: true,
      message: "Vendor vehicle updated successfully",
      vendor: finalVendor,
    });
  } catch (error) {
    console.error("Update Vendor Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating vendor vehicle",
      error: error.message,
    });
  }
};

// Delete a vendor vehicle
export const deleteVendorVehicle = async (req, res) => {
  const { vendorId, vehicleId } = req.body;

  if (!vendorId || !vehicleId) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID and vehicle ID are required",
    });
  }

  // Validate ObjectIds
  if (!mongoose.Types.ObjectId.isValid(vendorId) || !mongoose.Types.ObjectId.isValid(vehicleId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid vendor ID or vehicle ID format",
    });
  }

  try {
    const vendor = await User.findOne({ _id: vendorId, role: "vendor" });

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    // Find the specific vehicle in the vendor's availableVehicles array
    const vehicle = vendor.availableVehicles.find(
      (v) => v._id && v._id.toString() === vehicleId.toString()
    );

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found in vendor's available vehicles",
      });
    }

    // Delete images from Cloudinary
    const certFields = [
      "fitnessCertificateImage",
      "pollutionCertificateImage",
      "registrationCertificateImage",
      "insuranceImage",
    ];

    for (const field of certFields) {
      const publicId = vehicle[field]?.public_id;
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error(`Failed to delete image for ${field}:`, err);
        }
      }
    }

    // Convert vehicleId to ObjectId for the query
    const vehicleObjectId = mongoose.Types.ObjectId.isValid(vehicleId) 
      ? new mongoose.Types.ObjectId(vehicleId) 
      : vehicleId;

    // Use findOneAndUpdate with $pull to remove the vehicle from the array
    // This avoids validating other vehicles that might have old enum values
    const updateResult = await User.findOneAndUpdate(
      { _id: vendorId, role: "vendor", "availableVehicles._id": vehicleObjectId },
      { $pull: { availableVehicles: { _id: vehicleObjectId } } },
      { new: true, runValidators: false } // Disable validators to avoid issues with other vehicles
    );

    if (!updateResult) {
      return res.status(404).json({
        success: false,
        message: "Vendor or vehicle not found",
      });
    }

    // Fetch updated vendor with populated fields
    const finalVendor = await User.findById(vendorId)
      .populate("company", "name")
      .populate("branch", "name");

    res.status(200).json({
      success: true,
      message: "Vendor vehicle deleted successfully",
      vendor: finalVendor,
    });
  } catch (error) {
    console.error("Delete Vendor Vehicle Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting vendor vehicle",
      error: error.message,
    });
  }
};
