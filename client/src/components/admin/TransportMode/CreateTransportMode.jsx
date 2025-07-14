import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateTransportModeMutation } from "@/features/api/TransportMode/transportModeApi.js";

const CreateTransportMode = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    status: true,
  });

  const [createTransportMode, { isLoading, isSuccess, isError, error, data }] =
    useCreateTransportModeMutation();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const { name, desc } = formData;
    if (!name.trim()) return toast.error("Transport mode name is required.");
    if (!desc.trim()) return toast.error("Description is required.");
    await createTransportMode({
      name: name.trim(),
      desc: desc.trim(),
      status: formData.status,
    });
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Transport mode created successfully");
      navigate("/admin/transport-modes");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create transport mode");
    }
  }, [isSuccess, isError, data, error, navigate]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New Transport Mode</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a transport mode</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div>
          <Label>Transport Mode Name</Label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Enter transport mode name"
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
            "Create Transport Mode"
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/admin/transport-modes")}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default CreateTransportMode; 