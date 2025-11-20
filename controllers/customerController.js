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

    // If vendor is logged in, restrict to their assigned clients only
    if (req.user?.role === "vendor") {
      const vendor = await User.findById(req.user.userId).select(
        "assignedClients"
      ).populate("assignedClients");
      if (vendor?.assignedClients && vendor.assignedClients.length > 0) {
        const customerIds = vendor.assignedClients.map(
          (client) => client._id || client
        );
        query._id = { $in: customerIds };
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
      misFields,
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
    if (misFields !== undefined) customer.misFields = misFields;

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

// Add or Update Consignee (for KN Integration)
export const addOrUpdateConsignee = async (req, res) => {
  try {
    const { customerId, siteId, siteName, address } = req.body;

    // Validate required fields
    if (!customerId || !siteId || !siteName) {
      return res.status(400).json({
        success: false,
        message: "customerId, siteId, and siteName are required",
      });
    }

    // Find the customer
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if siteId already exists in consignees array
    const existingConsigneeIndex = customer.consignees.findIndex(
      (consignee) => consignee.siteId === siteId
    );

    if (existingConsigneeIndex !== -1) {
      // Update existing consignee
      customer.consignees[existingConsigneeIndex].consignee = siteName;
      if (address) customer.consignees[existingConsigneeIndex].address = address;
      await customer.save();

      return res.status(200).json({
        success: true,
        message: "Consignee updated successfully",
        consignee: customer.consignees[existingConsigneeIndex],
        customer,
      });
    } else {
      // Add new consignee
      customer.consignees.push({
        siteId: siteId,
        consignee: siteName,
        address: address || "",
      });
      await customer.save();

      return res.status(201).json({
        success: true,
        message: "Consignee added successfully",
        consignee: customer.consignees[customer.consignees.length - 1],
        customer,
      });
    }
  } catch (error) {
    console.error("Error adding/updating consignee:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while adding/updating consignee",
      error: error.message,
    });
  }
};

// Bulk Upload Consignees from CSV
export const bulkUploadConsignees = async (req, res) => {
  try {
    const { customerId, consignees } = req.body;

    if (!customerId || !consignees || !Array.isArray(consignees)) {
      return res.status(400).json({
        success: false,
        message: "customerId and consignees array are required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    let added = 0;
    let updated = 0;
    let errors = [];

    for (const item of consignees) {
      const { siteId, consignee, address } = item;

      if (!siteId || !consignee) {
        errors.push({ siteId, error: "Site ID and Consignee name are required" });
        continue;
      }

      const existingIndex = customer.consignees.findIndex(
        (c) => c.siteId === siteId
      );

      if (existingIndex !== -1) {
        customer.consignees[existingIndex].consignee = consignee;
        customer.consignees[existingIndex].address = address || "";
        updated++;
      } else {
        customer.consignees.push({ siteId, consignee, address: address || "" });
        added++;
      }
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: `Bulk upload completed. Added: ${added}, Updated: ${updated}`,
      added,
      updated,
      errors,
      customer,
    });
  } catch (error) {
    console.error("Error bulk uploading consignees:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while bulk uploading consignees",
      error: error.message,
    });
  }
};

// Bulk Upload Consignors from CSV
export const bulkUploadConsignors = async (req, res) => {
  try {
    const { customerId, consignors } = req.body;

    if (!customerId || !consignors || !Array.isArray(consignors)) {
      return res.status(400).json({
        success: false,
        message: "customerId and consignors array are required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    let added = 0;
    let updated = 0;
    let errors = [];

    for (const item of consignors) {
      const { siteId, consignor, address } = item;

      if (!consignor) {
        errors.push({ siteId, error: "Consignor name is required" });
        continue;
      }

      if (siteId) {
        const existingIndex = customer.consignors.findIndex(
          (c) => c.siteId === siteId
        );

        if (existingIndex !== -1) {
          customer.consignors[existingIndex].consignor = consignor;
          customer.consignors[existingIndex].address = address || "";
          updated++;
        } else {
          customer.consignors.push({ siteId, consignor, address: address || "" });
          added++;
        }
      } else {
        customer.consignors.push({ siteId: "", consignor, address: address || "" });
        added++;
      }
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: `Bulk upload completed. Added: ${added}, Updated: ${updated}`,
      added,
      updated,
      errors,
      customer,
    });
  } catch (error) {
    console.error("Error bulk uploading consignors:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while bulk uploading consignors",
      error: error.message,
    });
  }
};

// Export Consignees as CSV data
export const exportConsignees = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Consignees exported successfully",
      consignees: customer.consignees,
    });
  } catch (error) {
    console.error("Error exporting consignees:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while exporting consignees",
      error: error.message,
    });
  }
};

// Export Consignors as CSV data
export const exportConsignors = async (req, res) => {
  try {
    const { customerId } = req.params;

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Consignors exported successfully",
      consignors: customer.consignors,
    });
  } catch (error) {
    console.error("Error exporting consignors:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while exporting consignors",
      error: error.message,
    });
  }
};

// Manage MIS Fields for Customer
export const manageMisFields = async (req, res) => {
  try {
    const { customerId, action, field } = req.body;

    if (!customerId || !action) {
      return res.status(400).json({
        success: false,
        message: "customerId and action are required",
      });
    }

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (action === "add") {
      if (!field || !field.fieldName || !field.fieldLabel) {
        return res.status(400).json({
          success: false,
          message: "field with fieldName and fieldLabel is required",
        });
      }

      const maxOrder = customer.misFields.length > 0
        ? Math.max(...customer.misFields.map(f => f.order || 0))
        : -1;

      customer.misFields.push({
        fieldName: field.fieldName,
        fieldType: field.fieldType || "text",
        fieldLabel: field.fieldLabel,
        isRequired: field.isRequired || false,
        options: field.options || [],
        order: maxOrder + 1,
      });

      await customer.save();

      return res.status(200).json({
        success: true,
        message: "MIS field added successfully",
        misFields: customer.misFields,
      });
    } else if (action === "update") {
      if (!field || !field._id) {
        return res.status(400).json({
          success: false,
          message: "field with _id is required",
        });
      }

      const fieldIndex = customer.misFields.findIndex(
        (f) => f._id.toString() === field._id
      );

      if (fieldIndex === -1) {
        return res.status(404).json({
          success: false,
          message: "MIS field not found",
        });
      }

      if (field.fieldName) customer.misFields[fieldIndex].fieldName = field.fieldName;
      if (field.fieldType) customer.misFields[fieldIndex].fieldType = field.fieldType;
      if (field.fieldLabel) customer.misFields[fieldIndex].fieldLabel = field.fieldLabel;
      if (field.isRequired !== undefined) customer.misFields[fieldIndex].isRequired = field.isRequired;
      if (field.options !== undefined) customer.misFields[fieldIndex].options = field.options;
      if (field.order !== undefined) customer.misFields[fieldIndex].order = field.order;

      await customer.save();

      return res.status(200).json({
        success: true,
        message: "MIS field updated successfully",
        misFields: customer.misFields,
      });
    } else if (action === "delete") {
      if (!field || !field._id) {
        return res.status(400).json({
          success: false,
          message: "field with _id is required",
        });
      }

      customer.misFields = customer.misFields.filter(
        (f) => f._id.toString() !== field._id
      );

      await customer.save();

      return res.status(200).json({
        success: true,
        message: "MIS field deleted successfully",
        misFields: customer.misFields,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'add', 'update', or 'delete'",
      });
    }
  } catch (error) {
    console.error("Error managing MIS fields:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while managing MIS fields",
      error: error.message,
    });
  }
};
