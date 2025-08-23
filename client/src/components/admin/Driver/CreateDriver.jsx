import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2, CreditCard, Building, User, Mail, Lock, MapPin, Banknote, Hash, Building2, Phone, Car, Clock } from "lucide-react";
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
import { useCreateDriverMutation } from "@/features/api/authApi";

const CreateDriver = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    password: "",
    licenseNumber: "",
    experienceYears: "",
    driverType: "dellcube",
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

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData, isLoading: branchLoading }] =
    useGetBranchesByCompanyMutation();

  const [createDriver, { isLoading, isSuccess, isError, data, error }] =
    useCreateDriverMutation();

  useEffect(() => {
    if (!isBranchAdmin && formData.company) {
      getBranchesByCompany(formData.company);
    }
  }, [formData.company]);

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
    } else if (name === 'licenseNumber') {
      // License number validation: Allow alphanumeric, hyphens, and spaces
      const cleanValue = value.replace(/[^A-Za-z0-9\-\s]/g, '');
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = () => {
    const { name, mobile, password, licenseNumber, experienceYears, company, branch, driverType } = formData;
    
    if (!name || !mobile || !password || !licenseNumber || !experienceYears || !company || !branch || !driverType) {
      toast.error("All required fields are required.");
      return false;
    }

    // License number validation
    if (licenseNumber.length < 5) {
      toast.error("License number must be at least 5 characters long.");
      return false;
    }

    if (licenseNumber.length > 20) {
      toast.error("License number must not exceed 20 characters.");
      return false;
    }

    // Mobile validation
    if (mobile.length !== 10 || !/^\d{10}$/.test(mobile)) {
      toast.error("Mobile number must be exactly 10 digits.");
      return false;
    }

    // Experience validation
    if (experienceYears < 0 || experienceYears > 50) {
      toast.error("Experience years must be between 0 and 50.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    await createDriver(formData);
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
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add Driver</h2>
      <p className="text-sm mb-4 text-gray-500">
        Assign driver to a branch under a company
      </p>

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
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#FFD249]" />
            Mobile Number
          </Label>
          <Input
            name="mobile"
            value={formData.mobile}
            onChange={handleInputChange}
            placeholder="Phone number"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FFD249]" />
            Password
          </Label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Set Password"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[#FFD249]" />
            License Number
          </Label>
          <Input
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleInputChange}
            placeholder="Driver's License Number (e.g., DL-0123456789)"
            maxLength="20"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249] font-mono"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">
              Alphanumeric, hyphens, spaces allowed
            </span>
            <span className={`text-xs ${formData.licenseNumber.length < 5 ? 'text-red-500' : formData.licenseNumber.length > 15 ? 'text-yellow-500' : 'text-green-500'}`}>
              {formData.licenseNumber.length}/20
            </span>
          </div>
          {formData.licenseNumber && formData.licenseNumber.length < 5 && (
            <p className="text-xs text-red-500 mt-1">License number must be at least 5 characters</p>
          )}
        </div>
        <div>
          <Label className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#FFD249]" />
            Experience (Years)
          </Label>
          <Input
            type="number"
            name="experienceYears"
            value={formData.experienceYears}
            onChange={handleInputChange}
            placeholder="Years of Experience"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Car className="w-4 h-4 text-[#FFD249]" />
            Driver Type
          </Label>
          <Select
            value={formData.driverType}
            onValueChange={(val) => setFormData((prev) => ({ ...prev, driverType: val }))}
          >
            <SelectTrigger className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]">
              <SelectValue placeholder="Select Driver Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dellcube">Dellcube Driver</SelectItem>
              <SelectItem value="vendor">Vendor Driver</SelectItem>
              <SelectItem value="temporary">Temporary Driver</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isBranchAdmin ? (
          <div>
            <Label className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FFD249]" />
              Company
            </Label>
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
        ) : (
          <div>
            <Label className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#FFD249]" />
              Company
            </Label>
            <Input
              value={user?.company?.name}
              disabled
              className="bg-gray-100 cursor-not-allowed mt-2"
            />
          </div>
        )}

        {!isBranchAdmin ? (
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
              disabled={!formData.company || branchLoading}
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
        ) : (
          <div>
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FFD249]" />
              Branch
            </Label>
            <Input
              value={user?.branch?.name}
              disabled
              className="bg-gray-100 cursor-not-allowed mt-2"
            />
          </div>
        )}

        <div>
          <Label className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#FFD249]" />
            Aadhar Card Number (Optional)
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
            PAN Card Number (Optional)
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
            Bank Account Details (Optional)
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

        {/* Status toggle */}
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
        <Button variant="outline" onClick={() => navigate("/admin/drivers")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit} className="bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90">
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
  );
};

export default CreateDriver;
