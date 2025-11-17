import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
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
  Users,
  FileText,
} from "lucide-react";

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

import { useSelector } from "react-redux";
import {
  useGetOperationUserByIdMutation,
  useUpdateOperationUserMutation,
} from "@/features/api/authApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";

const UpdateOperations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const currentUser = useSelector((state) => state.auth.user);
  const isBranchAdmin = currentUser?.role === "branchAdmin";

  const [getOperationUserById, { data: userData, isLoading: isUserLoading }] =
    useGetOperationUserByIdMutation();
  const [updateOperationUser, { isLoading, isSuccess, error }] =
    useUpdateOperationUserMutation();

  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranches, { data: branchesData }] =
    useGetBranchesByCompanyMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    company: "",
    branch: "",
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

  useEffect(() => {
    if (userId) getOperationUserById({ id: userId });
  }, [userId]);

  useEffect(() => {
    if (userData?.user) {
      const u = userData.user;

      setFormData({
        name: u.name || "",
        email: u.email || "",
        mobile: u.mobile || "",
        company: u.company?._id || "",
        branch: u.branch?._id || "",
        status: u.status || false,
        aadharNumber: u.aadharNumber || "",
        panNumber: u.panNumber || "",
        bankDetails: {
          accountNumber: u.bankDetails?.accountNumber || "",
          ifscCode: u.bankDetails?.ifscCode || "",
          bankName: u.bankDetails?.bankName || "",
          accountHolderName: u.bankDetails?.accountHolderName || "",
        },
      });

      if (u.company?._id) getBranches(u.company._id);
    }
  }, [userData]);

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

  const validateForm = () => {
    const {
      name,
      email,
      company,
      branch,
      aadharNumber,
      panNumber,
      bankDetails,
      mobile,
    } = formData;

    if (!name || !email || !company || !branch || !aadharNumber || !panNumber) {
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

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = new FormData();
    payload.append("userId", userId);
    payload.append("name", formData.name);
    payload.append("email", formData.email);
    if (formData.mobile) payload.append("mobile", formData.mobile);
    payload.append("company", formData.company);
    payload.append("branch", formData.branch);
    payload.append("status", formData.status);
    payload.append("aadharNumber", formData.aadharNumber);
    payload.append("panNumber", formData.panNumber);
    payload.append("bankDetails", JSON.stringify(formData.bankDetails));
    if (profileImage) {
      payload.append("profilePhoto", profileImage);
    }

    await updateOperationUser(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Operation User Updated Successfully");
      setTimeout(() => navigate("/admin/operation-users"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isSuccess, error]);

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
                Update Operation User
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update operation user details and information
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {isUserLoading ? (
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Name"
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <Label>Mobile *</Label>
                    <Input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setFormData({ ...formData, mobile: v });
                      }}
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
                  <div>
                    <Label>Company *</Label>
                    {isBranchAdmin ? (
                      <Input
                        value={
                          companies?.companies?.find((c) => c._id === formData.company)
                            ?.name || "Company"
                        }
                        disabled
                        className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                      />
                    ) : (
                      <Select
                        value={formData.company}
                        onValueChange={(val) => {
                          setFormData({ ...formData, company: val, branch: "" });
                          getBranches(val);
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
                    )}
                  </div>
                  <div>
                    <Label>Branch *</Label>
                    {isBranchAdmin ? (
                      <Input
                        value={
                          branchesData?.branches?.find((b) => b._id === formData.branch)
                            ?.name || "Branch"
                        }
                        disabled
                        className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                      />
                    ) : (
                      <Select
                        value={formData.branch}
                        onValueChange={(val) => setFormData({ ...formData, branch: val })}
                        disabled={!formData.company}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branchesData?.branches?.map((b) => (
                            <SelectItem key={b._id} value={b._id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>Status</Label>
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
                onClick={handleUpdate}
                className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                  </>
                ) : (
                  "Update Operation User"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateOperations;
