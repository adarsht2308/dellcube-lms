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
} from "../controllers/vehicleController.js";
import upload from "../utils/common/Uploads.js";

const router = express.Router();

// Create a new vehicle
router.post("/create", isAuthenticated, upload, createVehicle);

// Get all vehicles with optional pagination, filters, etc.
router.get("/all", isAuthenticated, getAllVehicles);

// Get a single vehicle by ID
router.post("/view", isAuthenticated, getVehicleById);

// Update vehicle by ID
router.put("/update", isAuthenticated,upload, updateVehicle);

// Delete vehicle by ID
router.delete("/delete", isAuthenticated, deleteVehicle);

router.put("/vehicle/maintenance",isAuthenticated, addMaintenanceController);


export default router;
