import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Car, CreditCard, Calendar, Wrench } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetAllBranchesQuery } from "@/features/api/Branch/branchApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import {
  useGetVehicleByIdMutation,
  useUpdateVehicleMutation,
} from "@/features/api/Vehicle/vehicleApi";
import { useGetAllDriversQuery } from "@/features/api/authApi";
import { getTokenData } from "@/utils/getTokenData";
import { useSelector } from "react-redux";

const UpdateVehicle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vehicleId = location.state?.vehicleId;
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

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [type, setType] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [fitnessCertificateExpiry, setFitnessCertificateExpiry] = useState("");
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [pollutionCertificateExpiry, setPollutionCertificateExpiry] =
    useState("");
  const [companyId, setCompanyId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [companies, setCompanies] = useState([]);
  const [branches, setBranchesState] = useState([]);
  const [branchesByCompany, setBranchesByCompany] = useState({});
  const [status, setStatus] = useState("active");
  const [currentDriver, setCurrentDriver] = useState("");
  const [vehicleInsuranceNo, setVehicleInsuranceNo] = useState("");
  const [fitnessNo, setFitnessNo] = useState("");

  const [certFiles, setCertFiles] = useState({
    fitnessCertificateImage: null,
    pollutionCertificateImage: null,
    registrationCertificateImage: null,
    insuranceImage: null,
  });
  const [certPreviews, setCertPreviews] = useState({
    fitnessCertificateImage: null,
    pollutionCertificateImage: null,
    registrationCertificateImage: null,
    insuranceImage: null,
  });
  const [currentCertImages, setCurrentCertImages] = useState({
    fitnessCertificateImage: null,
    pollutionCertificateImage: null,
    registrationCertificateImage: null,
    insuranceImage: null,
  });

  const [getVehicleById, { data: viewData, isSuccess, isError: isViewError, error: viewError }] =
    useGetVehicleByIdMutation();
  const [updateVehicle, { isLoading, isSuccess: updated, error }] =
    useUpdateVehicleMutation();

  const { data: companyData } = useGetAllCompaniesQuery({
    page: 1,
    limit: 100,
  });
  const { data: branchData } = useGetAllBranchesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const { data: driversData, isLoading: isDriversLoading } = useGetAllDriversQuery({ page: 1, limit: 1000 });

  useEffect(() => {
    if (vehicleId) {
      getVehicleById(vehicleId);
    } else if (isVendor) {
      // If vendor tries to access update-vehicle without vehicleId, redirect
      toast.error("Please edit vehicles from the Vendor Vehicles page");
      navigate("/admin/vendor-vehicles");
    }
  }, [vehicleId, isVendor, navigate, getVehicleById]);

  // When view returns 404 (e.g. vendor vehicle id passed), redirect back
  useEffect(() => {
    if (isViewError && viewError) {
      const msg = viewError?.data?.message || viewError?.message || "Vehicle not found";
      toast.error(msg);
      navigate("/admin/vehicles");
    }
  }, [isViewError, viewError, navigate]);

  useEffect(() => {
    if (isSuccess) {
      // If vehicle not found, check if it's a vendor trying to edit
      if (!viewData?.vehicle) {
        if (isVendor) {
          toast.error("Vehicle not found. Vendor vehicles should be edited from the Vendor Vehicles page.");
          navigate("/admin/vendor-vehicles");
          return;
        }
        toast.error("Vehicle not found");
        navigate("/admin/vehicles");
        return;
      }
      
      const v = viewData.vehicle;
      setVehicleNumber(v.vehicleNumber || "");
      setType(v.type || "");
      setCargoType(v.cargoType || "");
      setBrand(v.brand || "");
      setModel(v.model || "");
      setYearOfManufacture(v.yearOfManufacture || "");
      setRegistrationDate(v.registrationDate?.slice(0, 10) || "");
      setFitnessCertificateExpiry(
        v.fitnessCertificateExpiry?.slice(0, 10) || ""
      );
      setInsuranceExpiry(v.insuranceExpiry?.slice(0, 10) || "");
      setPollutionCertificateExpiry(
        v.pollutionCertificateExpiry?.slice(0, 10) || ""
      );
      // For operation, branchAdmin, vendor - always use their profile company/branch
      // For superAdmin - use vehicle's existing company/branch
      const finalCompanyId = shouldHideCompanyBranch 
        ? (getUserCompanyId() || getTokenData().companyId)
        : (v.company?._id || "");
      const finalBranchId = shouldHideCompanyBranch
        ? (getUserBranchId() || getTokenData().branchId)
        : (v.branch?._id || "");
      setCompanyId(finalCompanyId);
      setBranchId(finalBranchId);
      setStatus(v.status || "active");
      setCurrentDriver(v.currentDriver?._id || ""); // set to driver ID if populated
      setCurrentCertImages({
        fitnessCertificateImage: v.fitnessCertificateImage?.url || null,
        pollutionCertificateImage: v.pollutionCertificateImage?.url || null,
        registrationCertificateImage: v.registrationCertificateImage?.url || null,
        insuranceImage: v.insuranceImage?.url || null,
      });
      setVehicleInsuranceNo(v.vehicleInsuranceNo || "");
      setFitnessNo(v.fitnessNo || "");

      if (v.companyBranchAssignments?.length > 0 && !shouldHideCompanyBranch) {
        const cids = [...new Set(v.companyBranchAssignments.map((a) => a.company?._id || a.company))];
        const bids = v.companyBranchAssignments.map((a) => a.branch?._id || a.branch);
        setCompanies(cids.filter(Boolean));
        setBranchesState(bids.filter(Boolean));
        cids.forEach((cid) => {
          if (!cid) return;
          getBranchesByCompany(cid).then((res) => {
            if (res?.data?.branches) {
              setBranchesByCompany((prev) => ({ ...prev, [cid]: res.data.branches }));
            }
          });
        });
      }
    }
  }, [isSuccess, viewData, shouldHideCompanyBranch, getBranchesByCompany]);

  const handleCertFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setCertFiles((prev) => ({ ...prev, [name]: files[0] }));
      setCertPreviews((prev) => ({ ...prev, [name]: URL.createObjectURL(files[0]) }));
    }
  };

  const handleVehicleCompanyToggle = async (cid) => {
    const isSelected = companies.includes(cid);
    if (isSelected) {
      const branchIdsFromCompany = (branchesByCompany[cid] || []).map((b) => b._id);
      setCompanies((prev) => prev.filter((id) => id !== cid));
      setBranchesState((prev) => prev.filter((id) => !branchIdsFromCompany.includes(id)));
      setBranchesByCompany((prev) => {
        const next = { ...prev };
        delete next[cid];
        return next;
      });
    } else {
      setCompanies((prev) => [...prev, cid]);
      try {
        const res = await getBranchesByCompany(cid);
        if (res?.data?.branches) setBranchesByCompany((prev) => ({ ...prev, [cid]: res.data.branches }));
      } catch {
        toast.error("Failed to load branches for company");
      }
    }
  };

  const handleVehicleBranchToggle = (bid) => {
    const isSelected = branches.includes(bid);
    setBranchesState((prev) =>
      isSelected ? prev.filter((id) => id !== bid) : [...prev, bid]
    );
  };

  const getCompanyBranchAssignments = () => {
    const assignments = [];
    branches.forEach((branchId) => {
      for (const [cid, branchList] of Object.entries(branchesByCompany)) {
        if (branchList.some((b) => b._id === branchId)) {
          assignments.push({ company: cid, branch: branchId });
          break;
        }
      }
    });
    return assignments;
  };

  const handleUpdate = async () => {
    // Validation for required fields
    if (!vehicleNumber || !vehicleNumber.trim()) {
      toast.error("Vehicle Number is required");
      return;
    }

    if (!type || !type.trim()) {
      toast.error("Vehicle Type (Size) is required");
      return;
    }

    // Validate cargoType - required field
    if (!cargoType || !cargoType.trim()) {
      toast.error("Cargo Type is required");
      return;
    }
    const validCargoTypes = ["Dry", "Refrigerated", "Container", "Open", "Closed", "Flatbed", "Tanker", "Other"];
    if (!validCargoTypes.includes(cargoType)) {
      toast.error("Please select a valid Cargo Type");
      return;
    }

    // Validate currentDriver - required field
    if (!currentDriver || !currentDriver.trim()) {
      toast.error("Current Driver is required");
      return;
    }
    // Validate ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(currentDriver)) {
      toast.error("Please select a valid Current Driver");
      return;
    }

    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    let finalCompanyId, finalBranchId;
    let companyBranchAssignments = null;

    if (shouldHideCompanyBranch) {
      finalCompanyId = getUserCompanyId() || tokenCompanyId || "";
      finalBranchId = getUserBranchId() || tokenBranchId || "";
    } else {
      if (companies.length > 0 && branches.length > 0) {
        companyBranchAssignments = getCompanyBranchAssignments();
        if (companyBranchAssignments.length === 0) {
          toast.error("Please select at least one company and branch");
          return;
        }
        finalCompanyId = companyBranchAssignments[0].company;
        finalBranchId = companyBranchAssignments[0].branch;
      } else {
        finalCompanyId = companyId || tokenCompanyId || "";
        finalBranchId = branchId || tokenBranchId || "";
        if (finalCompanyId && finalBranchId) {
          companyBranchAssignments = [{ company: finalCompanyId, branch: finalBranchId }];
        }
      }
    }

    if (!finalCompanyId || !finalBranchId) {
      toast.error("Company and Branch are required");
      return;
    }
    const payload = new FormData();
    payload.append("vehicleId", vehicleId);
    payload.append("vehicleNumber", vehicleNumber.trim());
    payload.append("type", type);
    payload.append("cargoType", cargoType);
    if (brand && brand.trim()) payload.append("brand", brand);
    if (model && model.trim()) payload.append("model", model);
    if (yearOfManufacture) payload.append("yearOfManufacture", yearOfManufacture);
    if (registrationDate) payload.append("registrationDate", registrationDate);
    if (fitnessCertificateExpiry) payload.append("fitnessCertificateExpiry", fitnessCertificateExpiry);
    if (insuranceExpiry) payload.append("insuranceExpiry", insuranceExpiry);
    if (pollutionCertificateExpiry) payload.append("pollutionCertificateExpiry", pollutionCertificateExpiry);
    payload.append("status", status);
    payload.append("currentDriver", currentDriver);
    payload.append("company", finalCompanyId);
    payload.append("branch", finalBranchId);
    if (companyBranchAssignments && companyBranchAssignments.length > 0) {
      payload.append("companyBranchAssignments", JSON.stringify(companyBranchAssignments));
    }
    if (vehicleInsuranceNo && vehicleInsuranceNo.trim()) {
      payload.append("vehicleInsuranceNo", vehicleInsuranceNo);
    }
    if (fitnessNo && fitnessNo.trim()) {
      payload.append("fitnessNo", fitnessNo);
    }
    // Only append changed cert files
    Object.entries(certFiles).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });
    
    try {
      await updateVehicle(payload).unwrap();
    } catch (err) {
      // Error is handled by useEffect below
      console.error("Error updating vehicle:", err);
    }
  };

  useEffect(() => {
    if (updated) {
      toast.success("Vehicle updated successfully");
      setTimeout(() => navigate("/admin/vehicles"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update vehicle");
    }
  }, [updated, error]);

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
                Update Vehicle
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update vehicle details below
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
                  value={vehicleNumber}
                  onChange={(e) => {
                    setVehicleNumber(e.target.value.toUpperCase());
                  }}
                  className="mt-1.5"
                />
                {vehicleNumber && vehicleNumber.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Enter vehicle registration number
                  </p>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Type (Size) *
                </Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Choose type" />
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
                      (t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Cargo Type *
                </Label>
                <Select value={cargoType} onValueChange={setCargoType}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select cargo type" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Dry", "Refrigerated", "Container", "Open", "Closed", "Flatbed", "Tanker", "Other"].map(
                      (ct) => (
                        <SelectItem key={ct} value={ct}>
                          {ct}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Brand
                </Label>
                <Input 
                  value={brand} 
                  onChange={(e) => setBrand(e.target.value)} 
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Model
                </Label>
                <Input 
                  value={model} 
                  onChange={(e) => setModel(e.target.value)} 
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Year of Manufacture
                </Label>
                <Input
                  type="number"
                  value={yearOfManufacture}
                  onChange={(e) => setYearOfManufacture(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registration Date
                </Label>
                <Input
                  type="date"
                  value={registrationDate}
                  onChange={(e) => setRegistrationDate(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "active",
                      "under_maintenance",
                      "inactive",
                      "decommissioned",
                    ].map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Driver * {driversData?.drivers?.length > 0 && `(Total: ${driversData.drivers.length})`}
                </Label>
                <SearchableSelect
                  value={currentDriver}
                  onValueChange={setCurrentDriver}
                  options={driversData?.drivers?.map((driver) => ({
                    value: driver._id,
                    label: `${driver.name} - ${driver.mobile} - ${driver.driverType}`,
                  })) || []}
                  placeholder="Select driver"
                  disabled={isDriversLoading}
                  emptyMessage="No drivers found"
                  className="mt-1.5"
                />
              </div>

              {shouldHideCompanyBranch ? (
                <>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company *</Label>
                    <Input
                      value={user?.company?.name || (Array.isArray(user?.company) && user.company.length > 0 ? user.company[0].name : "")}
                      disabled
                      className="bg-gray-100 cursor-not-allowed dark:bg-gray-800 mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch *</Label>
                    <Input
                      value={user?.branch?.name || (Array.isArray(user?.branch) && user.branch.length > 0 ? user.branch[0].name : "")}
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
                      {companyData?.companies?.length > 0 ? (
                        companyData.companies.map((c) => (
                          <div key={c._id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`uv-company-${c._id}`}
                              checked={companies.includes(c._id)}
                              onCheckedChange={() => handleVehicleCompanyToggle(c._id)}
                            />
                            <label htmlFor={`uv-company-${c._id}`} className="text-sm font-medium leading-none cursor-pointer">
                              {c.name} {c.companyCode ? `(${c.companyCode})` : ""}
                            </label>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No companies available</p>
                      )}
                    </div>
                    {companies.length > 0 && <p className="text-xs text-gray-500 mt-1">{companies.length} company(s) selected</p>}
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Branches *</Label>
                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                      {companies.length === 0 ? (
                        <p className="text-sm text-gray-500">Please select at least one company first</p>
                      ) : Object.keys(branchesByCompany).length === 0 ? (
                        <p className="text-sm text-gray-500">Loading branches...</p>
                      ) : (
                        Object.entries(branchesByCompany).map(([cid, branchList]) => {
                          if (!companies.includes(cid)) return null;
                          const company = companyData?.companies?.find((c) => c._id === cid);
                          return (
                            <div key={cid} className="space-y-2">
                              {company && <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2 first:mt-0">{company.name}:</p>}
                              {branchList.map((b) => (
                                <div key={b._id} className="flex items-center space-x-2 ml-4">
                                  <Checkbox
                                    id={`uv-branch-${b._id}`}
                                    checked={branches.includes(b._id)}
                                    onCheckedChange={() => handleVehicleBranchToggle(b._id)}
                                  />
                                  <label htmlFor={`uv-branch-${b._id}`} className="text-sm font-medium leading-none cursor-pointer">
                                    {b.name} {b.branchCode ? `(${b.branchCode})` : ""}
                                  </label>
                                </div>
                              ))}
                            </div>
                          );
                        })
                      )}
                    </div>
                    {branches.length > 0 && <p className="text-xs text-gray-500 mt-1">{branches.length} branch(es) selected</p>}
                  </div>
                </>
              )}
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
                  value={fitnessCertificateExpiry}
                  onChange={(e) => setFitnessCertificateExpiry(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Insurance Expiry
                </Label>
                <Input
                  type="date"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pollution Certificate Expiry
                </Label>
                <Input
                  type="date"
                  value={pollutionCertificateExpiry}
                  onChange={(e) => setPollutionCertificateExpiry(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vehicle Insurance Number
                </Label>
                <Input
                  value={vehicleInsuranceNo}
                  onChange={(e) => setVehicleInsuranceNo(e.target.value)}
                  placeholder="Enter vehicle insurance number"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fitness Number
                </Label>
                <Input
                  value={fitnessNo}
                  onChange={(e) => setFitnessNo(e.target.value)}
                  placeholder="Enter fitness certificate number"
                  className="mt-1.5"
                />
              </div>
            </div>
          </Card>

          {/* Certificate Images Card */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Certificate Images
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fitness Certificate */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fitness Certificate Image
                </Label>
                {currentCertImages.fitnessCertificateImage && !certPreviews.fitnessCertificateImage && (
                  <img src={currentCertImages.fitnessCertificateImage} alt="Fitness Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                {certPreviews.fitnessCertificateImage && (
                  <img src={certPreviews.fitnessCertificateImage} alt="New Fitness Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                <Input type="file" name="fitnessCertificateImage" accept="image/*" onChange={handleCertFileChange} className="mt-1.5" />
              </div>
              
              {/* Registration Certificate */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registration Certificate Image
                </Label>
                {currentCertImages.registrationCertificateImage && !certPreviews.registrationCertificateImage && (
                  <img src={currentCertImages.registrationCertificateImage} alt="Registration Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                {certPreviews.registrationCertificateImage && (
                  <img src={certPreviews.registrationCertificateImage} alt="New Registration Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                <Input type="file" name="registrationCertificateImage" accept="image/*" onChange={handleCertFileChange} className="mt-1.5" />
              </div>
              
              {/* Pollution Certificate */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pollution Certificate Image
                </Label>
                {currentCertImages.pollutionCertificateImage && !certPreviews.pollutionCertificateImage && (
                  <img src={currentCertImages.pollutionCertificateImage} alt="Pollution Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                {certPreviews.pollutionCertificateImage && (
                  <img src={certPreviews.pollutionCertificateImage} alt="New Pollution Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                <Input type="file" name="pollutionCertificateImage" accept="image/*" onChange={handleCertFileChange} className="mt-1.5" />
              </div>
              
              {/* Insurance Certificate */}
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Insurance Image
                </Label>
                {currentCertImages.insuranceImage && !certPreviews.insuranceImage && (
                  <img src={currentCertImages.insuranceImage} alt="Insurance" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                {certPreviews.insuranceImage && (
                  <img src={certPreviews.insuranceImage} alt="New Insurance" className="w-32 h-24 object-contain rounded border mb-2" />
                )}
                <Input type="file" name="insuranceImage" accept="image/*" onChange={handleCertFileChange} className="mt-1.5" />
              </div>
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
            onClick={handleUpdate} 
            disabled={isLoading}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update Vehicle"
            )}
          </Button>
        </div>
      </div>
    </div>

  );
};

export default UpdateVehicle;
