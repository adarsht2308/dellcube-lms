import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createState,
  getAllStates,
  updateState,
  deleteState,
  getStateById,
  getStatesByCountry,
} from "../controllers/stateController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createState);
router.get("/all", getAllStates);
router.post("/view", getStateById);

router.post("/get-states-by-country", getStatesByCountry);
router.put("/update", isAuthenticated, updateState);
router.delete("/delete", isAuthenticated, deleteState);

export default router;
