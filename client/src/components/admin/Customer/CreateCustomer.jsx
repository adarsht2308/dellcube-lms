import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Users, Building2, CreditCard, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { FaRegTrashCan } from "react-icons/fa6";

import { useCreateCustomerMutation } from "@/features/api/Customer/customerApi.js";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import { getTokenData } from "@/utils/getTokenData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";

const CreateCustomer = () => {
  const navigate = useNavigate();
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
  });

  useEffect(() => {
    // For all users, use token data (current session selected company/branch)
    const companyId = getUserCompanyId();
    const branchId = getUserBranchId();
    
    if (companyId && branchId) {
      setFormData((prev) => ({
        ...prev,
        company: String(companyId),
        branch: String(branchId),
      }));
      
      // Fetch branches and set display names
      getBranchesByCompany(companyId).then((res) => {
        if (res?.data?.branches) {
          if (shouldHideCompanyBranch) {
            setBranches([{ _id: branchId, name: res.data.branches.find(b => b._id === branchId)?.name || "Branch" }]);
          } else {
            setBranches(res.data.branches);
          }
          // Find and set current branch name
          const currentBranch = res.data.branches.find(b => b._id === branchId);
          if (currentBranch) {
            setCurrentSessionBranchName(currentBranch.name);
          }
        }
      });
      
      // Find and set current company name
      if (companies?.companies) {
        const currentCompany = companies.companies.find(c => c._id === companyId);
        if (currentCompany) {
          setCurrentSessionCompanyName(currentCompany.name);
        }
      }
    }
  }, [user, shouldHideCompanyBranch, tokenCompanyId, tokenBranchId, companies]);

  const [branches, setBranches] = useState([]);
  const { data: companies = [] } = useGetAllCompaniesQuery({ status: "true" });
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const [createCustomer, { isLoading, isSuccess, isError, error, data }] =
    useCreateCustomerMutation();
  
  // State to store current session's company and branch names for display
  const [currentSessionCompanyName, setCurrentSessionCompanyName] = useState("");
  const [currentSessionBranchName, setCurrentSessionBranchName] = useState("");

  const handleCompanyChange = async (companyId) => {
    // Don't allow changing company for operation, branchAdmin, vendor
    if (shouldHideCompanyBranch) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      company: companyId,
      branch: "",
    }));

    const res = await getBranchesByCompany(companyId);

    if (res?.data?.branches) {
      setBranches(res?.data?.branches);
    } else {
      setBranches([]);
    }
  };

  const handleSubmit = async () => {
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
      createdBy: user?._id,
    };

    // Remove undefined values from payload
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === "undefined") {
        delete payload[key];
      }
    });

    await createCustomer(payload);
  };

  useEffect(() => {
    if (!shouldHideCompanyBranch && formData.company) {
      handleCompanyChange(formData.company);
    }
  }, []);

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Customer created successfully");
      navigate("/admin/customers");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create customer");
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
                Create New Customer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new customer to your organization
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

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

              <div>
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
                    onValueChange={handleCompanyChange}
                    options={(companies?.companies || []).map((comp) => ({
                      value: comp._id,
                      label: comp.name,
                    }))}
                    placeholder="Select company"
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
                    value={formData.branch}
                    onValueChange={(value) =>
                      setFormData({ ...formData, branch: value })
                    }
                    options={(branches || []).map((branch) => ({
                      value: branch._id,
                      label: branch.name,
                    }))}
                    placeholder="Select branch"
                    emptyMessage="No branches found"
                    className="mt-1.5"
                  />
                )}
              </div>
            </div>
          </Card>

        
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border mt-10">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/customers")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            disabled={isLoading} 
            onClick={handleSubmit}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Customer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomer;
