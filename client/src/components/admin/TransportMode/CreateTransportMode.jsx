import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2, ArrowLeft, Truck } from "lucide-react";
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
                Create New Transport Mode
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Define a new transport mode for your organization
              </p>
            </div>
          </div>
        </div>

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

        <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
          <Button 
            variant="outline" 
            onClick={() => navigate("/admin/transport-modes")}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
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
        </div>
      </div>
    </div>
  );
};

export default CreateTransportMode; 