import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/common/Uploads.js";
import multer from "multer";
import { createBranchAdminController, deleteBranchAdminController, getAllBranchAdmins, getBranchAdminById, getUserProfileController, loginController, logoutController, registerController, updateBranchAdminController, updateProfileController, verifyOTPController, sendPasswordResetOTPController, verifyPasswordResetOTPController } from "../controllers/user.js";
import { isSuperAdmin } from "../middlewares/isSuperAdmin.js";
import {
    createOperationUserController,
    deleteOperationUserController,
    getAllOperationUsers,
    getOperationUserById,
    updateOperationUserController
} from "../controllers/user.js";
import {
    createDriverController,
    getAllDriversController,
    getDriverByIdController,
    updateDriverController,
    deleteDriverController,
    bulkUploadDriversController,
} from "../controllers/user.js";

const router = express.Router();

// Multer configuration for CSV files (store in memory)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only CSV files are allowed."), false);
    }
  },
});

//User
router.post("/register", upload, registerController);
router.post("/verify-otp", verifyOTPController);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/profile", isAuthenticated, getUserProfileController);
router.put("/update-profile", isAuthenticated, upload, updateProfileController);

// Password Reset
router.post("/send-password-reset-otp", sendPasswordResetOTPController);
router.post("/verify-password-reset-otp", verifyPasswordResetOTPController);

//Branch Admin
router.post("/create-branch-admin", isAuthenticated, isSuperAdmin, upload, createBranchAdminController)
router.get("/all/branch-admins", isAuthenticated, isSuperAdmin, getAllBranchAdmins);
router.post("/view/branch-admin", isAuthenticated, isSuperAdmin, getBranchAdminById);
router.put("/update-branch-admin", upload, updateBranchAdminController);
router.delete("/delete/branch-admin", isAuthenticated, isSuperAdmin, deleteBranchAdminController);

//Operations
router.post("/create-operations", isAuthenticated, upload, createOperationUserController);
router.get("/all-operations", isAuthenticated, getAllOperationUsers);
router.post("/view-operations", isAuthenticated, getOperationUserById);
router.delete("/delete-operations", isAuthenticated, deleteOperationUserController);
router.put("/update-operations", isAuthenticated, upload, updateOperationUserController);

// Drivers
router.post("/create-driver", isAuthenticated, createDriverController);
router.post("/bulk-upload-drivers", isAuthenticated, csvUpload.single('csvFile'), bulkUploadDriversController);
// router.post("/driver-login", loginDriverWithMobileController);
// router.post("/driver-verify-otp", verifyDriverOtpController);
router.get("/all-drivers", isAuthenticated, getAllDriversController);
router.post("/view-driver", isAuthenticated, getDriverByIdController);
router.put("/update-driver", isAuthenticated, upload, updateDriverController);
router.delete("/delete-driver", isAuthenticated, deleteDriverController);

export default router;
