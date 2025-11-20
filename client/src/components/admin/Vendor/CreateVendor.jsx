import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Lock,
  FileText,
  Banknote,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useCreateVendorMutation } from "@/features/api/Vendor/vendorApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi";

const CreateVendor = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";

  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    status: "active",
    company: "",
    branch: "",
    assignedClients: [],
    password: "",
    confirmPassword: "",
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");

  const [branches, setBranches] = useState([]);
  const { data: companies = [] } = useGetAllCompaniesQuery({ status: "true" });
  const { data: customers = [] } = useGetAllCustomersQuery({ status: "true" });
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const [createVendor, { isLoading, isSuccess, isError, error, data }] =
    useCreateVendorMutation();

  useEffect(() => {
    if (isBranchAdmin && user?.company && user?.branch) {
      setVendorFormData((prev) => ({
        ...prev,
        company: String(user?.company?._id),
        branch: String(user?.branch?._id),
      }));
    }
  }, [user]);

  const handleCompanyChange = async (companyId) => {
    setVendorFormData((prev) => ({
      ...prev,
      company: isBranchAdmin ? prev?.company : companyId,
      branch: isBranchAdmin ? prev?.branch : "",
    }));

    const res = await getBranchesByCompany(companyId);
    if (res?.data?.branches) {
      setBranches(res?.data?.branches);
    } else {
      setBranches([]);
    }
  };

  useEffect(() => {
    if (!isBranchAdmin && vendorFormData.company) {
      handleCompanyChange(vendorFormData.company);
    } else if (isBranchAdmin && user?.company) {
      handleCompanyChange(user.company);
    }
  }, []);

  useEffect(() => {
    if (isSuccess && data) {
      toast.success(data?.message || "Vendor created successfully");
      navigate("/admin/vendors");
    }
  }, [isSuccess, data, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusChange = (value) => {
    setVendorFormData((prev) => ({
      ...prev,
      status: value,
    }));
  };

  const handleSubmit = async () => {
    const {
      name,
      email,
      phone,
      company,
      branch,
      assignedClient,
      password,
      confirmPassword,
      panNumber,
    } = vendorFormData;

    // Detailed validation with specific error messages
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

    if (!vendorFormData.assignedClients || vendorFormData.assignedClients.length === 0) {
      toast.error("At least one customer must be assigned");
      return;
    }

    if (!password) {
      toast.error("Password is required");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    if (!confirmPassword) {
      toast.error("Confirm Password is required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password and Confirm Password do not match");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("name", vendorFormData.name);
      payload.append("email", vendorFormData.email);
      payload.append("phone", vendorFormData.phone);
      payload.append("address", vendorFormData.address);
      payload.append("gstNumber", vendorFormData.gstNumber);
      payload.append("panNumber", vendorFormData.panNumber);
      payload.append("bankName", vendorFormData.bankName);
      payload.append("accountNumber", vendorFormData.accountNumber);
      payload.append("ifsc", vendorFormData.ifsc);
      payload.append("status", vendorFormData.status);
      payload.append("company", vendorFormData.company);
      payload.append("branch", vendorFormData.branch);
      // Append each assigned client
      vendorFormData.assignedClients.forEach((clientId) => {
        payload.append("assignedClients", clientId);
      });
      payload.append("password", password);
      payload.append("createdBy", user?._id || "");
      if (signatureFile) {
        payload.append("signature", signatureFile);
      }

      const result = await createVendor(payload).unwrap();
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
        toast.error("Failed to create vendor. Please try again.");
      }
      console.error("Create vendor error:", err);
    }
  };

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
                Create Vendor
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new vendor to your organization
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
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
                    value={vendorFormData.name}
                    onChange={handleChange}
                    placeholder="Vendor Name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={vendorFormData.email}
                    onChange={handleChange}
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={vendorFormData.phone}
                    onChange={handleChange}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    }}
                    maxLength="10"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={vendorFormData.address}
                    onChange={handleChange}
                    placeholder="Address"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company *</Label>
                  <Select
                    value={vendorFormData.company}
                    onValueChange={handleCompanyChange}
                    disabled={isBranchAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {(companies?.companies || []).map((comp) => (
                        <SelectItem key={comp._id} value={comp._id}>
                          {comp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="branch">Branch *</Label>
                  <Select
                    value={vendorFormData.branch}
                    onValueChange={(value) =>
                      setVendorFormData({ ...vendorFormData, branch: value })
                    }
                    disabled={isBranchAdmin}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignedClients">Assigned Customers *</Label>
                  <div className="mt-2 border rounded-md p-4 max-h-60 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                    {customers?.customers && customers.customers.length > 0 ? (
                      <div className="space-y-3">
                        {customers.customers.map((customer) => (
                          <div
                            key={customer._id}
                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          >
                            <Checkbox
                              id={`customer-${customer._id}`}
                              checked={vendorFormData.assignedClients.includes(
                                customer._id
                              )}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setVendorFormData({
                                    ...vendorFormData,
                                    assignedClients: [
                                      ...vendorFormData.assignedClients,
                                      customer._id,
                                    ],
                                  });
                                } else {
                                  setVendorFormData({
                                    ...vendorFormData,
                                    assignedClients: vendorFormData.assignedClients.filter(
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
                              {customer.name} - {customer.email}
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
                  {vendorFormData.assignedClients.length > 0 && (
                    <p className="text-xs text-[#FFD249] mt-1 font-medium">
                      {vendorFormData.assignedClients.length} customer(s)
                      selected
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={vendorFormData.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                    setSignaturePreview(file ? URL.createObjectURL(file) : "");
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
                  <Label className="text-xs text-gray-600">Preview</Label>
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
                    value={vendorFormData.gstNumber}
                    onChange={handleChange}
                    placeholder="GST Number"
                  />
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number *</Label>
                  <Input
                    id="panNumber"
                    name="panNumber"
                    value={vendorFormData.panNumber}
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
                    value={vendorFormData.bankName}
                    onChange={handleChange}
                    placeholder="Bank Name"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    name="accountNumber"
                    value={vendorFormData.accountNumber}
                    onChange={handleChange}
                    placeholder="Account Number"
                  />
                </div>
                <div>
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    name="ifsc"
                    value={vendorFormData.ifsc}
                    onChange={handleChange}
                    placeholder="IFSC Code"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Login Credentials */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-[#202020]" />
                Login Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={vendorFormData.password}
                    onChange={handleChange}
                    placeholder="Set a password for vendor login"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={vendorFormData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter the password"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end sticky bottom-4 ">
            <Button
              variant="outline"
              onClick={() => navigate("/admin/vendors")}
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Vendor"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateVendor;
