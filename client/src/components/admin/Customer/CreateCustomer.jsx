import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, Users, Building2, CreditCard, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";
import { FaRegTrashCan } from "react-icons/fa6";

import { useCreateCustomerMutation } from "@/features/api/Customer/customerApi.js";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateCustomer = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";

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
  });

  useEffect(() => {
    if (isBranchAdmin && user?.company && user?.branch) {
      console.log("Setting company and branch for branch admin:", user.company._id, user.branch._id);
      setFormData((prev) => ({
        ...prev,
        company: String(user.company._id),
        branch: String(user.branch._id),
      }));
      // Also set branches for branch admin
      setBranches([{ _id: user.branch._id, name: user.branch.name }]);
    }
  }, [user, isBranchAdmin]);

  const [branches, setBranches] = useState([]);
  const { data: companies = [] } = useGetAllCompaniesQuery({ status: "true" });
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const [createCustomer, { isLoading, isSuccess, isError, error, data }] =
    useCreateCustomerMutation();

  const handleCompanyChange = async (companyId) => {
    setFormData((prev) => ({
      ...prev,
      company: isBranchAdmin ? prev.company : companyId,
      branch: isBranchAdmin ? prev?.branch : "",
    }));

    const res = await getBranchesByCompany(companyId);

    if (res?.data?.branches) {
      setBranches(res?.data?.branches);
    } else {
      setBranches([]);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.company || !formData.branch) {
      toast.error("Name, Company, and Branch are required");
      return;
    }

    await createCustomer({
      ...formData,
      createdBy: user?._id,
    });
  };

  useEffect(() => {
    if (!isBranchAdmin && formData.company) {
      handleCompanyChange(formData.company);
    } else if (isBranchAdmin && user?.company) {
      handleCompanyChange(user.company);
    }
  }, []);

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Customer created successfully");
      navigate("/admin/customers");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create customer");
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
                Create New Customer
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Add a new customer to your organization
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

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
            </div>
          </Card>

          {/* Company Information Card */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name
                </Label>
                <Input
                  placeholder="e.g., ABC Corporation"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
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

              <div className="md:col-span-2">
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
          {!isBranchAdmin && (
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
                    onValueChange={handleCompanyChange}
                  >
                    <SelectTrigger className="w-full mt-1.5">
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
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branch *
                  </Label>
                  <Select
                    value={formData.branch}
                    onValueChange={(value) =>
                      setFormData({ ...formData, branch: value })
                    }
                  >
                    <SelectTrigger className="w-full mt-1.5">
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
              </div>
            </Card>
          )}

          {/* Consignees Card */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Consignees
            </h3>
            <div className="space-y-3">
              {formData.consignees.map((consignee, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Site ID</Label>
                      <Input
                        placeholder="Enter site ID"
                        value={consignee.siteId}
                        onChange={(e) => {
                          const newConsignees = [...formData.consignees];
                          newConsignees[index].siteId = e.target.value;
                          setFormData({ ...formData, consignees: newConsignees });
                        }}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Consignee</Label>
                      <Input
                        placeholder="Enter consignee name"
                        value={consignee.consignee}
                        onChange={(e) => {
                          const newConsignees = [...formData.consignees];
                          newConsignees[index].consignee = e.target.value;
                          setFormData({ ...formData, consignees: newConsignees });
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      const newConsignees = formData.consignees.filter((_, i) => i !== index);
                      setFormData({ ...formData, consignees: newConsignees });
                    }}
                  >
                    <FaRegTrashCan className="w-4 h-4 mr-2" />
                    Remove Consignee
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    consignees: [
                      ...formData.consignees,
                      {
                        siteId: "",
                        consignee: "",
                      },
                    ],
                  });
                }}
                className="bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] border-[#FFD249]/30"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Consignee
              </Button>
            </div>
          </Card>

          {/* Consignors Card */}
          <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Consignors
            </h3>
            <div className="space-y-3">
              {formData.consignors.map((consignor, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-400">Consignor</Label>
                      <Input
                        placeholder="Enter consignor name"
                        value={consignor.consignor}
                        onChange={(e) => {
                          const newConsignors = [...formData.consignors];
                          newConsignors[index].consignor = e.target.value;
                          setFormData({ ...formData, consignors: newConsignors });
                        }}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    onClick={() => {
                      const newConsignors = formData.consignors.filter((_, i) => i !== index);
                      setFormData({ ...formData, consignors: newConsignors });
                    }}
                  >
                    <FaRegTrashCan className="w-4 h-4 mr-2" />
                    Remove Consignor
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    ...formData,
                    consignors: [
                      ...formData.consignors,
                      {
                        consignor: "",
                      },
                    ],
                  });
                }}
                className="bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] border-[#FFD249]/30"
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Consignor
              </Button>
            </div>
          </Card>
        </div>

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
            onClick={handleSubmit}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              "Create Customer"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateCustomer;
