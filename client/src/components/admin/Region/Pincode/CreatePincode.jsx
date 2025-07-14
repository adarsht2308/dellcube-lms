import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreatePincodeMutation } from "@/features/api/Region/pincodeApi.js";
import { useGetAllLocalitiesQuery } from "@/features/api/Region/LocalityApi.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreatePincode = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [status, setStatus] = useState(true);

  const [createPincode, { isLoading, isSuccess, isError, error, data }] =
    useCreatePincodeMutation();

  const { data: localitiesData, isLoading: localitiesLoading } =
    useGetAllLocalitiesQuery({
      page: 1,
      limit: 10000000,
    });

  const handleSubmit = async () => {
    if (!code || !localityId) {
      return toast.error("Pincode and locality are required.");
    }

    const payload = {
      code: code.trim(),
      locality: localityId,
      status,
    };

    await createPincode(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Pincode created successfully");
      navigate("/admin/pincodes");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create pincode");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New Pincode</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a pincode</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Pincode</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter Pincode"
          />
        </div>

        <div>
          <Label>Select Locality</Label>
          <Select
            value={localityId}
            onValueChange={setLocalityId}
            disabled={localitiesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a locality" />
            </SelectTrigger>
            <SelectContent>
              {localitiesData?.data?.map((locality) => (
                <SelectItem key={locality._id} value={locality._id}>
                  {locality.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <Label htmlFor="status-toggle">Active Status</Label>
          <Switch
            id="status-toggle"
            checked={status}
            onCheckedChange={setStatus}
          />
          <span className="text-sm text-gray-500">
            {status ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <Button variant="outline" onClick={() => navigate("/admin/pincodes")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Pincode"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreatePincode;
