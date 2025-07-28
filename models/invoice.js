import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    docketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderNumber: {
      type: String,
      trim: true,
      default: "",
    },
    siteId: { type: String, trim: true },
    sealNo: { type: String, trim: true },
    siteType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SiteType",
    },
    transportMode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TransportMode",
    },

    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // FROM LOCATION
    fromAddress: {
      country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
      state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
      city: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
      locality: { type: mongoose.Schema.Types.ObjectId, ref: "Locality" },
      pincode: { type: mongoose.Schema.Types.ObjectId, ref: "Pincode" },
    },

    // TO ADDRESS - Renamed from toLocation to match frontend
    toAddress: {
      country: { type: mongoose.Schema.Types.ObjectId, ref: "Country" },
      state: { type: mongoose.Schema.Types.ObjectId, ref: "State" },
      city: { type: mongoose.Schema.Types.ObjectId, ref: "City" },
      locality: { type: mongoose.Schema.Types.ObjectId, ref: "Locality" },
      pincode: { type: mongoose.Schema.Types.ObjectId, ref: "Pincode" },
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customers",
      required: true,
    },

    goodsType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Good",
    },

    vehicleType: {
      type: String,
      enum: ["Dellcube", "Vendor"],
      // required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
    },
    vehicleSize: { type: String, trim: true },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
    },

    vendorVehicle: {
      type: mongoose.Schema.Types.Mixed, 
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    driverContactNumber: { type: String, trim: true },

    status: {
      type: String,
      enum: [
        "Reserved",
        "Created",
        "Dispatched",
        "In Transit",
        "Arrived at Destination",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
      default: "Created",
    },

    driverUpdates: [
      {
        location: {
          lat: Number,
          lng: Number,
        },
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        orderPhotoUrl: String,
      },
    ],
    deliveredAt: Date,
    deliveryProof: {
      signature: String,
      receiverName: String,
      receiverMobile: String,
      remarks: String,
    },

    invoiceDate: {
      type: Date,
      // required: true,
    },

    dispatchDateTime: {
      type: Date,
      // required: true,
    },

    loadingContact: {
      name: String,
      mobile: String,
    },

    unloadingContact: {
      name: String,
      mobile: String,
    },

    totalWeight: Number,
    numberOfPackages: Number,
    freightCharges: Number,

    paymentType: {
      type: String,
      enum: ["Prepaid", "To-Pay", "Billing"],
      // required: true,
    },

    remarks: {
      type: String,
      default: "",
    },

    dellcubeSignature: String,
    receiverSignature: String,
    pickupAddress: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true },
    consignor: { type: String, trim: true },
    consignee: { type: String, trim: true },
    address: { type: String, trim: true },
    invoiceNumber: { type: String, trim: true },
    invoiceBill: { type: String, trim: true },
    ewayBillNo: { type: String, trim: true },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
