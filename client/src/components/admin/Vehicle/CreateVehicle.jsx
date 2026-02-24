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
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useGetAllDriversQuery } from "@/features/api/authApi.js";
import { getTokenData } from "@/utils/getTokenData";

const CreateVehicle = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isOperation = user?.role === "operation";
  const isVendor = user?.role === "vendor";
  const shouldHideCompanyBranch = isBranchAdmin || isOperation || isVendor;

  // Get companyId and branchId from token (current session)
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();

  // Helper function to get company ID - prioritize token (current session)
  const getUserCompanyId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenCompanyId) return tokenCompanyId;
    // Fallback to user profile data
    if (user?.company?._id) return user.company._id;
    if (Array.isArray(user?.company) && user.company.length > 0) return user.company[0]._id;
    return null;
  };

  // Helper function to get branch ID - prioritize token (current session)
  const getUserBranchId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenBranchId) return tokenBranchId;
    // Fallback to user profile data
    if (user?.branch?._id) return user.branch._id;
    if (Array.isArray(user?.branch) && user.branch.length > 0) return user.branch[0]._id;
    return null;
  };

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
    companies: [],
    branches: [],
    vehicleInsuranceNo: "",
    fitnessNo: "",
  });

  const [branches, setBranches] = useState([]);
  const [branchesByCompany, setBranchesByCompany] = useState({});
  const { data: companies = [] } = useGetAllCompaniesQuery({ status: "true" });
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const [createVehicle, { isLoading, isSuccess, isError, error, data }] =
    useCreateVehicleMutation();
  const { data: driversData } = useGetAllDriversQuery({ page: 1, limit: 1000 });
  console.log(driversData)
  
  // State to store current session's company and branch names for display
  const [currentSessionCompanyName, setCurrentSessionCompanyName] = useState("");
  const [currentSessionBranchName, setCurrentSessionBranchName] = useState("");

  const [certificateFiles, setCertificateFiles] = useState({
    fitnessCertificateImage: null,
    pollutionCertificateImage: null,
    registrationCertificateImage: null,
    insuranceImage: null,
  });

  useEffect(() => {
    // Get companyId and branchId from token (current session)
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    
    if (shouldHideCompanyBranch) {
      // For operation, branchAdmin, vendor - use token data (current session)
      const companyId = getUserCompanyId();
      const branchId = getUserBranchId();
      
      if (companyId && branchId) {
        setFormData((prev) => ({
          ...prev,
          company: String(companyId),
          branch: String(branchId),
        }));
        
        // Fetch branches and set display names
        getBranchesByCompany(companyId).then((res) => {
          if (res?.data?.branches) {
            setBranches(res.data.branches);
            const currentBranch = res.data.branches.find(b => b._id === branchId);
            if (currentBranch) {
              setCurrentSessionBranchName(currentBranch.name);
            }
          }
        });
        
        // Find and set company name
        if (companies?.companies) {
          const currentCompany = companies.companies.find(c => c._id === companyId);
          if (currentCompany) {
            setCurrentSessionCompanyName(currentCompany.name);
          }
        }
      }
    } else if (tokenCompanyId && tokenBranchId) {
      // For superAdmin - use token values if no form data
      setFormData((prev) => ({
        ...prev,
        company: prev.company || tokenCompanyId,
        branch: prev.branch || tokenBranchId,
      }));
    }
  }, [user, shouldHideCompanyBranch, companies]);

  const handleCompanyChange = async (companyId) => {
    if (shouldHideCompanyBranch) return;
    setFormData((prev) => ({ ...prev, company: companyId, branch: "" }));
    const res = await getBranchesByCompany(companyId);
    setBranches(res?.data?.branches || []);
  };

  const handleVehicleCompanyToggle = async (cid) => {
    const isSelected = formData.companies.includes(cid);
    if (isSelected) {
      const newCompanies = formData.companies.filter((id) => id !== cid);
      const branchIdsFromCompany = (branchesByCompany[cid] || []).map((b) => b._id);
      const newBranches = formData.branches.filter((id) => !branchIdsFromCompany.includes(id));
      setBranchesByCompany((prev) => {
        const next = { ...prev };
        delete next[cid];
        return next;
      });
      setFormData((prev) => ({ ...prev, companies: newCompanies, branches: newBranches }));
    } else {
      setFormData((prev) => ({ ...prev, companies: [...prev.companies, cid] }));
      try {
        const res = await getBranchesByCompany(cid);
        if (res?.data?.branches) setBranchesByCompany((prev) => ({ ...prev, [cid]: res.data.branches }));
      } catch {
        toast.error("Failed to load branches for company");
      }
    }
  };

  const handleVehicleBranchToggle = (bid) => {
    const isSelected = formData.branches.includes(bid);
    setFormData((prev) => ({
      ...prev,
      branches: isSelected ? prev.branches.filter((id) => id !== bid) : [...prev.branches, bid],
    }));
  };

  useEffect(() => {
    if (!shouldHideCompanyBranch && formData.company) {
      handleCompanyChange(formData.company);
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

  const getCompanyBranchAssignments = () => {
    const assignments = [];
    formData.branches.forEach((branchId) => {
      for (const [cid, branchList] of Object.entries(branchesByCompany)) {
        if (branchList.some((b) => b._id === branchId)) {
          assignments.push({ company: cid, branch: branchId });
          break;
        }
      }
    });
    return assignments;
  };

  const handleSubmit = async () => {
    const { vehicleNumber, type } = formData;
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();

    let finalCompany, finalBranch;
    let companyBranchAssignments = null;

    if (shouldHideCompanyBranch) {
      finalCompany = getUserCompanyId() || tokenCompanyId || "";
      finalBranch = getUserBranchId() || tokenBranchId || "";
    } else {
      if (formData.companies?.length > 0 && formData.branches?.length > 0) {
        companyBranchAssignments = getCompanyBranchAssignments();
        if (companyBranchAssignments.length === 0) {
          toast.error("Please select at least one company and branch");
          return;
        }
        finalCompany = companyBranchAssignments[0].company;
        finalBranch = companyBranchAssignments[0].branch;
      } else {
        finalCompany = formData.company || tokenCompanyId || "";
        finalBranch = formData.branch || tokenBranchId || "";
      }
    }

    if (!vehicleNumber || !type || !finalCompany || !finalBranch) {
      toast.error("Vehicle Number, Type, and at least one Company-Branch are required");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "companies" || key === "branches") return;
      if (value !== "" && value !== undefined) payload.append(key, value);
    });
    payload.set("company", finalCompany);
    payload.set("branch", finalBranch);
    if (companyBranchAssignments && companyBranchAssignments.length > 0) {
      payload.append("companyBranchAssignments", JSON.stringify(companyBranchAssignments));
    }
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
                  placeholder="e.g. MH04AB1234"
                  value={formData.vehicleNumber}
                  onChange={(e) => {
                    setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() });
                  }}
                  className="mt-1.5"
                />
                {formData.vehicleNumber && formData.vehicleNumber.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter vehicle registration number
                  </p>
                )}
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
                    {[
                      "14 Feet",
                      "17 Feet",
                      "19 Feet",
                      "20 Feet",
                      "22 Feet",
                      "24 Feet",
                      "32FTMXL-14MT",
                      "Biker",
                      "BYHAND",
                      "FLAT BED TRAILER 20FT",
                      "Pickup",
                      "TAURUS 16 TON",
                      "Tata 407",
                      "TRUCK/LORRY",
                      "SFBT40",
                      "TATA/EICHER 709",
                      "32FTMXL-18MT",
                      "32FTSXL-7MT",
                      "32FTSXL-9MT",
                      "FLAT BED TRAILER 40FT",
                      "SEMI FLAT BED TRAILER 40FT",
                      "TAURUS 18 TON",
                      "TAURUS 21 TON",
                      "TAURUS 25 TON",
                      "TAURUS 30 TON",
                      "TATA ACE"
                    ].map(
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
                  Driver Name {driversData?.drivers?.length > 0 && `(Total: ${driversData.drivers.filter((driver) => {
                    if (isVendor) {
                      return driver.driverType !== "dellcube";
                    }
                    return true;
                  }).length})`}
                </Label>
                <SearchableSelect
                  value={formData.currentDriver}
                  onValueChange={(val) => setFormData({ ...formData, currentDriver: val })}
                  options={driversData?.drivers
                    ?.filter((driver) => {
                      // For vendors, exclude dellcube drivers
                      if (isVendor) {
                        return driver.driverType !== "dellcube";
                      }
                      // For others, show all drivers
                      return true;
                    })
                    ?.map((driver) => ({
                      value: driver._id,
                      label: `${driver.name} - ${driver.mobile} - ${driver.driverType}`,
                    })) || []}
                  placeholder="Select Driver"
                  emptyMessage="No drivers found"
                  className="mt-1.5"
                />
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
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Company & Branch Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shouldHideCompanyBranch ? (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company *</Label>
                    <Input
                      value={currentSessionCompanyName || "Loading..."}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800 mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch *</Label>
                    <Input
                      value={currentSessionBranchName || "Loading..."}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800 mt-1.5"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Companies *</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {companies?.companies?.length > 0 ? (
                        companies.companies.map((c) => (
                          <div key={c._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cv-company-${c._id}`}
                              checked={formData.companies.includes(c._id)}
                              onCheckedChange={() => handleVehicleCompanyToggle(c._id)}
                            />
                            <label htmlFor={`cv-company-${c._id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {c.name} {c.companyCode ? `(${c.companyCode})` : ""}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No companies available</p>
                      )}
                    </div>
                    {formData.companies.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{formData.companies.length} company(s) selected</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branches *</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {formData.companies.length === 0 ? (
                        <p className="text-sm text-gray-500">Please select at least one company first</p>
                      ) : Object.keys(branchesByCompany).length === 0 ? (
                        <p className="text-sm text-gray-500">Loading branches...</p>
                      ) : (
                        Object.entries(branchesByCompany).map(([cid, branchList]) => {
                          if (!formData.companies.includes(cid)) return null;
                          const company = companies?.companies?.find((c) => c._id === cid);
                          return (
                            <div key={cid} className="space-y-2">
                              {company && (
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2 first:mt-0">
                                  {company.name}:
                                </p>
                              )}
                              {branchList.map((b) => (
                                <div key={b._id} className="flex items-center space-x-2 ml-4">
                                  <Checkbox
                                    id={`cv-branch-${b._id}`}
                                    checked={formData.branches.includes(b._id)}
                                    onCheckedChange={() => handleVehicleBranchToggle(b._id)}
                                  />
                                  <label htmlFor={`cv-branch-${b._id}`} className="text-sm font-medium leading-none cursor-pointer">
                                    {b.name} {b.branchCode ? `(${b.branchCode})` : ""}
                                  </label>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {formData.branches.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">{formData.branches.length} branch(es) selected</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </Card>
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
