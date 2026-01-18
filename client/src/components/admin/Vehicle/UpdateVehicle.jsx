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
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetAllBranchesQuery } from "@/features/api/Branch/branchApi";
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

  // Helper function to get company ID from user profile
  const getUserCompanyId = () => {
    if (user?.company?._id) return user.company._id;
    if (Array.isArray(user?.company) && user.company.length > 0) return user.company[0]._id;
    return null;
  };

  // Helper function to get branch ID from user profile
  const getUserBranchId = () => {
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

  const [getVehicleById, { data: viewData, isSuccess }] =
    useGetVehicleByIdMutation();
  const [updateVehicle, { isLoading, isSuccess: updated, error }] =
    useUpdateVehicleMutation();

  const { data: companyData } = useGetAllCompaniesQuery({
    page: 1,
    limit: 100,
  });
  const { data: branchData } = useGetAllBranchesQuery({ page: 1, limit: 100 });
  const { data: driversData, isLoading: isDriversLoading } = useGetAllDriversQuery({});

  useEffect(() => {
    if (vehicleId) {
      getVehicleById(vehicleId);
    }
  }, [vehicleId]);

  useEffect(() => {
    if (isSuccess && viewData?.vehicle) {
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
    }
  }, [isSuccess, viewData]);

  const handleCertFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setCertFiles((prev) => ({ ...prev, [name]: files[0] }));
      setCertPreviews((prev) => ({ ...prev, [name]: URL.createObjectURL(files[0]) }));
    }
  };

  const handleUpdate = async () => {
    // Validation for required fields
    if (!vehicleNumber || !vehicleNumber.trim()) {
      toast.error("Vehicle Number is required");
      return;
    }

    // Validate vehicle number format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576)
    const cleanedVehicleNumber = vehicleNumber.trim().replace(/[\s-]/g, '').toUpperCase();
    const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
    
    if (!vehicleNumberRegex.test(cleanedVehicleNumber)) {
      toast.error("Vehicle number must be in format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576). No dashes or spaces allowed.");
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

    // Get companyId and branchId from token as fallback
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    
    // For superAdmin, use form values; for others, use profile/token
    let finalCompanyId, finalBranchId;
    
    if (shouldHideCompanyBranch) {
      // For operation, branchAdmin, vendor - use profile data
      finalCompanyId = getUserCompanyId() || tokenCompanyId || "";
      finalBranchId = getUserBranchId() || tokenBranchId || "";
    } else {
      // For superAdmin - use form values or token
      finalCompanyId = companyId || tokenCompanyId || "";
      finalBranchId = branchId || tokenBranchId || "";
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
    // Only append optional fields if they have values
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
                  placeholder="e.g. CG04MM9576"
                  value={vehicleNumber}
                  onChange={(e) => {
                    // Remove spaces, dashes, and convert to uppercase
                    const cleaned = e.target.value.replace(/[\s-]/g, '').toUpperCase();
                    // Limit to 10 characters (2 letters + 2 digits + 2 letters + 4 digits)
                    const limited = cleaned.slice(0, 10);
                    setVehicleNumber(limited);
                  }}
                  maxLength={10}
                  className="mt-1.5"
                />
                {vehicleNumber && vehicleNumber.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576)
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
                  Current Driver *
                </Label>
                <Select
                  value={currentDriver}
                  onValueChange={setCurrentDriver}
                  disabled={isDriversLoading}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driversData?.drivers?.map((driver) => (
                      <SelectItem key={driver._id} value={driver._id}>
                          {driver.name} - {driver.mobile} - {driver.driverType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company *
                </Label>
                {shouldHideCompanyBranch ? (
                  <Input
                    value={user?.company?.name || (Array.isArray(user?.company) && user.company.length > 0 ? user.company[0].name : "")}
                    disabled
                    className="bg-gray-100 cursor-not-allowed dark:bg-gray-800 mt-1.5"
                  />
                ) : (
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyData?.companies?.map((comp) => (
                        <SelectItem key={comp._id} value={comp._id}>
                          {comp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Branch *
                </Label>
                {shouldHideCompanyBranch ? (
                  <Input
                    value={user?.branch?.name || (Array.isArray(user?.branch) && user.branch.length > 0 ? user.branch[0].name : "")}
                    disabled
                    className="bg-gray-100 cursor-not-allowed dark:bg-gray-800 mt-1.5"
                  />
                ) : (
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchData?.branches?.map((br) => (
                        <SelectItem key={br._id} value={br._id}>
                          {br.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
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
