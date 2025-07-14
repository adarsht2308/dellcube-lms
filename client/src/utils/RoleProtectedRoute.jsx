import React from "react";
import { Navigate } from "react-router-dom";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

const RoleProtectedRoute = ({ children, allowedRoles }) => {
  // const token = Cookies.get("token");
  const token = localStorage.getItem("token");
  // console.log(token);
  if (!token) return <Navigate to="/" replace />;

  try {
    const decoded = jwtDecode(token);
    // console.log(decoded)
    const userRole = decoded?.role;

    if (allowedRoles.includes(userRole)) {
      return children;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  } catch (err) {
    return <Navigate to="/" replace />;
  }
};

export default RoleProtectedRoute;
