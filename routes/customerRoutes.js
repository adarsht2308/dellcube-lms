import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCustomer,
  deleteCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
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

export default router;
