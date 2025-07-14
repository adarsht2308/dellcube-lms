
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetCountryByIdMutation,
  useUpdateCountryMutation,
} from "@/features/api/Region/countryApi";
import { Switch } from "@/components/ui/switch";

const UpdateCountry = () => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(true); 
  const location = useLocation();
  const countryId = location.state?.countryId;
  const navigate = useNavigate();

  const [getCountryById, { data, isSuccess }] = useGetCountryByIdMutation();
  
  const [updateCountry, { isLoading, isSuccess: isUpdated, error }] =
    useUpdateCountryMutation();

  useEffect(() => {
    if (countryId) {
      getCountryById(countryId);
    }
  }, [countryId]);

  
  useEffect(() => {
    if (isSuccess && data?.country) {
      const c = data.country;
      setName(c?.name || "");
      setCode(c?.code || "");
      setStatus(c?.status === true);
    }
  }, [data, isSuccess]);

  const handleUpdate = async () => {
    const payload = {
      countryId,
      name,
      code,
      status, 
    };

    await updateCountry(payload);
  };

  useEffect(() => {
    if (isUpdated) {
      toast.success("Country Updated Successfully");
      setTimeout(() => navigate("/admin/countries"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isUpdated, error]);

  return (
    <div className="flex-1 mx-4 md:mx-10 min-h-[100vh]">
      <div className="mb-4">
        <h1 className="font-bold text-xl">Edit Country</h1>
        <p className="text-sm">Update country details below.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter country name"
          />
        </div>

        <div>
          <Label>Code</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter country code (e.g., IN)"
          />
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
          <Button
            variant="outline"
            onClick={() => navigate("/admin/countries")}
          >
            Back
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Country"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCountry;
