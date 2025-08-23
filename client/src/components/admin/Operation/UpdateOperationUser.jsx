import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, CreditCard, Building, User, Mail, MapPin, Banknote, Hash, Building2, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

  const [getOperationUserById, { data: userData }] =
    useGetOperationUserByIdMutation();
  const [updateOperationUser, { isLoading, isSuccess, error }] =
    useUpdateOperationUserMutation();

  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranches, { data: branchesData }] = useGetBranchesByCompanyMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
    if (name.startsWith('bank.')) {
      const bankField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value,
        },
      }));
    } else if (name === 'aadharNumber') {
      // Only allow digits for Aadhar
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === 'panNumber') {
      // Convert to uppercase for PAN
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
    const { name, email, company, branch, aadharNumber, panNumber, bankDetails } = formData;

    if (!name || !email || !company || !branch || !aadharNumber || !panNumber) {
      toast.error("All basic fields are required.");
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

    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.bankName || !bankDetails.accountHolderName) {
      toast.error("All bank details are required.");
      return false;
    }

    if (bankDetails.accountNumber.length < 9 || bankDetails.accountNumber.length > 18) {
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
    <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Operation User</h2>
      <p className="text-sm mb-6 text-muted-foreground">
        Update operation user details
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#FFD249]" />
            Name
          </Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Name"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#FFD249]" />
            Email
          </Label>
          <Input
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#FFD249]" />
            Change Profile Image
          </Label>
          <Input 
            type="file" 
            accept="image/*" 
            onChange={handleImageChange} 
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>

        {/* Company */}
        <div>
          <Label className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#FFD249]" />
            Company
          </Label>
          {isBranchAdmin ? (
            <Input
              value={
                companies?.companies?.find((c) => c._id === formData.company)?.name || "Company"
              }
              disabled
              className="bg-gray-100 cursor-not-allowed mt-2"
            />
          ) : (
            <Select
              value={formData.company}
              onValueChange={(val) => {
                setFormData({ ...formData, company: val, branch: "" });
                getBranches(val);
              }}
            >
              <SelectTrigger className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]">
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

        {/* Branch */}
        <div>
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFD249]" />
            Branch
          </Label>
          {isBranchAdmin ? (
            <Input
              value={
                branchesData?.branches?.find((b) => b._id === formData.branch)?.name || "Branch"
              }
              disabled
              className="bg-gray-100 cursor-not-allowed mt-2"
            />
          ) : (
            <Select
              value={formData.branch}
              onValueChange={(val) =>
                setFormData({ ...formData, branch: val })
              }
              disabled={!formData.company}
            >
              <SelectTrigger className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]">
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

        <div>
          <Label className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#FFD249]" />
            Aadhar Card Number
          </Label>
          <Input
            name="aadharNumber"
            value={formData.aadharNumber}
            onChange={handleInputChange}
            placeholder="12-digit Aadhar Number"
            maxLength="12"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249] font-mono"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#FFD249]" />
            PAN Card Number
          </Label>
          <Input
            name="panNumber"
            value={formData.panNumber}
            onChange={handleInputChange}
            placeholder="ABCDE1234F"
            maxLength="10"
            style={{ textTransform: 'uppercase' }}
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249] font-mono"
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-lg font-semibold mb-3 block flex items-center gap-2">
            <Banknote className="w-5 h-5 text-[#FFD249]" />
            Bank Account Details
          </Label>
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#FFD249]" />
            Account Holder Name
          </Label>
          <Input
            name="bank.accountHolderName"
            value={formData.bankDetails.accountHolderName}
            onChange={handleInputChange}
            placeholder="Account Holder Name"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#FFD249]" />
            Bank Name
          </Label>
          <Input
            name="bank.bankName"
            value={formData.bankDetails.bankName}
            onChange={handleInputChange}
            placeholder="Bank Name"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#FFD249]" />
            Account Number
          </Label>
          <Input
            name="bank.accountNumber"
            value={formData.bankDetails.accountNumber}
            onChange={handleInputChange}
            placeholder="Account Number"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249] font-mono"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-[#FFD249]" />
            IFSC Code
          </Label>
          <Input
            name="bank.ifscCode"
            value={formData.bankDetails.ifscCode}
            onChange={handleInputChange}
            placeholder="ABCD0123456"
            style={{ textTransform: 'uppercase' }}
            maxLength="11"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249] font-mono"
          />
        </div>

        {/* Status */}
        <div className="flex items-center gap-4 mt-2">
          <Label>Status</Label>
          <Switch
            checked={formData.status}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, status: checked }))
            }
          />
          <span>{formData.status ? "Active" : "Inactive"}</span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/admin/operation-users")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleUpdate} className="bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90">
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
  );
};

export default UpdateOperations;
