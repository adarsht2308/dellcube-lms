import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Loader2, ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg w-fit mx-auto mb-4">
            <Truck className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white mb-2">
            No Transport Mode Selected
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Please select a transport mode to update
          </p>
          <Button 
            onClick={() => navigate("/admin/transport-modes")}
            className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
          >
            Back to Transport Modes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-3xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/transport-modes")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Transport Modes
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Truck className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Transport Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Edit transport mode details and information
              </p>
            </div>
          </div>
        </div>

        {!transportModeData?.transportMode ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="w-6 h-6 animate-spin text-[#FFD249]" />
          </div>
        ) : (
          <div className="space-y-6">
            <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Transport Mode Name *
                  </Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Road, Rail, Air, Sea"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description *
                  </Label>
                  <Input
                    name="desc"
                    value={formData.desc}
                    onChange={handleInputChange}
                    placeholder="e.g., Ground transportation by road"
                    className="mt-1.5"
                  />
                </div>
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 mt-2">
                    <Switch
                      id="status"
                      checked={formData.status}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, status: checked }))
                      }
                    />
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Active Status
                    </Label>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formData.status ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      
        <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/transport-modes")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUpdate}
            disabled={isLoading}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
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
        </div>
      </div>
    </div>
  );
};

export default UpdateTransportMode; 