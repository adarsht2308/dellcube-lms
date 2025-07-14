import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/common/Uploads.js";
import { isSuperAdmin } from "../middlewares/isSuperAdmin.js";
import {
  createOperationUserController,
  deleteOperationUserController,
  getAllOperationUsers,
  getOperationUserById,
  updateOperationUserController
} from "../controllers/user.js";

const router = express.Router();

router.post("/create", isAuthenticated, createOperationUserController);
router.get("/all", isAuthenticated, getAllOperationUsers);
router.post("/view", isAuthenticated, getOperationUserById);
router.delete("/delete", isAuthenticated, deleteOperationUserController);
router.put("/update", isAuthenticated, upload, updateOperationUserController);

export default router;