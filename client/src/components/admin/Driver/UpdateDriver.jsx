import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, CreditCard, Building, User, Phone, MapPin, Banknote, Hash, Building2, Camera, Car, Clock } from "lucide-react";
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
  useGetDriverByIdMutation,
  useUpdateDriverMutation,
} from "@/features/api/authApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";

const UpdateDriver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const driverId = location.state?.driverId;

  const currentUser = useSelector((state) => state.auth.user);
  const isBranchAdmin = currentUser?.role === "branchAdmin";

  const [getDriverById, { data: driverData, isSuccess: isDriverFetched, isLoading: isDriverLoading }] = useGetDriverByIdMutation();
  console.log(driverData);
  const [updateDriver, { isLoading, isSuccess, error }] =
    useUpdateDriverMutation();

  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranches, { data: branchesData }] =
    useGetBranchesByCompanyMutation();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    licenseNumber: "",
    experienceYears: "",
    driverType: "dellcube",
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
    console.log("DriverId:", driverId);
    if (driverId) {
      console.log("Calling getDriverById with:", { id: driverId });
      getDriverById({ id: driverId });
    }
  }, [driverId]);

  useEffect(() => {
    if (isDriverFetched && driverData?.user) {
      const d = driverData.user;

      setFormData({
        name: d.name || "",
        mobile: d.mobile || "",
        licenseNumber: d.licenseNumber || "",
        experienceYears: d.experienceYears || "",
        driverType: d.driverType || "dellcube",
        company: d.company?._id || "",
        branch: d.branch?._id || "",
        status: d.status || false,
        aadharNumber: d.aadharNumber || "",
        panNumber: d.panNumber || "",
        bankDetails: {
          accountNumber: d.bankDetails?.accountNumber || "",
          ifscCode: d.bankDetails?.ifscCode || "",
          bankName: d.bankDetails?.bankName || "",
          accountHolderName: d.bankDetails?.accountHolderName || "",
        },
      });

      if (d.company?._id) getBranches(d.company._id);
    }
  }, [isDriverFetched, driverData]);

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
    const { name, mobile, licenseNumber, experienceYears, company, branch, driverType } = formData;
    
    if (!name.trim()) {
      toast.error("Name is required");
      return false;
    }
    if (!mobile.trim()) {
      toast.error("Mobile is required");
      return false;
    }
    if (!licenseNumber.trim()) {
      toast.error("License Number is required");
      return false;
    }
    if (!experienceYears) {
      toast.error("Experience is required");
      return false;
    }
    if (!company) {
      toast.error("Company is required");
      return false;
    }
    if (!branch) {
      toast.error("Branch is required");
      return false;
    }
    if (!driverType) {
      toast.error("Driver Type is required");
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(file);
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    const payload = new FormData();
    payload.append("userId", driverId);
    payload.append("name", formData.name);
    payload.append("mobile", formData.mobile);
    payload.append("licenseNumber", formData.licenseNumber);
    payload.append("experienceYears", formData.experienceYears);
    payload.append("driverType", formData.driverType);
    payload.append("company", formData.company);
    payload.append("branch", formData.branch);
    payload.append("status", formData.status);
    payload.append("aadharNumber", formData.aadharNumber);
    payload.append("panNumber", formData.panNumber);
    payload.append("bankDetails", JSON.stringify(formData.bankDetails));
    if (profileImage) {
      payload.append("profilePhoto", profileImage);
    }

    await updateDriver(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Driver Updated Successfully");
      setTimeout(() => navigate("/admin/drivers"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isSuccess, error]);

  // Show loading state while fetching driver data
  if (isDriverLoading) {
    return (
      <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading driver data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no driver data found
  if (!driverId || (!isDriverLoading && !isDriverFetched)) {
    return (
      <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Driver not found</h3>
            <p className="text-muted-foreground mb-4">The driver you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/admin/drivers")}>
              Back to Drivers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Driver</h2>
      <p className="text-sm mb-6 text-muted-foreground">
        Update driver details
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
            placeholder="Driver's Name"
            className="focus:border-[#FFD249] mt-2 focus:ring-[#FFD249]"
          />
        </div>

        <div>
          <Label className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#FFD249]" />
            Mobile
          </Label>
          <Input
            value={formData.mobile}
            onChange={(e) =>
              setFormData({ ...formData, mobile: e.target.value })
            }
            placeholder="Mobile Number"
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
            value={formData.experienceYears}
            onChange={(e) =>
              setFormData({ ...formData, experienceYears: e.target.value })
            }
            placeholder="Years of experience"
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

        {/* Company */}
        <div>
          <Label className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#FFD249]" />
            Company
          </Label>
          {isBranchAdmin ? (
            <Input
              value={
                companies?.companies?.find((c) => c._id === formData.company)
                  ?.name || "Company"
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
                branchesData?.branches?.find((b) => b._id === formData.branch)
                  ?.name || "Branch"
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
        <Button variant="outline" onClick={() => navigate("/admin/drivers")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleUpdate} className="bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Driver"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateDriver;
