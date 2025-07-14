import mongoose from "mongoose";
import { City } from "../models/city.js";
import { State } from "../models/state.js";

export const createCity = async (req, res) => {
  try {
    const { name, state } = req.body;

    if (!name || !state) {
      return res.status(400).json({
        success: false,
        message: "City name and state are required",
      });
    }

    const stateExists = await State.findById(state);
    if (!stateExists) {
      return res.status(404).json({
        success: false,
        message: "State not found",
      });
    }

    const city = await City.create({ name, state });

    return res.status(201).json({
      success: true,
      message: "City created successfully",
      city,
    });
  } catch (error) {
    console.error("Error creating city:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating the city",
    });
  }
};

export const getAllCities = async (req, res) => {
  try {
    let { page = 1, limit = 50, search = "" } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const query = search ? { name: { $regex: search, $options: "i" } } : {};

    const cities = await City.find(query)
      .populate("state", "name")
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });

    const total = await City.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      cities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching cities:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching cities",
    });
  }
};

// Get cities by state
export const getCitiesByState = async (req, res) => {
  try {
    const { stateId } = req.body;

    if (!stateId) {
      return res.status(400).json({
        success: false,
        message: "State ID is required",
      });
    }

    const cities = await City.find({ state: stateId }).sort({ name: 1 });

    return res.status(200).json({
      success: true,
      message: "Cities fetched successfully",
      cities,
    });
  } catch (error) {
    console.error("Error fetching cities by state:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching cities by state",
    });
  }
};

// Update city
export const updateCity = async (req, res) => {
  try {
    const { cityId, name, state, status } = req.body;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    if (name) city.name = name;
    if (status !== undefined) city.status = status;
    if (state) {
      const stateExists = await State.findById(state);
      if (!stateExists) {
        return res.status(404).json({
          success: false,
          message: "State not found",
        });
      }
      city.state = state;
    }

    await city.save();

    return res.status(200).json({
      success: true,
      message: "City updated successfully",
      city,
    });
  } catch (error) {
    console.error("Error updating city:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the city",
    });
  }
};

// Delete city
export const deleteCity = async (req, res) => {
  try {
    const { id } = req.body;

    const city = await City.findById(id);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    await City.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "City deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting city:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the city",
    });
  }
};

export const getCitiesById = async (req, res) => {
  try {
    const { cityId } = req.body;

    if (!cityId || !mongoose.Types.ObjectId.isValid(cityId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid city ID is required." });
    }

    const city = await City.findById(cityId).populate("state", "name");

    if (!city) {
      return res
        .status(404)
        .json({ success: false, message: "City not found." });
    }

    return res.status(200).json({
      success: true,
      message: "City fetched successfully",
      data: city,
    });
  } catch (error) {
    console.error("Get city by ID error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
