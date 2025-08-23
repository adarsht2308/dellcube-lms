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
} from "lucide-react";
import { useGetVendorByIdMutation } from "@/features/api/Vendor/vendorApi";
import { Badge } from "@/components/ui/badge";

const DELLCUBE_COLORS = {
  gold: "#FFD249",
  dark: "#202020",
  gray: "#828083",
};

const VendorDetail = () => {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [getVendorById] = useGetVendorByIdMutation();
  const [vendorData, setVendorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
    fetchVendor();
  }, [vendorId, getVendorById]);

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
                {vendorData.company?.name} • {vendorData.branch?.name}
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
              <h3 className="text-lg font-semibold text-[#202020]">Company & Branch</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-[#828083]" />
                <span className="text-sm text-[#828083]">{vendorData.company?.name || "N/A"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-[#828083]" />
                <span className="text-sm text-[#828083]">{vendorData.branch?.name || "N/A"}</span>
              </div>
            </div>
          </Card>
        </div>

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

                  <div className="text-xs text-[#828083]">
                    Maintenance Records: {vehicle.maintenanceHistory?.length || 0}
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
      </div>
    </div>
  );
};

export default VendorDetail;
