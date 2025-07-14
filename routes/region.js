import express from "express";
import countryRoutes from "./countryRoutes.js";
import stateRoutes from "./stateRoutes.js";
import cityRoutes from "./cityRoutes.js";
import localityRoutes from "./localityRoutes.js";
import pincodeRoutes from "./pincodeRoutes.js";

const router = express.Router();

router.use("/country", countryRoutes);
router.use("/states", stateRoutes);
router.use("/cities", cityRoutes);
router.use("/localities", localityRoutes);
router.use("/pincodes", pincodeRoutes);

export default router;
