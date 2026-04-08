import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  addBillingPayment,
  createRate,
  deleteRate,
  generateBillingInvoice,
  getBillingInvoiceById,
  getBillingInvoices,
  getRates,
  listDocketsForBilling,
  updateBillingInvoiceStatus,
  updateRate,
} from "../controllers/billingController.js";

const router = express.Router();

router.get("/rates", isAuthenticated, getRates);
router.post("/rates", isAuthenticated, createRate);
router.put("/rates/:id", isAuthenticated, updateRate);
router.delete("/rates/:id", isAuthenticated, deleteRate);

router.get("/dockets", isAuthenticated, listDocketsForBilling);
router.post("/invoices/generate", isAuthenticated, generateBillingInvoice);
router.get("/invoices", isAuthenticated, getBillingInvoices);
router.get("/invoices/:id", isAuthenticated, getBillingInvoiceById);
router.put("/invoices/:id/status", isAuthenticated, updateBillingInvoiceStatus);
router.post("/invoices/:id/payments", isAuthenticated, addBillingPayment);

export default router;
