  import React, { useEffect, useState } from "react";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  import { Loader2 } from "lucide-react";
  import { useLocation, useNavigate } from "react-router-dom";
  import toast from "react-hot-toast";
  import { Switch } from "@/components/ui/switch";
  import {
    useUpdateLocalityMutation,
    useGetLocalityByIdMutation,
  } from "@/features/api/Region/LocalityApi";
  import { useGetAllCitiesQuery } from "@/features/api/Region/cityApi";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";

  const UpdateLocality = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const localityId = location.state?.localityId;

    const [name, setName] = useState("");
    const [cityId, setCityId] = useState("");
    const [status, setStatus] = useState(true);

    const [getLocalityById, { data, isSuccess }] = useGetLocalityByIdMutation();
    const [updateLocality, { isLoading, isSuccess: isUpdated, error }] =
      useUpdateLocalityMutation();
    const { data: citiesData, isLoading: loadingCities } = useGetAllCitiesQuery({ page: 1,
      limit: 1000000,  
      search: ""
     
    });

    
    useEffect(() => {
      if (localityId) {
        getLocalityById(localityId);
      }
    }, [localityId]);

    useEffect(() => {
      if (isSuccess && data?.data) {
        const loc = data.data;
        setName(loc?.name || "");
        setCityId(loc?.city?._id || "");
        setStatus(loc?.status === true); 
      }
    }, [data, isSuccess]);

    const handleUpdate = async () => {
      if (!name || !cityId) {
        return toast.error("Locality name and city are required");
      }

      const payload = {
        id: localityId,
        name,
        city: cityId,
        status,
      };

      await updateLocality(payload);
    };

    useEffect(() => {
      if (isUpdated) {
        toast.success("Locality updated successfully");
        setTimeout(() => navigate("/admin/localities"), 1500);
      } else if (error) {
        toast.error(error?.data?.message || "Failed to update locality");
      }
    }, [isUpdated, error]);

    return (
      <div className="flex-1 mx-4 md:mx-10 min-h-[100vh]">
        <div className="mb-4">
          <h1 className="font-bold text-xl">Edit Locality</h1>
          <p className="text-sm">Update locality details below.</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Locality Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter locality name"
            />
          </div>

          <div>
            <Label>Select City</Label>
            <Select
              value={cityId}
              onValueChange={setCityId}
              disabled={loadingCities}
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
              onClick={() => navigate("/admin/localities")}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Locality"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  export default UpdateLocality;
