import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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

const CreateVehicle = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";

  const [formData, setFormData] = useState({
    vehicleNumber: "",
    type: "",
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
    if (isBranchAdmin && user?.company && user?.branch) {
      setFormData((prev) => ({
        ...prev,
        company: String(user?.company?._id),
        branch: String(user?.branch?._id),
      }));
    }
  }, [user]);

  const handleCompanyChange = async (companyId) => {
    setFormData((prev) => ({
      ...prev,
      company: isBranchAdmin ? prev?.company : companyId,
      branch: isBranchAdmin ? prev?.branch : "",
    }));

    const res = await getBranchesByCompany(companyId);

    if (res?.data?.branches) {
      setBranches(res?.data?.branches);
    } else {
      setBranches([]);
    }
  };

  useEffect(() => {
    if (!isBranchAdmin && formData.company) {
      handleCompanyChange(formData.company);
    } else if (isBranchAdmin && user?.company) {
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
    const { vehicleNumber, type, company, branch } = formData;

    if (!vehicleNumber || !type || !company || !branch) {
      toast.error("Vehicle Number, Type, Company, and Branch are required");
      return;
    }

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });
    Object.entries(certificateFiles).forEach(([key, file]) => {
      if (file) payload.append(key, file);
    });
    payload.append("createdBy", user?._id);

    await createVehicle(payload);
  };

  return (
    <section className="md:mx-10 p-4 min-h-screen bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">
        Create Vehicle
      </h2>
      <p className="text-sm mb-6 text-gray-500">
        Fill out the vehicle details below
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label className="text-gray-700 mb-1 block">Vehicle Number*</Label>
          <Input
            placeholder="MH 12 AB 1234"
            value={formData.vehicleNumber}
            onChange={(e) =>
              setFormData({ ...formData, vehicleNumber: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">Vehicle Type*</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              {["7ft","10ft", "14ft", "18ft", "24ft", "32ft"].map(
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
          <Label className="text-gray-700 mb-1 block">Vehicle Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger className="w-full">
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
          <Label className="text-gray-700 mb-1 block">Driver Name</Label>
          <Select
            value={formData.currentDriver}
            onValueChange={(val) => setFormData({ ...formData, currentDriver: val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Driver" />
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
          <Label className="text-gray-700 mb-1 block">Brand</Label>
          <Input
            placeholder="Eg. Tata"
            value={formData.brand}
            onChange={(e) =>
              setFormData({ ...formData, brand: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">Model</Label>
          <Input
            placeholder="Eg. Ace"
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">
            Year of Manufacture
          </Label>
          <Input
            type="number"
            placeholder="Eg. 2020"
            value={formData.yearOfManufacture}
            onChange={(e) =>
              setFormData({ ...formData, yearOfManufacture: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">Registration Date</Label>
          <Input
            type="date"
            value={formData.registrationDate}
            onChange={(e) =>
              setFormData({ ...formData, registrationDate: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">
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
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">Insurance Expiry</Label>
          <Input
            type="date"
            value={formData.insuranceExpiry}
            onChange={(e) =>
              setFormData({ ...formData, insuranceExpiry: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">
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
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">Vehicle Insurance Number</Label>
          <Input
            placeholder="Enter vehicle insurance number"
            value={formData.vehicleInsuranceNo}
            onChange={(e) =>
              setFormData({ ...formData, vehicleInsuranceNo: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">Fitness Number</Label>
          <Input
            placeholder="Enter fitness certificate number"
            value={formData.fitnessNo}
            onChange={(e) =>
              setFormData({ ...formData, fitnessNo: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-gray-700 mb-1 block">Fitness Certificate Image</Label>
          <Input type="file" name="fitnessCertificateImage" accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <Label className="text-gray-700 mb-1 block">Pollution Certificate Image</Label>
          <Input type="file" name="pollutionCertificateImage" accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <Label className="text-gray-700 mb-1 block">Registration Certificate Image</Label>
          <Input type="file" name="registrationCertificateImage" accept="image/*" onChange={handleFileChange} />
        </div>
        <div>
          <Label className="text-gray-700 mb-1 block">Insurance Image</Label>
          <Input type="file" name="insuranceImage" accept="image/*" onChange={handleFileChange} />
        </div>

        {!isBranchAdmin && (
          <>
            <div>
              <Label className="text-gray-700 mb-1 block">Company*</Label>
              <Select
                value={formData.company}
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger className="w-full">
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
              <Label className="text-gray-700 mb-1 block">Branch*</Label>
              <Select
                value={formData.branch}
                onValueChange={(value) =>
                  setFormData({ ...formData, branch: value })
                }
              >
                <SelectTrigger className="w-full">
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
          </>
        )}

        
      </div>

      <div className="flex justify-start gap-3 mt-8">
        <Button variant="outline" onClick={() => navigate("/admin/vehicles")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Vehicle"
          )}
        </Button>
      </div>
    </section>
  );
};

export default CreateVehicle;
