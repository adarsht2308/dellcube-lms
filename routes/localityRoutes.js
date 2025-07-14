import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createLocality,
  getLocalitiesByCity,
  getAllLocalities,
  updateLocality,
  deleteLocality,
  getLocalityById,
} from "../controllers/localityController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createLocality);
router.get("/all", getAllLocalities);

router.post("/view", getLocalityById);
router.post("/get-locality-by-city", getLocalitiesByCity);
router.put("/update", isAuthenticated, updateLocality);
router.delete("/delete", isAuthenticated, deleteLocality);

export default router;
