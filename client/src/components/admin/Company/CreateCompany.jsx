import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Building2, FileText, CreditCard, Phone, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateCompanyMutation } from "@/features/api/Company/companyApi.js";

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

const CreateCompany = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    companyCode: "",
    emailId: "",
    website: "",
    gstNumber: "",
    gstNo: "",
    gstValue: "",
    pan: "",
    sacHsnCode: "",
    companyType: "",
    address: "",
    contactPhone: "",
    bankDetails: [{ bankName: "", accountNumber: "", ifsc: "" }],
    emergencyContactName: "",
    emergencyContactMobile: "",
    status: true,
    region: {
      country: "",
      state: "",
      city: "",
      locality: "",
      pincode: "",
    },
  });
  const [logoFile, setLogoFile] = useState(null);

  const [createCompany, { isLoading, isSuccess, isError, error, data }] =
    useCreateCompanyMutation();

  const { data: countries } = useGetAllCountriesQuery({
    page: 1,
    limit: 10000,
    search: "",
  });

  console.log(countries);
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
    const {
      name,
      companyCode,
      emailId,
      website,
      gstNumber,
      gstNo,
      gstValue,
      pan,
      sacHsnCode,
      companyType,
      address,
      contactPhone,
      bankDetails,
    } = formData;

    if (!name.trim()) return toast.error("Company name is required.");
    if (!companyCode.trim()) return toast.error("Company code is required.");
    if (!emailId.trim()) return toast.error("Email ID is required.");
    if (!gstNumber.trim()) return toast.error("GST number is required.");
    // if (!gstNo.trim()) return toast.error("GST NO is required.");
    if (gstValue === "") return toast.error("GST Value is required.");
    if (!pan.trim()) return toast.error("PAN is required.");
    if (!sacHsnCode.trim()) return toast.error("SAC/HSN code is required.");
    if (!companyType.trim()) return toast.error("Company type is required.");
    if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        gstNumber.toUpperCase()
      )
    )
      return toast.error("Invalid GST number format.");
    if (!contactPhone.trim()) return toast.error("Contact phone is required.");
    if (!/^\d{10}$/.test(contactPhone))
      return toast.error("Phone number must be 10 digits.");
    if (!address.trim()) return toast.error("Address is required.");

    const payload = new FormData();
    payload.append("name", formData.name.trim());
    payload.append("companyCode", formData.companyCode.trim());
    payload.append("emailId", formData.emailId.trim());
    payload.append("website", formData.website.trim());
    payload.append("gstNumber", formData.gstNumber.trim().toUpperCase());
    payload.append("gstNo", formData.gstNo.trim());
    payload.append("gstValue", formData.gstValue);
    payload.append("pan", formData.pan.trim().toUpperCase());
    payload.append("sacHsnCode", formData.sacHsnCode.trim());
    payload.append("companyType", formData.companyType);
    payload.append("address", formData.address.trim());
    payload.append("contactPhone", formData.contactPhone.trim());
    payload.append(
      "bankDetails",
      JSON.stringify(
        (bankDetails || []).filter(
          (b) =>
            (b.bankName || "").trim() ||
            (b.accountNumber || "").trim() ||
            (b.ifsc || "").trim()
        )
      )
    );
    payload.append(
      "emergencyContactName",
      formData.emergencyContactName.trim()
    );
    payload.append(
      "emergencyContactMobile",
      formData.emergencyContactMobile.trim()
    );
    payload.append("status", formData.status);
    payload.append("country", formData.region.country);
    payload.append("state", formData.region.state);
    payload.append("city", formData.region.city);
    payload.append("locality", formData.region.locality);
    payload.append("pincode", formData.region.pincode);
    if (logoFile) {
      payload.append("companyLogo", logoFile);
    }

    await createCompany(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Company created successfully");
      navigate("/admin/companies");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create company");
    }
  }, [isSuccess, isError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/companies")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Companies
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Building2 className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create New Company
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new company to your organization
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
                <Building2 className="w-5 h-5 text-[#202020]" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name *</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Company Name"
                  />
                </div>
                <div>
                  <Label>Company Code *</Label>
                  <Input
                    name="companyCode"
                    value={formData.companyCode}
                    onChange={handleInputChange}
                    placeholder="Unique Company Code"
                  />
                </div>
                <div>
                  <Label>Email ID *</Label>
                  <Input
                    name="emailId"
                    type="email"
                    value={formData.emailId}
                    onChange={handleInputChange}
                    placeholder="company@example.com"
                  />
                </div>
                <div>
                  <Label>Website</Label>
                  <Input
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.example.com"
                  />
                </div>
                <div>
                  <Label>Company Type *</Label>
                  <Select
                    value={formData.companyType}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, companyType: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="counter company">Counter Company</SelectItem>
                      <SelectItem value="logistic company">Logistic Company</SelectItem>
                      <SelectItem value="transport company">
                        Transport Company
                      </SelectItem>
                      <SelectItem value="warehouse company">
                        Warehouse Company
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Contact Phone *</Label>
                  <Input
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address *</Label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Company Address"
                  />
                </div>
                <div>
                  <Label>Company Logo</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogoFile(e.target.files[0])}
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

          {/* Legal & Tax Information */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#202020]" />
                Legal & Tax Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>GST Number *</Label>
                  <Input
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    placeholder="GSTIN"
                  />
                </div>
                <div>
                  <Label>GST Value *</Label>
                  <Select
                    value={String(formData.gstValue)}
                    onValueChange={(val) =>
                      setFormData((prev) => ({ ...prev, gstValue: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GST %" />
                    </SelectTrigger>
                    <SelectContent>
                      {["0", "5", "12", "18", "28"].map((rate) => (
                        <SelectItem key={rate} value={rate}>
                          {rate}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>PAN *</Label>
                  <Input
                    name="pan"
                    value={formData.pan}
                    onChange={handleInputChange}
                    placeholder="PAN Number"
                  />
                </div>
                <div>
                  <Label>SAC/HSN Code *</Label>
                  <Input
                    name="sacHsnCode"
                    value={formData.sacHsnCode}
                    onChange={handleInputChange}
                    placeholder="SAC/HSN Code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Details Section */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-[#202020]" />
                  Bank Details
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      bankDetails: [
                        ...(prev.bankDetails || []),
                        { bankName: "", accountNumber: "", ifsc: "" },
                      ],
                    }))
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {(formData.bankDetails || []).map((bank, idx) => (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800/30"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <Input
                          value={bank.bankName}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const next = [...prev.bankDetails];
                              next[idx] = {
                                ...next[idx],
                                bankName: e.target.value,
                              };
                              return { ...prev, bankDetails: next };
                            })
                          }
                          placeholder="Bank Name"
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={bank.accountNumber}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const next = [...prev.bankDetails];
                              next[idx] = {
                                ...next[idx],
                                accountNumber: e.target.value,
                              };
                              return { ...prev, bankDetails: next };
                            })
                          }
                          placeholder="Account Number"
                        />
                      </div>
                      <div>
                        <Label>IFSC</Label>
                        <Input
                          value={bank.ifsc}
                          onChange={(e) =>
                            setFormData((prev) => {
                              const next = [...prev.bankDetails];
                              next[idx] = {
                                ...next[idx],
                                ifsc: e.target.value.toUpperCase(),
                              };
                              return { ...prev, bankDetails: next };
                            })
                          }
                          placeholder="IFSC"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end mt-3">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            bankDetails: (prev.bankDetails || []).filter(
                              (_, i) => i !== idx
                            ),
                          }))
                        }
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Section */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5 text-[#202020]" />
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Name</Label>
                  <Input
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleInputChange}
                    placeholder="Emergency Contact Name"
                  />
                </div>
                <div>
                  <Label>Contact Mobile</Label>
                  <Input
                    name="emergencyContactMobile"
                    value={formData.emergencyContactMobile}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/companies")}
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
                "Create Company"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCompany;
