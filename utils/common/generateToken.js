import jwt from "jsonwebtoken";

export const generateToken = (res, user, message, companyId = null, branchId = null) => {
  const tokenPayload = {
    userId: user._id,
    role: user.role,
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
