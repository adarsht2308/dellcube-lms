import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateBranchMutation } from "@/features/api/Branch/branchApi.js";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetAllCountriesQuery } from "@/features/api/Region/countryApi.js";
import { useGetStatesByCountryMutation } from "@/features/api/Region/stateApi.js";
import { useGetCitiesByStateMutation } from "@/features/api/Region/cityApi.js";
import { useGetLocalitiesByCityMutation } from "@/features/api/Region/LocalityApi.js";
import { useGetPincodesByLocalityMutation } from "@/features/api/Region/pincodeApi.js";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const CreateBranch = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    branchCode: "",
    company: "",
    address: "",
    region: {
      country: "",
      state: "",
      city: "",
      locality: "",
      pincode: "",
    },
    status: true,
    gstNo: "",
    branchNo: "",
  });

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 1000 });
  const { data: countries } = useGetAllCountriesQuery({page:1,limit:10000,search:""});

  const [getStatesByCountry, { data: stateData }] =
    useGetStatesByCountryMutation();
  const [getCitiesByState, { data: cityData }] = useGetCitiesByStateMutation();
  const [getLocalitiesByCity, { data: localityData }] =
    useGetLocalitiesByCityMutation();
  const [getPincodesByLocality, { data: pincodeData }] =
    useGetPincodesByLocalityMutation();

  useEffect(() => {
    if (formData.region.country) getStatesByCountry(formData.region.country);
  }, [formData.region.country]);

  useEffect(() => {
    if (formData.region.state) getCitiesByState(formData.region.state);
  }, [formData.region.state]);

  useEffect(() => {
    if (formData.region.city) getLocalitiesByCity(formData.region.city);
  }, [formData.region.city]);

  useEffect(() => {
    if (formData.region.locality)
      getPincodesByLocality(formData.region.locality);
  }, [formData.region.locality]);

  const [createBranch, { isLoading, isSuccess, isError, error, data }] =
    useCreateBranchMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegionChange = async (field, value) => {
    const reset = {
      state: "",
      city: "",
      locality: "",
      pincode: "",
    };
    const updatedRegion = {
      ...formData.region,
      [field]: value,
      ...(field === "country" ? reset : {}),
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
      return toast.error("All required fields must be filled");
    }
    await createBranch(formData);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Branch created successfully");
      navigate("/admin/branches");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create branch");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New Branch</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a branch</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Branch Name</Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Branch Name"
          />
        </div>
        <div>
          <Label>Branch Code</Label>
          <Input
            name="branchCode"
            value={formData.branchCode}
            onChange={handleInputChange}
            placeholder="Unique Branch Code"
          />
        </div>
        <div>
          <Label>GST No</Label>
          <Input
            name="gstNo"
            value={formData.gstNo}
            onChange={handleInputChange}
            placeholder="GST Number"
          />
        </div>
        <div>
          <Label>Branch No</Label>
          <Input
            name="branchNo"
            value={formData.branchNo}
            onChange={handleInputChange}
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
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Branch Address"
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
          <Label htmlFor="status-toggle">Active Status</Label>
          <Switch
            id="status-toggle"
            checked={formData.status}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, status: checked }))
            }
          />
          <span className="text-sm text-gray-500">
            {formData.status ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/admin/branches")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create Branch"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateBranch;
