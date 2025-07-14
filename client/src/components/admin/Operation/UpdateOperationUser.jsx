import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { useSelector } from "react-redux";
import {
  useGetOperationUserByIdMutation,
  useUpdateOperationUserMutation,
} from "@/features/api/authApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";

const UpdateOperations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;
  const currentUser = useSelector((state) => state.auth.user);
  const isBranchAdmin = currentUser?.role === "branchAdmin";

  const [getOperationUserById, { data: userData }] =
    useGetOperationUserByIdMutation();
  const [updateOperationUser, { isLoading, isSuccess, error }] =
    useUpdateOperationUserMutation();

  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranches, { data: branchesData }] = useGetBranchesByCompanyMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    branch: "",
    status: true,
  });

  useEffect(() => {
    if (userId) getOperationUserById({ id: userId });
  }, [userId]);

  useEffect(() => {
    if (userData?.user) {
      const u = userData.user;

      setFormData({
        name: u.name || "",
        email: u.email || "",
        company: u.company?._id || "",
        branch: u.branch?._id || "",
        status: u.status || false,
      });

      if (u.company?._id) getBranches(u.company._id);
    }
  }, [userData]);

  const handleUpdate = async () => {
    const { name, email, company, branch } = formData;
    if (!name.trim()) return toast.error("Name is required");
    if (!email.trim()) return toast.error("Email is required");
    if (!company) return toast.error("Company is required");
    if (!branch) return toast.error("Branch is required");

    const payload = {
      userId,
      name,
      email,
      company,
      branch,
      status: formData.status,
    };

    await updateOperationUser(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Operation User Updated Successfully");
      setTimeout(() => navigate("/admin/operation-users"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isSuccess, error]);

  return (
    <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Operation User</h2>
      <p className="text-sm mb-6 text-muted-foreground">
        Update operation user details
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Name"
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
          />
        </div>

        {/* Company */}
        <div>
          <Label>Company</Label>
          {isBranchAdmin ? (
            <Input
              value={
                companies?.companies?.find((c) => c._id === formData.company)?.name || "Company"
              }
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          ) : (
            <select
              value={formData.company}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, company: val, branch: "" });
                getBranches(val);
              }}
              className="w-full border rounded p-2"
            >
              <option value="">Select Company</option>
              {companies?.companies?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Branch */}
        <div>
          <Label>Branch</Label>
          {isBranchAdmin ? (
            <Input
              value={
                branchesData?.branches?.find((b) => b._id === formData.branch)?.name || "Branch"
              }
              disabled
              className="bg-gray-100 cursor-not-allowed"
            />
          ) : (
            <select
              value={formData.branch}
              onChange={(e) =>
                setFormData({ ...formData, branch: e.target.value })
              }
              className="w-full border rounded p-2"
            >
              <option value="">Select Branch</option>
              {branchesData?.branches?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Status */}
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
        <Button variant="outline" onClick={() => navigate("/admin/operation-users")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleUpdate}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Operation User"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateOperations;
