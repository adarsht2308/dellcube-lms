import { User } from "../models/user.js";
import { generateOTP, sendOTPEmail } from "../utils/common/registerOTP.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/common/generateToken.js";
import { v2 as cloudinary } from "cloudinary";

const pendingUsers = new Map();

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

    // Generate OTP
    const otp = generateOTP();

    // Store user details and OTP temporarily
    pendingUsers.set(email, {
      name,
      email,
      hashedPassword,
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

    if (req.files && req.files.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId)
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }

    if (req.files && req.files.bannerImage) {
      if (user.bannerUrlPublicId) {
        await cloudinary.uploader.destroy(user.bannerUrlPublicId)
      }
      bannerUrl = req.files.bannerImage[0].path;
      bannerUrlPublicId = req.files.bannerImage[0].filename
    }
    const updatedData = { name };
    if (photoUrl) { updatedData.photoUrl = photoUrl; updatedData.photoUrlPublicId = photoUrlPublicId }
    if (bannerUrl) { updatedData.bannerUrl = bannerUrl; updatedData.bannerUrlPublicId = bannerUrlPublicId }

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
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong", error: error.message });
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

    let user;
    if (mobile) {
      user = await User.findOne({ mobile, role: "driver" });
    } else {
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
    const { name, email, password, company, branch } = req.body;

    if (!name || !email || !password || !company || !branch) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
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

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "branchAdmin",
      company,
      branch,
      status: true,
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
    const { userId, name,email, company, branch, status } = req.body;

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

    let photoUrl, photoUrlPublicId;

    if (req.files?.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId);
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }

    const updatedData = {
      name,
      email,
      ...(company && { company }),
      ...(branch && { branch }),
      ...(status !== undefined && { status }),
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
    const { name, email, password, company, branch } = req.body;
    if (!name || !email || !password || !company || !branch) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "User with this email already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "operation",
      company,
      branch,
      status: true,
    });
    return res.status(201).json({ success: true, message: "Operation User created successfully.", user: newUser });
  } catch (error) {
    console.error("Error creating operation user:", error.message);
    return res.status(500).json({ success: false, message: "Server error while creating operation user" });
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
    return res.status(500).json({ success: false, message: "Something went wrong while fetching operation users" });
  }
};

export const getOperationUserById = async (req, res) => {
  try {
    const { id } = req.body;
   
    const user = await User.findOne({ _id: id, role: "operation" })
      .populate("company", "name")
      .populate("branch", "name");
    if (!user) {
      return res.status(404).json({ success: false, message: "Operation user not found" });
    }
    return res.status(200).json({ success: true, message: "Operation user fetched successfully", user });
  } catch (error) {
    console.error("Error fetching operation user:", error);
    return res.status(500).json({ success: false, message: "Something went wrong while fetching the operation user" });
  }
};

export const deleteOperationUserController = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, message: "Operation User ID is required." });
    }
    const user = await User.findById(id);
    if (!user || user.role !== "operation") {
      return res.status(404).json({ success: false, message: "Operation User not found." });
    }
    await User.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Operation User deleted successfully." });
  } catch (error) {
    console.error("Error deleting operation user:", error.message);
    return res.status(500).json({ success: false, message: "Server error while deleting operation user." });
  }
};

export const updateOperationUserController = async (req, res) => {
  try {
    const { userId, name, company, branch, status } = req.body;
    if (!userId || !name) {
      return res.status(400).json({ success: false, message: "User ID and Name are required" });
    }
    const user = await User.findById(userId);
    if (!user || user.role !== "operation") {
      return res.status(404).json({ success: false, message: "Operation User not found" });
    }
    let photoUrl, photoUrlPublicId;
    if (req.files?.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId);
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }
    const updatedData = {
      name,
      ...(company && { company }),
      ...(branch && { branch }),
      ...(status !== undefined && { status }),
      ...(photoUrl && { photoUrl, photoUrlPublicId }),
    };
    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, { new: true }).select("-password");
    return res.status(200).json({ success: true, message: "Operation User updated successfully", updatedUser });
  } catch (error) {
    console.error("Update Operation User Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error while updating Operation User", error: error.message });
  }
};

// === DRIVER CONTROLLERS ===
export const createDriverController = async (req, res) => {
  try {
    const { name, mobile, password, company, branch, licenseNumber, experienceYears } = req.body;

    if (!name || !mobile || !password || !company || !branch || !licenseNumber || !experienceYears) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User with this mobile already exists.",
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
    let { page, limit, search, company, branch, status } = req.query;
    console.log(req.query)
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = { role: "driver" };
    if (search) query.name = { $regex: search, $options: "i" };
    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (status !== "") query.status = status === "true";

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
      .populate("branch", "name");

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
    const { userId, name, mobile, licenseNumber, experienceYears, company, branch, status } = req.body;

    if (!userId || !name || !mobile) {
      return res.status(400).json({
        success: false,
        message: "User ID, name, and mobile are required",
      });
    }

    const user = await User.findById(userId);
    if (!user || user.role !== "driver") {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    let photoUrl, photoUrlPublicId;

    if (req.files?.profilePhoto) {
      if (user.photoUrlPublicId) {
        await cloudinary.uploader.destroy(user.photoUrlPublicId);
      }
      photoUrl = req.files.profilePhoto[0].path;
      photoUrlPublicId = req.files.profilePhoto[0].filename;
    }

    const updatedData = {
      name,
      mobile,
      licenseNumber,
      experienceYears,
      ...(company && { company }),
      ...(branch && { branch }),
      ...(status !== undefined && { status }),
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

