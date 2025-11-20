import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  FileText,
  Banknote,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  useGetVendorByIdMutation,
  useUpdateVendorMutation,
} from "@/features/api/Vendor/vendorApi";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetAllBranchesQuery } from "@/features/api/Branch/branchApi.js";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi.js";

const UpdateVendor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = location.state?.vendorId;

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
    assignedClients: [],
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");

  const [getVendorById, { data: viewData, isSuccess: isGetSuccess, isLoading: isVendorLoading }] =
    useGetVendorByIdMutation();
  const [updateVendor, { isLoading, isSuccess: isUpdateSuccess, error }] =
    useUpdateVendorMutation();

  useEffect(() => {
    if (vendorId) {
      getVendorById(vendorId);
    } else {
      toast.error("No vendor ID provided for update.");
      navigate("/admin/vendors");
    }
  }, [vendorId, getVendorById, navigate]);

  const { data: companyData } = useGetAllCompaniesQuery({
    page: 1,
    limit: 100,
  });
  const { data: branchData } = useGetAllBranchesQuery({ page: 1, limit: 100 });
  const { data: customersData } = useGetAllCustomersQuery({
    page: 1,
    limit: 100,
  });

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
        assignedClients: v.assignedClients?.map((client) => client._id || client) || [],
      });
      setSignaturePreview(v.signature?.url || "");
    }
  }, [isGetSuccess, viewData]);

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


  const handleStatusToggle = (checked) => {
    setVendorData((prev) => ({
      ...prev,
      status: checked,
    }));
  };

  const handleUpdate = async () => {
    const {
      name,
      phone,
      email,
      company,
      branch,
      assignedClients,
      status: isStatusActive,
      panNumber,
    } = vendorData;

    // Detailed validation with specific error messages
    if (!name?.trim()) {
      toast.error("Vendor Name is required");
      return;
    }

    if (!email?.trim()) {
      toast.error("Email is required");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!phone?.trim()) {
      toast.error("Phone number is required");
      return;
    }

    // Phone number validation
    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    if (!company) {
      toast.error("Company is required");
      return;
    }

    if (!branch) {
      toast.error("Branch is required");
      return;
    }

    if (!panNumber?.trim()) {
      toast.error("PAN Number is required");
      return;
    }

    if (!assignedClients || assignedClients.length === 0) {
      toast.error("At least one customer must be assigned");
      return;
    }

    if (!vendorId) {
      toast.error("Vendor ID is missing. Please try again.");
      return;
    }

    try {
      const statusString = isStatusActive ? "active" : "inactive";
      const payload = new FormData();
      payload.append("vendorId", vendorId);
      console.log("Updating vendor with ID:", vendorId);
      payload.append("name", vendorData.name);
      payload.append("email", vendorData.email);
      payload.append("phone", vendorData.phone);
      payload.append("address", vendorData.address);
      payload.append("gstNumber", vendorData.gstNumber || "");
      payload.append("panNumber", vendorData.panNumber);
      payload.append("bankName", vendorData.bankName || "");
      payload.append("accountNumber", vendorData.accountNumber || "");
      payload.append("ifsc", vendorData.ifsc || "");
      payload.append("status", statusString);
      payload.append("company", vendorData.company);
      payload.append("branch", vendorData.branch);
      // Append each assigned client
      vendorData.assignedClients.forEach((clientId) => {
        payload.append("assignedClients", clientId);
      });
      if (signatureFile) {
        payload.append("signature", signatureFile);
      }

      const result = await updateVendor(payload).unwrap();
      // Success is handled in useEffect
    } catch (err) {
      // Detailed error handling
      if (err?.data?.message) {
        toast.error(err.data.message);
      } else if (err?.data?.error) {
        toast.error(err.data.error);
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update vendor. Please try again.");
      }
      console.error("Update vendor error:", err);
    }
  };

  useEffect(() => {
    if (isUpdateSuccess) {
      toast.success("Vendor updated successfully");
      setTimeout(() => navigate("/admin/vendors"), 1500);
    }
  }, [isUpdateSuccess, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/vendors")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vendors
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Users className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Vendor
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update vendor details and information
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {isVendorLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD249]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-[#202020]" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Eg. ABC Logistics"
                      value={vendorData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Eg. contact@abclogistics.com"
                      value={vendorData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={vendorData.phone}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      }}
                      maxLength="10"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={vendorData.address}
                      onChange={handleChange}
                      placeholder="Address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company *</Label>
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
                  <div>
                    <Label htmlFor="branch">Branch *</Label>
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
                  <div>
                    <Label htmlFor="assignedClients">Assigned Customers *</Label>
                    <div className="mt-2 border rounded-md p-4 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                      {customersData?.customers && customersData.customers.length > 0 ? (
                        <div className="space-y-3">
                          {customersData.customers.map((customer) => (
                            <div
                              key={customer._id}
                              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                              <Checkbox
                                id={`customer-${customer._id}`}
                                checked={vendorData.assignedClients.includes(
                                  customer._id
                                )}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setVendorData({
                                      ...vendorData,
                                      assignedClients: [
                                        ...vendorData.assignedClients,
                                        customer._id,
                                      ],
                                    });
                                  } else {
                                    setVendorData({
                                      ...vendorData,
                                      assignedClients: vendorData.assignedClients.filter(
                                        (id) => id !== customer._id
                                      ),
                                    });
                                  }
                                }}
                              />
                              <label
                                htmlFor={`customer-${customer._id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {customer.name} - {customer?.branch?.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No customers available
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Select one or more customers to assign to this vendor. The
                      vendor will be able to create dockets for these customers
                      only.
                    </p>
                    {vendorData.assignedClients.length > 0 && (
                      <p className="text-xs text-[#FFD249] mt-1 font-medium">
                        {vendorData.assignedClients.length} customer(s) selected
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="status"
                      checked={vendorData.status}
                      onCheckedChange={handleStatusToggle}
                    />
                    <Label htmlFor="status">
                      {vendorData.status ? "Active" : "Inactive"} Vendor
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Signature Upload */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#202020]" />
                Authorized Signature
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <Label>Upload Signature</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSignatureFile(file || null);
                      setSignaturePreview(
                        file ? URL.createObjectURL(file) : signaturePreview
                      );
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PNG, JPG. Recommended transparent
                    background.
                  </p>
                <p className="text-xs text-blue-600 mt-1">
                  This signature will print automatically on dockets handled by
                  this vendor.
                </p>
                </div>
                {signaturePreview && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <Label className="text-xs text-gray-600">Current Preview</Label>
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="mt-2 max-h-32 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

            {/* Business Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-[#202020]" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      name="gstNumber"
                      value={vendorData.gstNumber}
                      onChange={handleChange}
                      placeholder="GST Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="panNumber">PAN Number *</Label>
                    <Input
                      id="panNumber"
                      name="panNumber"
                      value={vendorData.panNumber}
                      onChange={handleChange}
                      placeholder="PAN Number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="w-5 h-5 text-[#202020]" />
                  Bank Account Details (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={vendorData.bankName}
                      onChange={handleChange}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={vendorData.accountNumber}
                      onChange={handleChange}
                      placeholder="Account Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      name="ifsc"
                      value={vendorData.ifsc}
                      onChange={handleChange}
                      placeholder="IFSC Code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/vendors")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isLoading}
                className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
              >
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
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateVendor;
