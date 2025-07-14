
export const isSuperAdmin = (req, res, next) => {
  if (req.user?.role !== "superAdmin") {
    console.log(req.user)
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};
