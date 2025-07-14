import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useCreateCountryMutation } from "@/features/api/Region/countryApi";

const CreateCountry = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(true);

  const [createCountry, { isLoading, isSuccess, isError, error, data }] =
    useCreateCountryMutation();

  const handleSubmit = async () => {
    if (!name || !code) {
      return toast.error("Name and Code are required.");
    }

    const payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      status,
    };

    await createCountry(payload);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message || "Country created successfully");
      navigate("/admin/countries");
    } else if (isError) {
      toast.error(error?.data?.message || "Failed to create country");
    }
  }, [isSuccess, isError]);

  return (
    <div className="md:mx-10 p-4 min-h-[100vh]">
      <h2 className="text-xl font-semibold mb-1">Add New Country</h2>
      <p className="text-sm mb-4 text-gray-500">Basic details for a country</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Country Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Country Name"
          />
        </div>
        <div>
          <Label>Country Code</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="E.g. IN, US"
          />
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
        <Button variant="outline" onClick={() => navigate("/admin/countries")}>
          Cancel
        </Button>
        <Button disabled={isLoading} onClick={handleSubmit}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Country"
          )}
        </Button>
      </div>
    </div>
  );
};

export default CreateCountry;
