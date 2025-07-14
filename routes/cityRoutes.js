import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCity,
  //   getCitiesByState,
  getCitiesById,
  getAllCities,
  updateCity,
  deleteCity,
  getCitiesByState,
} from "../controllers/cityController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createCity);
router.get("/all", getAllCities);
router.post("/view", getCitiesById);
router.post("/get-city-by-state", getCitiesByState);
router.put("/update", isAuthenticated, updateCity);
router.delete("/delete", isAuthenticated, deleteCity);

export default router;
