import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/dbConfig.js";
import fs from "fs";    

dotenv.config();
connectDB();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:8080",
      "http://localhost:5174",
      "http://localhost:5173",
      "https://dellcube-lms.onrender.com",
      "https://dellcube-lms-1.onrender.com",
      "https://dellcube-lms-nucw.onrender.com",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

//User Auth routes
import userRoutes from "./routes/user.js";
import regionRoutes from "./routes/region.js";
import companyRoutes from "./routes/companyRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import goodsRoutes from "./routes/goodsRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import operationUserRoutes from "./routes/operationUser.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import driverRoutes from "./routes/driverRoutes.js";
import siteTypeRoutes from "./routes/siteType.js";
import transportModeRoutes from "./routes/transportMode.js";

// Register all API routes BEFORE static file serving
app.use("/api/user", userRoutes);
app.use("/api/region", regionRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/goods", goodsRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/site-types", siteTypeRoutes);
app.use("/api/transport-modes", transportModeRoutes);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Static file serving and catch-all route (should be last)
app.use(express.static(path.join(__dirname, "./client/dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./client/dist/index.html"));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server is running at ${PORT}`);
});
