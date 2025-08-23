import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  addMaintenanceController,
  // getVehiclesByCompany,
  // getVehiclesByBranch,
  searchVehicles,
} from "../controllers/vehicleController.js";
import upload from "../utils/common/Uploads.js";
import { checkAllVehiclesForExpiry, checkVehicleForExpiry } from "../utils/common/vehicleExpiryChecker.js";

const router = express.Router();

// Create a new vehicle
router.post("/create", isAuthenticated, upload, createVehicle);

// Get all vehicles with optional pagination, filters, etc.
router.get("/all", isAuthenticated, getAllVehicles);

// Search for a vehicle by number
router.get("/search", isAuthenticated, searchVehicles);

// Get a single vehicle by ID
router.post("/view", isAuthenticated, getVehicleById);

// Update vehicle by ID
router.put("/update", isAuthenticated,upload, updateVehicle);

// Delete vehicle by ID
router.delete("/delete", isAuthenticated, deleteVehicle);

router.put("/vehicle/maintenance", isAuthenticated, upload, addMaintenanceController);

// Check all vehicles for expiry (admin only)
router.post("/check-expiry", isAuthenticated, async (req, res) => {
  try {
    const result = await checkAllVehiclesForExpiry();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error checking vehicle expiry", error: error.message });
  }
});

// Check specific vehicle for expiry
router.post("/check-vehicle-expiry", isAuthenticated, async (req, res) => {
  try {
    const { vehicleId } = req.body;
    if (!vehicleId) {
      return res.status(400).json({ success: false, message: "Vehicle ID is required" });
    }
    
    const result = await checkVehicleForExpiry(vehicleId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error checking vehicle expiry", error: error.message });
  }
});

// Get scheduler status (for debugging)
router.get("/scheduler-status", isAuthenticated, async (req, res) => {
  try {
    const { getSchedulerStatus } = await import("../utils/common/scheduler.js");
    const status = getSchedulerStatus();
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error getting scheduler status", error: error.message });
  }
});

// Manually trigger scheduler (for testing)
router.post("/trigger-scheduler", isAuthenticated, async (req, res) => {
  try {
    const { triggerVehicleExpiryCheck } = await import("../utils/common/scheduler.js");
    const result = await triggerVehicleExpiryCheck();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error triggering scheduler", error: error.message });
  }
});

// Control scheduler (start/stop)
router.post("/scheduler-control", isAuthenticated, async (req, res) => {
  try {
    const { action } = req.body;
    
    if (action === 'start') {
      const { initializeScheduler } = await import("../utils/common/scheduler.js");
      await initializeScheduler();
      res.json({ success: true, message: "Scheduler started successfully" });
    } else if (action === 'stop') {
      const { stopScheduler } = await import("../utils/common/scheduler.js");
      stopScheduler();
      res.json({ success: true, message: "Scheduler stopped successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid action. Use 'start' or 'stop'" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: "Error controlling scheduler", error: error.message });
  }
});

export default router;
