import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Building, FileText } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
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
                Create New Branch
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new branch to your company
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Information */}
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
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Branch Name"
                  />
                </div>
                <div>
                  <Label>Branch Code *</Label>
                  <Input
                    name="branchCode"
                    value={formData.branchCode}
                    onChange={handleInputChange}
                    placeholder="Unique Branch Code"
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
                    name="branchNo"
                    value={formData.branchNo}
                    onChange={handleInputChange}
                    placeholder="Branch Number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address *</Label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Branch Address"
                  />
                </div>
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

          {/* Tax Information */}
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
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleInputChange}
                    placeholder="GST Number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/branches")}
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
                "Create Branch"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBranch;
