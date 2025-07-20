import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createInvoice,
  deleteInvoice,
  getAllInvoices,
  getInvoiceById,
  updateInvoice,
  generateDellcubeInvoicePDF,
  generateInvoicePDF,
  exportInvoicesCSV,
} from "../controllers/invoiceController.js";

const router = express.Router();

// Create a new invoice
router.post("/create", isAuthenticated, createInvoice);

// Get all invoices (with optional pagination, search, filters)
router.get("/all", isAuthenticated, getAllInvoices);

// Get a single invoice by ID
router.post("/view", isAuthenticated, getInvoiceById);

// Update invoice by ID
router.put("/update", isAuthenticated, updateInvoice);

// Delete invoice by ID
router.delete("/delete", isAuthenticated, deleteInvoice);

router.get("/:invoiceId/pdf-dellcube", generateDellcubeInvoicePDF);

router.get("/:invoiceId/pdf", generateInvoicePDF);

// Export invoices as CSV
router.get('/export-csv', exportInvoicesCSV);

export default router;
