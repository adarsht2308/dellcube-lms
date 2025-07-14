import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createTransportMode,
  deleteTransportMode,
  getAllTransportModes,
  getTransportModeById,
  updateTransportMode,
} from "../controllers/transportMode.js";

const router = express.Router();

router.post("/create", isAuthenticated, createTransportMode);

router.get("/all", isAuthenticated, getAllTransportModes);

router.post("/view", isAuthenticated, getTransportModeById);

router.put("/update", isAuthenticated, updateTransportMode);

router.delete("/delete", isAuthenticated, deleteTransportMode);


export default router;
