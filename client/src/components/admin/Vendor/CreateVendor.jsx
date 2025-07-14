import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateVendorMutation } from "@/features/api/Vendor/vendorApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";

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
    status: true,
    company: "",
    branch: "",
  });

  const [branches, setBranches] = useState([]);
  const { data: companies = [] } = useGetAllCompaniesQuery({ status: "true" });
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
      console.log(res?.data?.branches);
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
    if (isSuccess) {
      toast.success(data?.message || "Vendor created successfully");
      navigate("/admin/vendors");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create vendor");
    }
  }, [isSuccess, isError, data, error, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleStatusToggle = (checked) => {
    setVendorFormData((prev) => ({
      ...prev,
      status: checked,
    }));
  };

  const handleSubmit = async () => {
    const { name, email, phone, company, branch } = vendorFormData;

    if (!name || !email || !phone || !company || !branch) {
      toast.error(
        "Name, Email, Phone, Company and Branch are required fields."
      );
      return;
    }

    const statusString = vendorFormData.status ? "active" : "inactive";

    const payload = {
      ...vendorFormData,
      status: statusString,
      createdBy: user?._id,
    };

    await createVendor(payload);
  };

  return (
    <section className="md:mx-10 p-4 min-h-screen bg-white rounded-xl shadow-sm">
      <h2 className="text-2xl font-semibold text-gray-800 mb-1">
        Create Vendor
      </h2>
      <p className="text-sm mb-6 text-gray-500">
        Fill out the vendor details below
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Vendor Name*</Label>
          <Input
            id="name"
            name="name"
            value={vendorFormData.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="phone">Phone*</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={vendorFormData.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="email">Email*</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={vendorFormData.email}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            value={vendorFormData.address}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="gstNumber">GST Number</Label>
          <Input
            id="gstNumber"
            name="gstNumber"
            value={vendorFormData.gstNumber}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="panNumber">PAN Number</Label>
          <Input
            id="panNumber"
            name="panNumber"
            value={vendorFormData.panNumber}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="bankName">Bank Name</Label>
          <Input
            id="bankName"
            name="bankName"
            value={vendorFormData.bankName}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="accountNumber">Account Number</Label>
          <Input
            id="accountNumber"
            name="accountNumber"
            value={vendorFormData.accountNumber}
            onChange={handleChange}
          />
        </div>
        <div>
          <Label htmlFor="ifsc">IFSC</Label>
          <Input
            id="ifsc"
            name="ifsc"
            value={vendorFormData.ifsc}
            onChange={handleChange}
          />
        </div>

        {!isBranchAdmin && (
          <>
            <div>
              <Label htmlFor="company">Company*</Label>
              <Select
                value={vendorFormData.company}
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger className="w-full">
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
              <Label htmlFor="branch">Branch*</Label>
              <Select
                value={vendorFormData.branch}
                onValueChange={(value) =>
                  setVendorFormData({ ...vendorFormData, branch: value })
                }
              >
                <SelectTrigger className="w-full">
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
          </>
        )}

        <div className="flex items-center space-x-2 md:col-span-2 mt-2">
          <Switch
            id="status"
            checked={vendorFormData.status}
            onCheckedChange={handleStatusToggle}
          />
          <Label htmlFor="status">
            {vendorFormData.status ? "Active" : "Inactive"} Vendor
          </Label>
        </div>
      </div>

      <div className="flex justify-start gap-3 mt-8">
        <Button variant="outline" onClick={() => navigate("/admin/vendors")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create Vendor"
          )}
        </Button>
      </div>
    </section>
  );
};

export default CreateVendor;
