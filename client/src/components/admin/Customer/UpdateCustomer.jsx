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
