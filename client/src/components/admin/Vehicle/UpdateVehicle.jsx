import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

const UpdateVehicle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vehicleId = location.state?.vehicleId;

  const [vehicleNumber, setVehicleNumber] = useState("");
  const [type, setType] = useState("");
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
      setCompanyId(v.company?._id || "");
      setBranchId(v.branch?._id || "");
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
    if (!vehicleNumber || !type || !companyId || !branchId) {
      return toast.error("Please fill all required fields");
    }
    const payload = new FormData();
    payload.append("vehicleId", vehicleId);
    payload.append("vehicleNumber", vehicleNumber);
    payload.append("type", type);
    payload.append("brand", brand);
    payload.append("model", model);
    payload.append("yearOfManufacture", yearOfManufacture);
    payload.append("registrationDate", registrationDate);
    payload.append("fitnessCertificateExpiry", fitnessCertificateExpiry);
    payload.append("insuranceExpiry", insuranceExpiry);
    payload.append("pollutionCertificateExpiry", pollutionCertificateExpiry);
    payload.append("status", status);
    payload.append("currentDriver", currentDriver);
    payload.append("company", companyId);
    payload.append("branch", branchId);
    payload.append("vehicleInsuranceNo", vehicleInsuranceNo);
    payload.append("fitnessNo", fitnessNo);
    // Only append changed cert files
    Object.entries(certFiles).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });
    await updateVehicle(payload);
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
    <section className="  mx-auto bg-white shadow-sm rounded-xl p-4 md:p-10 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Vehicle</h1>
        <p className="text-sm text-gray-500">Update vehicle details below</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label className="mb-1 block">Vehicle Number *</Label>
          <Input
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">Type *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Choose type" />
            </SelectTrigger>
            <SelectContent>
              {["7ft","10ft", "14ft", "18ft", "24ft", "32ft"].map(
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
          <Label className="mb-1 block">Brand</Label>
          <Input value={brand} onChange={(e) => setBrand(e.target.value)} />
        </div>

        <div>
          <Label className="mb-1 block">Model</Label>
          <Input value={model} onChange={(e) => setModel(e.target.value)} />
        </div>

        <div>
          <Label className="mb-1 block">Year of Manufacture</Label>
          <Input
            type="number"
            value={yearOfManufacture}
            onChange={(e) => setYearOfManufacture(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">Registration Date</Label>
          <Input
            type="date"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">Fitness Certificate Expiry</Label>
          <Input
            type="date"
            value={fitnessCertificateExpiry}
            onChange={(e) => setFitnessCertificateExpiry(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">Insurance Expiry</Label>
          <Input
            type="date"
            value={insuranceExpiry}
            onChange={(e) => setInsuranceExpiry(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">Pollution Certificate Expiry</Label>
          <Input
            type="date"
            value={pollutionCertificateExpiry}
            onChange={(e) => setPollutionCertificateExpiry(e.target.value)}
          />
        </div>

        <div>
          <Label className="mb-1 block">Vehicle Insurance Number</Label>
          <Input
            value={vehicleInsuranceNo}
            onChange={(e) => setVehicleInsuranceNo(e.target.value)}
            placeholder="Enter vehicle insurance number"
          />
        </div>

        <div>
          <Label className="mb-1 block">Fitness Number</Label>
          <Input
            value={fitnessNo}
            onChange={(e) => setFitnessNo(e.target.value)}
            placeholder="Enter fitness certificate number"
          />
        </div>

        <div>
          <Label className="mb-1 block">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
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
          <Label className="mb-1 block">Current Driver</Label>
          <Select
            value={currentDriver}
            onValueChange={setCurrentDriver}
            disabled={isDriversLoading}
          >
            <SelectTrigger>
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
          <Label className="mb-1 block">Company *</Label>
          <Select value={companyId} onValueChange={setCompanyId}>
            <SelectTrigger>
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
        </div>

        <div>
          <Label className="mb-1 block">Branch *</Label>
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger>
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
        </div>
      </div>

      {/* Certificate Image Uploads */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Fitness Certificate */}
        <div>
          <Label className="mb-1 block">Fitness Certificate Image</Label>
          {currentCertImages.fitnessCertificateImage && !certPreviews.fitnessCertificateImage && (
            <img src={currentCertImages.fitnessCertificateImage} alt="Fitness Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          {certPreviews.fitnessCertificateImage && (
            <img src={certPreviews.fitnessCertificateImage} alt="New Fitness Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          <Input type="file" name="fitnessCertificateImage" accept="image/*" onChange={handleCertFileChange} />
        </div>
        {/* Registration Certificate */}
        <div>
          <Label className="mb-1 block">Registration Certificate Image</Label>
          {currentCertImages.registrationCertificateImage && !certPreviews.registrationCertificateImage && (
            <img src={currentCertImages.registrationCertificateImage} alt="Registration Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          {certPreviews.registrationCertificateImage && (
            <img src={certPreviews.registrationCertificateImage} alt="New Registration Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          <Input type="file" name="registrationCertificateImage" accept="image/*" onChange={handleCertFileChange} />
        </div>
        {/* Pollution Certificate */}
        <div>
          <Label className="mb-1 block">Pollution Certificate Image</Label>
          {currentCertImages.pollutionCertificateImage && !certPreviews.pollutionCertificateImage && (
            <img src={currentCertImages.pollutionCertificateImage} alt="Pollution Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          {certPreviews.pollutionCertificateImage && (
            <img src={certPreviews.pollutionCertificateImage} alt="New Pollution Certificate" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          <Input type="file" name="pollutionCertificateImage" accept="image/*" onChange={handleCertFileChange} />
        </div>
        {/* Insurance Certificate */}
        <div>
          <Label className="mb-1 block">Insurance Image</Label>
          {currentCertImages.insuranceImage && !certPreviews.insuranceImage && (
            <img src={currentCertImages.insuranceImage} alt="Insurance" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          {certPreviews.insuranceImage && (
            <img src={certPreviews.insuranceImage} alt="New Insurance" className="w-32 h-24 object-contain rounded border mb-2" />
          )}
          <Input type="file" name="insuranceImage" accept="image/*" onChange={handleCertFileChange} />
        </div>
      </div>

      <div className="flex justify-start gap-4 mt-8">
        <Button variant="outline" onClick={() => navigate("/admin/vehicles")}>
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Vehicle"
          )}
        </Button>
      </div>
    </section>
  );
};

export default UpdateVehicle;
