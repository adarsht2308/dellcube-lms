import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
 const token = req.cookies.token;
     if (!token) {
      return res.status(401).json({
        message: "No token provided",
        success: false,
      });
    }

    if (!process.env.SECRETKEY) {
      return res.status(500).json({
        message: "Server misconfiguration: SECRETKEY not set",
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRETKEY);
    req.id = decode.userId;
    req.user = decode;
    // Extract companyId and branchId from token for use in controllers
    req.companyId = decode.companyId || null;
    req.branchId = decode.branchId || null;
    next();
  } catch (error) {
    console.log("JWT Verify Error:", error.message);
    return res.status(401).json({
      message: "Authentication failed",
      success: false,
      error: error.message,
    });
  }
};

export default isAuthenticated;
