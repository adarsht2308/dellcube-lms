import jwt from "jsonwebtoken";
import Activity from "../../models/activity.js";
import { Company } from "../../models/company.js";
import { Branch } from "../../models/branch.js";

export const generateToken = async (res, user, message, companyId = null, branchId = null) => {
  const tokenPayload = {
    userId: user._id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  // Include selected company and branch in token if provided
  if (companyId) {
    tokenPayload.companyId = companyId;
  }
  if (branchId) {
    tokenPayload.branchId = branchId;
  }

  const token = jwt.sign(
    tokenPayload,
    process.env.SECRETKEY,
    {
      expiresIn: "1d",
    }
  );

  // Log login activity
  try {
    let companyName = null;
    let branchName = null;

    if (companyId) {
      const company = await Company.findById(companyId).select("name");
      companyName = company?.name;
      tokenPayload.companyName = companyName;
    }

    if (branchId) {
      const branch = await Branch.findById(branchId).select("name");
      branchName = branch?.name;
      tokenPayload.branchName = branchName;
    }

    await Activity.create({
      user: user._id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      company: companyId || null,
      companyName: companyName,
      branch: branchId || null,
      branchName: branchName,
      action: "login",
      actionType: "POST",
      entity: "auth",
      method: "POST",
      endpoint: "/api/user/login",
      description: `${user.name} logged in successfully`,
      ipAddress: res.req?.ip || res.req?.connection?.remoteAddress || null,
      userAgent: res.req?.headers?.["user-agent"] || null,
      responseStatus: 200,
      success: true,
    });
  } catch (error) {
    console.error("[Login Activity Log] Failed to log login activity:", error);
    // Don't fail the login if activity logging fails
  }

  return res
    .status(200)
    .cookie("token", token, {
      httpOnly: true,
      // httpOnly: false,
      sameSite: "None",
      maxAge: 24 * 60 * 60 * 1000,
      secure:true
      // secure: false
    })
    .json({
      success: true,
      message,
      user: {
        ...user.toObject(),
        selectedCompany: companyId,
        selectedBranch: branchId,
      },
      token,
    });
};
