import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { createGood, deleteGood, getAllGoods, getGoodById, updateGood } from "../controllers/goodsController.js";


const router = express.Router();

// Create a new good
router.post("/create", isAuthenticated, createGood);

// Get all goods
router.get("/all", isAuthenticated, getAllGoods);

// Get a single good by ID
router.post("/view", isAuthenticated, getGoodById);

// Update a good by ID
router.put("/update", isAuthenticated, updateGood);

// Delete a good by ID
router.delete("/delete", isAuthenticated, deleteGood);

export default router;
