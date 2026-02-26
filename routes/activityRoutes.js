import express from "express";
import {
  getAllActivities,
  getActivityStats,
  getActivityById,
  cleanupOldActivities,
} from "../controllers/activityController.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

// All activity routes require authentication
router.use(isAuthenticated);

// Get all activities with filters and pagination
router.get("/", getAllActivities);

// Get activity statistics
router.get("/stats", getActivityStats);

// Get single activity by ID
router.get("/:id", getActivityById);

// Cleanup old activities (SuperAdmin only)
router.delete("/cleanup", cleanupOldActivities);

export default router;
