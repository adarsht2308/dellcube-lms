import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  trackInvoiceByDocketNumber,
  trackInvoiceById,
} from "../controllers/trackingController.js";

const router = express.Router();

// Public endpoint - Track by docket number (no authentication required)
router.get("/docket/:docketNumber", trackInvoiceByDocketNumber);

// Protected endpoint - Track by invoice ID (requires authentication)
router.get("/invoice/:id", isAuthenticated, trackInvoiceById);

export default router;

