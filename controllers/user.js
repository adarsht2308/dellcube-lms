import { User } from "../models/user.js";
import { generateOTP, sendOTPEmail, sendPasswordResetOTPEmail } from "../utils/common/registerOTP.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/common/generateToken.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

const pendingUsers = new Map();
const passwordResetOTPs = new Map(); // Store OTPs for password reset: email -> { otp, expiry, userId }

const parseJSONField = (field, fallback = null) => {
  if (!field) return fallback;
  if (typeof field === "string") {
    try {
      return JSON.parse(field);
    } catch (error) {
      return fallback;
    }
  }
  return field;
};

const normalizeBoolean = (value, defaultValue = true) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return defaultValue;
};

const getSignatureFromRequest = (req) => {
  const file = req.files?.signature?.[0];
  if (file) {
    return {
      url: file.path,
      public_id: file.filename,
    };
  }
  return null;
};

export const registerController = async (req, res) => {
  try {
    //   const { error } = User.validate(req.body);
    //   if (error) {
    //     return res
    //       .status(400)
    //       .send({ message: "Validation Error", details: error.details });
    //   }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email.",
      });
    }

    // Check if a pending user already exists for this email
    if (pendingUsers.has(email)) {
      return res.status(400).json({
        success: false,
        message: "OTP already sent. Please verify your email.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Capture optional signature upload
    const signatureFile = req.files?.signature?.[0];
    const signaturePayload = signatureFile
      ? {
          url: signatureFile.path,
          public_id: signatureFile.filename,
        }
      : null;

    // Generate OTP
    const otp = generateOTP();

    // Store user details and OTP temporarily
    pendingUsers.set(email, {
      name,
      email,
      hashedPassword,
      signature: signaturePayload,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000,
    });

    // Send OTP email
    await sendOTPEmail(name, email, otp);

    return res.status(200).json({
      success: true,
      message:
        "Account created successfully. Please verify your email with the OTP sent.",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to register",
    });
  }
};

//update profile
export const updateProfileController = async (req, res) => {
  try {
    const userId = req.id;
    const { name } = req.body;

    if (!name) {
      return res.status(500).send({
        message: "All field is required",
        success: false,
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User Not Found" });
    }
    let photoUrl;
    let photoUrlPublicId;
    let bannerUrl;
    let bannerUrlPublicId;
    let signaturePayload;

    if (req.files && req.files.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId);
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }

    if (req.files && req.files.bannerImage) {
      if (user.bannerUrlPublicId) {
        await cloudinary.uploader.destroy(user.bannerUrlPublicId);
      }
      bannerUrl = req.files.bannerImage[0].path;
      bannerUrlPublicId = req.files.bannerImage[0].filename;
    }
    if (req.files?.signature) {
      if (user.signature?.public_id) {
        await cloudinary.uploader.destroy(user.signature.public_id);
      }
      signaturePayload = {
        url: req.files.signature[0].path,
        public_id: req.files.signature[0].filename,
      };
    }

    const updatedData = { name };
    if (photoUrl) {
      updatedData.photoUrl = photoUrl;
      updatedData.photoUrlPublicId = photoUrlPublicId;
    }
    if (bannerUrl) {
      updatedData.bannerUrl = bannerUrl;
      updatedData.bannerUrlPublicId = bannerUrlPublicId;
    }
    if (signaturePayload) {
      updatedData.signature = signaturePayload;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.log("=== ERROR ===");
    console.log("Error message:", error.message);
    console.log("Error stack:", error.stack);
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

//Get User Profile
export const getUserProfileController = async (req, res) => {
  try {
    const userId = req.id;
    const user = await User.findById(userId)
      .select("-password")
      .populate("company")
      .populate("branch");
    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }
    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if ((!email && !mobile) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile and password are required",
      });
    }

    // Support login with both email and mobile for all roles
    let user;
    if (mobile) {
      // Try to find user by mobile (all roles can have mobile)
      user = await User.findOne({ mobile });
    } else if (email) {
      // Try to find user by email (all roles can have email)
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Incorrect credentials",
      });
    }

    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      return res.status(400).json({
        success: false,
        message: "Incorrect credentials",
      });
    }

    // If you want to restrict inactive accounts
    if (!user.status) {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact admin.",
      });
    }

    generateToken(res, user, `Welcome back ${user.name}`);
  } catch (error) {
    console.log("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to login",
    });
  }
};

// Verify OTP Controller
export const verifyOTPController = async (req, res) => {
  try {
    const { email, otp } = req.body;
    // Check if the email exists in pending users
    if (!pendingUsers.has(email)) {
      return res
        .status(400)
        .json({ message: "No registration found for this email" });
    }

    const pendingUser = pendingUsers.get(email);

    // Validate OTP
    if (pendingUser.otp !== otp || Date.now() > pendingUser.otpExpiry) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Create the user in the database
    const newUser = await User.create({
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.hashedPassword,
      status: true,
      ...(pendingUser.signature && { signature: pendingUser.signature }),
    });

    // Remove the user from pending list
    pendingUsers.delete(email);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully. User registered!",
      user: newUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logoutController = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged Out Successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to Log out",
    });
  }
};

// === BRANCH ADMIN CONTROLLERS ===
export const createBranchAdminController = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      company,
      branch,
      mobile,
      aadharNumber,
      panNumber,
      bankDetails,
      status,
    } = req.body;

    const parsedBankDetails = parseJSONField(bankDetails, bankDetails);
    if (
      !name ||
      !email ||
      !password ||
      !company ||
      !branch ||
      !aadharNumber ||
      !panNumber ||
      !parsedBankDetails
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required including Aadhar, PAN, and Bank details.",
      });
    }

    if (
      !parsedBankDetails.accountNumber ||
      !parsedBankDetails.ifscCode ||
      !parsedBankDetails.bankName ||
      !parsedBankDetails.accountHolderName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All bank details are required: account number, IFSC code, bank name, and account holder name.",
      });
    }

    const existingAadhar = await User.findOne({ aadharNumber });
    if (existingAadhar) {
      return res.status(400).json({
        success: false,
        message: "User with this Aadhar number already exists.",
      });
    }

    const existingPAN = await User.findOne({ panNumber });
    if (existingPAN) {
      return res.status(400).json({
        success: false,
        message: "User with this PAN number already exists.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (mobile && !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile must be 10 digits if provided.",
      });
    }

    const normalizedStatus = normalizeBoolean(status, true);
    const signatureData = getSignatureFromRequest(req);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "branchAdmin",
      company,
      branch,
      ...(mobile && { mobile }),
      aadharNumber,
      panNumber,
      bankDetails: parsedBankDetails,
      status: normalizedStatus,
      ...(signatureData && { signature: signatureData }),
    });

    return res.status(201).json({
      success: true,
      message: "Branch Admin created successfully.",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating branch admin:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while creating branch admin",
    });
  }
};

export const getAllBranchAdmins = async (req, res) => {
  try {
    let { page, limit, search, company, branch, status } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      role: "branchAdmin",
    };

    if (search) query.name = { $regex: search, $options: "i" };
    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (status !== "") query.status = status === "true";
    const branchAdmins = await User.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Branch admins fetched successfully",
      branchAdmins,
      page,
      limit,
      total,
      currentPageCount: branchAdmins.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching branch admins:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching branch admins",
    });
  }
};

export const getBranchAdminById = async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findOne({ _id: id, role: "branchAdmin" })
      .populate("company", "name")
      .populate("branch", "name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Branch admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Branch admin fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching branch admin:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the branch admin",
    });
  }
};

export const deleteBranchAdminController = async (req, res) => {
  try {
    const { id } = req.body;

    // Check if the ID is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Branch Admin ID is required.",
      });
    }

    const user = await User.findById(id);

    if (!user || user.role !== "branchAdmin") {
      return res.status(404).json({
        success: false,
        message: "Branch Admin not found.",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Branch Admin deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting branch admin:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting branch admin.",
    });
  }
};

export const updateBranchAdminController = async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      company,
      branch,
      status,
      mobile,
      aadharNumber,
      panNumber,
      bankDetails,
    } = req.body;

    if (!userId || !name) {
      return res.status(400).json({
        success: false,
        message: "User ID and Name are required",
      });
    }

    const user = await User.findById(userId);

    if (!user || user.role !== "branchAdmin") {
      return res.status(404).json({
        success: false,
        message: "Branch Admin not found",
      });
    }

    // Check for existing users with same Aadhar or PAN (excluding current user)
    if (aadharNumber && aadharNumber !== user.aadharNumber) {
      const existingAadhar = await User.findOne({
        aadharNumber,
        _id: { $ne: userId },
      });
      if (existingAadhar) {
        return res.status(400).json({
          success: false,
          message: "User with this Aadhar number already exists.",
        });
      }
    }

    if (panNumber && panNumber !== user.panNumber) {
      const existingPAN = await User.findOne({
        panNumber,
        _id: { $ne: userId },
      });
      if (existingPAN) {
        return res.status(400).json({
          success: false,
          message: "User with this PAN number already exists.",
        });
      }
    }

    let photoUrl, photoUrlPublicId, signaturePayload;

    if (req.files?.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId);
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }

    if (req.files?.signature) {
      if (user.signature?.public_id) {
        await cloudinary.uploader.destroy(user.signature.public_id);
      }
      signaturePayload = {
        url: req.files.signature[0].path,
        public_id: req.files.signature[0].filename,
      };
    }

    // Parse bankDetails if it's a JSON string
    let parsedBankDetails = bankDetails
      ? parseJSONField(bankDetails, null)
      : null;
    if (bankDetails && !parsedBankDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid bank details format",
      });
    }

    // Validate optional mobile
    if (mobile && !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile must be 10 digits if provided.",
      });
    }

    const normalizedStatus =
      status !== undefined ? normalizeBoolean(status, user.status) : undefined;

    const updatedData = {
      name,
      email,
      ...(company && { company }),
      ...(branch && { branch }),
      ...(normalizedStatus !== undefined && { status: normalizedStatus }),
      ...(mobile && { mobile }),
      ...(aadharNumber && { aadharNumber }),
      ...(panNumber && { panNumber }),
      ...(parsedBankDetails && { bankDetails: parsedBankDetails }),
      ...(photoUrl && {
        photoUrl,
        photoUrlPublicId,
      }),
      ...(signaturePayload && { signature: signaturePayload }),
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Branch Admin updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error("Update Branch Admin Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating Branch Admin",
      error: error.message,
    });
  }
};

// === OPERATION USER CONTROLLERS ===
export const createOperationUserController = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      company,
      branch,
      mobile,
      aadharNumber,
      panNumber,
      bankDetails,
      status,
    } = req.body;

    const parsedBankDetails = parseJSONField(bankDetails, bankDetails);

    if (
      !name ||
      !email ||
      !password ||
      !company ||
      !branch ||
      !aadharNumber ||
      !panNumber ||
      !parsedBankDetails
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required including Aadhar, PAN, and Bank details.",
      });
    }

    // Validate bank details
    if (
      !parsedBankDetails.accountNumber ||
      !parsedBankDetails.ifscCode ||
      !parsedBankDetails.bankName ||
      !parsedBankDetails.accountHolderName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All bank details are required: account number, IFSC code, bank name, and account holder name.",
      });
    }

    // Check for existing users with same Aadhar or PAN
    const existingAadhar = await User.findOne({ aadharNumber });
    if (existingAadhar) {
      return res.status(400).json({
        success: false,
        message: "User with this Aadhar number already exists.",
      });
    }

    const existingPAN = await User.findOne({ panNumber });
    if (existingPAN) {
      return res.status(400).json({
        success: false,
        message: "User with this PAN number already exists.",
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Validate optional mobile
    if (mobile && !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile must be 10 digits if provided.",
      });
    }

    const normalizedStatus = normalizeBoolean(status, true);
    const signatureData = getSignatureFromRequest(req);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "operation",
      company,
      branch,
      ...(mobile && { mobile }),
      aadharNumber,
      panNumber,
      bankDetails: parsedBankDetails,
      status: normalizedStatus,
      ...(signatureData && { signature: signatureData }),
    });
    return res.status(201).json({
      success: true,
      message: "Operation User created successfully.",
      user: newUser,
    });
  } catch (error) {
    console.error("Error creating operation user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while creating operation user",
    });
  }
};

export const getAllOperationUsers = async (req, res) => {
  try {
    let { page, limit, search, company, branch, status } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;
    const query = { role: "operation" };
    if (search) query.name = { $regex: search, $options: "i" };
    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (status !== "") query.status = status === "true";

    const operationUsers = await User.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);
    return res.status(200).json({
      success: true,
      message: "Operation users fetched successfully",
      operationUsers,
      page,
      limit,
      total,
      currentPageCount: operationUsers.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching operation users:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching operation users",
    });
  }
};

export const getOperationUserById = async (req, res) => {
  try {
    const { id } = req.body;

    const user = await User.findOne({ _id: id, role: "operation" })
      .populate("company", "name")
      .populate("branch", "name");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Operation user not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Operation user fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching operation user:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the operation user",
    });
  }
};

export const deleteOperationUserController = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Operation User ID is required." });
    }
    const user = await User.findById(id);
    if (!user || user.role !== "operation") {
      return res
        .status(404)
        .json({ success: false, message: "Operation User not found." });
    }
    await User.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Operation User deleted successfully." });
  } catch (error) {
    console.error("Error deleting operation user:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting operation user.",
    });
  }
};

export const updateOperationUserController = async (req, res) => {
  try {
    const {
      userId,
      name,
      email,
      company,
      branch,
      status,
      mobile,
      aadharNumber,
      panNumber,
      bankDetails,
    } = req.body;

    if (!userId || !name) {
      return res
        .status(400)
        .json({ success: false, message: "User ID and Name are required" });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "operation") {
      return res
        .status(404)
        .json({ success: false, message: "Operation User not found" });
    }

    // Check for existing users with same Aadhar or PAN (excluding current user)
    if (aadharNumber && aadharNumber !== user.aadharNumber) {
      const existingAadhar = await User.findOne({
        aadharNumber,
        _id: { $ne: userId },
      });
      if (existingAadhar) {
        return res.status(400).json({
          success: false,
          message: "User with this Aadhar number already exists.",
        });
      }
    }

    if (panNumber && panNumber !== user.panNumber) {
      const existingPAN = await User.findOne({
        panNumber,
        _id: { $ne: userId },
      });
      if (existingPAN) {
        return res.status(400).json({
          success: false,
          message: "User with this PAN number already exists.",
        });
      }
    }

    let photoUrl, photoUrlPublicId, signaturePayload;
    if (req.files?.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId);
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }
    if (req.files?.signature) {
      if (user.signature?.public_id) {
        await cloudinary.uploader.destroy(user.signature.public_id);
      }
      signaturePayload = {
        url: req.files.signature[0].path,
        public_id: req.files.signature[0].filename,
      };
    }

    // Parse bankDetails if it's a JSON string
    let parsedBankDetails = bankDetails
      ? parseJSONField(bankDetails, null)
      : null;
    if (bankDetails && !parsedBankDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid bank details format",
      });
    }

    // Validate optional mobile
    if (mobile && !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile must be 10 digits if provided.",
      });
    }

    const normalizedStatus =
      status !== undefined ? normalizeBoolean(status, user.status) : undefined;

    const updatedData = {
      name,
      ...(email && { email }),
      ...(company && { company }),
      ...(branch && { branch }),
      ...(normalizedStatus !== undefined && { status: normalizedStatus }),
      ...(mobile && { mobile }),
      ...(aadharNumber && { aadharNumber }),
      ...(panNumber && { panNumber }),
      ...(parsedBankDetails && { bankDetails: parsedBankDetails }),
      ...(photoUrl && { photoUrl, photoUrlPublicId }),
      ...(signaturePayload && { signature: signaturePayload }),
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");
    return res.status(200).json({
      success: true,
      message: "Operation User updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error("Update Operation User Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating Operation User",
      error: error.message,
    });
  }
};

// === DRIVER CONTROLLERS ===
export const createDriverController = async (req, res) => {
  try {
    const {
      name,
      mobile,
      password,
      company,
      branch,
      licenseNumber,
      experienceYears,
      driverType,
      vendor,
      aadharNumber,
      panNumber,
      bankDetails,
    } = req.body;

    if (
      !name ||
      !mobile ||
      !password ||
      !company ||
      !branch ||
      !licenseNumber ||
      !experienceYears ||
      !driverType
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required.",
      });
    }

    // Driver type validation
    if (!["dellcube", "vendor", "temporary"].includes(driverType)) {
      return res.status(400).json({
        success: false,
        message: "Driver type must be one of: dellcube, vendor, temporary.",
      });
    }

    // If driver type is vendor, vendor field is required
    if (driverType === "vendor" && !vendor) {
      return res.status(400).json({
        success: false,
        message: "Vendor is required when driver type is 'vendor'.",
      });
    }

    // Validate vendor exists and is actually a vendor
    if (driverType === "vendor" && vendor) {
      const vendorUser = await User.findOne({ _id: vendor, role: "vendor" });
      if (!vendorUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid vendor selected.",
        });
      }
    }

    // License number validation
    if (licenseNumber.length < 5) {
      return res.status(400).json({
        success: false,
        message: "License number must be at least 5 characters long.",
      });
    }

    if (licenseNumber.length > 20) {
      return res.status(400).json({
        success: false,
        message: "License number must not exceed 20 characters.",
      });
    }

    // License number format validation (alphanumeric, hyphens, spaces only)
    if (!/^[A-Za-z0-9\-\s]+$/.test(licenseNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "License number can only contain letters, numbers, hyphens, and spaces.",
      });
    }

    // Mobile number validation
    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits.",
      });
    }

    // Experience validation
    if (experienceYears < 0 || experienceYears > 50) {
      return res.status(400).json({
        success: false,
        message: "Experience years must be between 0 and 50.",
      });
    }

    // Check for existing users with same mobile
    const existingMobile = await User.findOne({ mobile });
    if (existingMobile) {
      return res.status(400).json({
        success: false,
        message: "User with this mobile number already exists.",
      });
    }

    // Check for existing users with same license number
    const existingLicense = await User.findOne({ licenseNumber });
    if (existingLicense) {
      return res.status(400).json({
        success: false,
        message: "User with this license number already exists.",
      });
    }

    // Aadhar and PAN validation (required)
    if (!aadharNumber || !aadharNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Aadhar Card Number is required.",
      });
    }

    if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
      return res.status(400).json({
        success: false,
        message: "Aadhar Card Number must be exactly 12 digits.",
      });
    }

    if (!panNumber || !panNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "PAN Card Number is required.",
      });
    }

    if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: "PAN Card Number must be in valid format (e.g., ABCDE1234F).",
      });
    }

    // Check for existing users with same Aadhar or PAN
    const existingAadhar = await User.findOne({ aadharNumber });
    if (existingAadhar) {
      return res.status(400).json({
        success: false,
        message: "User with this Aadhar number already exists.",
      });
    }

    const existingPAN = await User.findOne({ panNumber });
    if (existingPAN) {
      return res.status(400).json({
        success: false,
        message: "User with this PAN number already exists.",
      });
    }

    // Bank Details validation (required)
    if (!bankDetails) {
      return res.status(400).json({
        success: false,
        message: "Bank details are required.",
      });
    }

    const { accountHolderName, bankName, accountNumber, ifscCode } = bankDetails;

    if (!accountHolderName || !accountHolderName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Account Holder Name is required.",
      });
    }

    if (!bankName || !bankName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bank Name is required.",
      });
    }

    if (!accountNumber || !accountNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Account Number is required.",
      });
    }

    if (!ifscCode || !ifscCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "IFSC Code is required.",
      });
    }

    if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: "IFSC Code must be in valid format (e.g., ABCD0123456).",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDriver = await User.create({
      name,
      mobile,
      password: hashedPassword,
      role: "driver",
      company,
      branch,
      licenseNumber,
      experienceYears,
      driverType,
      ...(driverType === "vendor" && vendor && { vendor }),
      aadharNumber,
      panNumber,
      bankDetails,
      status: true,
    });

    return res.status(201).json({
      success: true,
      message: "Driver created successfully.",
      user: newDriver,
    });
  } catch (error) {
    console.error("Error creating driver:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while creating driver",
    });
  }
};

export const getAllDriversController = async (req, res) => {
  try {
    let { page, limit, search, company, branch, status, driverType } =
      req.query;
    console.log(req.query);
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = { role: "driver" };
    if (search) query.name = { $regex: search, $options: "i" };
    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (status !== "") query.status = status === "true";
    if (driverType) query.driverType = driverType;

    const drivers = await User.find(query)
      .populate("company", "name")
      .populate("branch", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Drivers fetched successfully",
      drivers,
      page,
      limit,
      total,
      currentPageCount: drivers.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching drivers:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching drivers",
    });
  }
};

export const getDriverByIdController = async (req, res) => {
  try {
    const { id } = req.body;

    const driver = await User.findOne({ _id: id, role: "driver" })
      .populate("company", "name")
      .populate("branch", "name")
      .populate("vendor", "name email phone");

    if (!driver) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Driver fetched successfully",
      user: driver,
    });
  } catch (error) {
    console.error("Error fetching driver:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching driver",
    });
  }
};

export const updateDriverController = async (req, res) => {
  try {
    const {
      userId,
      name,
      mobile,
      licenseNumber,
      experienceYears,
      company,
      branch,
      status,
      driverType,
      vendor,
      aadharNumber,
      panNumber,
      bankDetails,
    } = req.body;

    if (!userId || !name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "User ID, name, and mobile are required",
      });
    }

    // Driver type validation
    if (
      driverType &&
      !["dellcube", "vendor", "temporary"].includes(driverType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Driver type must be one of: dellcube, vendor, temporary.",
      });
    }

    // Determine the effective driver type (use provided or existing)
    const effectiveDriverType = driverType || user.driverType;

    // If driver type is vendor, vendor field is required
    if (effectiveDriverType === "vendor" && !vendor) {
      return res.status(400).json({
        success: false,
        message: "Vendor is required when driver type is 'vendor'.",
      });
    }

    // Validate vendor exists and is actually a vendor
    if (effectiveDriverType === "vendor" && vendor) {
      const vendorUser = await User.findOne({ _id: vendor, role: "vendor" });
      if (!vendorUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid vendor selected.",
        });
      }
    }

    // License number validation
    if (licenseNumber && licenseNumber.length < 5) {
      return res.status(400).json({
        success: false,
        message: "License number must be at least 5 characters long.",
      });
    }

    if (licenseNumber && licenseNumber.length > 20) {
      return res.status(400).json({
        success: false,
        message: "License number must not exceed 20 characters.",
      });
    }

    // License number format validation (alphanumeric, hyphens, spaces only)
    if (licenseNumber && !/^[A-Za-z0-9\-\s]+$/.test(licenseNumber)) {
      return res.status(400).json({
        success: false,
        message:
          "License number can only contain letters, numbers, hyphens, and spaces.",
      });
    }

    // Mobile number validation
    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: "Mobile number must be exactly 10 digits.",
      });
    }

    // Experience validation
    if (experienceYears && (experienceYears < 0 || experienceYears > 50)) {
      return res.status(400).json({
        success: false,
        message: "Experience years must be between 0 and 50.",
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "driver") {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    // Check for existing users with same mobile (excluding current user)
    if (mobile && mobile !== user.mobile) {
      const existingMobile = await User.findOne({
        mobile,
        _id: { $ne: userId },
      });
      if (existingMobile) {
        return res.status(400).json({
          success: false,
          message: "User with this mobile number already exists.",
        });
      }
    }

    // Check for existing users with same license number (excluding current user)
    if (licenseNumber && licenseNumber !== user.licenseNumber) {
      const existingLicense = await User.findOne({
        licenseNumber,
        _id: { $ne: userId },
      });
      if (existingLicense) {
        return res.status(400).json({
          success: false,
          message: "User with this license number already exists.",
        });
      }
    }

    // Check for existing users with same Aadhar or PAN (excluding current user)
    if (aadharNumber && aadharNumber !== user.aadharNumber) {
      const existingAadhar = await User.findOne({
        aadharNumber,
        _id: { $ne: userId },
      });
      if (existingAadhar) {
        return res.status(400).json({
          success: false,
          message: "User with this Aadhar number already exists.",
        });
      }
    }

    if (panNumber && panNumber !== user.panNumber) {
      const existingPAN = await User.findOne({
        panNumber,
        _id: { $ne: userId },
      });
      if (existingPAN) {
        return res.status(400).json({
          success: false,
          message: "User with this PAN number already exists.",
        });
      }
    }

    let photoUrl, photoUrlPublicId;

    if (req.files?.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId);
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }

    // Aadhar and PAN validation (required)
    if (!aadharNumber || !aadharNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Aadhar Card Number is required.",
      });
    }

    if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
      return res.status(400).json({
        success: false,
        message: "Aadhar Card Number must be exactly 12 digits.",
      });
    }

    if (!panNumber || !panNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "PAN Card Number is required.",
      });
    }

    if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      return res.status(400).json({
        success: false,
        message: "PAN Card Number must be in valid format (e.g., ABCDE1234F).",
      });
    }

    // Parse bankDetails if it's a JSON string
    let parsedBankDetails = bankDetails;
    if (typeof bankDetails === "string") {
      try {
        parsedBankDetails = JSON.parse(bankDetails);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid bank details format",
        });
      }
    }

    // Bank Details validation (required)
    if (!parsedBankDetails) {
      return res.status(400).json({
        success: false,
        message: "Bank details are required.",
      });
    }

    const { accountHolderName, bankName, accountNumber, ifscCode } = parsedBankDetails;

    if (!accountHolderName || !accountHolderName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Account Holder Name is required.",
      });
    }

    if (!bankName || !bankName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Bank Name is required.",
      });
    }

    if (!accountNumber || !accountNumber.trim()) {
      return res.status(400).json({
        success: false,
        message: "Account Number is required.",
      });
    }

    if (!ifscCode || !ifscCode.trim()) {
      return res.status(400).json({
        success: false,
        message: "IFSC Code is required.",
      });
    }

    if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      return res.status(400).json({
        success: false,
        message: "IFSC Code must be in valid format (e.g., ABCD0123456).",
      });
    }

    // Determine effective driver type for vendor field handling
    const effectiveDriverTypeForUpdate = driverType || user.driverType;

    const updatedData = {
      name,
      mobile,
      licenseNumber,
      experienceYears,
      ...(company && { company }),
      ...(branch && { branch }),
      ...(status !== undefined && { status }),
      ...(driverType && { driverType }),
      // Handle vendor field: set if driverType is vendor, clear if not
      ...(effectiveDriverTypeForUpdate === "vendor" && vendor
        ? { vendor }
        : effectiveDriverTypeForUpdate !== "vendor"
        ? { vendor: null }
        : {}),
      aadharNumber,
      panNumber,
      bankDetails: parsedBankDetails,
      ...(photoUrl && {
        photoUrl,
        photoUrlPublicId,
      }),
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    }).select("-password");

    return res.status(200).json({
      success: true,
      message: "Driver updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error("Error updating driver:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating driver",
    });
  }
};

// Helper function to parse CSV
const parseCSV = (csvText) => {
  // Split lines and filter out empty lines and comment lines (starting with #)
  const allLines = csvText.split('\n');
  const lines = allLines
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
  
  if (lines.length < 2) return { headers: [], rows: [] };
  
  // First non-comment line should be headers
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = [];
  
  // Process data rows (skip header row)
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());
    
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return { headers, rows };
};

export const bulkUploadDriversController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "CSV file is required",
      });
    }

    const csvText = req.file.buffer.toString('utf-8');
    const { headers, rows } = parseCSV(csvText);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CSV file is empty or has no data rows",
      });
    }

    // Required fields (company and branch are optional if user has defaults)
    const requiredFields = [
      'name', 'mobile', 'password', 'licenseNumber', 'experienceYears',
      'driverType', 'aadharNumber', 'panNumber',
      'accountHolderName', 'bankName', 'accountNumber', 'ifscCode'
    ];

    // Optional fields that can use defaults
    const optionalFields = ['company', 'branch', 'vendor', 'status'];

    // Check if all required headers are present
    const missingHeaders = requiredFields.filter(field => !headers.includes(field));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingHeaders.join(', ')}. Note: Company and Branch are optional if you have defaults set.`,
      });
    }

    const results = {
      success: [],
      errors: [],
      total: rows.length,
      successCount: 0,
      errorCount: 0,
    };

    // Get user context for role-based company/branch assignment
    const userToken = req.user;
    const actingUser = await User.findById(userToken?.userId).select("role company branch");
    
    let defaultCompany = req.body.company;
    let defaultBranch = req.body.branch;

    // Role-based control
    if (actingUser && (actingUser.role === "branchAdmin" || actingUser.role === "operation")) {
      defaultCompany = actingUser.company?.toString();
      defaultBranch = actingUser.branch?.toString();
    }

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
      
      try {
        // Extract and validate data
        const name = (row.name || '').trim();
        const mobile = (row.mobile || '').trim().replace(/\D/g, '');
        const password = (row.password || '').trim();
        const licenseNumber = (row.licenseNumber || '').trim();
        const experienceYears = parseInt(row.experienceYears) || 0;
        const driverType = (row.driverType || '').trim().toLowerCase();
        
        // Helper function to filter out placeholder values
        const filterPlaceholder = (value) => {
          if (!value) return '';
          const trimmed = String(value).trim();
          // Filter out common placeholder patterns
          if (trimmed.includes('_ID_HERE') || 
              trimmed.includes('_HERE') || 
              trimmed.toLowerCase().includes('placeholder') ||
              trimmed.toLowerCase().includes('example') ||
              trimmed === 'COMPANY_ID_HERE' ||
              trimmed === 'BRANCH_ID_HERE' ||
              trimmed === 'VENDOR_ID_HERE') {
            return '';
          }
          return trimmed;
        };

        // Use CSV value if provided and valid, otherwise use default from user context
        let company = filterPlaceholder(row.company) || defaultCompany || '';
        let branch = filterPlaceholder(row.branch) || defaultBranch || '';
        const vendor = filterPlaceholder(row.vendor);
        const aadharNumber = (row.aadharNumber || '').trim().replace(/\D/g, '');
        const panNumber = (row.panNumber || '').trim().toUpperCase();
        const accountHolderName = (row.accountHolderName || '').trim();
        const bankName = (row.bankName || '').trim();
        const accountNumber = (row.accountNumber || '').trim();
        const ifscCode = (row.ifscCode || '').trim().toUpperCase();
        const status = row.status !== undefined ? normalizeBoolean(row.status, true) : true;

        // Validation - company and branch can be empty if defaults are available
        if (!name || !mobile || !password || !licenseNumber || !driverType) {
          results.errors.push({
            row: rowNumber,
            name: name || 'N/A',
            error: "Missing required fields (name, mobile, password, licenseNumber, driverType)",
          });
          results.errorCount++;
          continue;
        }

        // Validate company and branch (must have either from CSV or defaults)
        if (!company) {
          results.errors.push({
            row: rowNumber,
            name: name || 'N/A',
            error: "Company is required. Please provide company ID in CSV or ensure you have a default company.",
          });
          results.errorCount++;
          continue;
        }

        // Validate company is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(company)) {
          results.errors.push({
            row: rowNumber,
            name: name || 'N/A',
            error: `Invalid company ID: "${company}". Please provide a valid company ID or leave empty to use default.`,
          });
          results.errorCount++;
          continue;
        }

        if (!branch) {
          results.errors.push({
            row: rowNumber,
            name: name || 'N/A',
            error: "Branch is required. Please provide branch ID in CSV or ensure you have a default branch.",
          });
          results.errorCount++;
          continue;
        }

        // Validate branch is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(branch)) {
          results.errors.push({
            row: rowNumber,
            name: name || 'N/A',
            error: `Invalid branch ID: "${branch}". Please provide a valid branch ID or leave empty to use default.`,
          });
          results.errorCount++;
          continue;
        }

        if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "Mobile number must be exactly 10 digits",
          });
          results.errorCount++;
          continue;
        }

        if (licenseNumber.length < 5 || licenseNumber.length > 20) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "License number must be between 5 and 20 characters",
          });
          results.errorCount++;
          continue;
        }

        if (!/^[A-Za-z0-9\-\s]+$/.test(licenseNumber)) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "License number contains invalid characters",
          });
          results.errorCount++;
          continue;
        }

        if (experienceYears < 0 || experienceYears > 50) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "Experience years must be between 0 and 50",
          });
          results.errorCount++;
          continue;
        }

        if (!["dellcube", "vendor", "temporary"].includes(driverType)) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "Driver type must be dellcube, vendor, or temporary",
          });
          results.errorCount++;
          continue;
        }

        // Only validate vendor if driver type is exactly "vendor" (already normalized to lowercase)
        if (driverType === "vendor") {
          if (!vendor || !vendor.trim()) {
            results.errors.push({
              row: rowNumber,
              name,
              error: "Vendor is required when driver type is 'vendor'",
            });
            results.errorCount++;
            continue;
          }
        }

        if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "Aadhar number must be exactly 12 digits",
          });
          results.errorCount++;
          continue;
        }

        if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "PAN number must be in format ABCDE1234F",
          });
          results.errorCount++;
          continue;
        }

        if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "All bank details are required",
          });
          results.errorCount++;
          continue;
        }

        if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "IFSC code must be in format ABCD0123456",
          });
          results.errorCount++;
          continue;
        }

        // Check for duplicates
        const existingMobile = await User.findOne({ mobile });
        if (existingMobile) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "Mobile number already exists",
          });
          results.errorCount++;
          continue;
        }

        const existingLicense = await User.findOne({ licenseNumber });
        if (existingLicense) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "License number already exists",
          });
          results.errorCount++;
          continue;
        }

        const existingAadhar = await User.findOne({ aadharNumber });
        if (existingAadhar) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "Aadhar number already exists",
          });
          results.errorCount++;
          continue;
        }

        const existingPAN = await User.findOne({ panNumber });
        if (existingPAN) {
          results.errors.push({
            row: rowNumber,
            name,
            error: "PAN number already exists",
          });
          results.errorCount++;
          continue;
        }

        // Validate vendor if driver type is vendor
        if (driverType === "vendor") {
          if (!vendor) {
            results.errors.push({
              row: rowNumber,
              name,
              error: "Vendor is required when driver type is 'vendor'",
            });
            results.errorCount++;
            continue;
          }
          // Validate vendor is a valid ObjectId
          if (!mongoose.Types.ObjectId.isValid(vendor)) {
            results.errors.push({
              row: rowNumber,
              name,
              error: `Invalid vendor ID: "${vendor}". Please provide a valid vendor ID.`,
            });
            results.errorCount++;
            continue;
          }
          const vendorUser = await User.findOne({ _id: vendor, role: "vendor" });
          if (!vendorUser) {
            results.errors.push({
              row: rowNumber,
              name,
              error: "Invalid vendor selected - vendor not found",
            });
            results.errorCount++;
            continue;
          }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create driver
        const newDriver = await User.create({
          name,
          mobile,
          password: hashedPassword,
          role: "driver",
          company,
          branch,
          licenseNumber,
          experienceYears,
          driverType,
          ...(driverType === "vendor" && vendor && { vendor }),
          aadharNumber,
          panNumber,
          bankDetails: {
            accountHolderName,
            bankName,
            accountNumber,
            ifscCode,
          },
          status,
        });

        results.success.push({
          row: rowNumber,
          name,
          id: newDriver._id,
        });
        results.successCount++;

      } catch (error) {
        results.errors.push({
          row: rowNumber,
          name: row.name || 'N/A',
          error: error.message || "Unknown error",
        });
        results.errorCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${results.successCount} successful, ${results.errorCount} failed out of ${results.total} total.`,
      results,
    });

  } catch (error) {
    console.error("Error in bulk upload:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing bulk upload",
      error: error.message,
    });
  }
};

export const deleteDriverController = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Driver ID is required.",
      });
    }

    const user = await User.findById(id);
    if (!user || user.role !== "driver") {
      return res.status(404).json({
        success: false,
        message: "Driver not found.",
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Driver deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting driver:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting driver",
    });
  }
};

// Send Password Reset OTP
export const sendPasswordResetOTPController = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    // Check if OTP was already sent recently (within 1 minute)
    if (passwordResetOTPs.has(email)) {
      const existingOTP = passwordResetOTPs.get(email);
      const timeSinceLastOTP = Date.now() - existingOTP.sentAt;
      if (timeSinceLastOTP < 60000) {
        // 1 minute cooldown
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting another OTP",
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiry (10 minutes)
    passwordResetOTPs.set(email, {
      otp,
      expiry: Date.now() + 10 * 60 * 1000, // 10 minutes
      userId: user._id.toString(),
      sentAt: Date.now(),
    });

    // Send OTP email
    try {
      await sendPasswordResetOTPEmail(user.name, email, otp);
    } catch (emailError) {
      console.error("Error sending password reset OTP email:", emailError);
      // Don't reveal if user exists or not for security
      // Return success message even if email fails (to prevent email enumeration)
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset OTP has been sent.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password reset OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Error in sendPasswordResetOTPController:", error);
    // Don't reveal if user exists or not for security
    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset OTP has been sent.",
    });
  }
};

// Verify Password Reset OTP and Reset Password
export const verifyPasswordResetOTPController = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, and new password are required",
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if OTP exists
    if (!passwordResetOTPs.has(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP. Please request a new one.",
      });
    }

    const otpData = passwordResetOTPs.get(email);

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check if OTP expired
    if (Date.now() > otpData.expiry) {
      passwordResetOTPs.delete(email);
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
      });
    }

    // Find user
    const user = await User.findById(otpData.userId);
    if (!user) {
      passwordResetOTPs.delete(email);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Remove OTP from memory
    passwordResetOTPs.delete(email);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Error verifying password reset OTP:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reset password",
    });
  }
};
