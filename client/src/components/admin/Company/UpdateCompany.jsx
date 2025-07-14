// Final updated code for UpdateCompany.jsx with region dropdowns prefilled
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CloudCog, Loader2 } from "lucide-react";

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
  useGetCompanyByIdMutation,
  useUpdateCompanyMutation,
} from "@/features/api/Company/companyApi.js";
import { useGetAllCountriesQuery } from "@/features/api/Region/countryApi.js";
import { useGetStatesByCountryMutation } from "@/features/api/Region/stateApi.js";
import { useGetCitiesByStateMutation } from "@/features/api/Region/cityApi.js";
import { useGetLocalitiesByCityMutation } from "@/features/api/Region/LocalityApi.js";
import { useGetPincodesByLocalityMutation } from "@/features/api/Region/pincodeApi.js";

const UpdateCompany = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const companyId = location.state?.companyId;

  const [getCompanyById, { data: companyData, isSuccess }] =
    useGetCompanyByIdMutation();
  const [updatedCompany, { isLoading, isSuccess: isUpdated, error }] =
    useUpdateCompanyMutation();

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
    companyCode: "",
    emailId: "",
    website: "",
    gstNumber: "",
    gstNo: "",
    gstValue: "",
    pan: "",
    sacHsnCode: "",
    companyType: "",
    contactPhone: "",
    address: "",
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
    logo: null,
  });

  useEffect(() => {
    if (companyId) getCompanyById(companyId);
  }, [companyId]);

  useEffect(() => {
    if (isSuccess && companyData?.company) {
      const c = companyData.company;
      const region = {
        country: c.region?.country?._id || "",
        state: c.region?.state?._id || "",
        city: c.region?.city?._id || "",
        locality: c.region?.locality?._id || "",
        pincode: c.region?.pincode?._id || "",
      };
      setFormData({
        name: c.name || "",
        companyCode: c.companyCode || "",
        emailId: c.emailId || "",
        website: c.website || "",
        gstNumber: c.gstNumber || "",
        gstNo: c.gstNo || "",
        gstValue: c.gstValue || "",
        pan: c.pan || "",
        sacHsnCode: c.sacHsnCode || "",
        companyType: c.companyType || "",
        contactPhone: c.contactPhone || "",
        address: c.address || "",
        bankName: c.bankDetails?.bankName || "",
        accountNumber: c.bankDetails?.accountNumber || "",
        ifsc: c.bankDetails?.ifsc || "",
        emergencyContactName: c.emergencyContact?.name || "",
        emergencyContactMobile: c.emergencyContact?.mobile || "",
        status: c.status === true,
        region,
        logo: null,
      });

      if (region.country) getStatesByCountry(region.country);
      if (region.state) getCitiesByState(region.state);
      if (region.city) getLocalitiesByCity(region.city);
      if (region.locality) getPincodesByLocality(region.locality);
    }
  }, [isSuccess, companyData]);

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

  const handleUpdate = async () => {
    const { name, companyCode, emailId, website, gstNumber, gstNo, gstValue, pan, sacHsnCode, companyType, contactPhone, address } = formData;
    if (!name.trim()) return toast.error("Company name is required");
    if (!companyCode.trim()) return toast.error("Company code is required");
    if (!emailId.trim()) return toast.error("Email ID is required");
    if (!gstNumber.trim()) return toast.error("GST Number is required");
    if (!gstNo.trim()) return toast.error("GST NO is required");
    if (!gstValue || gstValue <= 0) return toast.error("GST Value is required and must be greater than 0");
    if (!pan.trim()) return toast.error("PAN is required");
    if (!sacHsnCode.trim()) return toast.error("SAC/HSN code is required");
    if (!companyType.trim()) return toast.error("Company type is required");
    if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
        gstNumber.toUpperCase()
      )
    ) {
      return toast.error("Invalid GST number format");
    }
    if (!/^\d{10}$/.test(contactPhone))
      return toast.error("Phone number must be 10 digits");
    if (!address.trim()) return toast.error("Address is required");

    const payload = new FormData();
    payload.append("companyId", companyId);
    payload.append("name", name);
    payload.append("companyCode", companyCode);
    payload.append("emailId", emailId);
    payload.append("website", website);
    payload.append("gstNumber", gstNumber);
    payload.append("gstNo", gstNo);
    payload.append("gstValue", gstValue);
    payload.append("pan", pan);
    payload.append("sacHsnCode", sacHsnCode);
    payload.append("companyType", companyType);
    payload.append("contactPhone", contactPhone);
    payload.append("address", address);
    payload.append("bankName", formData.bankName);
    payload.append("accountNumber", formData.accountNumber);
    payload.append("ifsc", formData.ifsc);
    payload.append("emergencyContactName", formData.emergencyContactName);
    payload.append("emergencyContactMobile", formData.emergencyContactMobile);
    payload.append("status", formData.status);
    payload.append("region[country]", formData.region.country);
    payload.append("region[state]", formData.region.state);
    payload.append("region[city]", formData.region.city);
    payload.append("region[locality]", formData.region.locality);
    payload.append("region[pincode]", formData.region.pincode);
    if (formData.logo) payload.append("companyLogo", formData.logo);

    await updatedCompany(payload);
  };

  useEffect(() => {
    if (isUpdated) {
      toast.success("Company Updated Successfully");
      setTimeout(() => navigate("/admin/companies"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isUpdated, error]);

  return (
    <div className="mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Company</h2>
      <p className="text-sm mb-6 text-muted-foreground">
        Update company details
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Company Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Company name"
          />
        </div>
        <div>
          <Label>Company Code</Label>
          <Input
            value={formData.companyCode}
            onChange={(e) =>
              setFormData({ ...formData, companyCode: e.target.value })
            }
            placeholder="Company code"
          />
        </div>
        <div>
          <Label>Email ID</Label>
          <Input
            type="email"
            value={formData.emailId}
            onChange={(e) =>
              setFormData({ ...formData, emailId: e.target.value })
            }
            placeholder="Email ID"
          />
        </div>
        <div>
          <Label>Website</Label>
          <Input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            placeholder="Website URL"
          />
        </div>
        <div>
          <Label>GST Number</Label>
          <Input
            value={formData.gstNumber}
            onChange={(e) =>
              setFormData({ ...formData, gstNumber: e.target.value })
            }
            placeholder="GST number"
          />
        </div>
        <div>
          <Label>GST NO</Label>
          <Input
            value={formData.gstNo}
            onChange={(e) =>
              setFormData({ ...formData, gstNo: e.target.value })
            }
            placeholder="GST NO"
          />
        </div>
        <div>
          <Label>GST Value</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.gstValue}
            onChange={(e) =>
              setFormData({ ...formData, gstValue: e.target.value })
            }
            placeholder="GST Value"
          />
        </div>
        <div>
          <Label>Company Type</Label>
          <Select
            value={formData.companyType}
            onValueChange={(val) =>
              setFormData({ ...formData, companyType: val })
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
            value={formData.pan}
            onChange={(e) =>
              setFormData({ ...formData, pan: e.target.value })
            }
            placeholder="PAN number"
          />
        </div>
        <div>
          <Label>SAC/HSN Code</Label>
          <Input
            value={formData.sacHsnCode}
            onChange={(e) =>
              setFormData({ ...formData, sacHsnCode: e.target.value })
            }
            placeholder="SAC/HSN code"
          />
        </div>
        <div>
          <Label>Contact Phone</Label>
          <Input
            value={formData.contactPhone}
            onChange={(e) =>
              setFormData({ ...formData, contactPhone: e.target.value })
            }
            placeholder="Phone number"
          />
        </div>
        <div>
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Address"
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
        <div>
          <Label>Logo (optional)</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setFormData({ ...formData, logo: e.target.files[0] })
            }
          />
        </div>
        

        {/* Bank Details Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Bank Details</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Bank Name</Label>
              <Input
                value={formData.bankName}
                onChange={(e) =>
                  setFormData({ ...formData, bankName: e.target.value })
                }
                placeholder="Bank Name"
              />
            </div>
            <div>
              <Label>Account Number</Label>
              <Input
                value={formData.accountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, accountNumber: e.target.value })
                }
                placeholder="Account Number"
              />
            </div>
            <div>
              <Label>IFSC Code</Label>
              <Input
                value={formData.ifsc}
                onChange={(e) =>
                  setFormData({ ...formData, ifsc: e.target.value })
                }
                placeholder="IFSC Code"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="md:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Emergency Contact</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Contact Name</Label>
              <Input
                value={formData.emergencyContactName}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactName: e.target.value })
                }
                placeholder="Emergency Contact Name"
              />
            </div>
            <div>
              <Label>Contact Mobile</Label>
              <Input
                value={formData.emergencyContactMobile}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyContactMobile: e.target.value })
                }
                placeholder="10-digit mobile number"
              />
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
        </div>
      </div>
      

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/admin/companies")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleUpdate}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Company"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateCompany;
