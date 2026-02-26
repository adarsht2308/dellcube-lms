import Activity from "../models/activity.js";
import jwt from "jsonwebtoken";

/**
 * Middleware to log activities for POST, PUT, DELETE, PATCH operations
 * Automatically extracts user info from JWT token and logs the activity
 */
export const activityLogger = (options = {}) => {
  return async (req, res, next) => {
    // Only log non-GET operations
    const methodsToLog = ["POST", "PUT", "DELETE", "PATCH"];
    if (!methodsToLog.includes(req.method)) {
      return next();
    }

    // Skip if explicitly disabled for this route
    if (options.skip) {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    // Capture response data
    let responseData = null;
    let responseStatus = res.statusCode;

    res.json = function (data) {
      responseData = data;
      responseStatus = res.statusCode;
      return originalJson(data);
    };

    res.send = function (data) {
      responseData = data;
      responseStatus = res.statusCode;
      return originalSend(data);
    };

    // Wait for response to complete
    res.on("finish", async () => {
      try {
        // Extract user info from token
        // Prefer Authorization header, fall back to auth cookie
        const headerToken = req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.replace("Bearer ", "")
          : null;
        const cookieToken = req.cookies?.token;
        const token = headerToken || cookieToken;

        if (!token) {
          // No token (e.g., unauthenticated route) – skip logging
          return;
        }

        let decoded;
        try {
          decoded = jwt.verify(token, process.env.SECRETKEY);
        } catch (error) {
          console.error("[ActivityLogger] Failed to decode token:", error);
          return;
        }

        // Determine action based on method
        let action = "other";
        if (req.method === "POST") action = "create";
        else if (req.method === "PUT" || req.method === "PATCH") action = "update";
        else if (req.method === "DELETE") action = "delete";

        // Extract entity from URL
        const entity = extractEntityFromUrl(req.originalUrl || req.url);

        // Generate description
        const description = generateDescription(action, entity, req, responseData);

        // Extract IP address
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"];

        // Extract user agent
        const userAgent = req.headers["user-agent"];

        // Determine success based on status code
        const success = responseStatus >= 200 && responseStatus < 400;

        // Create activity log
        const activityData = {
          user: decoded._id || decoded.userId || decoded.id,
          userName: decoded.name || req.user?.name || "Unknown User",
          userEmail: decoded.email || req.user?.email,
          userRole: decoded.role,
          company: decoded.companyId || req.companyId || null,
          companyName: decoded.companyName,
          branch: decoded.branchId || req.branchId || null,
          branchName: decoded.branchName,
          action,
          actionType: req.method,
          entity,
          entityId: extractEntityId(req, responseData),
          method: req.method,
          endpoint: req.originalUrl || req.url,
          description,
          ipAddress,
          userAgent,
          responseStatus,
          success,
          errorMessage: !success && responseData?.message ? responseData.message : undefined,
          // Store minimal request data (excluding sensitive info)
          requestData: sanitizeRequestData(req.body, entity),
        };

        await Activity.create(activityData);
      } catch (error) {
        // Don't fail the request if logging fails
        console.error("[ActivityLogger] Failed to log activity:", error);
      }
    });

    next();
  };
};

/**
 * Extract entity name from URL
 * e.g., /api/v1/invoice/create -> invoice
 */
function extractEntityFromUrl(url) {
  // Remove query parameters
  const path = url.split("?")[0];
  
  // Common patterns
  const patterns = [
    /\/invoice/i,
    /\/vehicle/i,
    /\/driver/i,
    /\/vendor/i,
    /\/customer/i,
    /\/company/i,
    /\/branch/i,
    /\/user/i,
    /\/goods/i,
    /\/tracking/i,
  ];

  for (const pattern of patterns) {
    if (pattern.test(path)) {
      const match = path.match(pattern);
      return match[0].replace("/", "").toLowerCase();
    }
  }

  // Fallback: extract from path segments
  const segments = path.split("/").filter(Boolean);
  if (segments.length >= 2) {
    return segments[segments.length - 2] || "unknown";
  }

  return "unknown";
}

/**
 * Extract entity ID from request or response
 */
function extractEntityId(req, responseData) {
  // Try to get from request params
  if (req.params?.id) return req.params.id;
  
  // Try to get from request body
  if (req.body?._id) return req.body._id;
  if (req.body?.id) return req.body.id;
  
  // Try to get from response
  if (responseData?.data?._id) return responseData.data._id;
  if (responseData?.data?.id) return responseData.data.id;
  if (responseData?._id) return responseData._id;
  if (responseData?.id) return responseData.id;
  
  return null;
}

/**
 * Generate human-readable description
 */
function generateDescription(action, entity, req, responseData) {
  const userName = req.user?.name || "User";
  const entityName = entity.charAt(0).toUpperCase() + entity.slice(1);
  
  let description = "";
  
  switch (action) {
    case "create":
      description = `${userName} created a new ${entityName}`;
      if (req.body?.name) description += `: ${req.body.name}`;
      else if (req.body?.vehicleNumber) description += `: ${req.body.vehicleNumber}`;
      else if (req.body?.invoiceNumber) description += `: ${req.body.invoiceNumber}`;
      break;
      
    case "update":
      description = `${userName} updated ${entityName}`;
      if (req.body?.name) description += `: ${req.body.name}`;
      else if (req.body?.vehicleNumber) description += `: ${req.body.vehicleNumber}`;
      else if (req.body?.invoiceNumber) description += `: ${req.body.invoiceNumber}`;
      break;
      
    case "delete":
      description = `${userName} deleted ${entityName}`;
      if (req.params?.id) description += ` (ID: ${req.params.id})`;
      break;
      
    default:
      description = `${userName} performed ${action} on ${entityName}`;
  }
  
  return description;
}

/**
 * Sanitize request data - remove sensitive information
 */
function sanitizeRequestData(body, entity) {
  if (!body || typeof body !== "object") return null;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = [
    "password",
    "confirmPassword",
    "token",
    "accessToken",
    "refreshToken",
    "secret",
    "apiKey",
    "privateKey",
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });
  
  // Limit size of data stored (max 1000 chars when stringified)
  const stringified = JSON.stringify(sanitized);
  if (stringified.length > 1000) {
    return {
      _truncated: true,
      _size: stringified.length,
      _preview: stringified.substring(0, 500) + "...",
    };
  }
  
  return sanitized;
}

export default activityLogger;
