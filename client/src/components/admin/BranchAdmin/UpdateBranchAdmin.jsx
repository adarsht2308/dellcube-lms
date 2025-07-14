import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import {
  useGetBranchAdminByIdMutation,
  useUpdateBranchAdminMutation,
  useUpdateUserMutation,
} from "@/features/api/authApi";

const UpdateBranchAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
const branchAdminId = location.state?.branchAdminId;

const [getBranchAdminById, { data: adminData, isLoading: isAdminLoading }] =
  useGetBranchAdminByIdMutation();

useEffect(() => {
  if (branchAdminId) {
    getBranchAdminById({ id: branchAdminId });
  }
}, [branchAdminId]);


  const [updateBranchAdmin, { isLoading, isSuccess, error }] = useUpdateBranchAdminMutation();
  const { data: companies } = useGetAllCompaniesQuery({ page: 1, limit: 100 });
  const [getBranchesByCompany, { data: branchData }] = useGetBranchesByCompanyMutation();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    branch: "",
    status: true,
  });

  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (adminData?.user) {
      const u = adminData.user;
      setFormData({
        name: u.name || "",
        email: u.email || "",
        company: u.company?._id || "",
        branch: u.branch?._id || "",
        status: u.status ?? true,
      });

      if (u.company?._id) {
        getBranchesByCompany(u.company._id);
      }
    }
  }, [adminData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(file);
  };

  const handleSubmit = async () => {
    const { name, email, company, branch, status } = formData;

    if (!name || !email || !company || !branch) {
      return toast.error("All fields are required.");
    }

    const payload = new FormData();
    payload.append("userId",branchAdminId)
    payload.append("name", name);
    payload.append("email", email);
    payload.append("company", company);
    payload.append("branch", branch);
    payload.append("status", status);
    if (profileImage) {
      payload.append("profilePhoto", profileImage);
    }

    await updateBranchAdmin(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Branch Admin updated successfully");
      navigate("/admin/branch-admins");
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update Branch Admin");
    }
  }, [isSuccess, error]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Edit Branch Admin</h2>
      <p className="text-sm mb-4 text-gray-500">Update branch admin details</p>

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
          <Label>Change Profile Image</Label>
          <Input type="file" accept="image/*" onChange={handleImageChange} />
        </div>

        <div>
          <Label>Company</Label>
          <Select
            value={formData.company}
            onValueChange={async (val) => {
              setFormData((prev) => ({ ...prev, company: val, branch: "" }));
              await getBranchesByCompany(val);
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
            disabled={!formData.company}
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
              Updating...
            </>
          ) : (
            "Update Branch Admin"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateBranchAdmin;
