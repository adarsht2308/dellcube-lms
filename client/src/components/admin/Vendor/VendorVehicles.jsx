import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Edit, Eye, Calendar, MapPin, Wrench } from "lucide-react";
import {
  useGetVendorVehiclesQuery,
  useAddVehicleMutation,
} from "../../../features/api/Vendor/vendorApi.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

const VendorVehicles = () => {
  const { user } = useSelector((store) => store.auth);
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "",
    type: "7ft",
    brand: "",
    model: "",
    yearOfManufacture: "",
    registrationDate: "",
    fitnessCertificateExpiry: "",
    insuranceExpiry: "",
    pollutionCertificateExpiry: "",
    vehicleInsuranceNo: "",
    fitnessNo: "",
    status: "active",
  });

  // Use RTK Query hooks
  const {
    data: vehiclesData,
    isLoading: loading,
    error,
    refetch,
  } = useGetVendorVehiclesQuery();

  const [addVehicle, { isLoading: addingVehicle }] = useAddVehicleMutation();

  const vehicles = vehiclesData?.vehicles || [];

  const handleAddVehicle = async () => {
    // Validate vehicle number format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576)
    const cleanedVehicleNumber = vehicleForm.vehicleNumber.trim().replace(/[\s-]/g, '').toUpperCase();
    const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
    
    if (!vehicleNumberRegex.test(cleanedVehicleNumber)) {
      toast.error("Vehicle number must be in format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576). No dashes or spaces allowed.");
      return;
    }
    try {
      const formData = new FormData();

      // Add vehicle data
      Object.keys(vehicleForm).forEach((key) => {
        if (vehicleForm[key] !== "") {
          // Use cleaned vehicle number for vehicleNumber field
          if (key === "vehicleNumber") {
            formData.append(key, cleanedVehicleNumber);
          } else {
            formData.append(key, vehicleForm[key]);
          }
        }
      });

      await addVehicle({ vehicle: formData }).unwrap();
      toast.success("Vehicle added successfully!");
      setShowAddVehicleDialog(false);
      refetch();

      // Reset form
      setVehicleForm({
        vehicleNumber: "",
        type: "7ft",
        brand: "",
        model: "",
        yearOfManufacture: "",
        registrationDate: "",
        fitnessCertificateExpiry: "",
        insuranceExpiry: "",
        pollutionCertificateExpiry: "",
        vehicleInsuranceNo: "",
        fitnessNo: "",
        status: "active",
      });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add vehicle");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "maintenance":
        return "bg-yellow-500";
      case "inactive":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "Active";
      case "maintenance":
        return "Under Maintenance";
      case "inactive":
        return "Inactive";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-x-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Vehicles
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your vehicle fleet and track their status
          </p>
        </div>
        <Button
          className="flex items-center space-x-2"
          onClick={() => setShowAddVehicleDialog(true)}
        >
          <Plus className="h-4 w-4" />
          <span>Add Vehicle</span>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vehicles
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vehicles.filter((v) => v.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Under Maintenance
            </CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {vehicles.filter((v) => v.status === "maintenance").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {vehicles.filter((v) => v.status === "inactive").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {vehicle.vehicleNumber}
                </CardTitle>
                <Badge
                  className={`${getStatusColor(vehicle.status)} text-white`}
                >
                  {getStatusText(vehicle.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {vehicle.type} - {vehicle.brand} {vehicle.model}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Year: {vehicle.yearOfManufacture}
                  </span>
                </div>
                {vehicle.registrationDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Registered:{" "}
                      {new Date(vehicle.registrationDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm">
                  <span className="font-medium">Insurance No:</span>{" "}
                  {vehicle.vehicleInsuranceNo || "N/A"}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Fitness No:</span>{" "}
                  {vehicle.fitnessNo || "N/A"}
                </div>
                {vehicle.insuranceExpiry && (
                  <div className="text-sm">
                    <span className="font-medium">Insurance Expiry:</span>{" "}
                    {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex space-x-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Truck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              You don't have any vehicles assigned yet. Contact your
              administrator to get vehicles assigned to your account.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Request Vehicle Assignment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Vehicle Dialog */}
      <Dialog
        open={showAddVehicleDialog}
        onOpenChange={setShowAddVehicleDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
              <Input
                id="vehicleNumber"
                value={vehicleForm.vehicleNumber}
                onChange={(e) => {
                  // Remove spaces, dashes, and convert to uppercase
                  const cleaned = e.target.value.replace(/[\s-]/g, '').toUpperCase();
                  // Limit to 10 characters (2 letters + 2 digits + 2 letters + 4 digits)
                  const limited = cleaned.slice(0, 10);
                  setVehicleForm((prev) => ({
                    ...prev,
                    vehicleNumber: limited,
                  }));
                }}
                placeholder="e.g. CG04MM9576"
                maxLength={10}
              />
              {vehicleForm.vehicleNumber && vehicleForm.vehicleNumber.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Vehicle Type *</Label>
              <Select
                value={vehicleForm.type}
                onValueChange={(value) =>
                  setVehicleForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7ft">7ft</SelectItem>
                  <SelectItem value="10ft">10ft</SelectItem>
                  <SelectItem value="14ft">14ft</SelectItem>
                  <SelectItem value="18ft">18ft</SelectItem>
                  <SelectItem value="24ft">24ft</SelectItem>
                  <SelectItem value="32ft">32ft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="brand">Brand *</Label>
              <Input
                id="brand"
                value={vehicleForm.brand}
                onChange={(e) =>
                  setVehicleForm((prev) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="e.g. Tata, Mahindra"
              />
            </div>

            <div>
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={vehicleForm.model}
                onChange={(e) =>
                  setVehicleForm((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="e.g. Ace, Bolero"
              />
            </div>

            <div>
              <Label htmlFor="yearOfManufacture">Year of Manufacture</Label>
              <Input
                id="yearOfManufacture"
                type="number"
                value={vehicleForm.yearOfManufacture}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    yearOfManufacture: e.target.value,
                  }))
                }
                placeholder="e.g. 2020"
              />
            </div>

            <div>
              <Label htmlFor="registrationDate">Registration Date</Label>
              <Input
                id="registrationDate"
                type="date"
                value={vehicleForm.registrationDate}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    registrationDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="vehicleInsuranceNo">Insurance Number</Label>
              <Input
                id="vehicleInsuranceNo"
                value={vehicleForm.vehicleInsuranceNo}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    vehicleInsuranceNo: e.target.value,
                  }))
                }
                placeholder="Insurance policy number"
              />
            </div>

            <div>
              <Label htmlFor="fitnessNo">Fitness Number</Label>
              <Input
                id="fitnessNo"
                value={vehicleForm.fitnessNo}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    fitnessNo: e.target.value,
                  }))
                }
                placeholder="Fitness certificate number"
              />
            </div>

            <div>
              <Label htmlFor="insuranceExpiry">Insurance Expiry</Label>
              <Input
                id="insuranceExpiry"
                type="date"
                value={vehicleForm.insuranceExpiry}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    insuranceExpiry: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="fitnessCertificateExpiry">
                Fitness Certificate Expiry
              </Label>
              <Input
                id="fitnessCertificateExpiry"
                type="date"
                value={vehicleForm.fitnessCertificateExpiry}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    fitnessCertificateExpiry: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="pollutionCertificateExpiry">
                Pollution Certificate Expiry
              </Label>
              <Input
                id="pollutionCertificateExpiry"
                type="date"
                value={vehicleForm.pollutionCertificateExpiry}
                onChange={(e) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    pollutionCertificateExpiry: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={vehicleForm.status}
                onValueChange={(value) =>
                  setVehicleForm((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="under_maintenance">
                    Under Maintenance
                  </SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowAddVehicleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddVehicle}
              disabled={
                addingVehicle ||
                !vehicleForm.vehicleNumber ||
                !vehicleForm.brand ||
                !vehicleForm.model
              }
            >
              {addingVehicle ? "Adding..." : "Add Vehicle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorVehicles;
