import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { Loader2, CreditCard, Building, User, Mail, MapPin, Banknote, Hash, Building2, Camera } from "lucide-react";
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


  const [updateBranchAdmin, { isLoading, isSuccess, error }] = useUpdateBranchAdminMutation();
  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData }] = useGetBranchesByCompanyMutation();

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
    if (adminData?.user) {
      const u = adminData.user;
      setFormData({
        name: u.name || "",
        email: u.email || "",
        company: u.company?._id || "",
        branch: u.branch?._id || "",
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

      if (u.company?._id) {
        getBranchesByCompany(u.company._id);
      }
    }
  }, [adminData]);

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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = new FormData();
    payload.append("userId",branchAdminId)
    payload.append("name", name);
    payload.append("email", email);
    payload.append("company", company);
    payload.append("branch", branch);
    payload.append("status", status);
    payload.append("aadharNumber", aadharNumber);
    payload.append("panNumber", panNumber);
    payload.append("bankDetails", JSON.stringify(bankDetails));
    if (profileImage) {
      payload.append("profilePhoto", profileImage);
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
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Edit Branch Admin</h2>
      <p className="text-sm mb-4 text-gray-500">Update branch admin details</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#FFD249]" />
            Name
          </Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Full Name"
            className="focus:border-[#FFD249] mt-2  focus:ring-[#FFD249]"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#FFD249]" />
            Email
          </Label>
          <Input
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email Address"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#FFD249]" />
            Change Profile Image
          </Label>
          <Input type="file" accept="image/*" onChange={handleImageChange} className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]" />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#FFD249]" />
            Company
          </Label>
          <Select
            value={formData.company}
            onValueChange={async (val) => {
              setFormData((prev) => ({ ...prev, company: val, branch: "" }));
              await getBranchesByCompany(val);
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
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#FFD249]" />
            Branch
          </Label>
          <Select
            value={formData.branch}
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, branch: val }))
            }
            disabled={!formData.company}
          >
            <SelectTrigger className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]">
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

        <div className="flex items-center gap-4 mt-2">
          <Label htmlFor="status-toggle">Active Status</Label>
          <Switch
            id="status-toggle"
            checked={formData.status}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, status: checked }))
            }
          />
          <span className="text-sm text-gray-500">
            {formData.status ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/branch-admins")}
        >
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit} className="bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90">
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
  );
};

export default UpdateBranchAdmin;
