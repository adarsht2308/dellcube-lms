import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Car, CreditCard, Calendar, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

import { useCreateVehicleMutation } from "@/features/api/Vehicle/vehicleApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";


import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllDriversQuery } from "@/features/api/authApi.js";
import { getTokenData } from "@/utils/getTokenData";

const CreateVehicle = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isVendor = user?.role === "vendor";

  const [formData, setFormData] = useState({
    vehicleNumber: "",
    type: "",
    cargoType: "",
    brand: "",
    model: "",
    yearOfManufacture: "",
    registrationDate: "",
    fitnessCertificateExpiry: "",
    insuranceExpiry: "",
    pollutionCertificateExpiry: "",
    status: "active",
    currentDriver: "",
    company: "",
    branch: "",
    vehicleInsuranceNo: "",
    fitnessNo: "",
  });

  const [branches, setBranches] = useState([]);
  const { data: companies = [] } = useGetAllCompaniesQuery({ status: "true" });
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const [createVehicle, { isLoading, isSuccess, isError, error, data }] =
    useCreateVehicleMutation();
  const { data: driversData } = useGetAllDriversQuery({});
  console.log(driversData)
  

  const [certificateFiles, setCertificateFiles] = useState({
    fitnessCertificateImage: null,
    pollutionCertificateImage: null,
    registrationCertificateImage: null,
    insuranceImage: null,
  });

  useEffect(() => {
    // Get companyId and branchId from token as fallback
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    
    if (isBranchAdmin && user?.company && user?.branch) {
      // Handle both array and single value formats
      const companyId = Array.isArray(user.company) && user.company.length > 0
        ? String(user.company[0]._id || user.company[0])
        : (user.company._id ? String(user.company._id) : tokenCompanyId);
      const branchId = Array.isArray(user.branch) && user.branch.length > 0
        ? String(user.branch[0]._id || user.branch[0])
        : (user.branch._id ? String(user.branch._id) : tokenBranchId);
      
      setFormData((prev) => ({
        ...prev,
        company: companyId || prev.company,
        branch: branchId || prev.branch,
      }));
    } else if (isVendor && user?.company && user?.branch) {
      // Handle both array and single value formats
      const companyId = Array.isArray(user.company) && user.company.length > 0
        ? String(user.company[0]._id || user.company[0])
        : (user.company._id ? String(user.company._id) : tokenCompanyId);
      const branchId = Array.isArray(user.branch) && user.branch.length > 0
        ? String(user.branch[0]._id || user.branch[0])
        : (user.branch._id ? String(user.branch._id) : tokenBranchId);
      
      setFormData((prev) => ({
        ...prev,
        company: companyId || prev.company,
        branch: branchId || prev.branch,
      }));
    } else if (tokenCompanyId && tokenBranchId) {
      // Use token values if no user company/branch
      setFormData((prev) => ({
        ...prev,
        company: prev.company || tokenCompanyId,
        branch: prev.branch || tokenBranchId,
      }));
    }
  }, [user, isBranchAdmin, isVendor]);

  const handleCompanyChange = async (companyId) => {
    setFormData((prev) => ({
      ...prev,
      company: isBranchAdmin || isVendor ? prev?.company : companyId,
      branch: isBranchAdmin || isVendor ? prev?.branch : "",
    }));

    const res = await getBranchesByCompany(companyId);

    if (res?.data?.branches) {
      setBranches(res?.data?.branches);
    } else {
      setBranches([]);
    }
  };

  useEffect(() => {
    if (!isBranchAdmin && !isVendor && formData.company) {
      handleCompanyChange(formData.company);
    } else if (isBranchAdmin && user?.company) {
      handleCompanyChange(user.company);
    } else if (isVendor && user?.company) {
      handleCompanyChange(user.company);
    }
  }, []);

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Vehicle created successfully");
      navigate("/admin/vehicles");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create vehicle");
    }
  }, [isSuccess, isError]);

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setCertificateFiles((prev) => ({ ...prev, [name]: files[0] }));
  };

  const handleSubmit = async () => {
    const { vehicleNumber, type } = formData;

    // Get companyId and branchId from token as fallback
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    const finalCompany = formData.company || tokenCompanyId;
    const finalBranch = formData.branch || tokenBranchId;

    if (!vehicleNumber || !type || !finalCompany || !finalBranch) {
      toast.error("Vehicle Number, Type, Company, and Branch are required");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });
    // Ensure company and branch are set (use token values if formData values are empty)
    if (finalCompany) payload.set("company", finalCompany);
    if (finalBranch) payload.set("branch", finalBranch);
    Object.entries(certificateFiles).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });
    payload.append("createdBy", user?._id);

    await createVehicle(payload);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/vehicles")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vehicles
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Car className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Vehicle
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new vehicle to your fleet
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information Card */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Number *
                </Label>
                <Input
                  placeholder="e.g. MH-12-AB-1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => {
                    // Replace spaces with hyphens and convert to uppercase
                    const formatted = e.target.value.replace(/\s+/g, "-").toUpperCase();
                    setFormData({ ...formData, vehicleNumber: formatted });
                  }}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Type (Size) *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["6ft", "7ft", "8ft", "9ft", "10ft", "12ft", "14ft", "16ft", "17ft", "18ft", "19ft", "20ft", "22ft", "24ft", "28ft", "32ft"].map(
                      (type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cargo Type
                </Label>
                <Select
                  value={formData.cargoType}
                  onValueChange={(value) => setFormData({ ...formData, cargoType: value })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select cargo type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Dry", "Refrigerated", "Container", "Open", "Closed", "Flatbed", "Tanker", "Other"].map(
                      (cargoType) => (
                        <SelectItem key={cargoType} value={cargoType}>
                          {cargoType}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "active",
                      "under_maintenance",
                      "inactive",
                      "decommissioned",
                    ].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Driver Name
                </Label>
                <Select
                  value={formData.currentDriver}
                  onValueChange={(val) => setFormData({ ...formData, currentDriver: val })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversData?.drivers
                      ?.filter((driver) => {
                        // For vendors, exclude dellcube drivers
                        if (isVendor) {
                          return driver.driverType !== "dellcube";
                        }
                        // For others, show all drivers
                        return true;
                      })
                      ?.map((driver) => (
                        <SelectItem key={driver._id} value={driver._id}>
                          {driver.name} - {driver.mobile} - {driver.driverType}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Brand
                </Label>
                <Input
                  placeholder="e.g., Tata"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model
                </Label>
                <Input
                  placeholder="e.g., Ace"
                  value={formData.model}
                  onChange={(e) =>
                    setFormData({ ...formData, model: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Year of Manufacture
                </Label>
                <Input
                  type="number"
                  placeholder="e.g., 2020"
                  value={formData.yearOfManufacture}
                  onChange={(e) =>
                    setFormData({ ...formData, yearOfManufacture: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registration Date
                </Label>
                <Input
                  type="date"
                  value={formData.registrationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, registrationDate: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </Card>

          {/* Certificate Information Card */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Certificate Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fitness Certificate Expiry
                </Label>
                <Input
                  type="date"
                  value={formData.fitnessCertificateExpiry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fitnessCertificateExpiry: e.target.value,
                    })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Insurance Expiry
                </Label>
                <Input
                  type="date"
                  value={formData.insuranceExpiry}
                  onChange={(e) =>
                    setFormData({ ...formData, insuranceExpiry: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pollution Certificate Expiry
                </Label>
                <Input
                  type="date"
                  value={formData.pollutionCertificateExpiry}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pollutionCertificateExpiry: e.target.value,
                    })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Insurance Number
                </Label>
                <Input
                  placeholder="e.g., INS123456789"
                  value={formData.vehicleInsuranceNo}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleInsuranceNo: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fitness Number
                </Label>
                <Input
                  placeholder="e.g., FC123456789"
                  value={formData.fitnessNo}
                  onChange={(e) =>
                    setFormData({ ...formData, fitnessNo: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </Card>

          {/* Certificate Images Card */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Certificate Images (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fitness Certificate Image
                </Label>
                <Input 
                  type="file" 
                  name="fitnessCertificateImage" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pollution Certificate Image
                </Label>
                <Input 
                  type="file" 
                  name="pollutionCertificateImage" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registration Certificate Image
                </Label>
                <Input 
                  type="file" 
                  name="registrationCertificateImage" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Insurance Image
                </Label>
                <Input 
                  type="file" 
                  name="insuranceImage" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="mt-1.5"
                />
              </div>
            </div>
          </Card>

          {/* Company & Branch Information Card */}
          {!isBranchAdmin && !isVendor && (
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Company & Branch Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company *
                  </Label>
                  <Select
                    value={formData.company}
                    onValueChange={handleCompanyChange}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {(companies?.companies || []).map((comp) => (
                        <SelectItem key={comp._id} value={comp._id}>
                          {comp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch *
                  </Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) =>
                      setFormData({ ...formData, branch: value })
                    }
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/vehicles")}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Vehicle"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateVehicle;
