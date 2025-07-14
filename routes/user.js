import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/common/Uploads.js";
import { createBranchAdminController, deleteBranchAdminController, getAllBranchAdmins, getBranchAdminById, getUserProfileController, loginController, logoutController, registerController, updateBranchAdminController, updateProfileController, verifyOTPController } from "../controllers/user.js";
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
} from "../controllers/user.js";

const router = express.Router();

//User
router.post("/register", registerController);
router.post("/verify-otp", verifyOTPController);
router.post("/login", loginController);
router.get("/logout", logoutController);
router.get("/profile", isAuthenticated, getUserProfileController);
router.put("/update-profile", isAuthenticated, upload, updateProfileController);

//Branch Admin
router.post("/create-branch-admin", isAuthenticated, isSuperAdmin, createBranchAdminController)
router.get("/all/branch-admins", isAuthenticated, isSuperAdmin, getAllBranchAdmins);
router.post("/view/branch-admin", isAuthenticated, isSuperAdmin, getBranchAdminById);
router.put("/update-branch-admin", upload, updateBranchAdminController);
router.delete("/delete/branch-admin", isAuthenticated, isSuperAdmin, deleteBranchAdminController);

//Operations
router.post("/create-operations", isAuthenticated, createOperationUserController);
router.get("/all-operations", isAuthenticated, getAllOperationUsers);
router.post("/view-operations", isAuthenticated, getOperationUserById);
router.delete("/delete-operations", isAuthenticated, deleteOperationUserController);
router.put("/update-operations", isAuthenticated, upload, updateOperationUserController);

// Drivers
router.post("/create-driver", isAuthenticated, createDriverController);
// router.post("/driver-login", loginDriverWithMobileController);
// router.post("/driver-verify-otp", verifyDriverOtpController);
router.get("/all-drivers", isAuthenticated, getAllDriversController);
router.post("/view-driver", isAuthenticated, getDriverByIdController);
router.put("/update-driver", isAuthenticated, upload, updateDriverController);
router.delete("/delete-driver", isAuthenticated, deleteDriverController);

export default router;
