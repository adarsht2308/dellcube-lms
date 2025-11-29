import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Users, Building2, CreditCard } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import {
  useGetCustomerByIdMutation,
  useUpdateCustomerMutation,
} from "@/features/api/Customer/customerApi.js";
import ConsigneeConsignorManager from "./ConsigneeConsignorManager";
import MisFieldsManager from "./MisFieldsManager";

const UpdateCustomer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const customerId = location.state?.customerId;

  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";

  const [getCustomerById, { data: customerData }] =
    useGetCustomerByIdMutation();

  const [updateCustomer, { isLoading, isSuccess, isError, error }] =
    useUpdateCustomerMutation();

  const { data: companies = {} } = useGetAllCompaniesQuery({ status: "true" });

  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();

  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
    company: "",
    branch: "",
    companyName: "",
    companyContactName: "",
    companyContactInfo: "",
    taxType: "",
    taxValue: "",
    consignees: [],
    consignors: [],
    misFields: [],
    status: true,
  });

  useEffect(() => {
    if (customerId) getCustomerById(customerId);
  }, [customerId]);

  useEffect(() => {
    if (customerData?.customer) {
      const c = customerData.customer;
      const companyId = c.company._id;
      setFormData({
        name: c.name || "",
        email: c.email || "",
        phone: c.phone || "",
        gstNumber: c.gstNumber || "",
        address: c.address || "",
        company: isBranchAdmin ? user?.company : c.company?._id || "",
        branch: "",
        companyName: c.companyName || "",
        companyContactName: c.companyContactName || "",
        companyContactInfo: c.companyContactInfo || "",
        taxType: c.taxType || "",
        taxValue: c.taxValue || "",
        consignees: c.consignees || [],
        consignors: c.consignors || [],
        misFields: c.misFields || [],
        status: c.status === true || c.status === "active",
      });

      // Step 2: If not admin, fetch branches & then set branch
      if (!isBranchAdmin && c.company?._id) {
        getBranchesByCompany(c.company._id).then((res) => {
          const br = res?.data?.branches || [];
          setBranches(br);

          setFormData((prev) => ({
            ...prev,
            branch: c.branch?._id || "",
          }));
        });
      }

      // Step 3: If admin, populate only their branch
      if (isBranchAdmin) {
        setBranches([{ _id: user.branch, name: "Your Branch" }]);
        setFormData((prev) => ({
          ...prev,
          branch: user.branch,
        }));
      }
    }
  }, [customerData]);

  const handleCompanyChange = async (companyId) => {
    setFormData({ ...formData, company: companyId, branch: "" });
    const res = await getBranchesByCompany( companyId );
    setBranches(res?.data?.branches || []);
  };

  const handleUpdate = async () => {
    const { name, company, branch } = formData;
    if (!name || !company || !branch) {
      toast.error("Name, Company, and Branch are required");
      return;
    }

    await updateCustomer({
      customerId,
      ...formData,
      status: formData.status ? true : false,
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Customer updated successfully");
      navigate("/admin/customers");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to update customer");
    }
  }, [isSuccess, isError]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/customers")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Users className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Customer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Edit customer details and information
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

        {!customerData?.customer ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFD249]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information Card */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Name *
                  </Label>
                  <Input
                    placeholder="e.g., John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </Label>
                  <Input
                    placeholder="e.g., john@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone
                  </Label>
                  <Input
                    placeholder="e.g., +91 9876543210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    GST Number
                  </Label>
                  <Input
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, gstNumber: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address
                  </Label>
                  <Input
                    placeholder="e.g., 123 Main Street, City, State"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Contact Name
                  </Label>
                  <Input
                    placeholder="e.g., Jane Smith"
                    value={formData.companyContactName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyContactName: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>

                <div >
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company Contact Info
                  </Label>
                  <Input
                    placeholder="e.g., Phone, Email, Address"
                    value={formData.companyContactInfo}
                    onChange={(e) =>
                      setFormData({ ...formData, companyContactInfo: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Card>

          

            {/* Tax Information Card */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Tax Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tax Type
                  </Label>
                  <Select
                    value={formData.taxType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, taxType: value })
                    }
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Select tax type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GST">GST</SelectItem>
                      <SelectItem value="CGST+SGST">CGST+SGST</SelectItem>
                      <SelectItem value="IGST">IGST</SelectItem>
                      <SelectItem value="Exempt">Exempt</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tax Value (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="e.g., 18.00"
                    value={formData.taxValue}
                    onChange={(e) =>
                      setFormData({ ...formData, taxValue: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>
            </Card>

            {/* Organization Assignment Card */}
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Organization Assignment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Company *
                  </Label>
                  <Select
                    value={formData.company}
                    onValueChange={(val) => handleCompanyChange(val)}
                    disabled={isBranchAdmin}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {(companies?.companies || []).map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch *
                  </Label>
                  <Select
                    value={
                      branches.some((b) => b._id === formData.branch)
                        ? formData.branch
                        : ""
                    }
                    onValueChange={(val) => setFormData({ ...formData, branch: val })}
                    disabled={isBranchAdmin}
                  >
                    <SelectTrigger className="w-full mt-1.5">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {(branches || []).map((b) => (
                        <SelectItem key={b._id} value={b._id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center gap-4 mt-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
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
              </div>
            </Card>

            {/* Consignees & Consignors Manager */}
            <ConsigneeConsignorManager
              customerId={customerId}
              consignees={formData.consignees}
              consignors={formData.consignors}
              onUpdate={(updates) => {
                if (updates.refetch) {
                  // Refetch customer data after bulk upload
                  getCustomerById(customerId);
                } else {
                  // Update form data for local changes
                  setFormData({ ...formData, ...updates });
                }
              }}
            />

            {/* MIS Fields Manager */}
            <MisFieldsManager
              customerId={customerId}
              misFields={formData.misFields}
              onUpdate={(updates) => {
                if (updates.misFields) {
                  setFormData({ ...formData, misFields: updates.misFields });
                  getCustomerById(customerId);
                }
              }}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/customers")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            disabled={isLoading} 
            onClick={handleUpdate}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update Customer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCustomer;
