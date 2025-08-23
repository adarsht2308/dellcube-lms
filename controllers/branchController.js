import { Branch } from "../models/branch.js";

export const createBranch = async (req, res) => {
  try {
    const { name, branchCode, company, address, status, gstNo, branchNo } = req.body;

    if (!name || !branchCode || !company || !address) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    const existing = await Branch.findOne({ branchCode });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Branch already exists with this code" });
    }

    const branch = new Branch({
      name,
      branchCode,
      company,
      address,
      status: status !== undefined ? status : true,
      gstNo: gstNo || "",
      branchNo: branchNo || "",
    });

    await branch.save();

    return res.status(201).json({
      success: true,
      message: "Branch created successfully",
      branch,
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating branch",
    });
  }
};

export const getAllBranches = async (req, res) => {
  try {
    let { page, limit, search, status, company } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (status === "true") query.status = true;
    if (status === "false") query.status = false;
    
    // Handle company filter - skip if "all" is passed
    if (company && company !== "all") {
      // Validate if company is a valid ObjectId
      if (company.match(/^[0-9a-fA-F]{24}$/)) {
        query.company = company;
      }
    }

    const branches = await Branch.find(query)
      .populate(
        "company region.country region.state region.city region.locality region.pincode"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Branch.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Branches fetched successfully",
      branches,
      page,
      limit,
      total,
      currentPageCount: branches.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching branches",
    });
  }
};

export const getBranchById = async (req, res) => {
  try {
    const { id } = req.body;

    const branch = await Branch.findById(id).populate(
      "company region.country region.state region.city region.locality region.pincode"
    );
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Branch fetched successfully",
      branch,
    });
  } catch (error) {
    console.error("Error fetching branch:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the branch",
    });
  }
};

export const updateBranch = async (req, res) => {
  try {
    const { branchId, name, branchCode, company, address, status, gstNo, branchNo } =
      req.body;

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    if (name) branch.name = name;
    if (branchCode) branch.branchCode = branchCode;
    if (company) branch.company = company;
    if (address) branch.address = address;
    
    if (status !== undefined) branch.status = status;
    if (gstNo !== undefined) branch.gstNo = gstNo;
    if (branchNo !== undefined) branch.branchNo = branchNo;

    await branch.save();

    return res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      branch,
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the branch",
    });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.body;

    const branch = await Branch.findById(id);
    if (!branch) {
      return res
        .status(404)
        .json({ success: false, message: "Branch not found" });
    }

    await branch.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the branch",
    });
  }
};

export const getBranchesByCompany = async (req, res) => {
  try {
    const {companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Company ID is required",
      });
    }

    const branches = await Branch.find({ company: companyId }).sort({
      name: 1,
    });

    return res.status(200).json({
      success: true,
      message: "Branches fetched successfully",
      branches,
    });
  } catch (error) {
    console.error("Error fetching branches by company:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching branches by company",
    });
  }
};
