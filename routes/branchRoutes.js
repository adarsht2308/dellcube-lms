import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createBranch,
  getAllBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
  getBranchesByCompany,
} from "../controllers/branchController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createBranch);

router.get("/all", isAuthenticated, getAllBranches);

router.post("/view", isAuthenticated, getBranchById);

router.put("/update", isAuthenticated, updateBranch);

router.delete("/delete", isAuthenticated, deleteBranch);

router.post("/branches-by-company",isAuthenticated, getBranchesByCompany);

export default router;
