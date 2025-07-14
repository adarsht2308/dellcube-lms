import { TransportMode } from "../models/transportMode.js";

export const createTransportMode = async (req, res) => {
  try {
    const { name, desc, status } = req.body;
    if (!name || !desc) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }
    const existing = await TransportMode.findOne({ name });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Transport mode already exists with this name",
      });
    }
    const newTransportMode = await TransportMode.create({
      name,
      desc,
      status: status !== undefined ? status : true,
    });
    return res.status(201).json({
      success: true,
      message: "Transport mode created successfully",
      transportMode: newTransportMode,
    });
  } catch (error) {
    console.error("Create Transport Mode Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create transport mode",
    });
  }
};

export const getAllTransportModes = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { desc: { $regex: search, $options: "i" } },
      ];
    }
    if (status === "true") query.status = true;
    if (status === "false") query.status = false;
    const transportModes = await TransportMode.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await TransportMode.countDocuments(query);
    return res.status(200).json({
      success: true,
      message: "Transport modes fetched successfully",
      transportModes,
      page,
      limit,
      total,
      currentPageCount: transportModes.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get All Transport Modes Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getTransportModeById = async (req, res) => {
  try {
    const { transportModeId } = req.body;
    if (!transportModeId) {
      return res.status(400).json({ success: false, message: "Transport mode ID is required" });
    }
    const transportMode = await TransportMode.findById(transportModeId);
    if (!transportMode) {
      return res.status(404).json({ success: false, message: "Transport mode not found" });
    }
    return res.status(200).json({ success: true, transportMode });
  } catch (error) {
    console.error("Get Transport Mode Error:", error);
    return res.status(500).json({ success: false, message: "Failed to get transport mode" });
  }
};

export const updateTransportMode = async (req, res) => {
  try {
    const { transportModeId, name, desc, status } = req.body;
    if (!transportModeId) {
      return res.status(400).json({ success: false, message: "Transport mode ID is required" });
    }
    const transportMode = await TransportMode.findById(transportModeId);
    if (!transportMode) {
      return res.status(404).json({ success: false, message: "Transport mode not found" });
    }
    if (name && name !== transportMode.name) {
      const existing = await TransportMode.findOne({ name });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Transport mode already exists with this name",
        });
      }
    }
    transportMode.name = name || transportMode.name;
    transportMode.desc = desc || transportMode.desc;
    transportMode.status = status !== undefined ? status : transportMode.status;
    const updatedTransportMode = await transportMode.save();
    return res.status(200).json({
      success: true,
      message: "Transport mode updated successfully",
      updatedTransportMode,
    });
  } catch (error) {
    console.error("Update Transport Mode Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update transport mode" });
  }
};

export const deleteTransportMode = async (req, res) => {
  try {
    const { transportModeId } = req.body;
    if (!transportModeId) {
      return res.status(400).json({ success: false, message: "Transport mode ID is required" });
    }
    const transportMode = await TransportMode.findById(transportModeId);
    if (!transportMode) {
      return res.status(404).json({ success: false, message: "Transport mode not found" });
    }
    await TransportMode.findByIdAndDelete(transportModeId);
    return res.status(200).json({ success: true, message: "Transport mode deleted successfully" });
  } catch (error) {
    console.error("Delete Transport Mode Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete transport mode" });
  }
};
