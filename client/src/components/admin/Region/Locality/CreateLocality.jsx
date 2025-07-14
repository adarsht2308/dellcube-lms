import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateLocalityMutation } from "@/features/api/Region/LocalityApi.js";
import { useGetAllCitiesQuery } from "@/features/api/Region/cityApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateLocality = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [cityId, setCityId] = useState("");
  const [status, setStatus] = useState(true);

  const [createLocality, { isLoading, isSuccess, isError, error, data }] =
    useCreateLocalityMutation();

  const { data: citiesData, isLoading: citiesLoading } = useGetAllCitiesQuery({ 
    page: 1,
    limit: 10000,
    search: ""  
  });

  const handleSubmit = async () => {
    if (!name || !cityId) {
      return toast.error("Locality name and city are required.");
    }

    const payload = {
      name: name.trim(),
      city: cityId,
      status,
    };

    await createLocality(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Locality created successfully");
      navigate("/admin/localities");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create locality");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New Locality</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a locality</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Locality Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Locality Name"
          />
        </div>

        <div>
          <Label>Select City</Label>
          <Select
            value={cityId}
            onValueChange={setCityId}
            disabled={citiesLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a city" />
            </SelectTrigger>
            <SelectContent>
              {citiesData?.cities?.map((city) => (
                <SelectItem key={city._id} value={city._id}>
                  {city.name}
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
        <Button variant="outline" onClick={() => navigate("/admin/localities")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Locality"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateLocality;
