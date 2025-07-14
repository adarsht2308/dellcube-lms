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
  useGetDriverByIdMutation,
  useUpdateDriverMutation,
} from "@/features/api/authApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";

const UpdateDriver = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const driverId = location.state?.driverId;

  const currentUser = useSelector((state) => state.auth.user);
  const isBranchAdmin = currentUser?.role === "branchAdmin";

  const [getDriverById, { data: driverData, isSuccess: isDriverFetched, isLoading: isDriverLoading }] = useGetDriverByIdMutation();
  console.log(driverData);
  const [updateDriver, { isLoading, isSuccess, error }] =
    useUpdateDriverMutation();

  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranches, { data: branchesData }] =
    useGetBranchesByCompanyMutation();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    licenseNumber: "",
    experienceYears: "",
    company: "",
    branch: "",
    status: true,
  });

  useEffect(() => {
    console.log("DriverId:", driverId);
    if (driverId) {
      console.log("Calling getDriverById with:", { id: driverId });
      getDriverById({ id: driverId });
    }
  }, [driverId]);

  useEffect(() => {
    if (isDriverFetched && driverData?.user) {
      const d = driverData.user;

      setFormData({
        name: d.name || "",
        mobile: d.mobile || "",
        licenseNumber: d.licenseNumber || "",
        experienceYears: d.experienceYears || "",
        company: d.company?._id || "",
        branch: d.branch?._id || "",
        status: d.status || false,
      });

      if (d.company?._id) getBranches(d.company._id);
    }
  }, [isDriverFetched, driverData]);

  const handleUpdate = async () => {
    const { name, mobile, licenseNumber, experienceYears, company, branch } =
      formData;
    if (!name.trim()) return toast.error("Name is required");
    if (!mobile.trim()) return toast.error("Mobile is required");
    if (!licenseNumber.trim()) return toast.error("License Number is required");
    if (!experienceYears) return toast.error("Experience is required");
    if (!company) return toast.error("Company is required");
    if (!branch) return toast.error("Branch is required");

    const payload = {
      userId: driverId,
      ...formData,
    };

    await updateDriver(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Driver Updated Successfully");
      setTimeout(() => navigate("/admin/drivers"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isSuccess, error]);

  // Show loading state while fetching driver data
  if (isDriverLoading) {
    return (
      <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading driver data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error if no driver data found
  if (!driverId || (!isDriverLoading && !isDriverFetched)) {
    return (
      <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Driver not found</h3>
            <p className="text-muted-foreground mb-4">The driver you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/admin/drivers")}>
              Back to Drivers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Driver</h2>
      <p className="text-sm mb-6 text-muted-foreground">
        Update driver details
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Driver's Name"
          />
        </div>

        <div>
          <Label>Mobile</Label>
          <Input
            value={formData.mobile}
            onChange={(e) =>
              setFormData({ ...formData, mobile: e.target.value })
            }
            placeholder="Mobile Number"
          />
        </div>

        <div>
          <Label>License Number</Label>
          <Input
            value={formData.licenseNumber}
            onChange={(e) =>
              setFormData({ ...formData, licenseNumber: e.target.value })
            }
            placeholder="License Number"
          />
        </div>

        <div>
          <Label>Experience (Years)</Label>
          <Input
            type="number"
            value={formData.experienceYears}
            onChange={(e) =>
              setFormData({ ...formData, experienceYears: e.target.value })
            }
            placeholder="Years of experience"
          />
        </div>

        {/* Company */}
        <div>
          <Label>Company</Label>
          {isBranchAdmin ? (
            <Input
              value={
                companies?.companies?.find((c) => c._id === formData.company)
                  ?.name || "Company"
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
                branchesData?.branches?.find((b) => b._id === formData.branch)
                  ?.name || "Branch"
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
        <Button variant="outline" onClick={() => navigate("/admin/drivers")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleUpdate}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            "Update Driver"
          )}
        </Button>
      </div>
    </div>
  );
};

export default UpdateDriver;
