import { Company } from "../models/company.js";
import { v2 as cloudinary } from "cloudinary";

export const createCompany = async (req, res) => {
  try {
    const {
      name,
      companyCode,
      emailId,
      website,
      gstNumber,
      gstNo,
      gstValue,
      pan,
      sacHsnCode,
      companyType,
      address,
      contactPhone,
      bankName,
      accountNumber,
      ifsc,
      emergencyContactName,
      emergencyContactMobile,
      status,
      country,
      state,
      city,
      locality,
      pincode,
    } = req.body;
    if (
      !name ||
      !companyCode ||
      !emailId ||
      !gstNumber ||
      !gstNo ||
      !gstValue ||
      !pan ||
      !sacHsnCode ||
      !companyType ||
      !address ||
      !contactPhone ||
      !country ||
      !state ||
      !city ||
      !locality ||
      !pincode
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company already exists with this name",
      });
    }

    const existingCompanyCode = await Company.findOne({ companyCode });
    if (existingCompanyCode) {
      return res.status(400).json({
        success: false,
        message: "Company code already exists",
      });
    }

    const existingEmail = await Company.findOne({ emailId });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Email ID already exists",
      });
    }

    let logoUrl = "";
    let logoPublicId = "";

    if (req.files && req.files.companyLogo) {
      logoUrl = req.files.companyLogo[0].path;
      logoPublicId = req.files.companyLogo[0].filename;
    }

    const newCompany = await Company.create({
      name,
      companyCode,
      emailId,
      website,
      gstNumber,
      gstNo,
      gstValue: parseFloat(gstValue),
      pan,
      sacHsnCode,
      companyType,
      address,
      contactPhone,
      bankDetails: {
        bankName: bankName || "",
        accountNumber: accountNumber || "",
        ifsc: ifsc || "",
      },
      emergencyContact: {
        name: emergencyContactName || "",
        mobile: emergencyContactMobile || "",
      },
      companyLogoUrl: logoUrl,
      companyLogoUrlPublicId: logoPublicId,
      status: status !== undefined ? status : true,
      region: {
        country,
        state,
        city,
        locality,
        pincode,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Company created successfully",
      company: newCompany,
    });
  } catch (error) {
    console.error("Create Company Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create company",
    });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    let { page = 1, limit = 10, search = "", status } = req.query;
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { companyCode: { $regex: search, $options: "i" } },
        { emailId: { $regex: search, $options: "i" } },
        { website: { $regex: search, $options: "i" } },
        { gstNumber: { $regex: search, $options: "i" } },
        { gstNo: { $regex: search, $options: "i" } },
        { pan: { $regex: search, $options: "i" } },
        { sacHsnCode: { $regex: search, $options: "i" } },
        { companyType: { $regex: search, $options: "i" } },
        { "bankDetails.bankName": { $regex: search, $options: "i" } },
        { "bankDetails.accountNumber": { $regex: search, $options: "i" } },
        { "bankDetails.ifsc": { $regex: search, $options: "i" } },
        { "emergencyContact.name": { $regex: search, $options: "i" } },
        { "emergencyContact.mobile": { $regex: search, $options: "i" } },
      ];
    }
    if (status === "true") query.status = true;
    if (status === "false") query.status = false;

    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Company.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Companies fetched successfully",
      companies,
      page,
      limit,
      total,
      currentPageCount: companies.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Get All Companies Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }
    const company = await Company.findById(companyId)
      .populate("region.country", "name")
      .populate("region.state", "name")
      .populate("region.city", "name")
      .populate("region.locality", "name")
      .populate("region.pincode", "code");

    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    return res.status(200).json({ success: true, company });
  } catch (error) {
    console.error("Get Company Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get company",
    });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const {
      companyId,
      name,
      companyCode,
      emailId,
      website,
      gstNumber,
      gstNo,
      gstValue,
      pan,
      sacHsnCode,
      companyType,
      address,
      contactPhone,
      bankName,
      accountNumber,
      ifsc,
      emergencyContactName,
      emergencyContactMobile,
      status,
      country,
      state,
      city,
      locality,
      pincode,
    } = req.body;

    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    if (req.files && req.files.companyLogo) {
      // Delete previous image from Cloudinary
      if (company.companyLogoUrlPublicId) {
        await cloudinary.uploader.destroy(company.companyLogoUrlPublicId);
      }

      company.companyLogoUrl = req.files.companyLogo[0].path;
      company.companyLogoUrlPublicId = req.files.companyLogo[0].filename;
    }

    company.name = name || company.name;
    company.companyCode = companyCode || company.companyCode;
    company.emailId = emailId || company.emailId;
    company.website = website || company.website;
    company.gstNumber = gstNumber || company.gstNumber;
    company.gstNo = gstNo || company.gstNo;
    company.gstValue =
      gstValue !== undefined && gstValue !== null && gstValue !== ""
        ? parseFloat(gstValue)
        : company.gstValue;
    company.pan = pan || company.pan;
    company.sacHsnCode = sacHsnCode || company.sacHsnCode;
    company.companyType = companyType || company.companyType;
    company.address = address || company.address;
    company.contactPhone = contactPhone || company.contactPhone;
    company.bankDetails = {
      bankName: bankName || company.bankDetails?.bankName || "",
      accountNumber: accountNumber || company.bankDetails?.accountNumber || "",
      ifsc: ifsc || company.bankDetails?.ifsc || "",
    };
    company.emergencyContact = {
      name: emergencyContactName || company.emergencyContact?.name || "",
      mobile: emergencyContactMobile || company.emergencyContact?.mobile || "",
    };
    company.status = status !== undefined ? status : company.status;
    company.region.country = country || company.region.country;
    company.region.state = state || company.region.state;
    company.region.city = city || company.region.city;
    company.region.locality = locality || company.region.locality;
    company.region.pincode = pincode || company.region.pincode;

    const updatedCompany = await company.save();

    return res.status(200).json({
      success: true,
      message: "Company updated successfully",
      updatedCompany,
    });
  } catch (error) {
    console.error("Update Company Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update company",
      error: error.message,
    });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.body;
    if (!companyId) {
      return res
        .status(400)
        .json({ success: false, message: "Company ID is required" });
    }
    const company = await Company.findById(companyId);
    if (!company) {
      return res
        .status(404)
        .json({ success: false, message: "Company not found" });
    }

    if (company.companyLogoUrlPublicId) {
      await cloudinary.uploader.destroy(company.companyLogoUrlPublicId);
    }

    await company.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    console.error("Delete Company Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete company",
    });
  }
};
