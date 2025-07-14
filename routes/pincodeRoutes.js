import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createPincode,
  deletePincode,
  getAllPincodes,
  getPincodesById,
  getPincodesByLocality,
  updatePincode,
} from "../controllers/pincodeController.js";

const router = express.Router();

router.post("/create", isAuthenticated, createPincode);
router.get("/all", getAllPincodes);

router.post("/view", getPincodesById);
router.post("/get-pincode-by-locality", getPincodesByLocality);

router.put("/update", isAuthenticated, updatePincode);
router.delete("/delete", isAuthenticated, deletePincode);

export default router;
