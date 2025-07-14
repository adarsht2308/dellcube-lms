import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch"; // Import the Switch component

import {
  useGetVendorByIdMutation,
  useUpdateVendorMutation,
} from "@/features/api/Vendor/vendorApi"; // Import vendor API hooks
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetAllBranchesQuery } from "@/features/api/Branch/branchApi.js";

const UpdateVendor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = location.state?.vendorId; // Get vendorId from navigation state

  // State for vendor form fields
  // Status is managed as a boolean for the Switch component
  const [vendorData, setVendorData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    status: true,
    company: "",
    branch: "",
  });

  // RTK Query hooks
  const [getVendorById, { data: viewData, isSuccess: isGetSuccess }] =
    useGetVendorByIdMutation();
  const [updateVendor, { isLoading, isSuccess: isUpdateSuccess, error }] =
    useUpdateVendorMutation();

  // Fetch vendor data when component mounts or vendorId changes
  useEffect(() => {
    if (vendorId) {
      getVendorById(vendorId);
    } else {
      toast.error("No vendor ID provided for update.");
      navigate("/admin/vendors"); // Redirect if no ID is found
    }
  }, [vendorId, getVendorById, navigate]);

  const { data: companyData } = useGetAllCompaniesQuery({
    page: 1,
    limit: 100,
  });
  const { data: branchData } = useGetAllBranchesQuery({ page: 1, limit: 100 });

  // Populate form fields with fetched vendor data
  useEffect(() => {
    if (isGetSuccess && viewData?.vendor) {
      const v = viewData.vendor;
      setVendorData({
        name: v.name || "",
        phone: v.phone || "",
        email: v.email || "",
        address: v.address || "",
        gstNumber: v.gstNumber || "",
        panNumber: v.panNumber || "",
        bankName: v.bankName || "",
        accountNumber: v.accountNumber || "",
        ifsc: v.ifsc || "",
        status: v.status === "active",
        company: v.company?._id || "",
        branch: v.branch?._id || "",
      });
    }
  }, [isGetSuccess, viewData]);

  // Handle input changes (for text fields)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanyChange = (value) => {
    setVendorData((prev) => ({ ...prev, company: value }));
  };

  const handleBranchChange = (value) => {
    setVendorData((prev) => ({ ...prev, branch: value }));
  };

  // Handle status toggle change
  const handleStatusToggle = (checked) => {
    setVendorData((prev) => ({
      ...prev,
      status: checked,
    }));
  };

  // Handle the update submission
  const handleUpdate = async () => {
    const { name, phone, email, status: isStatusActive } = vendorData;

    // Client-side validation for required fields
    if (!name || !email || !phone) {
      toast.error("Name, Email, and Phone are required fields.");
      return;
    }

    // Convert boolean status back to string "active" or "inactive" for the backend
    const statusString = isStatusActive ? "active" : "inactive";

    const payload = {
      vendorId, // Pass the vendorId for the update mutation
      ...vendorData,
      status: statusString, // Use the converted string status
    };

    await updateVendor(payload);
  };

  // Effect for displaying toast messages after update operation
  useEffect(() => {
    if (isUpdateSuccess) {
      toast.success("Vendor updated successfully");
      setTimeout(() => navigate("/admin/vendors"), 1500); // Navigate back after a short delay
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update vendor");
    }
  }, [isUpdateSuccess, error, navigate]);

  // Show loading spinner while fetching initial vendor data
  if (isLoading && !viewData) {
    return (
      <section className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        <p className="ml-2 text-gray-500">Loading vendor details...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto bg-white shadow-sm rounded-xl p-4 md:p-10 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Edit Vendor</h1>
        <p className="text-sm text-gray-500">Update vendor details below</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vendor Name */}
        <div>
          <Label htmlFor="name" className="mb-1 block">
            Vendor Name *
          </Label>
          <Input
            id="name"
            name="name"
            placeholder="Eg. ABC Logistics"
            value={vendorData.name}
            onChange={handleChange}
          />
        </div>
        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="mb-1 block">
            Phone *
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Eg. +91 9876543210"
            value={vendorData.phone}
            onChange={handleChange}
          />
        </div>
        {/* Email */}
        <div>
          <Label htmlFor="email" className="mb-1 block">
            Email *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Eg. contact@abclogistics.com"
            value={vendorData.email}
            onChange={handleChange}
          />
        </div>
        {/* Address */}
        <div>
          <Label htmlFor="address" className="mb-1 block">
            Address
          </Label>
          <Input
            id="address"
            name="address"
            value={vendorData.address}
            onChange={handleChange}
          />
        </div>
        {/* GST Number */}
        <div>
          <Label htmlFor="gstNumber" className="mb-1 block">
            GST Number
          </Label>
          <Input
            id="gstNumber"
            name="gstNumber"
            value={vendorData.gstNumber}
            onChange={handleChange}
          />
        </div>
        {/* PAN Number */}
        <div>
          <Label htmlFor="panNumber" className="mb-1 block">
            PAN Number
          </Label>
          <Input
            id="panNumber"
            name="panNumber"
            value={vendorData.panNumber}
            onChange={handleChange}
          />
        </div>
        {/* Bank Name */}
        <div>
          <Label htmlFor="bankName" className="mb-1 block">
            Bank Name
          </Label>
          <Input
            id="bankName"
            name="bankName"
            value={vendorData.bankName}
            onChange={handleChange}
          />
        </div>
        {/* Account Number */}
        <div>
          <Label htmlFor="accountNumber" className="mb-1 block">
            Account Number
          </Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            value={vendorData.accountNumber}
            onChange={handleChange}
          />
        </div>
        {/* IFSC */}
        <div>
          <Label htmlFor="ifsc" className="mb-1 block">
            IFSC
          </Label>
          <Input
            id="ifsc"
            name="ifsc"
            value={vendorData.ifsc}
            onChange={handleChange}
          />
        </div>
        {/* Company Dropdown */}
        <div>
          <Label htmlFor="company" className="mb-1 block">
            Company *
          </Label>
          <Select
            value={vendorData.company}
            onValueChange={handleCompanyChange}
          >
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

        {/* Branch Dropdown */}
        <div>
          <Label htmlFor="branch" className="mb-1 block">
            Branch *
          </Label>
          <Select value={vendorData.branch} onValueChange={handleBranchChange}>
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

        {/* Status Toggle - Spans both columns */}
        <div className="flex items-center space-x-2 md:col-span-2 mt-2">
          <Switch
            id="status"
            checked={vendorData.status}
            onCheckedChange={handleStatusToggle}
          />
          <Label htmlFor="status" className="text-gray-700">
            {vendorData.status ? "Active" : "Inactive"} Vendor
          </Label>
        </div>
      </div>

      <div className="flex justify-start gap-4 mt-8">
        <Button variant="outline" onClick={() => navigate("/admin/vendors")}>
          Cancel
        </Button>
        <Button onClick={handleUpdate} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Vendor"
          )}
        </Button>
      </div>
    </section>
  );
};

export default UpdateVendor;
