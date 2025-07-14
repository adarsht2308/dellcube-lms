import mongoose from "mongoose";

import { Pincode } from "../models/pincode.js";
import { Locality } from "../models/locality.js";

// Create Pincode
export const createPincode = async (req, res) => {
  try {
    const { code, locality, status = true } = req.body;

    if (!code || !locality) {
      return res.status(400).json({
        success: false,
        message: "Pincode code and locality are required",
      });
    }

    const localityExists = await Locality.findById(locality);
    if (!localityExists) {
      return res.status(404).json({
        success: false,
        message: "Locality not found",
      });
    }

    const pincode = await Pincode.create({ code, locality, status });

    return res.status(201).json({
      success: true,
      message: "Pincode created successfully",
      data: pincode,
    });
  } catch (error) {
    console.error("Error creating pincode:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the pincode",
    });
  }
};

// Get All Pincodes (Paginated + Search)
export const getAllPincodes = async (req, res) => {
  try {
    let { page = 1, limit = 50, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const query = search ? { code: { $regex: search, $options: "i" } } : {};

    const pincodes = await Pincode.find(query)
      .populate("locality", "name")
      .skip(skip)
      .limit(limit)
      .sort({ code: 1 });

    const total = await Pincode.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Pincodes fetched successfully",
      pincodes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching pincodes:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching pincodes",
    });
  }
};

export const getPincodesByLocality = async (req, res) => {
  try {
    const { localityId } = req.body;

    if (!localityId || !mongoose.Types.ObjectId.isValid(localityId)) {
      return res.status(400).json({
        success: false,
        message: "Valid locality ID is required",
      });
    }

    const pincodes = await Pincode.find({ locality: localityId }).sort({
      code: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Pincodes fetched successfully",
      pincodes,
    });
  } catch (error) {
    console.error("Error fetching pincodes by locality:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching pincodes by locality",
    });
  }
};

// Get Pincode by ID
export const getPincodesById = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid pincode ID is required",
      });
    }

    const pincode = await Pincode.findById(id).populate("locality", "name");

    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pincode fetched successfully",
      data: pincode,
    });
  } catch (error) {
    console.error("Error fetching pincode by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the pincode",
    });
  }
};

// Update Pincode
export const updatePincode = async (req, res) => {
  try {
    const { id, code, locality, status } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid pincode ID is required",
      });
    }

    const pincode = await Pincode.findById(id);
    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found",
      });
    }

    if (code) pincode.code = code;
    if (status !== undefined) pincode.status = status;

    if (locality) {
      const localityExists = await Locality.findById(locality);
      if (!localityExists) {
        return res.status(404).json({
          success: false,
          message: "Locality not found",
        });
      }
      pincode.locality = locality;
    }

    await pincode.save();

    return res.status(200).json({
      success: true,
      message: "Pincode updated successfully",
      data: pincode,
    });
  } catch (error) {
    console.error("Error updating pincode:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the pincode",
    });
  }
};

// Delete Pincode
export const deletePincode = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid pincode ID is required",
      });
    }

    const pincode = await Pincode.findByIdAndDelete(id);

    if (!pincode) {
      return res.status(404).json({
        success: false,
        message: "Pincode not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Pincode deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting pincode:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the pincode",
    });
  }
};
