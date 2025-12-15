import { jwtDecode } from "jwt-decode";

/**
 * Get companyId and branchId from the JWT token stored in localStorage
 * @returns {Object} { companyId, branchId } or { companyId: null, branchId: null } if not found
 */
export const getTokenData = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { companyId: null, branchId: null };
    }

    const decoded = jwtDecode(token);
    return {
      companyId: decoded.companyId || null,
      branchId: decoded.branchId || null,
    };
  } catch (error) {
    console.error("Error decoding token:", error);
    return { companyId: null, branchId: null };
  }
};

