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

import { useSelector } from "react-redux";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useCreateDriverMutation } from "@/features/api/authApi";
import { useGetAllVendorsQuery } from "@/features/api/Vendor/vendorApi";

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
    driverType: user?.role === "vendor" ? "vendor" : "dellcube",
    company: isBranchAdmin ? user?.company?._id : "",
    branch: isBranchAdmin ? user?.branch?._id : "",
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
  
  const { data: vendorsData } = useGetAllVendorsQuery({
    page: 1,
    limit: 100,
    companyId: formData.company || "",
    branchId: formData.branch || "",
  });

  const [createDriver, { isLoading, isSuccess, isError, data, error }] =
    useCreateDriverMutation();

  useEffect(() => {
    if (!isBranchAdmin && formData.company) {
      getBranchesByCompany(formData.company);
    }
  }, [formData.company]);

  useEffect(() => {
    if (formData.driverType !== "vendor") {
      setFormData((prev) => ({ ...prev, vendor: "" }));
    }
  }, [formData.driverType]);

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
      company,
      branch,
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
      !company ||
      !branch ||
      !driverType
    ) {
      toast.error("All required fields are required.");
      return false;
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

    if (experienceYears < 0 || experienceYears > 50) {
      toast.error("Experience years must be between 0 and 50.");
      return false;
    }

    if (!aadharNumber || !aadharNumber.trim()) {
      toast.error("Aadhar Card Number is required.");
      return false;
    }

    if (aadharNumber.length !== 12 || !/^\d{12}$/.test(aadharNumber)) {
      toast.error("Aadhar Card Number must be exactly 12 digits.");
      return false;
    }

    if (!panNumber || !panNumber.trim()) {
      toast.error("PAN Card Number is required.");
      return false;
    }

    if (panNumber.length !== 10 || !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)) {
      toast.error("PAN Card Number must be in valid format (e.g., ABCDE1234F).");
      return false;
    }

    // Bank Details Validation
    const { accountHolderName, bankName, accountNumber, ifscCode } = formData.bankDetails;
    
    if (!accountHolderName || !accountHolderName.trim()) {
      toast.error("Account Holder Name is required.");
      return false;
    }

    if (!bankName || !bankName.trim()) {
      toast.error("Bank Name is required.");
      return false;
    }

    if (!accountNumber || !accountNumber.trim()) {
      toast.error("Account Number is required.");
      return false;
    }

    if (!ifscCode || !ifscCode.trim()) {
      toast.error("IFSC Code is required.");
      return false;
    }

    if (ifscCode.length !== 11 || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)) {
      toast.error("IFSC Code must be in valid format (e.g., ABCD0123456).");
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
                    <Label>Vendor *</Label>
                    <Select
                      value={formData.vendor}
                      onValueChange={(val) =>
                        setFormData((prev) => ({ ...prev, vendor: val }))
                      }
                      disabled={!formData.company || !formData.branch}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorsData?.vendors?.length > 0 ? (
                          vendorsData.vendors.map((v) => (
                            <SelectItem key={v._id} value={v._id}>
                              {v.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            {!formData.company || !formData.branch
                              ? "Please select company and branch first"
                              : "No vendors available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
