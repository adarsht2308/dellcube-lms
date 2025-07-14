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
  });

  useEffect(() => {
    if (isBranchAdmin && user?.company && user?.branch) {
      console.log(user.branch);
      setFormData((prev) => ({
        ...prev,
        company: String(user?.company?._id),
        branch: String(user?.branch?._id),
      }));
    }
  }, [user]);

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
