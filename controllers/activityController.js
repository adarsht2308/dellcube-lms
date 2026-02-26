import Activity from "../models/activity.js";
import jwt from "jsonwebtoken";

/**
 * Get all activities with filters and pagination
 * @route GET /api/v1/activity
 * @access SuperAdmin, BranchAdmin
 */
export const getAllActivities = async (req, res) => {
  try {
    // Extract user info from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);
    const userRole = decoded.role;
    const userBranchId = decoded.branchId;
    const userCompanyId = decoded.companyId;

    // Build query based on user role
    let query = {};

    // Branch Admin can only see their branch activities
    if (userRole === "branchAdmin") {
      query.branch = userBranchId;
    }
    
    // SuperAdmin can see all or filter by company/branch
    // Apply filters from request
    const {
      company,
      branch,
      user,
      action,
      entity,
      startDate,
      endDate,
      search,
      success,
    } = req.query;

    if (company) query.company = company;
    if (branch) query.branch = branch;
    if (user) query.user = user;
    if (action) query.action = action;
    if (entity) query.entity = entity;
    if (success !== undefined) query.success = success === "true";

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add one day to include the entire end date
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // Search filter (searches in description, userName, userEmail, entity)
    if (search) {
      query.$or = [
        { description: { $regex: search, $options: "i" } },
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
        { entity: { $regex: search, $options: "i" } },
        { endpoint: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Sort order (default: newest first)
    const sortBy = req.query.sortBy || "createdAt";
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Execute query with pagination
    const [rawActivities, totalCount] = await Promise.all([
      Activity.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate("user", "name email role")
        .populate("company", "name")
        .populate("branch", "name")
        .lean(),
      Activity.countDocuments(query),
    ]);

    // Normalize company/branch names so frontend always has them
    const activities = rawActivities.map((activity) => ({
      ...activity,
      companyName:
        activity.companyName ||
        (activity.company && activity.company.name) ||
        null,
      branchName:
        activity.branchName ||
        (activity.branch && activity.branch.name) ||
        null,
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return res.status(200).json({
      success: true,
      data: activities,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activities",
    });
  }
};

/**
 * Get activity statistics
 * @route GET /api/v1/activity/stats
 * @access SuperAdmin, BranchAdmin
 */
export const getActivityStats = async (req, res) => {
  try {
    // Extract user info from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);
    const userRole = decoded.role;
    const userBranchId = decoded.branchId;

    // Build query based on user role
    let query = {};
    if (userRole === "branchAdmin") {
      query.branch = userBranchId;
    }

    // Apply filters from request
    const { company, branch, startDate, endDate } = req.query;
    if (company) query.company = company;
    if (branch) query.branch = branch;

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const endDateObj = new Date(endDate);
        endDateObj.setHours(23, 59, 59, 999);
        query.createdAt.$lte = endDateObj;
      }
    }

    // Get statistics
    const [
      totalActivities,
      actionStats,
      entityStats,
      recentActivities,
      successRate,
    ] = await Promise.all([
      Activity.countDocuments(query),
      Activity.aggregate([
        { $match: query },
        { $group: { _id: "$action", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Activity.aggregate([
        { $match: query },
        { $group: { _id: "$entity", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      Activity.find(query)
        .sort({ createdAt: -1 })
        .limit(5)
        .select("description createdAt success")
        .lean(),
      Activity.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: ["$success", 1, 0] },
            },
          },
        },
      ]),
    ]);

    // Calculate success percentage
    const successPercentage = successRate.length > 0
      ? ((successRate[0].successful / successRate[0].total) * 100).toFixed(2)
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalActivities,
        actionStats,
        entityStats,
        recentActivities,
        successRate: {
          total: successRate[0]?.total || 0,
          successful: successRate[0]?.successful || 0,
          percentage: successPercentage,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching activity stats:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity statistics",
    });
  }
};

/**
 * Get single activity by ID
 * @route GET /api/v1/activity/:id
 * @access SuperAdmin, BranchAdmin
 */
export const getActivityById = async (req, res) => {
  try {
    const { id } = req.params;

    const activity = await Activity.findById(id)
      .populate("user", "name email role phone")
      .populate("company", "name")
      .populate("branch", "name");

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: "Activity not found",
      });
    }

    // Extract user info from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(token, process.env.SECRETKEY);
      const userRole = decoded.role;
      const userBranchId = decoded.branchId;

      // Branch Admin can only see their branch activities
      if (userRole === "branchAdmin" && activity.branch?.toString() !== userBranchId) {
        return res.status(403).json({
          success: false,
          message: "You don't have permission to view this activity",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: activity,
    });
  } catch (error) {
    console.error("Error fetching activity:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch activity",
    });
  }
};

/**
 * Delete old activities (cleanup)
 * @route DELETE /api/v1/activity/cleanup
 * @access SuperAdmin only
 */
export const cleanupOldActivities = async (req, res) => {
  try {
    // Extract user info from token
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.SECRETKEY);
    if (decoded.role !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Only SuperAdmin can perform cleanup",
      });
    }

    // Delete activities older than specified days (default: 90 days)
    const daysToKeep = parseInt(req.query.days) || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await Activity.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    return res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} activities older than ${daysToKeep} days`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error cleaning up activities:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to cleanup activities",
    });
  }
};
