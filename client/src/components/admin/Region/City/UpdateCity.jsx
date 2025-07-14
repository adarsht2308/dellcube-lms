import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useUpdateCityMutation,
  useGetCityByIdMutation,
} from "@/features/api/Region/cityApi";
import { useGetAllStatesQuery } from "@/features/api/Region/stateApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const UpdateCity = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cityId = location.state?.cityId;

  const [name, setName] = useState("");
  const [stateId, setStateId] = useState("");
  const [status, setStatus] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const [getCityById, { data: cityData, isSuccess }] = useGetCityByIdMutation();
  const { data: stateData, isLoading: loadingStates } = useGetAllStatesQuery(
    { page: 1,
      limit: 100000,  
      search: ""}
  );
  const [updateCity, { isLoading, isSuccess: isUpdated, error }] =
    useUpdateCityMutation();

  useEffect(() => {
    if (cityId) getCityById(cityId);
  }, [cityId]);

  useEffect(() => {
    if (isSuccess && cityData?.data && !isLoaded) {
      const c = cityData.data;
      setName(c.name || "");
      setStateId(c.state?._id || "");
      setStatus(c.status === true);
      setIsLoaded(true);
    }
  }, [cityData, isSuccess, isLoaded]);

  const handleUpdate = async () => {
    if (!name || !stateId)
      return toast.error("City name and state are required");

    const payload = {
      cityId,
      name: name.trim(),
      state: stateId,
      status,
    };

    await updateCity(payload);
  };

  useEffect(() => {
    if (isUpdated) {
      toast.success("City updated successfully");
      setTimeout(() => navigate("/admin/cities"), 1500);
    } else if (error) {
      toast.error(error?.data?.message || "Failed to update city");
    }
  }, [isUpdated, error]);

  return (
    <div className="flex-1 mx-4 md:mx-10 min-h-[100vh]">
      <div className="mb-4">
        <h1 className="font-bold text-xl">Edit City</h1>
        <p className="text-sm">Update city details below.</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>City Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter city name"
          />
        </div>

        <div>
          <Label>Select State</Label>
          <Select
            value={stateId}
            onValueChange={setStateId}
            disabled={loadingStates}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a state" />
            </SelectTrigger>
            <SelectContent>
              {stateData?.data?.map((s) => (
                <SelectItem key={s._id} value={s._id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <Label>Status</Label>
          <div className="flex items-center gap-2">
            <Switch checked={status} onCheckedChange={setStatus} />
            <span>{status ? "Active" : "Inactive"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-6">
          <Button variant="outline" onClick={() => navigate("/admin/cities")}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
              </>
            ) : (
              "Update City"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpdateCity;
