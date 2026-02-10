import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    // User who performed the action
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
    },
    userRole: {
      type: String,
      enum: ["superAdmin", "branchAdmin", "operation", "driver", "vendor"],
      required: true,
    },
    
    // Company and Branch context
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    companyName: {
      type: String,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    branchName: {
      type: String,
    },
    
    // Activity details
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "create",
        "update",
        "delete",
        "approve",
        "reject",
        "upload",
        "download",
        "export",
        "import",
        "other"
      ],
    },
    actionType: {
      type: String,
      required: true, // e.g., "POST", "PUT", "DELETE", "PATCH"
    },
    entity: {
      type: String,
      required: true, // e.g., "invoice", "vehicle", "driver", "vendor", "customer"
    },
    entityId: {
      type: String, // ID of the affected entity (if applicable)
    },
    
    // Request details
    method: {
      type: String,
      required: true, // HTTP method: POST, PUT, DELETE, PATCH
    },
    endpoint: {
      type: String,
      required: true, // API endpoint
    },
    
    // Description
    description: {
      type: String,
      required: true,
    },
    
    // Additional metadata
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    
    // Request/Response data (optional, for debugging)
    requestData: {
      type: mongoose.Schema.Types.Mixed,
    },
    responseStatus: {
      type: Number,
    },
    
    // Success/Failure
    success: {
      type: Boolean,
      default: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Indexes for efficient querying
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ company: 1, createdAt: -1 });
activitySchema.index({ branch: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ entity: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 }); // For sorting by date

const Activity = mongoose.model("Activity", activitySchema);

export default Activity;
