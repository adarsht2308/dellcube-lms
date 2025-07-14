import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";

import {
  createCountry,
  getAllCountries,
  getCountryById,
  updateCountry,
  deleteCountry,
} from "../controllers/countryController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createCountry);
router.get("/all", getAllCountries);
router.post("/view", getCountryById);
router.put("/update", isAuthenticated, updateCountry);
router.delete("/delete", isAuthenticated, deleteCountry);

export default router;
