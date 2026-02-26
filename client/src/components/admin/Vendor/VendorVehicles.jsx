import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Truck, Plus, Edit, Eye, Calendar, MapPin, Wrench } from "lucide-react";
import {
  useGetVendorVehiclesQuery,
  useAddVehicleMutation,
  useUpdateVendorVehicleMutation,
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import toast from "react-hot-toast";

const VendorVehicles = () => {
  const { user } = useSelector((store) => store.auth);
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({
    vehicleNumber: "",
    type: "",
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
  const [updateVendorVehicle, { isLoading: updatingVehicle }] = useUpdateVendorVehicleMutation();
  
  const [showEditVehicleDialog, setShowEditVehicleDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  const vehicles = vehiclesData?.vehicles || [];

  const handleEditVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber || "",
      type: vehicle.type || "14 Feet",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      yearOfManufacture: vehicle.yearOfManufacture || "",
      registrationDate: vehicle.registrationDate ? new Date(vehicle.registrationDate).toISOString().split("T")[0] : "",
      fitnessCertificateExpiry: vehicle.fitnessCertificateExpiry ? new Date(vehicle.fitnessCertificateExpiry).toISOString().split("T")[0] : "",
      insuranceExpiry: vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toISOString().split("T")[0] : "",
      pollutionCertificateExpiry: vehicle.pollutionCertificateExpiry ? new Date(vehicle.pollutionCertificateExpiry).toISOString().split("T")[0] : "",
      vehicleInsuranceNo: vehicle.vehicleInsuranceNo || "",
      fitnessNo: vehicle.fitnessNo || "",
      status: vehicle.status || "active",
    });
    setShowEditVehicleDialog(true);
  };

  const handleUpdateVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      const formData = new FormData();

      // Add vehicle data
      formData.append("vendorId", user._id);
      formData.append("vehicleId", selectedVehicle._id);
      
      Object.keys(vehicleForm).forEach((key) => {
        if (vehicleForm[key] !== "") {
          // Trim and uppercase vehicle number
          if (key === "vehicleNumber") {
            formData.append(key, vehicleForm.vehicleNumber.trim().toUpperCase());
          } else {
            formData.append(key, vehicleForm[key]);
          }
        }
      });

      await updateVendorVehicle({ vehicle: formData }).unwrap();
      toast.success("Vehicle updated successfully!");
      setShowEditVehicleDialog(false);
      setSelectedVehicle(null);
      refetch();

      // Reset form
      setVehicleForm({
        vehicleNumber: "",
        type: "14 Feet",
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
      toast.error(error?.data?.message || "Failed to update vehicle");
    }
  };

  const handleAddVehicle = async () => {
    try {
      const formData = new FormData();

      // Add vehicle data
      Object.keys(vehicleForm).forEach((key) => {
        if (vehicleForm[key] !== "") {
          // Trim and uppercase vehicle number
          if (key === "vehicleNumber") {
            formData.append(key, vehicleForm.vehicleNumber.trim().toUpperCase());
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
        type: "",
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
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditVehicle(vehicle)}
                >
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
                  setVehicleForm((prev) => ({
                    ...prev,
                    vehicleNumber: e.target.value.toUpperCase(),
                  }));
                }}
                placeholder="e.g. MH04AB1234"
              />
              {vehicleForm.vehicleNumber && vehicleForm.vehicleNumber.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter vehicle registration number
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
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "14 Feet",
                    "17 Feet",
                    "19 Feet",
                    "20 Feet",
                    "22 Feet",
                    "24 Feet",
                    "32FTMXL-14MT",
                    "Biker",
                    "BYHAND",
                    "FLAT BED TRAILER 20FT",
                    "Pickup",
                    "TAURUS 16 TON",
                    "Tata 407",
                    "TRUCK/LORRY",
                    "SFBT40",
                    "TATA/EICHER 709",
                    "32FTMXL-18MT",
                    "32FTSXL-7MT",
                    "32FTSXL-9MT",
                    "FLAT BED TRAILER 40FT",
                    "SEMI FLAT BED TRAILER 40FT",
                    "TAURUS 18 TON",
                    "TAURUS 21 TON",
                    "TAURUS 25 TON",
                    "TAURUS 30 TON",
                    "TATA ACE",
                  ].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
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

      {/* Edit Vehicle Dialog */}
      <Dialog
        open={showEditVehicleDialog}
        onOpenChange={setShowEditVehicleDialog}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Vehicle</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-vehicleNumber">Vehicle Number *</Label>
              <Input
                id="edit-vehicleNumber"
                value={vehicleForm.vehicleNumber}
                onChange={(e) => {
                  setVehicleForm((prev) => ({
                    ...prev,
                    vehicleNumber: e.target.value.toUpperCase(),
                  }));
                }}
                placeholder="e.g. MH04AB1234"
              />
              {vehicleForm.vehicleNumber && vehicleForm.vehicleNumber.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Enter vehicle registration number
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-type">Vehicle Type *</Label>
              <Select
                value={vehicleForm.type}
                onValueChange={(value) =>
                  setVehicleForm((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "14 Feet",
                    "17 Feet",
                    "19 Feet",
                    "20 Feet",
                    "22 Feet",
                    "24 Feet",
                    "32FTMXL-14MT",
                    "Biker",
                    "BYHAND",
                    "FLAT BED TRAILER 20FT",
                    "Pickup",
                    "TAURUS 16 TON",
                    "Tata 407",
                    "TRUCK/LORRY",
                    "SFBT40",
                    "TATA/EICHER 709",
                    "32FTMXL-18MT",
                    "32FTSXL-7MT",
                    "32FTSXL-9MT",
                    "FLAT BED TRAILER 40FT",
                    "SEMI FLAT BED TRAILER 40FT",
                    "TAURUS 18 TON",
                    "TAURUS 21 TON",
                    "TAURUS 25 TON",
                    "TAURUS 30 TON",
                    "TATA ACE",
                  ].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-brand">Brand *</Label>
              <Input
                id="edit-brand"
                value={vehicleForm.brand}
                onChange={(e) =>
                  setVehicleForm((prev) => ({ ...prev, brand: e.target.value }))
                }
                placeholder="e.g. Tata, Mahindra"
              />
            </div>

            <div>
              <Label htmlFor="edit-model">Model *</Label>
              <Input
                id="edit-model"
                value={vehicleForm.model}
                onChange={(e) =>
                  setVehicleForm((prev) => ({ ...prev, model: e.target.value }))
                }
                placeholder="e.g. Ace, Bolero"
              />
            </div>

            <div>
              <Label htmlFor="edit-yearOfManufacture">Year of Manufacture</Label>
              <Input
                id="edit-yearOfManufacture"
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
              <Label htmlFor="edit-registrationDate">Registration Date</Label>
              <Input
                id="edit-registrationDate"
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
              <Label htmlFor="edit-vehicleInsuranceNo">Insurance Number</Label>
              <Input
                id="edit-vehicleInsuranceNo"
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
              <Label htmlFor="edit-fitnessNo">Fitness Number</Label>
              <Input
                id="edit-fitnessNo"
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
              <Label htmlFor="edit-insuranceExpiry">Insurance Expiry</Label>
              <Input
                id="edit-insuranceExpiry"
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
              <Label htmlFor="edit-fitnessCertificateExpiry">
                Fitness Certificate Expiry
              </Label>
              <Input
                id="edit-fitnessCertificateExpiry"
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
              <Label htmlFor="edit-pollutionCertificateExpiry">
                Pollution Certificate Expiry
              </Label>
              <Input
                id="edit-pollutionCertificateExpiry"
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
              <Label htmlFor="edit-status">Status</Label>
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
              onClick={() => {
                setShowEditVehicleDialog(false);
                setSelectedVehicle(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVehicle}
              disabled={
                updatingVehicle ||
                !vehicleForm.vehicleNumber ||
                !vehicleForm.brand ||
                !vehicleForm.model
              }
            >
              {updatingVehicle ? "Updating..." : "Update Vehicle"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorVehicles;
