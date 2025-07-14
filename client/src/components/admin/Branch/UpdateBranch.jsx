import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

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

import {
  useGetBranchByIdMutation,
  useUpdateBranchMutation,
} from "@/features/api/Branch/branchApi.js";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetAllCountriesQuery } from "@/features/api/Region/countryApi.js";
import { useGetStatesByCountryMutation } from "@/features/api/Region/stateApi.js";
import { useGetCitiesByStateMutation } from "@/features/api/Region/cityApi.js";
import { useGetLocalitiesByCityMutation } from "@/features/api/Region/LocalityApi.js";
import { useGetPincodesByLocalityMutation } from "@/features/api/Region/pincodeApi.js";

const UpdateBranch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const branchId = location.state?.branchId;

  const [getBranchById, { data: branchData, isSuccess: isBranchFetched }] =
    useGetBranchByIdMutation();
  console.log(branchData);
  const [updateBranch, { isLoading: isUpdating, isSuccess: isUpdated, error }] =
    useUpdateBranchMutation();

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const { data: countries } = useGetAllCountriesQuery({});

  const [getStatesByCountry, { data: stateData }] =
    useGetStatesByCountryMutation();
  console.log(stateData);
  const [getCitiesByState, { data: cityData }] = useGetCitiesByStateMutation();
  const [getLocalitiesByCity, { data: localityData }] =
    useGetLocalitiesByCityMutation();
  const [getPincodesByLocality, { data: pincodeData }] =
    useGetPincodesByLocalityMutation();

  const [formData, setFormData] = useState({
    name: "",
    branchCode: "",
    company: "",
    address: "",
    status: true,
    region: {
      country: "",
      state: "",
      city: "",
      locality: "",
      pincode: "",
    },
    gstNo: "",
    branchNo: "",
  });

  useEffect(() => {
    if (branchId) getBranchById(branchId);
  }, [branchId]);

  useEffect(() => {
    if (isBranchFetched && branchData?.branch) {
      const b = branchData.branch;
      const region = {
        country: b.region?.country?._id || "",
        state: b.region?.state?._id || "",
        city: b.region?.city?._id || "",
        locality: b.region?.locality?._id || "",
        pincode: b.region?.pincode?._id || "",
      };

      setFormData({
        name: b.name || "",
        branchCode: b.branchCode || "",
        company: b.company?._id || "",
        address: b.address || "",
        status: b.status,
        region,
        gstNo: b.gstNo || "",
        branchNo: b.branchNo || "",
      });

      // Fetch dependent region data
      if (region.country) getStatesByCountry(region.country);
      if (region.state) getCitiesByState(region.state);
      if (region.city) getLocalitiesByCity(region.city);
      if (region.locality) getPincodesByLocality(region.locality);
    }
  }, [isBranchFetched, branchData]);

  const handleRegionChange = async (field, value) => {
    const resetRegion = {
      state: "",
      city: "",
      locality: "",
      pincode: "",
    };
    const updatedRegion = {
      ...formData.region,
      [field]: value,
      ...(field === "country" ? resetRegion : {}),
      ...(field === "state" ? { city: "", locality: "", pincode: "" } : {}),
      ...(field === "city" ? { locality: "", pincode: "" } : {}),
      ...(field === "locality" ? { pincode: "" } : {}),
    };

    setFormData((prev) => ({ ...prev, region: updatedRegion }));

    if (field === "country") await getStatesByCountry(value);
    if (field === "state") await getCitiesByState(value);
    if (field === "city") await getLocalitiesByCity(value);
    if (field === "locality") await getPincodesByLocality(value);
  };

  const handleSubmit = async () => {
    const { name, branchCode, company, address } = formData;
    if (!name || !branchCode || !company || !address) {
      return toast.error("All fields are required");
    }

    const payload = {
      ...formData,
      branchId,
    };

    await updateBranch(payload);
  };

  useEffect(() => {
    if (isUpdated) {
      toast.success("Branch updated successfully");
      navigate("/admin/branches");
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update branch");
    }
  }, [isUpdated, error]);

  return (
    <div className="mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Branch</h2>
      <p className="text-sm mb-6 text-muted-foreground">
        Update branch details
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Branch Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Branch name"
          />
        </div>

        <div>
          <Label>Branch Code</Label>
          <Input
            value={formData.branchCode}
            onChange={(e) =>
              setFormData({ ...formData, branchCode: e.target.value })
            }
            placeholder="Unique code"
          />
        </div>
        <div>
          <Label>GST No</Label>
          <Input
            value={formData.gstNo}
            onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
            placeholder="GST Number"
          />
        </div>
        <div>
          <Label>Branch Contact No</Label>
          <Input
            value={formData.branchNo}
            onChange={(e) => setFormData({ ...formData, branchNo: e.target.value })}
            placeholder="Branch Number"
          />
        </div>

        <div>
          <Label>Company</Label>
          <Select
            value={formData.company}
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, company: val }))
            }
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
        </div>

        <div>
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Full address"
          />
        </div>

        <div>
          <Label>Country</Label>
          <Select
            value={formData.region.country}
            onValueChange={(val) => handleRegionChange("country", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Country" />
            </SelectTrigger>
            <SelectContent>
              {countries?.countries?.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>State</Label>
          <Select
            value={formData.region.state}
            onValueChange={(val) => handleRegionChange("state", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {stateData?.data?.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>City</Label>
          <Select
            value={formData.region.city}
            onValueChange={(val) => handleRegionChange("city", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select City" />
            </SelectTrigger>
            <SelectContent>
              {cityData?.cities?.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Locality</Label>
          <Select
            value={formData.region.locality}
            onValueChange={(val) => handleRegionChange("locality", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Locality" />
            </SelectTrigger>
            <SelectContent>
              {localityData?.data?.map((l) => (
                <SelectItem key={l._id} value={l._id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Pincode</Label>
          <Select
            value={formData.region.pincode}
            onValueChange={(val) => handleRegionChange("pincode", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Pincode" />
            </SelectTrigger>
            <SelectContent>
              {pincodeData?.pincodes?.map((p) => (
                <SelectItem key={p._id} value={p._id}>
                  {p.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
        <Button variant="outline" onClick={() => navigate("/admin/branches")}>
          Cancel
        </Button>
        <Button disabled={isUpdating} onClick={handleSubmit}>
          {isUpdating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Branch"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateBranch;
