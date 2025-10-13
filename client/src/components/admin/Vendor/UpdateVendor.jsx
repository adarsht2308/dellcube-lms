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
    assignedClient: "",
  });

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
        assignedClient: v.assignedClient?._id || "",
      });
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

  const handleAssignedClientChange = (value) => {
    setVendorData((prev) => ({ ...prev, assignedClient: value }));
  };

  const handleStatusToggle = (checked) => {
    setVendorData((prev) => ({
      ...prev,
      status: checked,
    }));
  };

  const handleUpdate = async () => {
    const { name, phone, email, status: isStatusActive } = vendorData;

    if (!name || !email || !phone) {
      toast.error("Name, Email, and Phone are required fields.");
      return;
    }

    const statusString = isStatusActive ? "active" : "inactive";

    const payload = {
      vendorId,
      ...vendorData,
      status: statusString,
    };

    await updateVendor(payload);
  };

  useEffect(() => {
    if (isUpdateSuccess) {
      toast.success("Vendor updated successfully");
      setTimeout(() => navigate("/admin/vendors"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update vendor");
    }
  }, [isUpdateSuccess, error, navigate]);

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
                      placeholder="Eg. +91 9876543210"
                      value={vendorData.phone}
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
                    <Label htmlFor="assignedClient">Assigned Client *</Label>
                    <Select
                      value={vendorData.assignedClient}
                      onValueChange={handleAssignedClientChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a customer to assign" />
                      </SelectTrigger>
                      <SelectContent>
                        {customersData?.customers?.map((customer) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            {customer.name} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

            {/* Business Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-[#202020]" />
                  Business Information (Optional)
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
                    <Label htmlFor="panNumber">PAN Number</Label>
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
