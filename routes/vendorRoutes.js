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
  //   getVehiclesByVendor,
} from "../controllers/vendorController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createVendor);

// Get all vendors (for the "Select Vendor" dropdown)
router.get("/all", isAuthenticated, getAllVendors);

// Get a single vendor by ID (optional, but good for detail views)
router.post("/view", isAuthenticated, getVendorById); // Using POST for ID in body, consistent with your vehicle/view

// Update vendor by ID
router.put("/update", isAuthenticated, updateVendor);

// Delete vendor by ID
router.delete("/delete", isAuthenticated, deleteVendor);

// router.post("/vehicle-by-vendor", isAuthenticated, getVehiclesByVendor);

router.put("/vendor/vehicles", isAuthenticated, upload, addVehicleController);
router.put("/vendor/vehicle/status", isAuthenticated, updateVendorVehicleStatus);
router.put("/vendor/vehicle/maintenance", isAuthenticated, upload, addVendorVehicleMaintenance);

export default router;
