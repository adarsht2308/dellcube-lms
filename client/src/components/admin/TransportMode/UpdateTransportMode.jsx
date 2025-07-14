import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useGetTransportModeByIdMutation,
  useUpdateTransportModeMutation,
} from "@/features/api/TransportMode/transportModeApi.js";

const UpdateTransportMode = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const transportModeId = location.state?.transportModeId;

  const [getTransportModeById, { data: transportModeData, isSuccess }] =
    useGetTransportModeByIdMutation();
  const [updateTransportMode, { isLoading, isSuccess: isUpdated, error }] =
    useUpdateTransportModeMutation();

  const [formData, setFormData] = useState({
    name: "",
    desc: "",
    status: true,
  });

  useEffect(() => {
    if (transportModeId) getTransportModeById(transportModeId);
  }, [transportModeId, getTransportModeById]);

  useEffect(() => {
    if (isSuccess && transportModeData?.transportMode) {
      const transportMode = transportModeData.transportMode;
      setFormData({
        name: transportMode.name || "",
        desc: transportMode.desc || "",
        status: transportMode.status === true,
      });
    }
  }, [isSuccess, transportModeData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdate = async () => {
    const { name, desc } = formData;
    if (!name.trim()) return toast.error("Transport mode name is required");
    if (!desc.trim()) return toast.error("Description is required");
    await updateTransportMode({
      transportModeId,
      name: name.trim(),
      desc: desc.trim(),
      status: formData.status,
    });
  };

  useEffect(() => {
    if (isUpdated) {
      toast.success("Transport Mode Updated Successfully");
      setTimeout(() => navigate("/admin/transport-modes"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isUpdated, error, navigate]);

  if (!transportModeId) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">
            No Transport Mode Selected
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Please select a transport mode to update
          </p>
          <Button onClick={() => navigate("/admin/transport-modes")}>Back to Transport Modes</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 md:mx-10 py-6">
      <h2 className="text-xl font-bold mb-2">Edit Transport Mode</h2>
      <p className="text-sm mb-6 text-muted-foreground">Update transport mode details</p>
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
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
          onClick={handleUpdate}
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Transport Mode"
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

export default UpdateTransportMode; 