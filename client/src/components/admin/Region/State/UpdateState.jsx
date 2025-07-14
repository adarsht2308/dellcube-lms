import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useUpdateStateMutation,
  useGetStateByIdMutation,
} from "@/features/api/Region/stateApi";
import { useGetAllCountriesQuery } from "@/features/api/Region/countryApi";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UpdateState = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const stateId = location.state?.stateId;

  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [status, setStatus] = useState(true);

  const [getStateById, { data, isSuccess }] = useGetStateByIdMutation();
  const { data: countriesData, isLoading: countriesLoading } =
    useGetAllCountriesQuery({ page: 1,
      limit: 10000,  
      search: ""});

  const [updateState, { isLoading, isSuccess: isUpdated, error }] =
    useUpdateStateMutation();

  useEffect(() => {
    if (stateId) getStateById(stateId);
  }, [stateId]);

  useEffect(() => {
    if (isSuccess && data?.data) {
      const c = data.data;
      setName(c.name || "");
      setCountryId(c.country?._id || "");
      setStatus(c.status === true);
    }
  }, [isSuccess, data]);

  const handleUpdate = async () => {
    if (!name || !countryId) {
      return toast.error("State name and country are required");
    }

    const payload = {
      id: stateId,
      name,
      country: countryId,
      status, 
    };

    await updateState(payload);
  };

  useEffect(() => {
    if (isUpdated) {
      toast.success("State Updated Successfully");
      setTimeout(() => navigate("/admin/states"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Update failed");
    }
  }, [isUpdated, error]);

  return (
    <div className="flex-1 mx-4 md:mx-10 min-h-[100vh]">
      <div className="mb-4">
        <h1 className="font-bold text-xl">Edit State</h1>
        <p className="text-sm">Update state details below.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>State Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter state name"
          />
        </div>

        <div>
          <Label>Select Country</Label>
          <Select
            value={countryId}
            onValueChange={setCountryId}
            disabled={countriesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {countriesData?.countries?.map((country) => (
                <SelectItem key={country._id} value={country._id}>
                  {country.name}
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
          <Button variant="outline" onClick={() => navigate("/admin/states")}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update State"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateState;
