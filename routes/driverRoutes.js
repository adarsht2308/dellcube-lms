import express from "express";

import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/common/Uploads.js";
import {
  getDriverInvoices,
  getRecentDriverInvoices,
  updateInvoiceByDriver,
} from "../controllers/driverController.js";

const router = express.Router();

// Protected routes - Only accessible by driver role (middleware should check req.user.role)

router.post("/driver-invoices", isAuthenticated, getDriverInvoices); // All assigned invoices
router.post("/recent-invoice", isAuthenticated, getRecentDriverInvoices); // Invoices from last 24 hrs
router.put("/update-driver-invoice", isAuthenticated, upload, updateInvoiceByDriver); // Update invoice fields by driver

export default router;
