import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateSiteTypeMutation } from "@/features/api/SiteType/siteTypeApi.js";

const CreateSiteType = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    status: true,
  });

  const [createSiteType, { isLoading, isSuccess, isError, error, data }] =
    useCreateSiteTypeMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { name, desc } = formData;

    if (!name.trim()) return toast.error("Site type name is required.");
    if (!desc.trim()) return toast.error("Description is required.");

    await createSiteType({
      name: name.trim(),
      desc: desc.trim(),
      status: formData.status,
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Site type created successfully");
      navigate("/admin/site-types");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create site type");
    }
  }, [isSuccess, isError, data, error, navigate]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New Site Type</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a site type</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div>
          <Label>Site Type Name</Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter site type name"
            className="mt-1"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            name="desc"
            value={formData.desc}
            onChange={handleInputChange}
            placeholder="Enter description"
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="status"
              checked={formData.status}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, status: checked }))
              }
            />
            <Label htmlFor="status">Active Status</Label>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Site Type"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/site-types")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CreateSiteType;
