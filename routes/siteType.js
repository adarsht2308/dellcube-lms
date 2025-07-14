import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createSiteType,
  deleteSiteType,
  getAllSiteTypes,
  getSiteTypeById,
  updateSiteType,
} from "../controllers/siteType.js";

const router = express.Router();

router.post("/create", isAuthenticated, createSiteType);

router.get("/all", isAuthenticated, getAllSiteTypes);

router.post("/view", isAuthenticated, getSiteTypeById);

router.put("/update", isAuthenticated, updateSiteType);

router.delete("/delete", isAuthenticated, deleteSiteType);

export default router;
