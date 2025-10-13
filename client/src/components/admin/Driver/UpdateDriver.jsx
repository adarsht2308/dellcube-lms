import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Loader2,
  CreditCard,
  Building,
  User,
  Phone,
  MapPin,
  Banknote,
  Hash,
  Building2,
  Camera,
  Car,
  Clock,
  ArrowLeft,
  Truck,
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
    if (driverId) {
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
      const numericValue = value.replace(/\D/g, '');
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else if (name === 'panNumber') {
      setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === 'licenseNumber') {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
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
                Update Driver
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update driver details and information
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {isDriverLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD249]" />
          </div>
        ) : !driverId || (!isDriverLoading && !isDriverFetched) ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Driver not found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                The driver you're looking for doesn't exist.
              </p>
              <Button onClick={() => navigate("/admin/drivers")}>
                Back to Drivers
              </Button>
            </div>
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
                      placeholder="Driver's Name"
                    />
                  </div>
                  <div>
                    <Label>Mobile *</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      placeholder="Mobile Number"
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
                      <span className={`text-xs ${formData.licenseNumber.length < 5 ? 'text-red-500' : formData.licenseNumber.length > 15 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {formData.licenseNumber.length}/20
                      </span>
                    </div>
                  </div>
                  <div>
                    <Label>Experience (Years) *</Label>
                    <Input
                      type="number"
                      value={formData.experienceYears}
                      onChange={(e) =>
                        setFormData({ ...formData, experienceYears: e.target.value })
                      }
                      placeholder="Years of experience"
                    />
                  </div>
                  <div>
                    <Label>Driver Type *</Label>
                    <Select
                      value={formData.driverType}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, driverType: val }))}
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
                        onValueChange={(val) =>
                          setFormData({ ...formData, branch: val })
                        }
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
                  Identity Information (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Aadhar Card Number</Label>
                    <Input
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      placeholder="12-digit Aadhar Number"
                      maxLength="12"
                    />
                  </div>
                  <div>
                    <Label>PAN Card Number</Label>
                    <Input
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleInputChange}
                      placeholder="ABCDE1234F"
                      maxLength="10"
                      style={{ textTransform: 'uppercase' }}
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
                  Bank Account Details (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Account Holder Name</Label>
                    <Input
                      name="bank.accountHolderName"
                      value={formData.bankDetails.accountHolderName}
                      onChange={handleInputChange}
                      placeholder="Account Holder Name"
                    />
                  </div>
                  <div>
                    <Label>Bank Name</Label>
                    <Input
                      name="bank.bankName"
                      value={formData.bankDetails.bankName}
                      onChange={handleInputChange}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      name="bank.accountNumber"
                      value={formData.bankDetails.accountNumber}
                      onChange={handleInputChange}
                      placeholder="Account Number"
                    />
                  </div>
                  <div>
                    <Label>IFSC Code</Label>
                    <Input
                      name="bank.ifscCode"
                      value={formData.bankDetails.ifscCode}
                      onChange={handleInputChange}
                      placeholder="ABCD0123456"
                      style={{ textTransform: 'uppercase' }}
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
                onClick={() => navigate("/admin/drivers")}
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
                  "Update Driver"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateDriver;
