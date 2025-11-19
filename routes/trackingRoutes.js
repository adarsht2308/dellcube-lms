import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  trackInvoiceByDocketNumber,
  trackInvoiceById,
} from "../controllers/trackingController.js";

const router = express.Router();

// Handle OPTIONS preflight requests for CORS
router.options("*", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(200);
});

// Public endpoint - Track by docket number (no authentication required)
// Supports both /docket/:docketNumber and /:docketNumber for flexibility
router.get("/docket/:docketNumber", trackInvoiceByDocketNumber);
router.get("/:docketNumber", trackInvoiceByDocketNumber);

// Protected endpoint - Track by invoice ID (requires authentication)
router.get("/invoice/:id", isAuthenticated, trackInvoiceById);

export default router;

