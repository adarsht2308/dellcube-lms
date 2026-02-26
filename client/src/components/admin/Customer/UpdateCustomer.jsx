import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Users, Building2, CreditCard } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";

import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import {
  useGetCustomerByIdMutation,
  useUpdateCustomerMutation,
} from "@/features/api/Customer/customerApi.js";
import { getTokenData } from "@/utils/getTokenData";
import ConsigneeConsignorManager from "./ConsigneeConsignorManager";
import MisFieldsManager from "./MisFieldsManager";

const UpdateCustomer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customerId = location.state?.customerId;

  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isOperation = user?.role === "operation";
  const isVendor = user?.role === "vendor";
  const shouldHideCompanyBranch = isBranchAdmin || isOperation || isVendor;

  // Get companyId and branchId from token (current session)
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();

  // Helper function to get company ID - prioritize token (current session)
  const getUserCompanyId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenCompanyId) return tokenCompanyId;
    // Fallback to user profile data
    if (user?.company?._id) return user.company._id;
    if (Array.isArray(user?.company) && user.company.length > 0) return user.company[0]._id;
    return null;
  };

  // Helper function to get branch ID - prioritize token (current session)
  const getUserBranchId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenBranchId) return tokenBranchId;
    // Fallback to user profile data
    if (user?.branch?._id) return user.branch._id;
    if (Array.isArray(user?.branch) && user.branch.length > 0) return user.branch[0]._id;
    return null;
  };

  const [getCustomerById, { data: customerData }] =
    useGetCustomerByIdMutation();

  const [updateCustomer, { isLoading, isSuccess, isError, error }] =
    useUpdateCustomerMutation();

  const { data: companies = {} } = useGetAllCompaniesQuery({ status: "true" });

  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();

  const [branches, setBranches] = useState([]);
  
  // State to store current session's company and branch names for display
  const [currentSessionCompanyName, setCurrentSessionCompanyName] = useState("");
  const [currentSessionBranchName, setCurrentSessionBranchName] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
    company: "",
    branch: "",
    companyName: "",
    companyContactName: "",
    companyContactInfo: "",
    taxType: "",
    taxValue: "",
    consignees: [],
    consignors: [],
    misFields: [],
    status: true,
  });

  useEffect(() => {
    if (customerId) getCustomerById(customerId);
  }, [customerId]);

  useEffect(() => {
    if (customerData?.customer) {
      const c = customerData.customer;
      // Handle company - could be object or array
      const companyId = c.company?._id || (Array.isArray(c.company) && c.company.length > 0 ? c.company[0]._id : null) || "";
      // Handle branch - could be object or array
      const branchId = c.branch?._id || (Array.isArray(c.branch) && c.branch.length > 0 ? c.branch[0]._id : null) || "";
      
      // For operation, branchAdmin, vendor - always use their profile company/branch
      // For superAdmin - use customer's existing company/branch or allow editing
      const finalCompanyId = shouldHideCompanyBranch 
        ? (getUserCompanyId() || getTokenData().companyId)
        : companyId;
      
      setFormData({
        name: c.name || "",
        email: c.email || "",
        phone: c.phone || "",
        gstNumber: c.gstNumber || "",
        address: c.address || "",
        company: finalCompanyId,
        branch: "",
        companyName: c.companyName || "",
        companyContactName: c.companyContactName || "",
        companyContactInfo: c.companyContactInfo || "",
        taxType: c.taxType || "",
        taxValue: c.taxValue || "",
        consignees: c.consignees || [],
        consignors: c.consignors || [],
        misFields: c.misFields || [],
        status: c.status === true || c.status === "active",
      });

      // Step 2: For superAdmin, fetch branches & then set branch
      if (!shouldHideCompanyBranch && finalCompanyId) {
        getBranchesByCompany(finalCompanyId).then((res) => {
          const br = res?.data?.branches || [];
          setBranches(br);

          setFormData((prev) => ({
            ...prev,
            branch: branchId || "",
          }));
        });
      }

      // Step 3: For operation, branchAdmin, vendor - fetch branches and set current session's branch
      if (shouldHideCompanyBranch && finalCompanyId) {
        const profileBranchId = getUserBranchId() || getTokenData().branchId;
        getBranchesByCompany(finalCompanyId).then((res) => {
          const branches = res?.data?.branches || [];
          const currentBranch = branches.find(b => b._id === profileBranchId);
          if (currentBranch) {
            setCurrentSessionBranchName(currentBranch.name);
            setBranches([{ _id: profileBranchId, name: currentBranch.name }]);
          } else {
            setBranches([{ _id: profileBranchId, name: "Your Branch" }]);
          }
        });
        
        // Set company name
        if (companies?.companies) {
          const currentCompany = companies.companies.find(c => c._id === finalCompanyId);
          if (currentCompany) {
            setCurrentSessionCompanyName(currentCompany.name);
          }
        }
        
        setFormData((prev) => ({
          ...prev,
          branch: profileBranchId || "",
        }));
      }
    }
  }, [customerData, companies]);

  const handleCompanyChange = async (companyId) => {
    // Don't allow changing company for operation, branchAdmin, vendor
    if (shouldHideCompanyBranch) {
      return;
    }
    
    setFormData({ ...formData, company: companyId, branch: "" });
    const res = await getBranchesByCompany( companyId );
    setBranches(res?.data?.branches || []);
  };

  const handleUpdate = async () => {
    // Get companyId and branchId from token if not provided in formData
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    
    // For superAdmin, use form values; for others, use profile/token
    let finalCompany, finalBranch;
    
    if (shouldHideCompanyBranch) {
      // For operation, branchAdmin, vendor - use profile data
      finalCompany = getUserCompanyId() || tokenCompanyId || "";
      finalBranch = getUserBranchId() || tokenBranchId || "";
    } else {
      // For superAdmin - use form values or token
      finalCompany = (formData.company && formData.company !== "undefined") 
        ? formData.company 
        : (tokenCompanyId || "");
      finalBranch = (formData.branch && formData.branch !== "undefined") 
        ? formData.branch 
        : (tokenBranchId || "");
    }

    if (!formData.name || !finalCompany || !finalBranch) {
      toast.error("Name, Company, and Branch are required");
      return;
    }

    // Create payload with only valid values, excluding undefined fields
    const payload = {
      customerId,
      name: formData.name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      gstNumber: formData.gstNumber || undefined,
      address: formData.address || undefined,
      company: finalCompany,
      branch: finalBranch,
      companyName: formData.companyName || undefined,
      companyContactName: formData.companyContactName || undefined,
      companyContactInfo: formData.companyContactInfo || undefined,
      taxType: formData.taxType || undefined,
      taxValue: formData.taxValue || undefined,
      consignees: formData.consignees || [],
      consignors: formData.consignors || [],
      misFields: formData.misFields || [],
      status: formData.status ? true : false,
    };

    // Remove undefined values from payload
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === "undefined") {
        delete payload[key];
      }
    });

    await updateCustomer(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Customer updated successfully");
      navigate("/admin/customers");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to update customer");
    }
  }, [isSuccess, isError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/customers")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Users className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Customer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Edit customer details and information
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

        {!customerData?.customer ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFD249]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information Card */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Name *
                  </Label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <Input
                    placeholder="e.g., john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </Label>
                  <Input
                    placeholder="e.g., +91 9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    GST Number
                  </Label>
                  <Input
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, gstNumber: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </Label>
                  <Input
                    placeholder="e.g., 123 Main Street, City, State"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Contact Name
                  </Label>
                  <Input
                    placeholder="e.g., Jane Smith"
                    value={formData.companyContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyContactName: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div >
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Contact Info
                  </Label>
                  <Input
                    placeholder="e.g., Phone, Email, Address"
                    value={formData.companyContactInfo}
                    onChange={(e) =>
                      setFormData({ ...formData, companyContactInfo: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Card>

          

            {/* Tax Information Card */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Tax Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tax Type
                  </Label>
                  <Select
                    value={
                      formData.taxType && ["GST", "CGST+SGST", "IGST", "Exempt"].includes(formData.taxType)
                        ? formData.taxType
                        : "Other"
                    }
                    onValueChange={(value) => {
                      if (value === "Other") {
                        // Keep current custom value or set to empty if it was a predefined option
                        setFormData({ 
                          ...formData, 
                          taxType: ["GST", "CGST+SGST", "IGST", "Exempt"].includes(formData.taxType) ? "" : formData.taxType 
                        });
                      } else {
                        setFormData({ ...formData, taxType: value });
                      }
                    }}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST</SelectItem>
                      <SelectItem value="CGST+SGST">CGST+SGST</SelectItem>
                      <SelectItem value="IGST">IGST</SelectItem>
                      <SelectItem value="Exempt">Exempt</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {(!formData.taxType || !["GST", "CGST+SGST", "IGST", "Exempt"].includes(formData.taxType)) && (
                    <Input
                      placeholder="Enter custom tax type"
                      value={["GST", "CGST+SGST", "IGST", "Exempt"].includes(formData.taxType) ? "" : formData.taxType || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, taxType: e.target.value })
                      }
                      className="mt-2"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tax Value (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g., 18.00"
                    value={formData.taxValue}
                    onChange={(e) =>
                      setFormData({ ...formData, taxValue: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Card>

            {/* Organization Assignment Card */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company *
                  </Label>
                  {shouldHideCompanyBranch ? (
                    <Input
                      value={currentSessionCompanyName || "Loading..."}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800 mt-1.5"
                    />
                  ) : (
                    <SearchableSelect
                      value={formData.company}
                      onValueChange={(val) => handleCompanyChange(val)}
                      options={(companies?.companies || []).map((c) => ({
                        value: c._id,
                        label: c.name,
                      }))}
                      placeholder="Select Company"
                      emptyMessage="No companies found"
                      className="mt-1.5"
                    />
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch *
                  </Label>
                  {shouldHideCompanyBranch ? (
                    <Input
                      value={currentSessionBranchName || "Loading..."}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800 mt-1.5"
                    />
                  ) : (
                    <SearchableSelect
                      value={
                        branches.some((b) => b._id === formData.branch)
                          ? formData.branch
                          : ""
                      }
                      onValueChange={(val) => setFormData({ ...formData, branch: val })}
                      options={(branches || []).map((b) => ({
                        value: b._id,
                        label: b.name,
                      }))}
                      placeholder="Select Branch"
                      emptyMessage="No branches found"
                      className="mt-1.5"
                    />
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center gap-4 mt-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                    <Switch
                      checked={formData.status}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, status: checked }))
                      }
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Consignees & Consignors Manager */}
            <ConsigneeConsignorManager
              customerId={customerId}
              consignees={formData.consignees}
              consignors={formData.consignors}
              onUpdate={(updates) => {
                if (updates.refetch) {
                  // Refetch customer data after bulk upload
                  getCustomerById(customerId);
                } else {
                  // Update form data for local changes
                  setFormData({ ...formData, ...updates });
                }
              }}
            />

            {/* MIS Fields Manager */}
            <MisFieldsManager
              customerId={customerId}
              misFields={formData.misFields}
              onUpdate={(updates) => {
                if (updates.misFields) {
                  setFormData({ ...formData, misFields: updates.misFields });
                  getCustomerById(customerId);
                }
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/customers")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            disabled={isLoading} 
            onClick={handleUpdate}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update Customer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCustomer;
