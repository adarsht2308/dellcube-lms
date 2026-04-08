import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  addOrUpdateConsignee,
  bulkUploadConsignees,
  bulkUploadConsignors,
  exportConsignees,
  exportConsignors,
  manageMisFields,
  manageBillingFields,
} from "../controllers/customerController.js";

const router = express.Router();

// Create customer (superadmin or branchadmin)
router.post("/create", isAuthenticated, createCustomer);

// Get all customers (with pagination, search, filters for company/branch)
router.get("/all", isAuthenticated, getAllCustomers);

// Get single customer by ID
router.post("/view", isAuthenticated, getCustomerById);

// Update customer
router.put("/update", isAuthenticated, updateCustomer);

// Delete customer
router.delete("/delete", isAuthenticated, deleteCustomer);

// Add or Update Consignee (KN Integration)
router.post("/consignee/add-or-update", isAuthenticated, addOrUpdateConsignee);

// Bulk Upload Consignees
router.post("/consignees/bulk-upload", isAuthenticated, bulkUploadConsignees);

// Bulk Upload Consignors
router.post("/consignors/bulk-upload", isAuthenticated, bulkUploadConsignors);

// Export Consignees
router.get("/consignees/export/:customerId", isAuthenticated, exportConsignees);

// Export Consignors
router.get("/consignors/export/:customerId", isAuthenticated, exportConsignors);

// Manage MIS Fields
router.post("/mis-fields/manage", isAuthenticated, manageMisFields);
router.post("/billing-fields/manage", isAuthenticated, manageBillingFields);

export default router;
