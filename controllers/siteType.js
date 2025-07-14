import { SiteType } from "../models/siteType.js";

export const createSiteType = async (req, res) => {
  try {
    const { name, desc, status } = req.body;
    
    if (!name || !desc) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    const existingSiteType = await SiteType.findOne({ name });
    if (existingSiteType) {
      return res.status(400).json({
        success: false,
        message: "Site type already exists with this name",
      });
    }

    const newSiteType = await SiteType.create({
      name,
      desc,
      status: status !== undefined ? status : true,
    });

    return res.status(201).json({
      success: true,
      message: "Site type created successfully",
      siteType: newSiteType,
    });
  } catch (error) {
    console.error("Create Site Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create site type",
    });
  }
};

export const getAllSiteTypes = async (req, res) => {
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

    const siteTypes = await SiteType.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SiteType.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Site types fetched successfully",
      siteTypes,
      page,
      limit,
      total,
      currentPageCount: siteTypes.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get All Site Types Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

export const getSiteTypeById = async (req, res) => {
  try {
    const { siteTypeId } = req.body;
    if (!siteTypeId) {
      return res
        .status(400)
        .json({ success: false, message: "Site type ID is required" });
    }
    
    const siteType = await SiteType.findById(siteTypeId);

    if (!siteType) {
      return res
        .status(404)
        .json({ success: false, message: "Site type not found" });
    }

    return res.status(200).json({ 
      success: true, 
      siteType 
    });
  } catch (error) {
    console.error("Get Site Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get site type",
    });
  }
};

export const updateSiteType = async (req, res) => {
  try {
    const { siteTypeId, name, desc, status } = req.body;

    if (!siteTypeId) {
      return res
        .status(400)
        .json({ success: false, message: "Site type ID is required" });
    }

    const siteType = await SiteType.findById(siteTypeId);
    if (!siteType) {
      return res
        .status(404)
        .json({ success: false, message: "Site type not found" });
    }

    // Check if name is being updated and if it already exists
    if (name && name !== siteType.name) {
      const existingSiteType = await SiteType.findOne({ name });
      if (existingSiteType) {
        return res.status(400).json({
          success: false,
          message: "Site type already exists with this name",
        });
      }
    }

    siteType.name = name || siteType.name;
    siteType.desc = desc || siteType.desc;
    siteType.status = status !== undefined ? status : siteType.status;

    const updatedSiteType = await siteType.save();

    return res.status(200).json({
      success: true,
      message: "Site type updated successfully",
      updatedSiteType,
    });
  } catch (error) {
    console.error("Update Site Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update site type",
    });
  }
};

export const deleteSiteType = async (req, res) => {
  try {
    const { siteTypeId } = req.body;
    
    if (!siteTypeId) {
      return res
        .status(400)
        .json({ success: false, message: "Site type ID is required" });
    }

    const siteType = await SiteType.findById(siteTypeId);
    if (!siteType) {
      return res
        .status(404)
        .json({ success: false, message: "Site type not found" });
    }

    await SiteType.findByIdAndDelete(siteTypeId);

    return res.status(200).json({
      success: true,
      message: "Site type deleted successfully",
    });
  } catch (error) {
    console.error("Delete Site Type Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete site type",
    });
  }
};
