import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { useCreateBranchAdminMutation } from "@/features/api/authApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";

const CreateBranchAdmin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
    branch: "",
    status: true,
  });

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData, isLoading: branchLoading }] =
    useGetBranchesByCompanyMutation();

  const [createBranchAdmin, { isLoading, isSuccess, isError, data, error }] =
    useCreateBranchAdminMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { name, email, password, company, branch } = formData;
    if (!name || !email || !password || !company || !branch) {
      return toast.error("All fields are required.");
    }

    await createBranchAdmin(formData);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Branch Admin created successfully");
      navigate("/admin/branch-admins");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create Branch Admin");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add Branch Admin</h2>
      <p className="text-sm mb-4 text-gray-500">
        Assign branch admin to a company
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Full Name"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Email Address"
          />
        </div>
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Set Password"
          />
        </div>
        <div>
          <Label>Company</Label>
          <Select
            value={formData.company}
            onValueChange={async (val) => {
              setFormData((prev) => ({ ...prev, company: val, branch: "" }));
              try {
                await getBranchesByCompany(val);
              } catch (err) {
                toast.error("Failed to fetch branches for selected company");
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Company" />
            </SelectTrigger>
            <SelectContent>
              {companies?.companies?.map((c) => (
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
            value={formData.branch}
            onValueChange={(val) =>
              setFormData((prev) => ({ ...prev, branch: val }))
            }
            disabled={!formData.company || branchLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Branch" />
            </SelectTrigger>
            <SelectContent>
              {branchData?.branches?.map((b) => (
                <SelectItem key={b._id} value={b._id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <Label htmlFor="status-toggle">Active Status</Label>
          <Switch
            id="status-toggle"
            checked={formData.status}
            onCheckedChange={(checked) =>
              setFormData((prev) => ({ ...prev, status: checked }))
            }
          />
          <span className="text-sm text-gray-500">
            {formData.status ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/branch-admins")}
        >
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Branch Admin"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateBranchAdmin;
