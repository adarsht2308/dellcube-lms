import { goods } from "../models/goods.js";

// Create a new Good
export const createGood = async (req, res) => {
  try {
    const { name, description = "", items } = req.body;

    if (!name || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Name and at least one item are required",
      });
    }

    const good = await goods.create({ name, description, items });

    return res.status(201).json({
      success: true,
      message: "Good created successfully",
      good,
    });
  } catch (error) {
    console.error("Create Good Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create good",
    });
  }
};

// Get all Goods

export const getAllGoods = async (req, res) => {
  try {
    let { page, limit, search } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const goodss = await goods
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await goods.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Goods fetched successfully",
      goodss,
      page,
      limit,
      total,
      currentPageCount: goodss.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get All Goods Error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching goods",
    });
  }
};

// Get a single Good by ID
export const getGoodById = async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Good ID is required" });
    }
    const good = await goods.findById(id);
    if (!good) {
      return res
        .status(404)
        .json({ success: false, message: "Good not found" });
    }
    return res.status(200).json({ success: true, good });
  } catch (error) {
    console.error("Get Good Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get good",
    });
  }
};

// Update a Good
export const updateGood = async (req, res) => {
  try {
    const { id } = req.body;
    const { name, description, items } = req.body;

    const good = await goods.findById(id);
    if (!good) {
      return res
        .status(404)
        .json({ success: false, message: "Good not found" });
    }

    if (name) good.name = name;
    if (description !== undefined) good.description = description;
    if (Array.isArray(items)) good.items = items;

    const updatedGood = await good.save();

    return res.status(200).json({
      success: true,
      message: "Good updated successfully",
      good: updatedGood,
    });
  } catch (error) {
    console.error("Update Good Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update good",
    });
  }
};

// Delete a Good
export const deleteGood = async (req, res) => {
  try {
    const { id } = req.body;
    const good = await goods.findById(id);
    if (!good) {
      return res
        .status(404)
        .json({ success: false, message: "Good not found" });
    }

    await good.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Good deleted successfully",
    });
  } catch (error) {
    console.error("Delete Good Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete good",
    });
  }
};
