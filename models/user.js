import mongoose from "mongoose";

const user = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      sparse: true,
      required: function () {
        return this.role !== "driver";
      },
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["superAdmin", "branchAdmin", "operation", "driver", "vendor"],
      default: "superAdmin",
    },
    // Support multiple companies and branches (arrays)
    company: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
      }],
      default: [],
      required: function () {
        // Check if company exists and is an array before checking length
        // During updates, company might be undefined if not provided
        if (this.role === "superAdmin") return false;
        if (!this.company || !Array.isArray(this.company)) return false;
        return this.company.length === 0;
      },
    },
    branch: {
      type: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      }],
      default: [],
      required: function () {
        // Check if branch exists and is an array before checking length
        // During updates, branch might be undefined if not provided
        if (this.role === "superAdmin") return false;
        if (!this.branch || !Array.isArray(this.branch)) return false;
        return this.branch.length === 0;
      },
    },
    mobile: {
      type: String,
      required: function () {
        return this.role === "driver";
      },
      unique: true,
      sparse: true,
    },
    // Vendor contact phone (separate from driver mobile rules)
    phone: {
      type: String,
      required: function () {
        return this.role === "vendor";
      },
      trim: true,
      sparse: true,
    },
    licenseNumber: {
      type: String,
      required: function () {
        return this.role === "driver";
      },
      unique: true,
      sparse: true,
    },
    experienceYears: {
      type: Number,
      required: function () {
        return this.role === "driver";
      },
    },
    driverType: {
      type: String,
      enum: ["dellcube", "vendor", "temporary"],
      required: function () {
        return this.role === "driver";
      },
      default: "dellcube",
    },
    // Vendor reference for drivers with driverType "vendor"
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.role === "driver" && this.driverType === "vendor";
      },
    },

    // Vendor specific fields
    address: {
      type: String,
      trim: true,
      default: "",
    },
    gstNumber: {
      type: String,
      trim: true,
      default: "",
    },
    panNumber: {
      type: String,
      trim: true,
      default: "",
    },
    bankName: {
      type: String,
      trim: true,
      default: "",
    },
    accountNumber: {
      type: String,
      trim: true,
      default: "",
    },
    ifsc: {
      type: String,
      trim: true,
      default: "",
    },
    vendorStatus: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    // Assign multiple clients to vendor (optional during creation)
    assignedClients: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Customers",
      default: [],
    },
    // Vendor owned vehicles (embedded, mirroring previous Vendor model)
    availableVehicles: [
      {
        vehicleNumber: { type: String, required: true, trim: true },
        type: {
          type: String,
          required: true,
          enum: ["7ft", "10ft", "14ft", "18ft", "24ft", "32ft"],
        },
        brand: { type: String, trim: true },
        model: { type: String, trim: true },
        yearOfManufacture: { type: Number },
        registrationDate: { type: Date },
        fitnessCertificateExpiry: { type: Date },
        insuranceExpiry: { type: Date },
        pollutionCertificateExpiry: { type: Date },
        vehicleInsuranceNo: { type: String, trim: true },
        fitnessNo: { type: String, trim: true },
        status: {
          type: String,
          enum: ["active", "under_maintenance", "inactive", "decommissioned"],
          default: "active",
        },
        fitnessCertificateImage: {
          url: { type: String, default: "" },
          public_id: { type: String, default: "" },
        },
        pollutionCertificateImage: {
          url: { type: String, default: "" },
          public_id: { type: String, default: "" },
        },
        registrationCertificateImage: {
          url: { type: String, default: "" },
          public_id: { type: String, default: "" },
        },
        insuranceImage: {
          url: { type: String, default: "" },
          public_id: { type: String, default: "" },
        },
        maintenanceHistory: [
          {
            serviceDate: Date,
            serviceType: String,
            cost: Number,
            description: String,
            servicedBy: { type: String, trim: true },
            files: [String],
            billImage: {
              url: { type: String, default: "" },
              public_id: { type: String, default: "" },
            },
          },
        ],
      },
    ],

    // Branch Admin specific fields
    aadharNumber: {
      type: String,
      required: function () {
        return this.role === "branchAdmin";
      },
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          return /^\d{12}$/.test(v);
        },
        message: "Aadhar number must be exactly 12 digits",
      },
    },
    panNumber: {
      type: String,
      required: function () {
        return this.role === "branchAdmin";
      },
      unique: true,
      sparse: true,
      validate: {
        validator: function (v) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: "PAN number must be in format: ABCDE1234F",
      },
    },
    bankDetails: {
      accountNumber: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        },
        validate: {
          validator: function (v) {
            // Only validate if value is provided (not empty)
            if (!v || v.trim() === "") return true;
            return /^\d{9,18}$/.test(v);
          },
          message: "Account number must be between 9-18 digits",
        },
      },
      ifscCode: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        },
        validate: {
          validator: function (v) {
            // Only validate if value is provided (not empty)
            if (!v || v.trim() === "") return true;
            return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
          },
          message: "IFSC code must be in format: ABCD0123456",
        },
      },
      bankName: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        },
      },
      accountHolderName: {
        type: String,
        required: function () {
          return this.role === "branchAdmin";
        },
      },
    },

    // assignedOrders: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Order",
    //   },
    // ],

    currentLocation: {
      type: {
        lat: { type: Number },
        lng: { type: Number },
      },
      default: null,
    },

    photoUrl: {
      type: String,
      default: "",
    },
    bannerUrl: {
      type: String,
      default: "",
    },
    photoUrlPublicId: {
      type: String,
      default: "",
    },
    bannerUrlPublicId: {
      type: String,
      default: "",
    },
    signature: {
      url: {
        type: String,
        default: "",
      },
      public_id: {
        type: String,
        default: "",
      },
    },
    status: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpiry: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Removed compound index on company and branch - MongoDB doesn't allow compound indexes on multiple array fields
// If needed, create separate indexes: user.index({ company: 1 }); user.index({ branch: 1 });
user.index({ aadharNumber: 1 }, { unique: true, sparse: true });
user.index({ panNumber: 1 }, { unique: true, sparse: true });
// user.index({ email: 1 }, { unique: true });

export const User = mongoose.model("User", user);
