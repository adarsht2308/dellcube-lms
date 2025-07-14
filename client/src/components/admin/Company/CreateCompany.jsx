import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
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
    bankName: "",
    accountNumber: "",
    ifsc: "",
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
  search: ""
});

  console.log(countries)
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
    const { name, companyCode, emailId, website, gstNumber, gstNo, gstValue, pan, sacHsnCode, companyType, address, contactPhone } = formData;

    if (!name.trim()) return toast.error("Company name is required.");
    if (!companyCode.trim()) return toast.error("Company code is required.");
    if (!emailId.trim()) return toast.error("Email ID is required.");
    if (!gstNumber.trim()) return toast.error("GST number is required.");
    if (!gstNo.trim()) return toast.error("GST NO is required.");
    if (!gstValue || gstValue <= 0) return toast.error("GST Value is required and must be greater than 0.");
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
    payload.append("bankName", formData.bankName.trim());
    payload.append("accountNumber", formData.accountNumber.trim());
    payload.append("ifsc", formData.ifsc.trim());
    payload.append("emergencyContactName", formData.emergencyContactName.trim());
    payload.append("emergencyContactMobile", formData.emergencyContactMobile.trim());
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
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New Company</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a company</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Company Name</Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Company Name"
          />
        </div>
        <div>
          <Label>Company Code</Label>
          <Input
            name="companyCode"
            value={formData.companyCode}
            onChange={handleInputChange}
            placeholder="Unique Company Code"
          />
        </div>
        <div>
          <Label>Email ID</Label>
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
          <Label>GST Number</Label>
          <Input
            name="gstNumber"
            value={formData.gstNumber}
            onChange={handleInputChange}
            placeholder="GSTIN"
          />
        </div>
        <div>
          <Label>GST NO</Label>
          <Input
            name="gstNo"
            value={formData.gstNo}
            onChange={handleInputChange}
            placeholder="GST NO"
          />
        </div>
        <div>
          <Label>GST Value</Label>
          <Input
            name="gstValue"
            type="number"
            step="0.01"
            value={formData.gstValue}
            onChange={handleInputChange}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label>Company Type</Label>
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
              <SelectItem value="transport company">Transport Company</SelectItem>
              <SelectItem value="warehouse company">Warehouse Company</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>PAN</Label>
          <Input
            name="pan"
            value={formData.pan}
            onChange={handleInputChange}
            placeholder="PAN Number"
          />
        </div>
        <div>
          <Label>SAC/HSN Code</Label>
          <Input
            name="sacHsnCode"
            value={formData.sacHsnCode}
            onChange={handleInputChange}
            placeholder="SAC/HSN Code"
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Company Address"
          />
        </div>
        <div>
          <Label>Contact Phone</Label>
          <Input
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleInputChange}
            placeholder="10-digit mobile number"
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

        {/* Region Selectors */}
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

        {/* Bank Details Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Bank Name</Label>
              <Input
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="Bank Name"
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                placeholder="Account Number"
              />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input
                name="ifsc"
                value={formData.ifsc}
                onChange={handleInputChange}
                placeholder="IFSC Code"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Emergency Contact</h3>
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
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/admin/companies")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
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
  );
};

export default CreateCompany;
