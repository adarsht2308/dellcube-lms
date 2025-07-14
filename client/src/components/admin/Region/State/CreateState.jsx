import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateStateMutation } from "@/features/api/Region/stateApi";
import { useGetAllCountriesQuery } from "@/features/api/Region/countryApi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreateState = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [countryId, setCountryId] = useState("");
  const [status, setStatus] = useState(true);

  const [createState, { isLoading, isSuccess, isError, error, data }] =
    useCreateStateMutation();
  const { data: countryData, isLoading: countryLoading } =
    useGetAllCountriesQuery({ page: 1,
      limit: 100000,  
      search: ""});

  const handleSubmit = async () => {
    if (!name || !countryId) {
      return toast.error("Name and Country are required.");
    }

    const payload = {
      name: name.trim(),
      country: countryId,
      status,
    };

    await createState(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "State created successfully");
      navigate("/admin/states");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create state");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New State</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a state</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>State Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="State Name"
          />
        </div>

        <div>
          <Label>Select Country</Label>
          <Select
            value={countryId}
            onValueChange={(value) => setCountryId(value)}
            disabled={countryLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {countryData?.countries?.map((country) => (
                <SelectItem key={country._id} value={country._id}>
                  {country.name}
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
        <Button variant="outline" onClick={() => navigate("/admin/states")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            "Create State"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateState;
