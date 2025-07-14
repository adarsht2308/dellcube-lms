import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateCityMutation } from "@/features/api/Region/cityApi";
import { useGetAllStatesQuery } from "@/features/api/Region/stateApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateCity = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [stateId, setStateId] = useState("");
  const [status, setStatus] = useState(true);

  const [createCity, { isLoading, isSuccess, isError, error, data }] =
    useCreateCityMutation();
  const { data: stateData, isLoading: stateLoading } = useGetAllStatesQuery({ page: 1,
    limit: 1000000,  
    search: ""});

  const handleSubmit = async () => {
    if (!name || !stateId) {
      return toast.error("City name and State are required.");
    }

    const payload = {
      name: name.trim(),
      state: stateId,
      status,
    };

    await createCity(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "City created successfully");
      navigate("/admin/cities");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create city");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New City</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a city</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>City Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="City Name"
          />
        </div>

        <div>
          <Label>Select State</Label>
          <Select
            value={stateId}
            onValueChange={(value) => setStateId(value)}
            disabled={stateLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a state" />
            </SelectTrigger>
            <SelectContent>
              {stateData?.data?.map((state) => (
                <SelectItem key={state._id} value={state._id}>
                  {state.name}
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
        <Button variant="outline" onClick={() => navigate("/admin/cities")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create City"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateCity;
