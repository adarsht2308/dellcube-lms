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

import { useSelector } from "react-redux";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useCreateOperationUserMutation } from "@/features/api/authApi";

const CreateOperationUser = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    company: isBranchAdmin ? user?.company?._id : "",
    branch: isBranchAdmin ? user?.branch?._id : "",
    status: true,
  });

  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData, isLoading: branchLoading }] =
    useGetBranchesByCompanyMutation();

  const [createOperationUser, { isLoading, isSuccess, isError, data, error }] =
    useCreateOperationUserMutation();

  useEffect(() => {
    if (!isBranchAdmin && formData.company) {
      getBranchesByCompany(formData.company);
    }
  }, [formData.company]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { name, email, password, company, branch } = formData;
    if (!name || !email || !password || !company || !branch) {
      return toast.error("All fields are required.");
    }

    await createOperationUser(formData);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Operation User created successfully");
      navigate("/admin/operation-users");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create Operation User");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add Operation User</h2>
      <p className="text-sm mb-4 text-gray-500">
        Assign operation user to a branch under a company
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

        {/* Company field */}
        {!isBranchAdmin ? (
          <div>
            <Label>Company</Label>
            <Select
              value={formData.company}
              onValueChange={async (val) => {
                setFormData((prev) => ({ ...prev, company: val, branch: "" }));
                try {
                  await getBranchesByCompany(val);
                } catch {
                  toast.error("Failed to fetch branches");
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
        ) : (
          <div>
            <Label>Company</Label>
            <Input
              value={user?.company?.name}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>
        )}

        {/* Branch field */}
        {!isBranchAdmin ? (
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
        ) : (
          <div>
            <Label>Branch</Label>
            <Input
              value={user?.branch?.name}
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          </div>
        )}

        {/* Status toggle */}
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
          onClick={() => navigate("/admin/operation-users")}
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
            "Create Operation User"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateOperationUser;
