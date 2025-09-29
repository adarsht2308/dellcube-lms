import { Customer } from "../models/customer.js";
import { User } from "../models/user.js";

// Create Customer
export const createCustomer = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      company,
      branch,
      status,
      gstNumber,
      companyName,
      companyContactName,
      companyContactInfo,
      taxType,
      taxValue,
      consignees,
      consignors,
    } = req.body;

    console.log(req.body);

    if (!name || !company || !branch) {
      return res
        .status(400)
        .json({ message: "Name, company, and branch are required" });
    }

    const customer = new Customer({
      name,
      email,
      phone,
      address,
      company,
      branch,
      gstNumber,
      companyName,
      companyContactName,
      companyContactInfo,
      taxType,
      taxValue: taxValue ? parseFloat(taxValue) : undefined,
      consignees: consignees || [],
      consignors: consignors || [],
      status: status !== undefined ? status : true,
    });

    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      customer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating customer",
    });
  }
};

// Get All Customers (with pagination, search, and optional filters)
export const getAllCustomers = async (req, res) => {
  try {
    let { page, limit, search, status, companyId, branchId } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (status === "true") query.status = true;
    if (status === "false") query.status = false;
    if (companyId) query.company = companyId;
    if (branchId) query.branch = branchId;

    // If vendor is logged in, restrict to their assigned client only
    if (req.user?.role === "vendor") {
      const vendor = await User.findById(req.user.userId).select(
        "assignedClient"
      );
      if (vendor?.assignedClient) {
        query._id = vendor.assignedClient;
      } else {
        // No assigned client -> return empty result set
        query._id = null;
      }
    }

    const customers = await Customer.find(query)
      .populate("company branch")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Customer.countDocuments(query);

    return res.status(200).json({
      success: true,
      message: "Customers fetched successfully",
      customers,
      page,
      limit,
      total,
      currentPageCount: customers.length,
      totalPage: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching customers",
    });
  }
};

// Get Customer by ID
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.body;

    const customer = await Customer.findById(id).populate("company branch");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer fetched successfully",
      customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching customer",
    });
  }
};

// Update Customer
export const updateCustomer = async (req, res) => {
  try {
    const {
      customerId,
      name,
      email,
      phone,
      address,
      company,
      branch,
      status,
      gstNumber,
      companyName,
      companyContactName,
      companyContactInfo,
      taxType,
      taxValue,
      consignees,
      consignors,
    } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (name) customer.name = name;
    if (email) customer.email = email;
    if (phone) customer.phone = phone;
    if (address) customer.address = address;
    if (gstNumber !== undefined) customer.gstNumber = gstNumber;
    if (company) customer.company = company;
    if (branch) customer.branch = branch;
    if (status !== undefined) customer.status = status;
    if (companyName !== undefined) customer.companyName = companyName;
    if (companyContactName !== undefined)
      customer.companyContactName = companyContactName;
    if (companyContactInfo !== undefined)
      customer.companyContactInfo = companyContactInfo;
    if (taxType !== undefined) customer.taxType = taxType;
    if (taxValue !== undefined)
      customer.taxValue = taxValue ? parseFloat(taxValue) : undefined;
    if (consignees !== undefined) customer.consignees = consignees;
    if (consignors !== undefined) customer.consignors = consignors;

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating customer",
    });
  }
};

// Delete Customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.body;

    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customer.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting customer",
    });
  }
};
