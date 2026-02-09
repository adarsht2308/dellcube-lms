import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ChevronLeft,
  Users,
  Building2,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Car,
  Wrench,
  AlertTriangle,
  Truck,
  BarChart2,
  Edit,
  Trash2,
} from "lucide-react";
import { 
  useGetVendorByIdMutation,
  useUpdateVendorVehicleMutation,
  useDeleteVendorVehicleMutation,
} from "@/features/api/Vendor/vendorApi";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

const DELLCUBE_COLORS = {
  gold: "#FFD249",
  dark: "#202020",
  gray: "#828083",
};

const VendorDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [getVendorById] = useGetVendorByIdMutation();
  const [updateVendorVehicle] = useUpdateVendorVehicleMutation();
  const [deleteVendorVehicle] = useDeleteVendorVehicleMutation();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editVehicleDialog, setEditVehicleDialog] = useState({ open: false, vehicle: null });
  const [deleteVehicleDialog, setDeleteVehicleDialog] = useState({ open: false, vehicle: null });
  const [vehicleForm, setVehicleForm] = useState({
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
  const [vehicleFiles, setVehicleFiles] = useState({
    fitnessCertificateImage: null,
    pollutionCertificateImage: null,
    registrationCertificateImage: null,
    insuranceImage: null,
  });

    const fetchVendor = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getVendorById(vendorId);
        if (data?.success) {
          setVendorData(data.vendor);
        } else {
          setError("Vendor not found");
        }
      } catch (err) {
        setError("Failed to fetch vendor data");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchVendor();
  }, [vendorId, getVendorById]);

  const handleEditVehicle = (vehicle) => {
    // Format dates properly - handle both Date objects and ISO strings
    const formatDate = (dateValue) => {
      if (!dateValue) return "";
      try {
        const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
        if (isNaN(date.getTime())) return "";
        return date.toISOString().split('T')[0];
      } catch (e) {
        return "";
      }
    };

    setVehicleForm({
      vehicleNumber: vehicle.vehicleNumber || "",
      type: vehicle.type || "14 Feet",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      yearOfManufacture: vehicle.yearOfManufacture ? vehicle.yearOfManufacture.toString() : "",
      registrationDate: formatDate(vehicle.registrationDate),
      fitnessCertificateExpiry: formatDate(vehicle.fitnessCertificateExpiry),
      insuranceExpiry: formatDate(vehicle.insuranceExpiry),
      pollutionCertificateExpiry: formatDate(vehicle.pollutionCertificateExpiry),
      vehicleInsuranceNo: vehicle.vehicleInsuranceNo || "",
      fitnessNo: vehicle.fitnessNo || "",
      status: vehicle.status || "active",
    });
    setVehicleFiles({
      fitnessCertificateImage: null,
      pollutionCertificateImage: null,
      registrationCertificateImage: null,
      insuranceImage: null,
    });
    setEditVehicleDialog({ open: true, vehicle });
  };

  const handleUpdateVehicle = async () => {
    if (!vehicleForm.vehicleNumber || !vehicleForm.brand || !vehicleForm.model || !vehicleForm.type) {
      toast.error("Vehicle Number, Type, Brand, and Model are required.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("vendorId", vendorId);
      formData.append("vehicleId", editVehicleDialog.vehicle._id);
      formData.append("vehicleNumber", vehicleForm.vehicleNumber.trim().toUpperCase());
      formData.append("type", vehicleForm.type);
      formData.append("brand", vehicleForm.brand);
      formData.append("model", vehicleForm.model);
      if (vehicleForm.yearOfManufacture) formData.append("yearOfManufacture", vehicleForm.yearOfManufacture);
      if (vehicleForm.registrationDate) formData.append("registrationDate", vehicleForm.registrationDate);
      if (vehicleForm.fitnessCertificateExpiry) formData.append("fitnessCertificateExpiry", vehicleForm.fitnessCertificateExpiry);
      if (vehicleForm.insuranceExpiry) formData.append("insuranceExpiry", vehicleForm.insuranceExpiry);
      if (vehicleForm.pollutionCertificateExpiry) formData.append("pollutionCertificateExpiry", vehicleForm.pollutionCertificateExpiry);
      formData.append("vehicleInsuranceNo", vehicleForm.vehicleInsuranceNo || "");
      formData.append("fitnessNo", vehicleForm.fitnessNo || "");
      formData.append("status", vehicleForm.status);

      if (vehicleFiles.fitnessCertificateImage) {
        formData.append("vendorVehicleFitnessCertificateImage", vehicleFiles.fitnessCertificateImage);
      }
      if (vehicleFiles.pollutionCertificateImage) {
        formData.append("vendorVehiclePollutionCertificateImage", vehicleFiles.pollutionCertificateImage);
      }
      if (vehicleFiles.registrationCertificateImage) {
        formData.append("vendorVehicleRegistrationCertificateImage", vehicleFiles.registrationCertificateImage);
      }
      if (vehicleFiles.insuranceImage) {
        formData.append("vendorVehicleInsuranceImage", vehicleFiles.insuranceImage);
      }

      await updateVendorVehicle({ vehicle: formData }).unwrap();
      toast.success("Vehicle updated successfully!");
      setEditVehicleDialog({ open: false, vehicle: null });
      await fetchVendor();
    } catch (err) {
      console.error("Update vehicle error:", err);
      toast.error(err?.data?.message || "Failed to update vehicle.");
    }
  };

  const handleDeleteVehicle = async () => {
    if (!deleteVehicleDialog.vehicle) return;
    
    try {
      await deleteVendorVehicle({
        vendorId,
        vehicleId: deleteVehicleDialog.vehicle._id,
      }).unwrap();
      toast.success("Vehicle deleted successfully!");
      setDeleteVehicleDialog({ open: false, vehicle: null });
      await fetchVendor();
    } catch (err) {
      console.error("Delete vehicle error:", err);
      toast.error(err?.data?.message || "Failed to delete vehicle.");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-[#828083]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD249] mx-auto mb-4"></div>
        Loading vendor details...
      </div>
    );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!vendorData) return null;

  const totalVehicles = vendorData?.availableVehicles?.length || 0;
  const activeVehicles = vendorData?.availableVehicles?.filter(v => v.status === 'active').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="container mx-auto">
        <Button
          variant="ghost"
          className="mb-4 flex items-center gap-2 text-[#202020] hover:text-[#FFD249]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft /> Back
        </Button>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-[#828083] mb-4">
          <button 
            onClick={() => navigate('/admin/vendors')}
            className="hover:text-[#FFD249] transition-colors"
          >
            Vendors
          </button>
          <span>/</span>
          <span className="text-[#202020] font-medium">{vendorData.name}</span>
        </div>

        {/* Vendor Info Header */}
        <Card className="mb-6 p-6 rounded-2xl shadow-lg border-0 bg-white/90 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-4 bg-[#FFD249]/20 rounded-full">
              <Users className="w-10 h-10 text-[#FFD249]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-[#202020]">
                  {vendorData.name}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/update-vendor`, { state: { vendorId: vendorData._id } })}
                  className="bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] border-[#FFD249]/30"
                >
                  Edit Vendor
                </Button>
              </div>
              <div className="text-[#828083] text-sm mb-1">
                {vendorData.email} • {vendorData.phone}
              </div>
              <div className="text-[#828083] text-xs">
                {Array.isArray(vendorData.company) 
                  ? vendorData.company.map(c => c?.name || c).join(", ") || "N/A"
                  : vendorData.company?.name || "N/A"} • {Array.isArray(vendorData.branch)
                  ? vendorData.branch.map(b => b?.name || b).join(", ") || "N/A"
                  : vendorData.branch?.name || "N/A"}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <Badge 
              variant={vendorData.status === 'active' ? 'default' : 'secondary'}
              className={`${
                vendorData.status === 'active' 
                  ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                  : 'bg-red-100 text-red-800 hover:bg-red-200'
              }`}
            >
              {vendorData.status}
            </Badge>
            <div className="text-xs text-[#828083]">
              Total Vehicles:{" "}
              <span className="font-medium text-[#202020]">
                {totalVehicles}
              </span>
            </div>
          </div>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 rounded-2xl shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Car className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Vehicles</p>
                <p className="text-2xl font-bold text-blue-800">{totalVehicles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-full">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Active Vehicles</p>
                <p className="text-2xl font-bold text-green-800">{activeVehicles}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <BarChart2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Maintenance</p>
                <p className="text-2xl font-bold text-purple-800">
                  {vendorData.availableVehicles?.reduce((sum, v) => sum + (v.maintenanceHistory?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Vendor Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Contact Information */}
          <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/90">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-full">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#202020]">Contact Information</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#828083]" />
                <span className="text-sm text-[#828083]">{vendorData.email || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#828083]" />
                <span className="text-sm text-[#828083]">{vendorData.phone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#828083]" />
                <span className="text-sm text-[#828083]">{vendorData.address || "N/A"}</span>
              </div>
            </div>
          </Card>

          {/* Company & Branch */}
          <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/90">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-full">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#202020]">Companies & Branches</h3>
            </div>
            <div className="space-y-4">
              {(() => {
                // Group branches by company
                const companies = Array.isArray(vendorData.company) 
                  ? vendorData.company 
                  : vendorData.company ? [vendorData.company] : [];
                const branches = Array.isArray(vendorData.branch)
                  ? vendorData.branch
                  : vendorData.branch ? [vendorData.branch] : [];
                
                // Create a map of company to branches
                const companyBranchMap = new Map();
                
                // First, add all companies
                companies.forEach((company) => {
                  const companyId = company?._id || company;
                  const companyName = typeof company === 'object' ? (company?.name || 'Unknown') : company;
                  
                  if (!companyBranchMap.has(String(companyId))) {
                    companyBranchMap.set(String(companyId), {
                      company: companyName,
                      branches: []
                    });
                  }
                });
                
                // Then, try to match branches to companies
                branches.forEach((branch) => {
                  const branchName = typeof branch === 'object' ? (branch?.name || 'Unknown') : branch;
                  const branchCompanyId = branch?.company?._id || branch?.company;
                  
                  if (branchCompanyId && companyBranchMap.has(String(branchCompanyId))) {
                    companyBranchMap.get(String(branchCompanyId)).branches.push(branchName);
                  } else {
                    // If branch doesn't have company reference, add to first company or create a standalone entry
                    if (companyBranchMap.size > 0) {
                      const firstCompany = Array.from(companyBranchMap.values())[0];
                      firstCompany.branches.push(branchName);
                    }
                  }
                });
                
                if (companyBranchMap.size === 0) {
                  return <p className="text-sm text-[#828083]">No companies or branches assigned</p>;
                }
                
                return Array.from(companyBranchMap.entries()).map(([companyId, item], idx) => (
                  <div key={companyId || idx} className="border-l-4 border-green-400 pl-4 py-2 bg-green-50/50 rounded-r-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-sm text-[#202020]">{item.company}</span>
                    </div>
                    {item.branches.length > 0 ? (
                      <div className="ml-6 space-y-1">
                        {item.branches.map((branchName, branchIdx) => (
                          <div key={branchIdx} className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-[#828083]" />
                            <span className="text-xs text-[#828083]">{branchName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-6">
                        <span className="text-xs text-[#828083] italic">No branches assigned</span>
                      </div>
                    )}
                  </div>
                ));
              })()}
            </div>
          </Card>
        </div>

        {/* Assigned Customers */}
        <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/90 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-full">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#202020]">Assigned Customers</h3>
            <Badge variant="outline" className="text-[#828083]">
              {vendorData.assignedClients?.length || 0} customer(s)
            </Badge>
          </div>
          {vendorData.assignedClients && vendorData.assignedClients.length > 0 ? (
            <div className="space-y-4">
              {(() => {
                // Group customers by company and branch
                const groupedCustomers = {};
                
                vendorData.assignedClients.forEach((customer) => {
                  const companyId = customer?.company?._id || customer?.company || 'unknown';
                  const branchId = customer?.branch?._id || customer?.branch || 'unknown';
                  const companyName = customer?.company?.name || 'Unknown Company';
                  const branchName = customer?.branch?.name || 'Unknown Branch';
                  const key = `${companyId}-${branchId}`;
                  
                  if (!groupedCustomers[key]) {
                    groupedCustomers[key] = {
                      companyName,
                      branchName,
                      companyId,
                      branchId,
                      customers: []
                    };
                  }
                  groupedCustomers[key].customers.push(customer);
                });

                return Object.values(groupedCustomers).map((group, idx) => (
                  <div key={idx} className="border-l-4 border-orange-400 pl-4 py-3 bg-orange-50/50 rounded-r-md">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="w-4 h-4 text-orange-600" />
                      <span className="font-semibold text-sm text-[#202020]">{group.companyName}</span>
                      <span className="text-xs text-[#828083]">→</span>
                      <MapPin className="w-3 h-3 text-orange-600" />
                      <span className="font-medium text-xs text-[#202020]">{group.branchName}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {group.customers.length} customer(s)
                      </Badge>
                    </div>
                    <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {group.customers.map((customer, customerIdx) => (
                        <div 
                          key={customerIdx} 
                          className="flex items-center gap-2 p-2 bg-white rounded-md border border-orange-100 hover:border-orange-300 transition-colors"
                        >
                          <Users className="w-3 h-3 text-orange-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#202020] truncate">
                              {customer?.name || customer}
                            </p>
                            {customer?.email && (
                              <p className="text-xs text-[#828083] truncate">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-[#828083]">
              <Users className="w-12 h-12 mx-auto mb-3 text-[#828083] opacity-50" />
              <p>No customers assigned to this vendor</p>
              <p className="text-sm mt-1">Customers can be assigned when creating or updating the vendor</p>
            </div>
          )}
        </Card>

        {/* Financial Information */}
        <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/90 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-[#202020]">Financial Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-[#828083] mb-1">Bank Name</p>
              <p className="text-sm font-medium text-[#202020]">{vendorData.bankName || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#828083] mb-1">Account Number</p>
              <p className="text-sm font-medium text-[#202020]">{vendorData.accountNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#828083] mb-1">IFSC Code</p>
              <p className="text-sm font-medium text-[#202020]">{vendorData.ifsc || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-[#828083] mb-1">PAN Number</p>
              <p className="text-sm font-medium text-[#202020]">{vendorData.panNumber || "N/A"}</p>
            </div>
          </div>
        </Card>

        {/* Vehicles Section */}
        <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/90 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-full">
                <Truck className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#202020]">Available Vehicles</h3>
            </div>
            <Badge variant="outline" className="text-[#828083]">
              {totalVehicles} vehicles
            </Badge>
          </div>
          
          {totalVehicles > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorData.availableVehicles.map((vehicle, index) => (
                <Card key={vehicle._id || index} className="p-4 border border-gray-200 hover:border-[#FFD249] transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-[#202020] mb-1">{vehicle.vehicleNumber}</h4>
                      <p className="text-sm text-[#828083]">{vehicle.brand} {vehicle.model}</p>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          vehicle.status === 'active' 
                            ? 'border-green-200 text-green-700 bg-green-50' 
                            : vehicle.status === 'under_maintenance'
                            ? 'border-yellow-200 text-yellow-700 bg-yellow-50'
                            : 'border-red-200 text-red-700 bg-red-50'
                        }`}
                      >
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#828083]">{vehicle.type}</p>
                      <p className="text-xs text-[#828083]">{vehicle.yearOfManufacture || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Certificate Expiry Warnings */}
                  <div className="space-y-1 mb-3">
                    {vehicle.fitnessCertificateExpiry && (
                      <div className={`text-xs flex items-center gap-1 ${
                        new Date(vehicle.fitnessCertificateExpiry) < new Date()
                          ? 'text-red-600' 
                          : new Date(vehicle.fitnessCertificateExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        FC: {new Date(vehicle.fitnessCertificateExpiry).toLocaleDateString()}
                      </div>
                    )}
                    {vehicle.insuranceExpiry && (
                      <div className={`text-xs flex items-center gap-1 ${
                        new Date(vehicle.insuranceExpiry) < new Date()
                          ? 'text-red-600' 
                          : new Date(vehicle.insuranceExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}>
                        <AlertTriangle className="w-3 h-3" />
                        Insurance: {new Date(vehicle.insuranceExpiry).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <div className="text-xs text-[#828083] mb-3">
                    Maintenance Records: {vehicle.maintenanceHistory?.length || 0}
                  </div>

                  {/* Edit and Delete Buttons */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] border-[#FFD249]/30"
                      onClick={() => handleEditVehicle(vehicle)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      onClick={() => setDeleteVehicleDialog({ open: true, vehicle })}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#828083]">
              <Car className="w-12 h-12 mx-auto mb-3 text-[#828083]" />
              <p>No vehicles available for this vendor</p>
            </div>
          )}
        </Card>

        {/* Maintenance History Section */}
        <Card className="p-6 rounded-2xl shadow-lg border-0 bg-white/90 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-[#202020]">Maintenance History</h3>
            </div>
            <Badge variant="outline" className="text-[#828083]">
              {vendorData.availableVehicles?.reduce((sum, v) => sum + (v.maintenanceHistory?.length || 0), 0) || 0} records
            </Badge>
          </div>

          {/* Maintenance Records */}
          {vendorData.availableVehicles?.some(v => v.maintenanceHistory?.length > 0) ? (
            <div className="space-y-6">
              {vendorData.availableVehicles.map((vehicle, vehicleIndex) => 
                vehicle.maintenanceHistory?.length > 0 && (
                  <div key={vehicle._id || vehicleIndex} className="border-l-4 border-[#FFD249] pl-4">
                    <h4 className="font-semibold text-[#202020] mb-3 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {vehicle.vehicleNumber} - {vehicle.brand} {vehicle.model}
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {vehicle.maintenanceHistory.map((maintenance, maintenanceIndex) => (
                        <Card key={maintenanceIndex} className="p-4 border border-gray-200 bg-gray-50/50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-blue-100 rounded">
                                <Wrench className="w-3 h-3 text-blue-600" />
                              </div>
                              <span className="font-medium text-sm text-[#202020]">{maintenance.serviceType}</span>
                            </div>
                            <span className="text-xs text-[#828083]">
                              {maintenance.serviceDate ? new Date(maintenance.serviceDate).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <p className="text-[#828083]">
                              <span className="font-medium">Description:</span> {maintenance.description || 'N/A'}
                            </p>
                            <div className="flex justify-between items-center">
                              <span className="text-[#828083]">
                                <span className="font-medium">Cost:</span> ₹{maintenance.cost?.toLocaleString() || 'N/A'}
                              </span>
                              <span className="text-[#828083]">
                                <span className="font-medium">By:</span> {maintenance.servicedBy || 'N/A'}
                              </span>
                            </div>
                            
                            {maintenance.billImage?.url && (
                              <div className="mt-2">
                                <img 
                                  src={maintenance.billImage.url} 
                                  alt="Maintenance Bill" 
                                  className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                  onClick={() => window.open(maintenance.billImage.url, '_blank')}
                                />
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[#828083]">
              <Wrench className="w-12 h-12 mx-auto mb-3 text-[#828083]" />
              <p>No maintenance records found</p>
              <p className="text-sm">Maintenance records will appear here when vehicles are serviced</p>
            </div>
          )}
        </Card>

        {/* Edit Vehicle Dialog */}
        <Dialog open={editVehicleDialog.open} onOpenChange={(open) => setEditVehicleDialog({ open, vehicle: null })}>
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
                    setVehicleForm((prev) => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }));
                  }}
                  placeholder="e.g. MH04AB1234"
                />
              </div>

              <div>
                <Label htmlFor="edit-type">Vehicle Type *</Label>
                <Select
                  value={vehicleForm.type}
                  onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, type: value }))}
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
                      "32FTMXL-18MT",
                      "32FTSXL-7MT",
                      "32FTSXL-9MT",
                      "Biker",
                      "BYHAND",
                      "FLAT BED TRAILER 20FT",
                      "FLAT BED TRAILER 40FT",
                      "SEMI FLAT BED TRAILER 40FT",
                      "Pickup",
                      "TAURUS 16 TON",
                      "TAURUS 18 TON",
                      "TAURUS 21 TON",
                      "TAURUS 25 TON",
                      "TAURUS 30 TON",
                      "Tata 407",
                      "TRUCK/LORRY",
                      "SFBT40",
                      "TATA/EICHER 709",
                      "TATA ACE"
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
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, brand: e.target.value }))}
                  placeholder="e.g. Tata, Mahindra"
                />
              </div>

              <div>
                <Label htmlFor="edit-model">Model *</Label>
                <Input
                  id="edit-model"
                  value={vehicleForm.model}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="e.g. Ace, Bolero"
                />
              </div>

              <div>
                <Label htmlFor="edit-yearOfManufacture">Year of Manufacture</Label>
                <Input
                  id="edit-yearOfManufacture"
                  type="number"
                  value={vehicleForm.yearOfManufacture}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, yearOfManufacture: e.target.value }))}
                  placeholder="e.g. 2020"
                />
              </div>

              <div>
                <Label htmlFor="edit-registrationDate">Registration Date</Label>
                <Input
                  id="edit-registrationDate"
                  type="date"
                  value={vehicleForm.registrationDate}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, registrationDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-fitnessCertificateExpiry">Fitness Certificate Expiry</Label>
                <Input
                  id="edit-fitnessCertificateExpiry"
                  type="date"
                  value={vehicleForm.fitnessCertificateExpiry}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, fitnessCertificateExpiry: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-insuranceExpiry">Insurance Expiry</Label>
                <Input
                  id="edit-insuranceExpiry"
                  type="date"
                  value={vehicleForm.insuranceExpiry}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, insuranceExpiry: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-pollutionCertificateExpiry">Pollution Certificate Expiry</Label>
                <Input
                  id="edit-pollutionCertificateExpiry"
                  type="date"
                  value={vehicleForm.pollutionCertificateExpiry}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, pollutionCertificateExpiry: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-fitnessNo">Fitness Number</Label>
                <Input
                  id="edit-fitnessNo"
                  value={vehicleForm.fitnessNo}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, fitnessNo: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-vehicleInsuranceNo">Insurance Number</Label>
                <Input
                  id="edit-vehicleInsuranceNo"
                  value={vehicleForm.vehicleInsuranceNo}
                  onChange={(e) => setVehicleForm((prev) => ({ ...prev, vehicleInsuranceNo: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={vehicleForm.status} onValueChange={(value) => setVehicleForm((prev) => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="decommissioned">Decommissioned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-fitnessCertificateImage">Fitness Certificate Image</Label>
                <Input
                  id="edit-fitnessCertificateImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVehicleFiles((prev) => ({ ...prev, fitnessCertificateImage: e.target.files[0] }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-pollutionCertificateImage">Pollution Certificate Image</Label>
                <Input
                  id="edit-pollutionCertificateImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVehicleFiles((prev) => ({ ...prev, pollutionCertificateImage: e.target.files[0] }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-registrationCertificateImage">Registration Certificate Image</Label>
                <Input
                  id="edit-registrationCertificateImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVehicleFiles((prev) => ({ ...prev, registrationCertificateImage: e.target.files[0] }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-insuranceImage">Insurance Image</Label>
                <Input
                  id="edit-insuranceImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVehicleFiles((prev) => ({ ...prev, insuranceImage: e.target.files[0] }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditVehicleDialog({ open: false, vehicle: null })}>
                Cancel
              </Button>
              <Button onClick={handleUpdateVehicle} className="bg-[#FFD249] hover:bg-[#FFD249]/90 text-[#202020]">
                Update Vehicle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Vehicle Confirmation Dialog */}
        <AlertDialog open={deleteVehicleDialog.open} onOpenChange={(open) => setDeleteVehicleDialog({ open, vehicle: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the vehicle{" "}
                <strong>{deleteVehicleDialog.vehicle?.vehicleNumber}</strong> from this vendor.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteVehicle}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default VendorDetail;
