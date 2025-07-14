import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";

import upload from "../utils/common/Uploads.js";
import {
  createCompany,
  deleteCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
} from "../controllers/companyController.js";

const router = express.Router();

router.post("/create", isAuthenticated, upload, createCompany);

router.get("/all", isAuthenticated, getAllCompanies);

router.post("/view", isAuthenticated, getCompanyById);

router.put("/update", isAuthenticated, upload, updateCompany);

router.delete("/delete", isAuthenticated, deleteCompany);

export default router;
