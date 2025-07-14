import { Country } from "../models/country.js";
import mongoose from "mongoose";
import { State } from "../models/state.js";

export const createState = async (req, res) => {
  try {
    const { name, country, status = true } = req.body;

    if (!name || !country) {
      return res
        .status(400)
        .json({ success: false, message: "Name and country are required." });
    }

    const countryExists = await Country.findById(country);
    if (!countryExists) {
      return res
        .status(404)
        .json({ success: false, message: "Country not found." });
    }

    const newState = new State({ name, country, status });
    await newState.save();

    res.status(201).json({
      success: true,
      message: "State created successfully",
      data: newState,
    });
  } catch (error) {
    console.error("Create state error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const getAllStates = async (req, res) => {
  try {
    let { page, limit, search } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const states = await State.find(query)
      .populate("country", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await State.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "States fetched successfully",
      data: states,
      page,
      limit,
      total,
      currentPageCount: states.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching states:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching states",
    });
  }
};

export const getStatesByCountry = async (req, res) => {
  try {
    const { countryId } = req.body;

    if (!countryId || !mongoose.Types.ObjectId.isValid(countryId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid countryId is required." });
    }

    const states = await State.find({ country: countryId }).populate(
      "country",
      "name"
    );
    res.status(200).json({ success: true, data: states });
  } catch (error) {
    console.error("Get states by country error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const updateState = async (req, res) => {
  try {
    const { id, name, country, status } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid state ID is required." });
    }

    const state = await State.findById(id);
    if (!state) {
      return res
        .status(404)
        .json({ success: false, message: "State not found." });
    }

    if (country) {
      const countryExists = await Country.findById(country);
      if (!countryExists) {
        return res
          .status(404)
          .json({ success: false, message: "Country not found." });
      }
      state.country = country;
    }

    if (name) state.name = name;
    if (status !== undefined) state.status = status;

    await state.save();
    res.status(200).json({
      success: true,
      message: "State updated successfully",
      data: state,
    });
  } catch (error) {
    console.error("Update state error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const deleteState = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid state ID is required." });
    }

    const state = await State.findByIdAndDelete(id);
    if (!state) {
      return res
        .status(404)
        .json({ success: false, message: "State not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "State deleted successfully" });
  } catch (error) {
    console.error("Delete state error:", error);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

export const getStateById = async (req, res) => {
  try {
    const { stateId } = req.body;

    if (!stateId || !mongoose.Types.ObjectId.isValid(stateId)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid state ID is required." });
    }

    const state = await State.findById(stateId).populate("country", "name");

    if (!state) {
      return res
        .status(404)
        .json({ success: false, message: "State not found." });
    }

    return res.status(200).json({
      success: true,
      message: "State fetched successfully",
      data: state,
    });
  } catch (error) {
    console.error("Get state by ID error:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};
