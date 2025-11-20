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
  ArrowLeft,
  Users,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useSelector } from "react-redux";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useCreateOperationUserMutation } from "@/features/api/authApi";

const CreateOperationUser = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    company: isBranchAdmin ? user?.company?._id : "",
    branch: isBranchAdmin ? user?.branch?._id : "",
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
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData, isLoading: branchLoading }] =
    useGetBranchesByCompanyMutation();

  const [createOperationUser, { isLoading, isSuccess, isError, data, error }] =
    useCreateOperationUserMutation();

  useEffect(() => {
    if (!isBranchAdmin && formData.company) {
      getBranchesByCompany(formData.company);
    }
  }, [formData.company]);

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

  const validateForm = () => {
    const {
      name,
      email,
      password,
      company,
      branch,
      aadharNumber,
      panNumber,
      bankDetails,
      mobile,
    } = formData;

    if (
      !name ||
      !email ||
      !password ||
      !company ||
      !branch ||
      !aadharNumber ||
      !panNumber
    ) {
      toast.error("All basic fields are required.");
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

    const submission = new FormData();
    submission.append("name", formData.name);
    submission.append("email", formData.email);
    submission.append("password", formData.password);
    submission.append("mobile", formData.mobile);
    submission.append("company", formData.company);
    submission.append("branch", formData.branch);
    submission.append("status", String(formData.status));
    submission.append("aadharNumber", formData.aadharNumber);
    submission.append("panNumber", formData.panNumber);
    submission.append("bankDetails", JSON.stringify(formData.bankDetails));
    if (signatureFile) {
      submission.append("signature", signatureFile);
    }

    await createOperationUser(submission);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Operation User created successfully");
      navigate("/admin/operation-users");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create Operation User");
    }
  }, [isSuccess, isError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/operation-users")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Operation Users
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Users className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Operation User
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new operation user to your organization
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
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
                  <Label>Company *</Label>
                  {!isBranchAdmin ? (
                    <Select
                      value={formData.company}
                      onValueChange={async (val) => {
                        setFormData((prev) => ({ ...prev, company: val, branch: "" }));
                        try {
                          await getBranchesByCompany(val);
                        } catch {
                          toast.error("Failed to fetch branches");
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companies?.companies?.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={user?.company?.name}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                    />
                  )}
                </div>
                <div>
                  <Label>Branch *</Label>
                  {!isBranchAdmin ? (
                    <Select
                      value={formData.branch}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, branch: val }))
                      }
                      disabled={!formData.company || branchLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchData?.branches?.map((b) => (
                          <SelectItem key={b._id} value={b._id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={user?.branch?.name}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                    />
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
                    setSignaturePreview(file ? URL.createObjectURL(file) : "");
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PNG, JPG. Recommended transparent
                  background.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  This signature is embedded on every docket created by this
                  user.
                </p>
              </div>
              {signaturePreview && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <Label className="text-xs text-gray-600">Preview</Label>
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
              onClick={() => navigate("/admin/operation-users")}
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
                "Create Operation User"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateOperationUser;
