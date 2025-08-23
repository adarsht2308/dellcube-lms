import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useSelector } from "react-redux";

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
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-white">
        Create Customer
      </h2>
      <p className="text-sm mb-4 text-gray-500 dark:text-gray-400">
        Add your client
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm mb-1">Customer Name</Label>
          <Input
            placeholder="Enter customer name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-sm mb-1">Email</Label>
          <Input
            placeholder="Enter email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-sm mb-1">Phone</Label>
          <Input
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-sm mb-1">GST Number</Label>
          <Input
            placeholder="Enter GST number"
            value={formData.gstNumber}
            onChange={(e) =>
              setFormData({ ...formData, gstNumber: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm mb-1">Address</Label>
          <Input
            placeholder="Enter address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>

        {/* Company Information Section */}
        <div className="md:col-span-2">
          <Label className="text-sm mb-1 font-semibold text-gray-700">Company Information</Label>
        </div>
        
        <div>
          <Label className="text-sm mb-1">Company Name</Label>
          <Input
            placeholder="Enter company name"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
          />
        </div>

        <div>
          <Label className="text-sm mb-1">Company Contact Name</Label>
          <Input
            placeholder="Enter contact person name"
            value={formData.companyContactName}
            onChange={(e) =>
              setFormData({ ...formData, companyContactName: e.target.value })
            }
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-sm mb-1">Company Contact Info</Label>
          <Input
            placeholder="Enter contact information"
            value={formData.companyContactInfo}
            onChange={(e) =>
              setFormData({ ...formData, companyContactInfo: e.target.value })
            }
          />
        </div>

        {/* Tax Information Section */}
        <div className="md:col-span-2">
          <Label className="text-sm mb-1 font-semibold text-gray-700">Tax Information</Label>
        </div>

        <div>
          <Label className="text-sm mb-1">Tax Type</Label>
          <Select
            value={formData.taxType}
            onValueChange={(value) =>
              setFormData({ ...formData, taxType: value })
            }
          >
            <SelectTrigger className="w-full">
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
          <Label className="text-sm mb-1">Tax Value (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Enter tax percentage"
            value={formData.taxValue}
            onChange={(e) =>
              setFormData({ ...formData, taxValue: e.target.value })
            }
          />
        </div>

        {!isBranchAdmin && (
          <div>
            <Label className="text-sm mb-1">Company</Label>
            <Select
              value={formData.company}
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
        )}

        {!isBranchAdmin && (
          <div>
            <Label className="text-sm mb-1">Branch</Label>
            <Select
              value={formData.branch}
              onValueChange={(value) =>
                setFormData({ ...formData, branch: value })
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
        )}

        {/* Consignee Section */}
        <div className="md:col-span-2">
          <Label className="text-sm mb-1 font-semibold text-gray-700">Consignees</Label>
          <div className="space-y-3">
            {formData.consignees.map((consignee, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1">Site ID</Label>
                    <Input
                      placeholder="Enter site ID"
                      value={consignee.siteId}
                      onChange={(e) => {
                        const newConsignees = [...formData.consignees];
                        newConsignees[index].siteId = e.target.value;
                        setFormData({ ...formData, consignees: newConsignees });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1">Consignee</Label>
                    <Input
                      placeholder="Enter consignee name"
                      value={consignee.consignee}
                      onChange={(e) => {
                        const newConsignees = [...formData.consignees];
                        newConsignees[index].consignee = e.target.value;
                        setFormData({ ...formData, consignees: newConsignees });
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-red-600 hover:text-red-700"
                  onClick={() => {
                    const newConsignees = formData.consignees.filter((_, i) => i !== index);
                    setFormData({ ...formData, consignees: newConsignees });
                  }}
                >
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
            >
              Add Consignee
            </Button>
          </div>
        </div>

        {/* Consignor Section */}
        <div className="md:col-span-2">
          <Label className="text-sm mb-1 font-semibold text-gray-700">Consignors</Label>
          <div className="space-y-3">
            {formData.consignors.map((consignor, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs mb-1">Consignor</Label>
                    <Input
                      placeholder="Enter consignor name"
                      value={consignor.consignor}
                      onChange={(e) => {
                        const newConsignors = [...formData.consignors];
                        newConsignors[index].consignor = e.target.value;
                        setFormData({ ...formData, consignors: newConsignors });
                      }}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 text-red-600 hover:text-red-700"
                  onClick={() => {
                    const newConsignors = formData.consignors.filter((_, i) => i !== index);
                    setFormData({ ...formData, consignors: newConsignors });
                  }}
                >
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
            >
              Add Consignor
            </Button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/admin/customers")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Customer"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateCustomer;
