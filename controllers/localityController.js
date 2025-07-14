import mongoose from "mongoose";

import { City } from "../models/city.js";
import { Locality } from "../models/locality.js";

export const createLocality = async (req, res) => {
  try {
    const { name, city, status = true } = req.body;

    if (!name || !city) {
      return res.status(400).json({
        success: false,
        message: "Name and city are required.",
      });
    }

    const cityExists = await City.findById(city);
    if (!cityExists) {
      return res.status(404).json({
        success: false,
        message: "City not found.",
      });
    }

    const newLocality = new Locality({ name, city, status });
    await newLocality.save();

    return res.status(201).json({
      success: true,
      message: "Locality created successfully",
      data: newLocality,
    });
  } catch (error) {
    console.error("Create locality error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

export const getAllLocalities = async (req, res) => {
  try {
    let { page, limit, search } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const localities = await Locality.find(query)
      .populate("city", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Locality.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Localities fetched successfully",
      data: localities,
      page,
      limit,
      total,
      currentPageCount: localities.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching localities:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching localities",
    });
  }
};

export const getLocalitiesByCity = async (req, res) => {
  try {
    const { cityId } = req.body;

    if (!cityId || !mongoose.Types.ObjectId.isValid(cityId)) {
      return res.status(400).json({
        success: false,
        message: "Valid city ID is required.",
      });
    }

    const localities = await Locality.find({ city: cityId }).populate(
      "city",
      "name"
    );

    return res.status(200).json({
      success: true,
      message: "Localities fetched successfully",
      data: localities,
    });
  } catch (error) {
    console.error("Error fetching localities by city:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// Update Locality
export const updateLocality = async (req, res) => {
  try {
    const { id, name, city, status } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid locality ID is required.",
      });
    }

    const locality = await Locality.findById(id);
    if (!locality) {
      return res.status(404).json({
        success: false,
        message: "Locality not found.",
      });
    }

    if (city) {
      const cityExists = await City.findById(city);
      if (!cityExists) {
        return res.status(404).json({
          success: false,
          message: "City not found.",
        });
      }
      locality.city = city;
    }

    if (name) locality.name = name;
    if (status !== undefined) locality.status = status;

    await locality.save();

    return res.status(200).json({
      success: true,
      message: "Locality updated successfully",
      data: locality,
    });
  } catch (error) {
    console.error("Update locality error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// Delete Locality
export const deleteLocality = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid locality ID is required.",
      });
    }

    const locality = await Locality.findByIdAndDelete(id);
    if (!locality) {
      return res.status(404).json({
        success: false,
        message: "Locality not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Locality deleted successfully",
    });
  } catch (error) {
    console.error("Delete locality error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};

// View Locality by ID
export const getLocalityById = async (req, res) => {
  try {
    const { localityId } = req.body;

    if (!localityId || !mongoose.Types.ObjectId.isValid(localityId)) {
      return res.status(400).json({
        success: false,
        message: "Valid locality ID is required.",
      });
    }

    const locality = await Locality.findById(localityId).populate(
      "city",
      "name"
    );

    if (!locality) {
      return res.status(404).json({
        success: false,
        message: "Locality not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Locality fetched successfully",
      data: locality,
    });
  } catch (error) {
    console.error("Get locality by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
};
