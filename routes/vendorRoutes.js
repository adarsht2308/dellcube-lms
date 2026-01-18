import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/common/Uploads.js";
import {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  addVehicleController,
  updateVendorVehicleStatus, // <-- import the new controller
  addVendorVehicleMaintenance, // <-- import the new controller
  updateVendorVehicle,
  deleteVendorVehicle,
  getVendorVehicles,
  getVendorInvoices,
  getVendorProfile,
  updateVendorProfile,
  testVendorInvoices,
  //   getVehiclesByVendor,
} from "../controllers/vendorController.js";

const router = express.Router();

router.post("/create", isAuthenticated, upload, createVendor);

// Get all vendors (for the "Select Vendor" dropdown)
router.get("/all", isAuthenticated, getAllVendors);

// Get a single vendor by ID (optional, but good for detail views)
router.post("/view", isAuthenticated, getVendorById); // Using POST for ID in body, consistent with your vehicle/view

// Update vendor by ID
router.put("/update", isAuthenticated, upload, updateVendor);

// Delete vendor by ID
router.delete("/delete", isAuthenticated, deleteVendor);

// Vendor-specific routes
router.get("/my-vehicles", isAuthenticated, getVendorVehicles);
router.get("/my-invoices", isAuthenticated, getVendorInvoices);
router.get("/my-profile", isAuthenticated, getVendorProfile);
router.put("/my-profile", isAuthenticated, upload, updateVendorProfile);
router.get("/test-invoices", isAuthenticated, testVendorInvoices);

// router.post("/vehicle-by-vendor", isAuthenticated, getVehiclesByVendor);

router.put("/vendor/vehicles", isAuthenticated, upload, addVehicleController);
router.put(
  "/vendor/vehicle/status",
  isAuthenticated,
  updateVendorVehicleStatus
);
router.put(
  "/vendor/vehicle/maintenance",
  isAuthenticated,
  upload,
  addVendorVehicleMaintenance
);
router.put(
  "/vendor/vehicle/update",
  isAuthenticated,
  upload,
  updateVendorVehicle
);
router.delete(
  "/vendor/vehicle/delete",
  isAuthenticated,
  deleteVendorVehicle
);

export default router;
