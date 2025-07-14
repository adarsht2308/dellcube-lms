import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
import {
  useGetPincodeByIdMutation,
  useUpdatePincodeMutation,
} from "@/features/api/Region/pincodeApi";
import { useGetAllLocalitiesQuery } from "@/features/api/Region/LocalityApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UpdatePincode = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pincodeId = location.state?.pincodeId;

  const [code, setCode] = useState("");
  const [localityId, setLocalityId] = useState("");
  const [status, setStatus] = useState(true);

  const [getPincodeById, { data, isSuccess }] = useGetPincodeByIdMutation();
  const [updatePincode, { isLoading, isSuccess: isUpdated, error }] =
    useUpdatePincodeMutation();

  const { data: localitiesData, isLoading: loadingLocalities } =
    useGetAllLocalitiesQuery({
      page: 1,
      limit: 10000000,
    });


  useEffect(() => {
    if (pincodeId) {
      getPincodeById(pincodeId);
    }
  }, [pincodeId]);

  
  useEffect(() => {
    if (isSuccess && data?.data) {
      const pin = data.data;
      setCode(pin?.code || "");
      setLocalityId(pin?.locality?._id || "");
      setStatus(pin?.status === true);
    }
  }, [data, isSuccess]);

  const handleUpdate = async () => {
    if (!code || !localityId) {
      return toast.error("Pincode and locality are required");
    }

    const payload = {
      id: pincodeId,
      code,
      locality: localityId,
      status,
    };

    await updatePincode(payload);
  };

  useEffect(() => {
    if (isUpdated) {
      toast.success("Pincode updated successfully");
      setTimeout(() => navigate("/admin/pincodes"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update pincode");
    }
  }, [isUpdated, error]);

  return (
    <div className="flex-1 mx-4 md:mx-10 min-h-[100vh]">
      <div className="mb-4">
        <h1 className="font-bold text-xl">Edit Pincode</h1>
        <p className="text-sm">Update pincode details below.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Pincode</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter pincode"
          />
        </div>

        <div>
          <Label>Select Locality</Label>
          <Select
            value={localityId}
            onValueChange={setLocalityId}
            disabled={loadingLocalities}
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

        <div className="flex items-center gap-4">
          <Label>Status</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={status}
              onCheckedChange={(checked) => setStatus(checked)}
            />
            <span>{status ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Button variant="outline" onClick={() => navigate("/admin/pincodes")}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Pincode"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdatePincode;
