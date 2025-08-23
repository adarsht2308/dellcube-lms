import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
    <div className="mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Customer</h2>
      <p className="text-sm mb-6 text-muted-foreground">
        Update customer details
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Phone</Label>
          <Input
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
        </div>

        <div>
          <Label>GST Number</Label>
          <Input
            value={formData.gstNumber}
            onChange={(e) =>
              setFormData({ ...formData, gstNumber: e.target.value })
            }
          />
        </div>

        <div className="col-span-2">
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />
        </div>

        {/* Company Information Section */}
        <div className="col-span-2">
          <Label className="font-semibold text-gray-700">Company Information</Label>
        </div>
        
        <div>
          <Label>Company Name</Label>
          <Input
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Company Contact Name</Label>
          <Input
            value={formData.companyContactName}
            onChange={(e) =>
              setFormData({ ...formData, companyContactName: e.target.value })
            }
          />
        </div>

        <div className="col-span-2">
          <Label>Company Contact Info</Label>
          <Input
            value={formData.companyContactInfo}
            onChange={(e) =>
              setFormData({ ...formData, companyContactInfo: e.target.value })
            }
          />
        </div>

        {/* Tax Information Section */}
        <div className="col-span-2">
          <Label className="font-semibold text-gray-700">Tax Information</Label>
        </div>

        <div>
          <Label>Tax Type</Label>
          <Select
            value={formData.taxType}
            onValueChange={(value) =>
              setFormData({ ...formData, taxType: value })
            }
          >
            <SelectTrigger>
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
          <Label>Tax Value (%)</Label>
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={formData.taxValue}
            onChange={(e) =>
              setFormData({ ...formData, taxValue: e.target.value })
            }
          />
        </div>

        <div>
          <Label>Company</Label>
          <Select
            value={formData.company}
            onValueChange={(val) => handleCompanyChange(val)}
            disabled={isBranchAdmin}
          >
            <SelectTrigger>
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
          <Label>Branch</Label>
          <Select
            value={
              branches.some((b) => b._id === formData.branch)
                ? formData.branch
                : ""
            }
            onValueChange={(val) => setFormData({ ...formData, branch: val })}
            disabled={isBranchAdmin}
          >
            <SelectTrigger>
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

        {/* Consignee Section */}
        <div className="col-span-2">
          <Label className="font-semibold text-gray-700">Consignees</Label>
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
        <div className="col-span-2">
          <Label className="font-semibold text-gray-700">Consignors</Label>
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
        <Button disabled={isLoading} onClick={handleUpdate}>
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
  );
};

export default UpdateCustomer;
