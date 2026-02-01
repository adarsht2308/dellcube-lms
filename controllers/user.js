import { User } from "../models/user.js";
import { Company } from "../models/company.js";
import { Branch } from "../models/branch.js";
import { generateOTP, sendOTPEmail, sendPasswordResetOTPEmail, sendWelcomeEmail } from "../utils/common/registerOTP.js";
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
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode");
    if (!user) {
      return res.status(404).json({
        message: "Profile not found",
        success: false,
      });
    }

    // Get selected company and branch from token (current session)
    const selectedCompanyId = req.companyId;
    const selectedBranchId = req.branchId;

    // Fetch selected company and branch details if available
    let selectedCompany = null;
    let selectedBranch = null;

    if (selectedCompanyId) {
      selectedCompany = await Company.findById(selectedCompanyId).select("name companyCode");
    }

    if (selectedBranchId) {
      selectedBranch = await Branch.findById(selectedBranchId).select("name branchCode");
    }

    // Return user with selected company/branch for current session
    const userObject = user.toObject();
    userObject.selectedCompany = selectedCompany;
    userObject.selectedBranch = selectedBranch;

    return res.status(200).json({
      success: true,
      user: userObject,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user",
    });
  }
};

// Check available companies/branches for a user (before login)
export const checkUserAssignmentsController = async (req, res) => {
  try {
    const { email, mobile } = req.body;

    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile is required",
      });
    }

    // Find user by email, mobile, or phone (vendors can use phone field)
    let user;
    if (mobile) {
      // Try to find user by mobile first
      user = await User.findOne({ mobile }).select("company branch role");
      // If not found and mobile is provided, also try phone field (for vendors)
      if (!user) {
        user = await User.findOne({ phone: mobile }).select("company branch role");
      }
    } else if (email) {
      user = await User.findOne({ email }).select("company branch role");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all unique companies from company array
    let companyIds = [];
    if (user.company && Array.isArray(user.company) && user.company.length > 0) {
      companyIds = user.company.map(c => {
        if (c && typeof c === 'object' && c._id) {
          return c._id.toString();
        }
        return c.toString ? c.toString() : c;
      });
    } else if (user.company) {
      // Handle legacy single company
      companyIds = [user.company.toString ? user.company.toString() : user.company];
    }

    // Get all unique branches from branch array
    let branchIds = [];
    if (user.branch && Array.isArray(user.branch) && user.branch.length > 0) {
      branchIds = user.branch.map(b => {
        if (b && typeof b === 'object' && b._id) {
          return b._id.toString();
        }
        return b.toString ? b.toString() : b;
      });
      // Remove duplicates
      branchIds = [...new Set(branchIds)];
    } else if (user.branch) {
      // Handle legacy single branch
      branchIds = [user.branch.toString ? user.branch.toString() : user.branch];
    }

    console.log(`[checkUserAssignments] User ${user._id} (${user.role}) - Company IDs:`, companyIds);
    console.log(`[checkUserAssignments] User ${user._id} (${user.role}) - Branch IDs:`, branchIds);

    // Fetch company details
    const companies = await Company.find({ _id: { $in: companyIds } }).select("name companyCode");
    
    // Fetch branch details with company info
    const branches = await Branch.find({ _id: { $in: branchIds } })
      .populate("company", "name companyCode")
      .select("name branchCode company");

    console.log(`[checkUserAssignments] Found ${branches.length} branches for user ${user._id}`);

    // Organize branches by company
    const branchesByCompany = {};
    branches.forEach(branch => {
      // Handle cases where branch might not have company populated
      if (branch.company && branch.company._id) {
        const companyId = branch.company._id.toString();
        if (!branchesByCompany[companyId]) {
          branchesByCompany[companyId] = [];
        }
        // Check for duplicates before adding
        const exists = branchesByCompany[companyId].some(b => b._id.toString() === branch._id.toString());
        if (!exists) {
          branchesByCompany[companyId].push({
            _id: branch._id,
            name: branch.name,
            branchCode: branch.branchCode,
          });
        }
      } else {
        // If branch doesn't have company, try to match it to one of the user's companies
        // This handles edge cases where branch-company relationship might be missing
        console.warn(`Branch ${branch._id} does not have company populated. Attempting to match to user companies.`);
        // Try to match to first company if only one company exists
        if (companyIds.length === 1) {
          const companyId = companyIds[0];
          if (!branchesByCompany[companyId]) {
            branchesByCompany[companyId] = [];
          }
          const exists = branchesByCompany[companyId].some(b => b._id.toString() === branch._id.toString());
          if (!exists) {
            branchesByCompany[companyId].push({
              _id: String(branch._id), // Ensure ID is a string
              name: branch.name,
              branchCode: branch.branchCode,
            });
          }
        }
      }
    });

    // Convert company IDs to strings for consistent frontend lookup
    const branchesByCompanyStringKeys = {};
    Object.keys(branchesByCompany).forEach(companyId => {
      branchesByCompanyStringKeys[String(companyId)] = branchesByCompany[companyId];
    });

    return res.status(200).json({
      success: true,
      data: {
        companies: companies.map(c => ({
          _id: String(c._id), // Ensure ID is a string
          name: c.name,
          companyCode: c.companyCode,
        })),
        branchesByCompany: branchesByCompanyStringKeys,
        hasMultipleCompanies: companies.length > 1,
        hasMultipleBranches: branches.length > 1,
      },
    });
  } catch (error) {
    console.log("Check User Assignments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check user assignments",
    });
  }
};

export const loginController = async (req, res) => {
  try {
    const { email, mobile, password, companyId, branchId } = req.body;

    if ((!email && !mobile) || !password) {
      return res.status(400).json({
        success: false,
        message: "Email or mobile/phone and password are required",
      });
    }

    // Support login with email, mobile, or phone for all roles
    let user;
    if (mobile) {
      // Try to find user by mobile first (for drivers and other roles)
      user = await User.findOne({ mobile });
      // If not found and mobile is provided, also try phone field (for vendors)
      if (!user) {
        user = await User.findOne({ phone: mobile });
      }
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

    // For superAdmin, no company/branch needed
    if (user.role === "superAdmin") {
      return generateToken(res, user, `Welcome back ${user.name}`, null, null);
    }

    // Get available companies and branches from arrays
    let companyIds = [];
    if (user.company && Array.isArray(user.company) && user.company.length > 0) {
      companyIds = user.company.map(c => {
        if (c && typeof c === 'object' && c._id) {
          return c._id.toString();
        }
        return c.toString ? c.toString() : c;
      });
    } else if (user.company) {
      // Handle legacy single company
      companyIds = [user.company.toString ? user.company.toString() : user.company];
    }

    let branchIds = [];
    if (user.branch && Array.isArray(user.branch) && user.branch.length > 0) {
      branchIds = user.branch.map(b => {
        if (b && typeof b === 'object' && b._id) {
          return b._id.toString();
        }
        return b.toString ? b.toString() : b;
      });
    } else if (user.branch) {
      // Handle legacy single branch
      branchIds = [user.branch.toString ? user.branch.toString() : user.branch];
    }

    // Determine selected company and branch
    let selectedCompanyId = null;
    let selectedBranchId = null;

    // If companyId and branchId provided, validate them
    if (companyId && branchId) {
      // Validate selected company belongs to user
      if (!companyIds.includes(companyId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid company selection",
        });
      }

      // Validate selected branch belongs to user
      if (!branchIds.includes(branchId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch selection",
        });
      }

      // Validate branch belongs to selected company
      const branch = await Branch.findById(branchId);
      if (!branch) {
        return res.status(400).json({
          success: false,
          message: "Branch not found",
        });
      }
      
      if (branch.company.toString() !== companyId) {
        return res.status(400).json({
          success: false,
          message: "Branch does not belong to selected company",
        });
      }

      selectedCompanyId = companyId;
      selectedBranchId = branchId;
    } else {
      // No selection provided - use defaults if single assignment
      if (companyIds.length === 1 && branchIds.length === 1) {
        selectedCompanyId = companyIds[0];
        selectedBranchId = branchIds[0];
      } else if (companyIds.length > 1 || branchIds.length > 1) {
        // Multiple assignments require selection
        return res.status(400).json({
          success: false,
          message: "Please select company and branch",
          requiresSelection: true,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Company and branch assignment required",
        });
      }
    }

    return generateToken(res, user, `Welcome back ${user.name}`, selectedCompanyId, selectedBranchId);
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
      company, // Single company (backward compatibility)
      branch, // Single branch (backward compatibility)
      companies, // Array of companies (new)
      branches, // Array of branches (new)
      mobile,
      aadharNumber,
      panNumber,
      bankDetails,
      status,
    } = req.body;

    const parsedBankDetails = parseJSONField(bankDetails, bankDetails);
    
    // Support multiple companies/branches as arrays
    // Handle FormData - company and branch are sent as JSON strings
    let companyIds = [];
    let branchIds = [];
    
    // Parse company - could be JSON string, array, or single value
    // Handle FormData which sends JSON as string
    const companyValue = req.body.company || company;
    if (companyValue) {
      if (typeof companyValue === 'string') {
        // Try to parse as JSON first
        let trimmed = companyValue.trim();
        // Remove outer quotes if present (handles double-encoded strings)
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          trimmed = trimmed.slice(1, -1);
        }
        // Unescape if needed
        if (trimmed.includes('\\"')) {
          trimmed = trimmed.replace(/\\"/g, '"');
        }
        
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            companyIds = Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.error("Failed to parse company JSON:", parseError, "Value:", trimmed);
            // If JSON parse fails, treat as single value
            companyIds = [trimmed];
          }
        } else {
          // Not JSON format, treat as single value
          companyIds = [trimmed];
        }
      } else if (Array.isArray(companyValue)) {
        companyIds = companyValue;
      } else {
        companyIds = [companyValue];
      }
    }
    
    // Parse branch - could be JSON string, array, or single value
    // Handle FormData which sends JSON as string
    const branchValue = req.body.branch || branch;
    if (branchValue) {
      if (typeof branchValue === 'string') {
        // Try to parse as JSON first
        let trimmed = branchValue.trim();
        // Remove outer quotes if present (handles double-encoded strings)
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          trimmed = trimmed.slice(1, -1);
        }
        // Unescape if needed
        if (trimmed.includes('\\"')) {
          trimmed = trimmed.replace(/\\"/g, '"');
        }
        
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            branchIds = Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.error("Failed to parse branch JSON:", parseError, "Value:", trimmed);
            // If JSON parse fails, treat as single value
            branchIds = [trimmed];
          }
        } else {
          // Not JSON format, treat as single value
          branchIds = [trimmed];
        }
      } else if (Array.isArray(branchValue)) {
        branchIds = branchValue;
      } else {
        branchIds = [branchValue];
      }
    }
    
    // Filter out empty values
    companyIds = companyIds.filter(id => id && String(id).trim() !== '');
    branchIds = branchIds.filter(id => id && String(id).trim() !== '');
    
    if (
      !name ||
      !email ||
      !password ||
      companyIds.length === 0 ||
      branchIds.length === 0 ||
      !aadharNumber ||
      !panNumber ||
      !parsedBankDetails
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required including at least one company, one branch, Aadhar, PAN, and Bank details.",
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

    // Validate that we have at least one company and branch
    if (companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one company is required.",
      });
    }
    if (branchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one branch is required.",
      });
    }

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "branchAdmin",
      company: companyIds, // Always set as array
      branch: branchIds,   // Always set as array
      ...(mobile && { mobile }),
      aadharNumber,
      panNumber,
      bankDetails: parsedBankDetails,
      status: normalizedStatus,
      ...(signatureData && { signature: signatureData }),
    });

    // Populate companies and branches arrays
    const populatedUser = await User.findById(newUser._id)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .select("-password");

    // Send welcome email to new user
    try {
      await sendWelcomeEmail(name, email, "branchAdmin");
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail user creation if welcome email fails
    }

    return res.status(201).json({
      success: true,
      message: "Branch Admin created successfully.",
      user: populatedUser,
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
    
    // Use companyId/branchId from token if not provided in query (for non-superAdmin users)
    const finalCompany = company || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranch = branch || (req.user?.role !== "superAdmin" ? req.branchId : null);
    
    // Query for array fields - use $in operator to find users with matching company/branch in their arrays
    if (finalCompany) query.company = { $in: [finalCompany] };
    if (finalBranch) query.branch = { $in: [finalBranch] };
    if (status !== "") query.status = status === "true";
    const branchAdmins = await User.find(query)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
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
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode");

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
      company, // Single company (backward compatibility)
      branch, // Single branch (backward compatibility)
      companies, // Array of companies (new)
      branches, // Array of branches (new)
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

    // Support multiple companies/branches as arrays
    // Handle FormData - company and branch are sent as JSON strings
    let companyIds = [];
    let branchIds = [];
    
    // Helper function to parse JSON string from FormData
    const parseFormDataArray = (value) => {
      if (!value) return [];
      
      // If already an array, return it
      if (Array.isArray(value)) {
        return value;
      }
      
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        let trimmed = value.trim();
        
        // Remove outer quotes if the entire string is quoted (handles double-encoded)
        // e.g., "[\"id1\",\"id2\"]" -> ["id1","id2"]
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) && trimmed.length > 2) {
          const inner = trimmed.slice(1, -1);
          // Check if inner is also a JSON string
          if (inner.startsWith('[') || inner.startsWith('{')) {
            trimmed = inner;
          }
        }
        
        // Unescape escaped quotes
        trimmed = trimmed.replace(/\\"/g, '"').replace(/\\'/g, "'");
        
        // Try to parse as JSON
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.error("Failed to parse JSON:", parseError, "Original value:", value, "Trimmed:", trimmed);
            // If parse fails, return empty array (invalid format)
            return [];
          }
        } else {
          // Single value, return as array
          return [trimmed];
        }
      }
      
      // Single non-string value
      return [value];
    };
    
    // Parse company
    const companyValue = req.body.company || company;
    companyIds = parseFormDataArray(companyValue);
    
    // Parse branch
    const branchValue = req.body.branch || branch;
    branchIds = parseFormDataArray(branchValue);
    
    // Filter out empty values and validate ObjectIds
    companyIds = companyIds
      .map(id => String(id).trim())
      .filter(id => {
        if (!id) return false;
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
          console.error(`Invalid company ObjectId: ${id}`);
          return false;
        }
        return true;
      });
    
    branchIds = branchIds
      .map(id => String(id).trim())
      .filter(id => {
        if (!id) return false;
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
          console.error(`Invalid branch ObjectId: ${id}`);
          return false;
        }
        return true;
      });

    // Validate that we have at least one company and branch
    if (companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid company is required.",
      });
    }
    if (branchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid branch is required.",
      });
    }

    // Always set company and branch as arrays (required for multi-assignment)
    const updatedData = {
      name,
      email,
      company: companyIds, // Always set as array
      branch: branchIds,   // Always set as array
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

    // Update the user
    await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    // Fetch the updated user with populated companies and branches
    const updatedUser = await User.findById(userId)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Branch Admin not found after update",
      });
    }

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
      company, // Single company (backward compatibility)
      branch, // Single branch (backward compatibility)
      companies, // Array of companies (new)
      branches, // Array of branches (new)
      mobile,
      aadharNumber,
      panNumber,
      bankDetails,
      status,
    } = req.body;

    const parsedBankDetails = parseJSONField(bankDetails, bankDetails);
    
    // Support multiple companies/branches as arrays
    // Handle FormData - company and branch are sent as JSON strings
    let companyIds = [];
    let branchIds = [];
    
    // Parse company - could be JSON string, array, or single value
    // Handle FormData which sends JSON as string
    const companyValue = req.body.company || company;
    if (companyValue) {
      if (typeof companyValue === 'string') {
        // Try to parse as JSON first
        let trimmed = companyValue.trim();
        // Remove outer quotes if present (handles double-encoded strings)
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          trimmed = trimmed.slice(1, -1);
        }
        // Unescape if needed
        if (trimmed.includes('\\"')) {
          trimmed = trimmed.replace(/\\"/g, '"');
        }
        
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            companyIds = Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.error("Failed to parse company JSON:", parseError, "Value:", trimmed);
            // If JSON parse fails, treat as single value
            companyIds = [trimmed];
          }
        } else {
          // Not JSON format, treat as single value
          companyIds = [trimmed];
        }
      } else if (Array.isArray(companyValue)) {
        companyIds = companyValue;
      } else {
        companyIds = [companyValue];
      }
    }
    
    // Parse branch - could be JSON string, array, or single value
    // Handle FormData which sends JSON as string
    const branchValue = req.body.branch || branch;
    if (branchValue) {
      if (typeof branchValue === 'string') {
        // Try to parse as JSON first
        let trimmed = branchValue.trim();
        // Remove outer quotes if present (handles double-encoded strings)
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || 
            (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
          trimmed = trimmed.slice(1, -1);
        }
        // Unescape if needed
        if (trimmed.includes('\\"')) {
          trimmed = trimmed.replace(/\\"/g, '"');
        }
        
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            branchIds = Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.error("Failed to parse branch JSON:", parseError, "Value:", trimmed);
            // If JSON parse fails, treat as single value
            branchIds = [trimmed];
          }
        } else {
          // Not JSON format, treat as single value
          branchIds = [trimmed];
        }
      } else if (Array.isArray(branchValue)) {
        branchIds = branchValue;
      } else {
        branchIds = [branchValue];
      }
    }
    
    // Filter out empty values
    companyIds = companyIds.filter(id => id && String(id).trim() !== '');
    branchIds = branchIds.filter(id => id && String(id).trim() !== '');

    if (
      !name ||
      !email ||
      !password ||
      companyIds.length === 0 ||
      branchIds.length === 0 ||
      !aadharNumber ||
      !panNumber ||
      !parsedBankDetails
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required including at least one company, one branch, Aadhar, PAN, and Bank details.",
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
      company: companyIds, // Always set as array
      branch: branchIds,   // Always set as array
      ...(mobile && { mobile }),
      aadharNumber,
      panNumber,
      bankDetails: parsedBankDetails,
      status: normalizedStatus,
      ...(signatureData && { signature: signatureData }),
    });

    // Populate companies and branches arrays
    const populatedUser = await User.findById(newUser._id)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .select("-password");

    // Send welcome email to new user
    try {
      await sendWelcomeEmail(name, email, "operation");
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail user creation if welcome email fails
    }

    return res.status(201).json({
      success: true,
      message: "Operation User created successfully.",
      user: populatedUser,
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
    
    // Use companyId/branchId from token if not provided in query (for non-superAdmin users)
    const finalCompany = company || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranch = branch || (req.user?.role !== "superAdmin" ? req.branchId : null);
    
    // Query for array fields - use $in operator to find users with matching company/branch in their arrays
    if (finalCompany) query.company = { $in: [finalCompany] };
    if (finalBranch) query.branch = { $in: [finalBranch] };
    if (status !== "") query.status = status === "true";

    const operationUsers = await User.find(query)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
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
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode");
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
      company, // Single company (backward compatibility)
      branch, // Single branch (backward compatibility)
      companies, // Array of companies (new)
      branches, // Array of branches (new)
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

    // Support multiple companies/branches as arrays
    // Handle FormData - company and branch are sent as JSON strings
    let companyIds = [];
    let branchIds = [];
    
    // Helper function to parse JSON string from FormData
    const parseFormDataArray = (value) => {
      if (!value) return [];
      
      // If already an array, return it
      if (Array.isArray(value)) {
        return value;
      }
      
      // If it's a string, try to parse it
      if (typeof value === 'string') {
        let trimmed = value.trim();
        
        // Remove outer quotes if the entire string is quoted (handles double-encoded)
        // e.g., "[\"id1\",\"id2\"]" -> ["id1","id2"]
        if ((trimmed.startsWith('"') && trimmed.endsWith('"')) && trimmed.length > 2) {
          const inner = trimmed.slice(1, -1);
          // Check if inner is also a JSON string
          if (inner.startsWith('[') || inner.startsWith('{')) {
            trimmed = inner;
          }
        }
        
        // Unescape escaped quotes
        trimmed = trimmed.replace(/\\"/g, '"').replace(/\\'/g, "'");
        
        // Try to parse as JSON
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.error("Failed to parse JSON:", parseError, "Original value:", value, "Trimmed:", trimmed);
            // If parse fails, return empty array (invalid format)
            return [];
          }
        } else {
          // Single value, return as array
          return [trimmed];
        }
      }
      
      // Single non-string value
      return [value];
    };
    
    // Parse company
    const companyValue = req.body.company || company;
    companyIds = parseFormDataArray(companyValue);
    
    // Parse branch
    const branchValue = req.body.branch || branch;
    branchIds = parseFormDataArray(branchValue);
    
    // Filter out empty values and validate ObjectIds
    companyIds = companyIds
      .map(id => String(id).trim())
      .filter(id => {
        if (!id) return false;
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
          console.error(`Invalid company ObjectId: ${id}`);
          return false;
        }
        return true;
      });
    
    branchIds = branchIds
      .map(id => String(id).trim())
      .filter(id => {
        if (!id) return false;
        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(id)) {
          console.error(`Invalid branch ObjectId: ${id}`);
          return false;
        }
        return true;
      });

    // Validate that we have at least one company and branch
    if (companyIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid company is required.",
      });
    }
    if (branchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one valid branch is required.",
      });
    }

    // Always set company and branch as arrays (required for multi-assignment)
    const updatedData = {
      name,
      ...(email && { email }),
      company: companyIds, // Always set as array
      branch: branchIds,   // Always set as array
      ...(normalizedStatus !== undefined && { status: normalizedStatus }),
      ...(mobile && { mobile }),
      ...(aadharNumber && { aadharNumber }),
      ...(panNumber && { panNumber }),
      ...(parsedBankDetails && { bankDetails: parsedBankDetails }),
      ...(photoUrl && { photoUrl, photoUrlPublicId }),
      ...(signaturePayload && { signature: signaturePayload }),
    };

    // Update the user
    await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });

    // Fetch the updated user with populated companies and branches
    const updatedUser = await User.findById(userId)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
      .select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Operation User not found after update",
      });
    }

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
      company, // Single company (backward compatibility)
      branch, // Single branch (backward compatibility)
      companies, // Array of companies (new)
      branches, // Array of branches (new)
      licenseNumber,
      experienceYears,
      driverType,
      vendor,
      aadharNumber,
      panNumber,
      bankDetails,
    } = req.body;

    // Support both single and multiple companies/branches
    let companyIds = [];
    let branchIds = [];
    
    if (companies && Array.isArray(companies) && companies.length > 0) {
      companyIds = companies;
    } else if (company) {
      companyIds = [company];
    }
    
    if (branches && Array.isArray(branches) && branches.length > 0) {
      branchIds = branches;
    } else if (branch) {
      branchIds = [branch];
    }

    if (
      !name ||
      !mobile ||
      !password ||
      companyIds.length === 0 ||
      branchIds.length === 0 ||
      !licenseNumber ||
      !experienceYears ||
      !driverType
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields are required including at least one company and branch.",
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

    // Aadhar and PAN validation (required only for dellcube drivers)
    if (driverType === "dellcube") {
      if (!aadharNumber || !aadharNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: "Aadhar Card Number is required for company drivers.",
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
          message: "PAN Card Number is required for company drivers.",
        });
      }

      if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        return res.status(400).json({
          success: false,
          message: "PAN Card Number must be in valid format (e.g., ABCDE1234F).",
        });
      }

      // Check for existing users with same Aadhar or PAN (only for dellcube drivers)
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
    } else {
      // For vendor and temporary drivers, Aadhar and PAN are optional
      // But if provided, validate format and check for duplicates
      if (aadharNumber && aadharNumber.trim()) {
        if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
          return res.status(400).json({
            success: false,
            message: "Aadhar Card Number must be exactly 12 digits.",
          });
        }
        const existingAadhar = await User.findOne({ aadharNumber });
        if (existingAadhar) {
          return res.status(400).json({
            success: false,
            message: "User with this Aadhar number already exists.",
          });
        }
      }

      if (panNumber && panNumber.trim()) {
        if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
          return res.status(400).json({
            success: false,
            message: "PAN Card Number must be in valid format (e.g., ABCDE1234F).",
          });
        }
        const existingPAN = await User.findOne({ panNumber });
        if (existingPAN) {
          return res.status(400).json({
            success: false,
            message: "User with this PAN number already exists.",
          });
        }
      }
    }

    // Bank Details validation (required only for dellcube drivers)
    if (driverType === "dellcube") {
      if (!bankDetails) {
        return res.status(400).json({
          success: false,
          message: "Bank details are required for company drivers.",
        });
      }

      const { accountHolderName, bankName, accountNumber, ifscCode } = bankDetails;

      if (!accountHolderName || !accountHolderName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Account Holder Name is required for company drivers.",
        });
      }

      if (!bankName || !bankName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Bank Name is required for company drivers.",
        });
      }

      if (!accountNumber || !accountNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: "Account Number is required for company drivers.",
        });
      }

      if (!ifscCode || !ifscCode.trim()) {
        return res.status(400).json({
          success: false,
          message: "IFSC Code is required for company drivers.",
        });
      }

      if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        return res.status(400).json({
          success: false,
          message: "IFSC Code must be in valid format (e.g., ABCD0123456).",
        });
      }
    } else {
      // For vendor and temporary drivers, bank details are optional
      // But if provided, validate format
      if (bankDetails) {
        const { accountHolderName, bankName, accountNumber, ifscCode } = bankDetails;

        if (ifscCode && ifscCode.trim()) {
          if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
            return res.status(400).json({
              success: false,
              message: "IFSC Code must be in valid format (e.g., ABCD0123456).",
            });
          }
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // For backward compatibility, set single company/branch if only one
    const singleCompany = companyIds.length === 1 ? companyIds[0] : null;
    const singleBranch = branchIds.length === 1 ? branchIds[0] : null;

    const newDriver = await User.create({
      name,
      mobile,
      password: hashedPassword,
      role: "driver",
      ...(singleCompany && { company: singleCompany }),
      ...(singleBranch && { branch: singleBranch }),
      companies: companyIds,
      branches: branchIds,
      licenseNumber,
      experienceYears,
      driverType,
      ...(driverType === "vendor" && vendor && { vendor }),
      ...(aadharNumber && aadharNumber.trim() && { aadharNumber }),
      ...(panNumber && panNumber.trim() && { panNumber }),
      ...(bankDetails && { bankDetails }),
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
    
    // Use companyId/branchId from token if not provided in query (for non-superAdmin users)
    const finalCompany = company || (req.user?.role !== "superAdmin" ? req.companyId : null);
    const finalBranch = branch || (req.user?.role !== "superAdmin" ? req.branchId : null);
    
    // Query for array fields - use $in operator to find users with matching company/branch in their arrays
    if (finalCompany) query.company = { $in: [finalCompany] };
    if (finalBranch) query.branch = { $in: [finalBranch] };
    if (status !== "") query.status = status === "true";
    if (driverType) query.driverType = driverType;

    const drivers = await User.find(query)
      .populate("company", "name companyCode")
      .populate("branch", "name branchCode")
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
      company, // Single company (backward compatibility)
      branch, // Single branch (backward compatibility)
      companies, // Array of companies (new)
      branches, // Array of branches (new)
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

    // Aadhar and PAN validation (required only for dellcube drivers)
    // Note: effectiveDriverType was already declared earlier in the function
    if (effectiveDriverType === "dellcube") {
      if (!aadharNumber || !aadharNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: "Aadhar Card Number is required for company drivers.",
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
          message: "PAN Card Number is required for company drivers.",
        });
      }

      if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        return res.status(400).json({
          success: false,
          message: "PAN Card Number must be in valid format (e.g., ABCDE1234F).",
        });
      }
    } else {
      // For vendor and temporary drivers, Aadhar and PAN are optional
      // But if provided, validate format
      if (aadharNumber && aadharNumber.trim()) {
        if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
          return res.status(400).json({
            success: false,
            message: "Aadhar Card Number must be exactly 12 digits.",
          });
        }
      }

      if (panNumber && panNumber.trim()) {
        if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
          return res.status(400).json({
            success: false,
            message: "PAN Card Number must be in valid format (e.g., ABCDE1234F).",
          });
        }
      }
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

    // Bank Details validation (required only for dellcube drivers)
    if (effectiveDriverType === "dellcube") {
      if (!parsedBankDetails) {
        return res.status(400).json({
          success: false,
          message: "Bank details are required for company drivers.",
        });
      }

      const { accountHolderName, bankName, accountNumber, ifscCode } = parsedBankDetails;

      if (!accountHolderName || !accountHolderName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Account Holder Name is required for company drivers.",
        });
      }

      if (!bankName || !bankName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Bank Name is required for company drivers.",
        });
      }

      if (!accountNumber || !accountNumber.trim()) {
        return res.status(400).json({
          success: false,
          message: "Account Number is required for company drivers.",
        });
      }

      if (!ifscCode || !ifscCode.trim()) {
        return res.status(400).json({
          success: false,
          message: "IFSC Code is required for company drivers.",
        });
      }

      if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        return res.status(400).json({
          success: false,
          message: "IFSC Code must be in valid format (e.g., ABCD0123456).",
        });
      }
    } else {
      // For vendor and temporary drivers, bank details are optional
      // But if provided, validate format
      if (parsedBankDetails) {
        const { ifscCode } = parsedBankDetails;
        if (ifscCode && ifscCode.trim()) {
          if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
            return res.status(400).json({
              success: false,
              message: "IFSC Code must be in valid format (e.g., ABCD0123456).",
            });
          }
        }
      }
    }

    // Determine effective driver type for vendor field handling
    const effectiveDriverTypeForUpdate = driverType || user.driverType;

    // Support both single and multiple companies/branches
    let companyIds = [];
    let branchIds = [];
    
    if (companies && Array.isArray(companies) && companies.length > 0) {
      companyIds = companies;
    } else if (company) {
      companyIds = [company];
    }
    
    if (branches && Array.isArray(branches) && branches.length > 0) {
      branchIds = branches;
    } else if (branch) {
      branchIds = [branch];
    }

    // For backward compatibility, set single company/branch if only one
    const singleCompany = companyIds.length === 1 ? companyIds[0] : (companyIds.length > 0 ? null : company);
    const singleBranch = branchIds.length === 1 ? branchIds[0] : (branchIds.length > 0 ? null : branch);

    const updatedData = {
      name,
      mobile,
      licenseNumber,
      experienceYears,
      ...(singleCompany && { company: singleCompany }),
      ...(singleBranch && { branch: singleBranch }),
      ...(companyIds.length > 0 && { companies: companyIds }),
      ...(branchIds.length > 0 && { branches: branchIds }),
      ...(status !== undefined && { status }),
      ...(driverType && { driverType }),
      // Handle vendor field: set if driverType is vendor, clear if not
      ...(effectiveDriverTypeForUpdate === "vendor" && vendor
        ? { vendor }
        : effectiveDriverTypeForUpdate !== "vendor"
        ? { vendor: null }
        : {}),
      ...(aadharNumber && aadharNumber.trim() && { aadharNumber }),
      ...(panNumber && panNumber.trim() && { panNumber }),
      ...(parsedBankDetails && { bankDetails: parsedBankDetails }),
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
    // Aadhar, PAN, and bank details are only required for dellcube drivers
    const requiredFields = [
      'name', 'mobile', 'password', 'licenseNumber', 'experienceYears', 'driverType'
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

        // Aadhar and PAN validation (required only for dellcube drivers)
        if (driverType === "dellcube") {
          if (!aadharNumber || aadharNumber.trim().length === 0) {
            results.errors.push({
              row: rowNumber,
              name,
              error: "Aadhar number is required for company drivers",
            });
            results.errorCount++;
            continue;
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

          if (!panNumber || panNumber.trim().length === 0) {
            results.errors.push({
              row: rowNumber,
              name,
              error: "PAN number is required for company drivers",
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
        } else {
          // For vendor and temporary drivers, Aadhar and PAN are optional
          // But if provided, validate format
          if (aadharNumber && aadharNumber.trim()) {
            if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
              results.errors.push({
                row: rowNumber,
                name,
                error: "Aadhar number must be exactly 12 digits",
              });
              results.errorCount++;
              continue;
            }
          }

          if (panNumber && panNumber.trim()) {
            if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
              results.errors.push({
                row: rowNumber,
                name,
                error: "PAN number must be in format ABCDE1234F",
              });
              results.errorCount++;
              continue;
            }
          }
        }

        // Bank Details validation (required only for dellcube drivers)
        if (driverType === "dellcube") {
          if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
            results.errors.push({
              row: rowNumber,
              name,
              error: "All bank details are required for company drivers",
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
        } else {
          // For vendor and temporary drivers, bank details are optional
          // But if provided, validate IFSC format
          if (ifscCode && ifscCode.trim()) {
            if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
              results.errors.push({
                row: rowNumber,
                name,
                error: "IFSC code must be in format ABCD0123456",
              });
              results.errorCount++;
              continue;
            }
          }
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

        // Check for duplicate Aadhar only if provided
        if (aadharNumber && aadharNumber.trim()) {
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
        }

        // Check for duplicate PAN only if provided
        if (panNumber && panNumber.trim()) {
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
          ...(aadharNumber && aadharNumber.trim() && { aadharNumber }),
          ...(panNumber && panNumber.trim() && { panNumber }),
          ...(accountHolderName && bankName && accountNumber && ifscCode && {
            bankDetails: {
              accountHolderName,
              bankName,
              accountNumber,
              ifscCode,
            }
          }),
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
