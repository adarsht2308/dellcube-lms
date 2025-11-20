import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Building, FileText } from "lucide-react";

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
  const [updateBranch, { isLoading: isUpdating, isSuccess: isUpdated, error }] =
    useUpdateBranchMutation();

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const { data: countries } = useGetAllCountriesQuery({});

  const [getStatesByCountry, { data: stateData }] =
    useGetStatesByCountryMutation();
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/branches")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Branches
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Building className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Branch
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Edit branch information
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building className="w-5 h-5 text-[#202020]" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Branch Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Branch name"
                  />
                </div>
                <div>
                  <Label>Branch Code *</Label>
                  <Input
                    value={formData.branchCode}
                    onChange={(e) =>
                      setFormData({ ...formData, branchCode: e.target.value })
                    }
                    placeholder="Unique code"
                  />
                </div>
                <div>
                  <Label>Company *</Label>
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
                  <Label>Branch Contact No</Label>
                  <Input
                    value={formData.branchNo}
                    onChange={(e) => setFormData({ ...formData, branchNo: e.target.value })}
                    placeholder="Branch Number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address *</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Full address"
                  />
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

          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#202020]" />
                Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>GST No</Label>
                  <Input
                    value={formData.gstNo}
                    onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                    placeholder="GST Number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/branches")}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button 
              disabled={isUpdating} 
              onClick={handleSubmit}
              className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
            >
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
      </div>
    </div>
  );
};

export default UpdateBranch;
