import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  CreditCard,
  Building,
  User,
  Mail,
  MapPin,
  Banknote,
  Hash,
  Building2,
  Camera,
  ArrowLeft,
  UserCog,
  FileText,
  Image,
} from "lucide-react";
import toast from "react-hot-toast";

import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import {
  useGetBranchAdminByIdMutation,
  useUpdateBranchAdminMutation,
  useUpdateUserMutation,
} from "@/features/api/authApi";

const UpdateBranchAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const branchAdminId = location.state?.branchAdminId;

  const [getBranchAdminById, { data: adminData, isLoading: isAdminLoading }] =
    useGetBranchAdminByIdMutation();

  useEffect(() => {
    if (branchAdminId) {
      getBranchAdminById({ id: branchAdminId });
    }
  }, [branchAdminId]);

  const [updateBranchAdmin, { isLoading, isSuccess, error }] =
    useUpdateBranchAdminMutation();
  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData }] =
    useGetBranchesByCompanyMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    companies: [], // Changed to array
    branches: [], // Changed to array
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

  const [profileImage, setProfileImage] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");
  
  // Store branches for each selected company
  const [branchesByCompany, setBranchesByCompany] = useState({});

  useEffect(() => {
    if (adminData?.user) {
      const u = adminData.user;
      
      // Get companies from company array
      // Handle both populated objects and plain IDs
      const companyIds = u.company && Array.isArray(u.company) && u.company.length > 0
        ? u.company.map(c => {
            if (typeof c === 'string') return c;
            return c._id || c;
          })
        : [];
      
      // Get branches from branch array
      // Handle both populated objects and plain IDs
      const branchIds = u.branch && Array.isArray(u.branch) && u.branch.length > 0
        ? u.branch.map(b => {
            if (typeof b === 'string') return b;
            return b._id || b;
          })
        : [];
      
      setFormData({
        name: u.name || "",
        email: u.email || "",
        mobile: u.mobile || "",
        companies: companyIds,
        branches: branchIds,
        status: u.status ?? true,
        aadharNumber: u.aadharNumber || "",
        panNumber: u.panNumber || "",
        bankDetails: {
          accountNumber: u.bankDetails?.accountNumber || "",
          ifscCode: u.bankDetails?.ifscCode || "",
          bankName: u.bankDetails?.bankName || "",
          accountHolderName: u.bankDetails?.accountHolderName || "",
        },
      });

      // Fetch branches for all companies
      const fetchBranchesForCompanies = async () => {
        const branchesMap = {};
        for (const companyId of companyIds) {
          try {
            const result = await getBranchesByCompany(companyId);
            branchesMap[companyId] = result?.data?.branches || [];
          } catch (err) {
            console.error(`Failed to fetch branches for company ${companyId}`, err);
          }
        }
        setBranchesByCompany(branchesMap);
      };
      
      if (companyIds.length > 0) {
        fetchBranchesForCompanies();
      }
      setSignaturePreview(u.signature?.url || "");
    }
  }, [adminData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("bank.")) {
      const bankField = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value,
        },
      }));
    } else if (name === "aadharNumber") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === "mobile") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prev) => ({ ...prev, [name]: numericValue.slice(0, 10) }));
    } else if (name === "panNumber") {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(file);
  };

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

  const validateForm = () => {
    const {
      name,
      email,
      companies,
      branches,
      aadharNumber,
      panNumber,
      bankDetails,
      mobile,
    } = formData;

    if (!name || !email || !companies || companies.length === 0 || !branches || branches.length === 0 || !aadharNumber || !panNumber) {
      toast.error("All basic fields are required including at least one company and branch.");
      return false;
    }
    if (mobile && mobile.length !== 10) {
      toast.error("Mobile must be 10 digits if provided.");
      return false;
    }

    if (aadharNumber.length !== 12) {
      toast.error("Aadhar number must be exactly 12 digits.");
      return false;
    }

    if (panNumber.length !== 10) {
      toast.error("PAN number must be exactly 10 characters.");
      return false;
    }

    if (
      !bankDetails.accountNumber ||
      !bankDetails.ifscCode ||
      !bankDetails.bankName ||
      !bankDetails.accountHolderName
    ) {
      toast.error("All bank details are required.");
      return false;
    }

    if (
      bankDetails.accountNumber.length < 9 ||
      bankDetails.accountNumber.length > 18
    ) {
      toast.error("Account number must be between 9-18 digits.");
      return false;
    }

    if (bankDetails.ifscCode.length !== 11) {
      toast.error("IFSC code must be exactly 11 characters.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const { name, email, mobile, companies, branches, status, aadharNumber, panNumber, bankDetails } = formData;

    const payload = new FormData();
    payload.append("userId", branchAdminId);
    payload.append("name", name);
    payload.append("email", email);
    if (mobile) payload.append("mobile", mobile);
    // Append company and branch as JSON strings (multer doesn't auto-create arrays for non-file fields)
    payload.append("company", JSON.stringify(companies));
    payload.append("branch", JSON.stringify(branches));
    payload.append("status", String(status));
    payload.append("aadharNumber", aadharNumber);
    payload.append("panNumber", panNumber);
    payload.append("bankDetails", JSON.stringify(bankDetails));
    if (profileImage) {
      payload.append("profilePhoto", profileImage);
    }
    if (signatureFile) {
      payload.append("signature", signatureFile);
    }

    await updateBranchAdmin(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Branch Admin updated successfully");
      navigate("/admin/branch-admins");
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update Branch Admin");
    }
  }, [isSuccess, error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/branch-admins")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Branch Admins
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <UserCog className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Branch Admin
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update branch admin details and information
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {isAdminLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD249]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
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
                    <Label>Email *</Label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Email Address"
                    />
                  </div>
                  <div>
                    <Label>Mobile *</Label>
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
                    <Label>Profile Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Companies *</Label>
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
                  </div>
                  <div className="md:col-span-2">
                    <Label>Branches *</Label>
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
                  </div>
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

          {/* Signature Upload */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#202020]" />
                Authorized Signature
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <Label>Upload Signature</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSignatureFile(file || null);
                      setSignaturePreview(
                        file ? URL.createObjectURL(file) : signaturePreview
                      );
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PNG, JPG. Recommended transparent
                    background.
                  </p>
                <p className="text-xs text-blue-600 mt-1">
                  This signature automatically appears on generated
                  dockets/invoices.
                </p>
                </div>
                {signaturePreview && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <Label className="text-xs text-gray-600">Current Preview</Label>
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="mt-2 max-h-32 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

            {/* Identity Information */}
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

            {/* Bank Details */}
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

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/branch-admins")}
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
                    Updating...
                  </>
                ) : (
                  "Update Branch Admin"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateBranchAdmin;
