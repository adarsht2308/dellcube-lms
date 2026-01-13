import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  CreditCard,
  Building,
  User,
  Mail,
  Lock,
  MapPin,
  Banknote,
  Hash,
  Building2,
  Phone,
  Car,
  Clock,
  ArrowLeft,
  FileText,
  Truck,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useSelector } from "react-redux";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useCreateDriverMutation } from "@/features/api/authApi";
import { useGetAllVendorsQuery } from "@/features/api/Vendor/vendorApi";
import { getTokenData } from "@/utils/getTokenData";

const CreateDriver = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isOperation = user?.role === "operation";
  const shouldHideCompanyBranch = isBranchAdmin || isOperation;

  // Get company and branch from user profile for operation/branchAdmin
  const getUserCompanyId = () => {
    if (isBranchAdmin || isOperation) {
      if (user?.company?._id) return user.company._id;
      if (Array.isArray(user?.company) && user.company.length > 0) return user.company[0]._id;
    }
    return null;
  };

  const getUserBranchId = () => {
    if (isBranchAdmin || isOperation) {
      if (user?.branch?._id) return user.branch._id;
      if (Array.isArray(user?.branch) && user.branch.length > 0) return user.branch[0]._id;
    }
    return null;
  };

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
    licenseNumber: "",
    experienceYears: "",
    driverType: user?.role === "vendor" ? "vendor" : "dellcube",
    companies: shouldHideCompanyBranch && getUserCompanyId() ? [getUserCompanyId()] : [],
    branches: shouldHideCompanyBranch && getUserBranchId() ? [getUserBranchId()] : [],
    vendor: "",
    status: true,
    aadharNumber: "",
    panNumber: "",
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      bankName: "",
      accountHolderName: "",
    },
  });

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData, isLoading: branchLoading }] =
    useGetBranchesByCompanyMutation();
  
  // Store branches for each selected company
  const [branchesByCompany, setBranchesByCompany] = useState({});
  
  // Initialize branches for operation/branchAdmin's company and set token values
  useEffect(() => {
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    
    if (shouldHideCompanyBranch) {
      const companyId = getUserCompanyId();
      const branchId = getUserBranchId();
      
      if (companyId) {
        getBranchesByCompany(companyId).then((res) => {
          if (res?.data?.branches) {
            setBranchesByCompany({
              [companyId]: res.data.branches
            });
          }
        });
        
        // Set company and branch in formData
        setFormData(prev => ({
          ...prev,
          companies: prev.companies.length > 0 ? prev.companies : [companyId],
          branches: prev.branches.length > 0 ? prev.branches : (branchId ? [branchId] : []),
        }));
      }
    } else if (tokenCompanyId && tokenBranchId) {
      // For superAdmin users, use token values if formData is empty
      setFormData(prev => ({
        ...prev,
        companies: prev.companies.length > 0 ? prev.companies.filter(id => id && id !== "undefined") : [tokenCompanyId],
        branches: prev.branches.length > 0 ? prev.branches.filter(id => id && id !== "undefined") : [tokenBranchId],
      }));
    }
  }, [shouldHideCompanyBranch, user]);
  
  // Fetch vendors - use first selected company/branch if multiple selected
  const { data: vendorsData, isLoading: vendorsLoading } = useGetAllVendorsQuery({
    page: 1,
    limit: 100,
    companyId: formData.companies.length > 0 ? formData.companies[0] : "",
    branchId: formData.branches.length > 0 ? formData.branches[0] : "",
  }, {
    skip: formData.companies.length === 0 || formData.branches.length === 0,
  });

  const [createDriver, { isLoading, isSuccess, isError, data, error }] =
    useCreateDriverMutation();

  // Handle company selection (multiple)
  const handleCompanyToggle = async (companyId) => {
    const isSelected = formData.companies.includes(companyId);
    let newCompanies = [];
    
    if (isSelected) {
      // Remove company
      newCompanies = formData.companies.filter(id => id !== companyId);
      // Remove branches for this company
      const newBranchesByCompany = { ...branchesByCompany };
      delete newBranchesByCompany[companyId];
      setBranchesByCompany(newBranchesByCompany);
      // Remove branches that belong to this company
      const companyBranches = branchesByCompany[companyId] || [];
      const companyBranchIds = companyBranches.map(b => b._id);
      const newBranches = formData.branches.filter(bId => !companyBranchIds.includes(bId));
      setFormData(prev => ({ ...prev, companies: newCompanies, branches: newBranches }));
    } else {
      // Add company
      newCompanies = [...formData.companies, companyId];
      setFormData(prev => ({ ...prev, companies: newCompanies }));
      // Fetch branches for this company
      try {
        const result = await getBranchesByCompany(companyId);
        const branches = result?.data?.branches || [];
        setBranchesByCompany(prev => ({
          ...prev,
          [companyId]: branches
        }));
      } catch (err) {
        toast.error("Failed to fetch branches for selected company");
      }
    }
  };

  // Handle branch selection (multiple)
  const handleBranchToggle = (branchId) => {
    const isSelected = formData.branches.includes(branchId);
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        branches: prev.branches.filter(id => id !== branchId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        branches: [...prev.branches, branchId]
      }));
    }
  };

  useEffect(() => {
    if (formData.driverType !== "vendor") {
      setFormData((prev) => ({ ...prev, vendor: "" }));
    }
  }, [formData.driverType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("bank.")) {
      const bankField = name.split(".")[1];
      // Convert IFSC code to uppercase
      const processedValue = bankField === "ifscCode" ? value.toUpperCase() : value;
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: processedValue,
        },
      }));
    } else if (name === "aadharNumber") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === "panNumber") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === "licenseNumber") {
      const cleanValue = value.replace(/[^A-Za-z0-9\-\s]/g, "");
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    } else if (name === "experienceYears") {
      const numValue = value === "" ? "" : Math.max(0, parseInt(value) || 0);
      setFormData((prev) => ({ ...prev, [name]: numValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const {
      name,
      mobile,
      password,
      licenseNumber,
      experienceYears,
      companies,
      branches,
      driverType,
      aadharNumber,
      panNumber,
    } = formData;

    if (
      !name ||
      !mobile ||
      !password ||
      !licenseNumber ||
      !experienceYears ||
      !driverType
    ) {
      toast.error("All required fields must be filled.");
      return false;
    }

    // For operation and branchAdmin, company/branch are auto-set from profile
    // For superAdmin, they need to select at least one
    if (!shouldHideCompanyBranch) {
      if (!companies || companies.length === 0 || !branches || branches.length === 0) {
        toast.error("Please select at least one company and branch.");
        return false;
      }
    } else {
      // Double-check that company/branch are set for operation/branchAdmin
      if (!formData.companies || formData.companies.length === 0 || !formData.branches || formData.branches.length === 0) {
        toast.error("Company or branch information is missing from your profile.");
        return false;
      }
    }
      
    if (driverType === "vendor" && !formData.vendor) {
      toast.error("Vendor is required when driver type is 'vendor'.");
      return false;
    }

    if (licenseNumber.length < 5) {
      toast.error("License number must be at least 5 characters long.");
      return false;
    }

    if (licenseNumber.length > 20) {
      toast.error("License number must not exceed 20 characters.");
      return false;
    }

    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      toast.error("Mobile number must be exactly 10 digits.");
      return false;
    }

    const expYears = Number(experienceYears);
    if (isNaN(expYears) || expYears < 0 || expYears > 50) {
      toast.error("Experience years must be between 0 and 50.");
      return false;
    }

    // Aadhar and PAN validation (required only for dellcube drivers)
    if (driverType === "dellcube") {
      if (!aadharNumber || !aadharNumber.trim()) {
        toast.error("Aadhar Card Number is required for company drivers.");
        return false;
      }

      if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
        toast.error("Aadhar Card Number must be exactly 12 digits.");
        return false;
      }

      if (!panNumber || !panNumber.trim()) {
        toast.error("PAN Card Number is required for company drivers.");
        return false;
      }

      if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
        toast.error("PAN Card Number must be in valid format (e.g., ABCDE1234F).");
        return false;
      }

      // Bank Details Validation (required only for dellcube drivers)
      const { accountHolderName, bankName, accountNumber, ifscCode } = formData.bankDetails;
      
      if (!accountHolderName || !accountHolderName.trim()) {
        toast.error("Account Holder Name is required for company drivers.");
        return false;
      }

      if (!bankName || !bankName.trim()) {
        toast.error("Bank Name is required for company drivers.");
        return false;
      }

      if (!accountNumber || !accountNumber.trim()) {
        toast.error("Account Number is required for company drivers.");
        return false;
      }

      if (!ifscCode || !ifscCode.trim()) {
        toast.error("IFSC Code is required for company drivers.");
        return false;
      }

      if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
        toast.error("IFSC Code must be in valid format (e.g., ABCD0123456).");
        return false;
      }
    } else {
      // For vendor and temporary drivers, Aadhar and PAN are optional
      // But if provided, validate format
      if (aadharNumber && aadharNumber.trim()) {
        if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
          toast.error("Aadhar Card Number must be exactly 12 digits.");
          return false;
        }
      }

      if (panNumber && panNumber.trim()) {
        if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
          toast.error("PAN Card Number must be in valid format (e.g., ABCDE1234F).");
          return false;
        }
      }

      // Bank Details Validation (optional for vendor/temporary drivers)
      // But if provided, validate format
      if (formData.bankDetails) {
        const { accountHolderName, bankName, accountNumber, ifscCode } = formData.bankDetails;
        
        if (ifscCode && ifscCode.trim()) {
          if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
            toast.error("IFSC Code must be in valid format (e.g., ABCD0123456).");
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Get companyId and branchId from token if not provided (for superAdmin)
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    
    // Ensure we have valid companies and branches arrays
    let finalCompanies = formData.companies || [];
    let finalBranches = formData.branches || [];
    
    // For operation/branchAdmin, ensure values are set from user profile
    if (shouldHideCompanyBranch) {
      const userCompanyId = getUserCompanyId();
      const userBranchId = getUserBranchId();
      if (finalCompanies.length === 0 && userCompanyId) {
        finalCompanies = [userCompanyId];
      }
      if (finalBranches.length === 0 && userBranchId) {
        finalBranches = [userBranchId];
      }
    } else {
      // For superAdmin, use token values if arrays are empty
      if (finalCompanies.length === 0 && tokenCompanyId) {
        finalCompanies = [tokenCompanyId];
      }
      if (finalBranches.length === 0 && tokenBranchId) {
        finalBranches = [tokenBranchId];
      }
    }
    
    // Filter out any undefined or "undefined" values
    finalCompanies = finalCompanies.filter(id => id && id !== "undefined");
    finalBranches = finalBranches.filter(id => id && id !== "undefined");
    
    // Build clean payload - backend accepts both companies/branches (arrays) and company/branch (single)
    const payload = {
      name: formData.name.trim(),
      mobile: formData.mobile.trim(),
      password: formData.password,
      licenseNumber: formData.licenseNumber.trim(),
      experienceYears: Number(formData.experienceYears),
      driverType: formData.driverType,
      companies: finalCompanies, // Send as arrays (preferred by backend)
      branches: finalBranches,
      vendor: formData.driverType === "vendor" ? formData.vendor : undefined,
      status: formData.status,
      aadharNumber: formData.aadharNumber.trim(),
      panNumber: formData.panNumber.trim(),
      bankDetails: {
        accountHolderName: formData.bankDetails.accountHolderName.trim(),
        bankName: formData.bankDetails.bankName.trim(),
        accountNumber: formData.bankDetails.accountNumber.trim(),
        ifscCode: formData.bankDetails.ifscCode.trim().toUpperCase(),
      },
    };
    
    // Remove undefined values from payload
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === "undefined") {
        delete payload[key];
      }
    });
    
    await createDriver(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Driver created successfully");
      navigate("/admin/drivers");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create driver");
    }
  }, [isSuccess, isError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/drivers")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drivers
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Truck className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Driver
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new driver to your organization
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-[#202020]" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <Label>Mobile Number *</Label>
                  <Input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    }}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                  />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Set Password"
                  />
                </div>
                <div>
                  <Label>License Number *</Label>
                  <Input
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    placeholder="Driver's License Number (e.g., DL-0123456789)"
                    maxLength="20"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      Alphanumeric, hyphens, spaces allowed
                    </span>
                    <span
                      className={`text-xs ${
                        formData.licenseNumber.length < 5
                          ? "text-red-500"
                          : formData.licenseNumber.length > 15
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {formData.licenseNumber.length}/20
                    </span>
                  </div>
                </div>
                <div>
                  <Label>Experience (Years) *</Label>
                  <Input
                    type="number"
                    name="experienceYears"
                    value={formData.experienceYears}
                    onChange={handleInputChange}
                    onInput={(e) => {
                      if (e.target.value < 0) e.target.value = 0;
                    }}
                    min="0"
                    max="50"
                    placeholder="Years of Experience"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Companies *</Label>
                  {shouldHideCompanyBranch ? (
                    <Input
                      value={user?.company?.name || (Array.isArray(user?.company) && user.company.length > 0 ? user.company[0].name : "")}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                    />
                  ) : (
                    <>
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {companies?.companies?.length > 0 ? (
                          companies.companies.map((c) => (
                            <div key={c._id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`company-${c._id}`}
                                checked={formData.companies.includes(c._id)}
                                onCheckedChange={() => handleCompanyToggle(c._id)}
                              />
                              <label
                                htmlFor={`company-${c._id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {c.name} ({c.companyCode})
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No companies available</p>
                        )}
                      </div>
                      {formData.companies.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.companies.length} company(s) selected
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label>Branches *</Label>
                  {shouldHideCompanyBranch ? (
                    <Input
                      value={user?.branch?.name || (Array.isArray(user?.branch) && user.branch.length > 0 ? user.branch[0].name : "")}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                    />
                  ) : (
                    <>
                      <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                        {formData.companies.length === 0 ? (
                          <p className="text-sm text-gray-500">Please select at least one company first</p>
                        ) : Object.keys(branchesByCompany).length === 0 ? (
                          <p className="text-sm text-gray-500">Loading branches...</p>
                        ) : (
                          Object.entries(branchesByCompany).map(([companyId, branches]) => {
                            const company = companies?.companies?.find(c => c._id === companyId);
                            return (
                              <div key={companyId} className="space-y-2">
                                {company && (
                                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2 first:mt-0">
                                    {company.name}:
                                  </p>
                                )}
                                {branches.map((b) => (
                                  <div key={b._id} className="flex items-center space-x-2 ml-4">
                                    <Checkbox
                                      id={`branch-${b._id}`}
                                      checked={formData.branches.includes(b._id)}
                                      onCheckedChange={() => handleBranchToggle(b._id)}
                                    />
                                    <label
                                      htmlFor={`branch-${b._id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {b.name} ({b.branchCode})
                                    </label>
                                  </div>
                                ))}
                              </div>
                            );
                          })
                        )}
                      </div>
                      {formData.branches.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.branches.length} branch(es) selected
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <Label>Driver Type *</Label>
                  <Select
                    value={formData.driverType}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, driverType: val, vendor: "" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Driver Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dellcube">Dellcube Driver</SelectItem>
                      <SelectItem value="vendor">Vendor Driver</SelectItem>
                      <SelectItem value="temporary">Temporary Driver</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.driverType === "vendor" && (
                  <div>
                    <Label>Select Vendor *</Label>
                    <Select
                      value={formData.vendor}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, vendor: val }))
                      }
                      disabled={formData.companies.length === 0 || formData.branches.length === 0 || vendorsLoading}
                    >
                      <SelectTrigger className={formData.companies.length === 0 || formData.branches.length === 0 ? "bg-gray-100 dark:bg-gray-800" : ""}>
                        <SelectValue placeholder={
                          vendorsLoading 
                            ? "Loading vendors..." 
                            : formData.companies.length === 0 || formData.branches.length === 0
                            ? "Please select company and branch first"
                            : "Select a vendor"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorsLoading ? (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            Loading vendors...
                          </div>
                        ) : vendorsData?.vendors?.length > 0 ? (
                          vendorsData.vendors.map((v) => (
                            <SelectItem key={v._id} value={v._id}>
                              {v.name} {v.email ? `(${v.email})` : ""}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-gray-500">
                            {formData.companies.length === 0 || formData.branches.length === 0
                              ? "Please select company and branch first"
                              : "No vendors available for selected company/branch"}
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    {formData.driverType === "vendor" && formData.companies.length > 0 && formData.branches.length > 0 && !vendorsLoading && vendorsData?.vendors?.length === 0 && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        No vendors found. Please create a vendor first or select a different company/branch.
                      </p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Label htmlFor="status-toggle">Status</Label>
                  <Switch
                    id="status-toggle"
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
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#202020]" />
                Identity Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Aadhar Card Number *</Label>
                  <Input
                    name="aadharNumber"
                    value={formData.aadharNumber}
                    onChange={handleInputChange}
                    placeholder="12-digit Aadhar Number"
                    maxLength="12"
                  />
                </div>
                <div>
                  <Label>PAN Card Number *</Label>
                  <Input
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    placeholder="ABCDE1234F"
                    maxLength="10"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Banknote className="w-5 h-5 text-[#202020]" />
                Bank Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account Holder Name *</Label>
                  <Input
                    name="bank.accountHolderName"
                    value={formData.bankDetails.accountHolderName}
                    onChange={handleInputChange}
                    placeholder="Account Holder Name"
                  />
                </div>
                <div>
                  <Label>Bank Name *</Label>
                  <Input
                    name="bank.bankName"
                    value={formData.bankDetails.bankName}
                    onChange={handleInputChange}
                    placeholder="Bank Name"
                  />
                </div>
                <div>
                  <Label>Account Number *</Label>
                  <Input
                    name="bank.accountNumber"
                    value={formData.bankDetails.accountNumber}
                    onChange={handleInputChange}
                    placeholder="Account Number"
                  />
                </div>
                <div>
                  <Label>IFSC Code *</Label>
                  <Input
                    name="bank.ifscCode"
                    value={formData.bankDetails.ifscCode}
                    onChange={handleInputChange}
                    placeholder="ABCD0123456"
                    style={{ textTransform: "uppercase" }}
                    maxLength="11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/drivers")}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Driver"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateDriver;
