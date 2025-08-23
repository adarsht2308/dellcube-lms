import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users, // Icon for vendors
  EyeIcon,
  Loader2,
  Car, // Icon for vehicles
  SlidersHorizontal, // Icon for filters
  Mail,
  Phone,
  Building2,
  MapPin,
} from "lucide-react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { GrPowerCycle } from "react-icons/gr";
import { useSelector } from "react-redux";
import {
  useGetAllVendorsQuery,
  useGetVendorByIdMutation,
  useDeleteVendorMutation,
  useAddVehicleMutation,
  useUpdateVendorMutation,
  useUpdateVendorVehicleStatusMutation, // <-- import the new hook
  useAddVendorVehicleMaintenanceMutation, // <-- import the new maintenance hook
} from "@/features/api/Vendor/vendorApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Drawer } from "antd"; // Ant Design Drawer
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"; // Assuming you have a Label component

import { useDebounce } from "@/hooks/Debounce"; // Custom hook for debouncing search input

// InfoCard and InfoRow components for Drawer, styled like Invoices/Customers
const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
  <div
    className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-gray-300/50 dark:hover:border-gray-600/50 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative flex items-center gap-3 mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
    </div>
    <div className="relative space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200">
    <div className="flex items-center gap-2 min-w-0">
      {Icon && <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{label}:</span>
    </div>
    <div className="flex-shrink-0 ml-3">
      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{value || <span className="text-gray-400 italic">N/A</span>}</span>
    </div>
  </div>
);

// Dellcube color theme constants
const DELLCUBE_COLORS = {
  gold: '#FFD249',
  dark: '#202020',
  gray: '#828083',
};

const Vendors = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const isBranchAdmin = user?.role === "branchAdmin";
  const isSuperAdmin = user?.role === "superAdmin";

  const [companyId, setCompanyId] = useState(
    isBranchAdmin ? user?.company?._id : ""
  );
  const [branchId, setBranchId] = useState(
    isBranchAdmin ? user?.branch?._id : ""
  );
  const [branches, setBranches] = useState([]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false); // State to toggle filter visibility

  const { data, isLoading, refetch } = useGetAllVendorsQuery({
    page,
    limit,
    search: debouncedSearch,
    companyId: isBranchAdmin ? user?.company?._id : companyId,
    branchId: isBranchAdmin ? user?.branch?._id : branchId,
    status,
  });

  const [deleteVendor, { isSuccess, isError }] = useDeleteVendorMutation();
  const [getVendorById] = useGetVendorByIdMutation();
  const [addVehicleToVendor] = useAddVehicleMutation();
  const [updateVendor] = useUpdateVendorMutation();
  const [updateVendorVehicleStatus] = useUpdateVendorVehicleStatusMutation();
  const [addVendorVehicleMaintenance] = useAddVendorVehicleMaintenanceMutation();

  const [open, setOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const { data: companyData } = useGetAllCompaniesQuery({});

  useEffect(() => {
    const fetchBranches = async () => {
      if (companyId && isSuperAdmin) {
        try {
          const res = await getBranchesByCompany(companyId);
          if (res?.data?.branches) {
            setBranches(res.data.branches);
          }
        } catch (err) {
          console.error("Failed to fetch branches:", err);
        }
      } else if (!companyId) {
        setBranches([]); // Clear branches if no company is selected
      }
    };
    fetchBranches();
  }, [companyId, isSuperAdmin, getBranchesByCompany]);

  // Effect to refetch data when filters change
  useEffect(() => {
    refetch();
  }, [page, limit, debouncedSearch, companyId, branchId, status, refetch]);

  const [openAddVehicle, setOpenAddVehicle] = useState(false);
  const [targetVendorId, setTargetVendorId] = useState(null);
  const [openVehicleDialog, setOpenVehicleDialog] = useState(false);
  const [vehicleDialogVendor, setVehicleDialogVendor] = useState(null);
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);

  const handleView = async (id) => {
    setOpen(true);
    try {
      const { data: vendorData } = await getVendorById(id);
      if (vendorData?.success) {
        setSelectedVendor(vendorData.vendor);
      } else {
        toast.error(vendorData?.message || "Failed to fetch vendor details.");
        setOpen(false); // Optionally close if fetch fails
      }
    } catch (err) {
      console.error("Error fetching vendor:", err);
      toast.error("Error fetching vendor details.");
      setOpen(false); // Optionally close if fetch fails
    }
  };

  const handleDelete = async (id) => {
    await deleteVendor(id);
  };

  const handleOpenAddVehicle = (vendorId) => {
    setTargetVendorId(vendorId);
    setOpenVehicleDialog(true);
  };

  const handleAddVehicle = async (vendorId, formData) => {
    try {
      // If formData is FormData (from file uploads), send it directly
      if (formData instanceof FormData) {
        // Append vendorId to the FormData
        formData.append('vendorId', vendorId);
        await addVehicleToVendor({ vehicle: formData }).unwrap();
      } else {
        // If it's a regular object, create FormData
        const data = new FormData();
        data.append('vendorId', vendorId);
        Object.keys(formData).forEach(key => {
          if (formData[key] !== "") {
            data.append(key, formData[key]);
          }
        });
        await addVehicleToVendor({ vehicle: data }).unwrap();
      }
      
      toast.success("Vehicle added to vendor successfully!");
      refetch();
      if (open && selectedVendor?._id === vendorId) {
        handleView(vendorId); // Re-fetch details for the open drawer
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add vehicle.");
      console.error("Failed to add vehicle:", err);
    }
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Vendor deleted successfully");
      refetch();
    } else if (isError) {
      toast.error("Failed to delete vendor");
    }
  }, [isSuccess, isError, refetch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) setPage(newPage);
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    setPage(1); // Reset to first page when limit changes
  };

  const handleClearFilters = () => {
    setCompanyId(isBranchAdmin ? user?.company?._id : "");
    setBranchId(isBranchAdmin ? user?.branch?._id : "");
    setSearch("");
    setStatus("");
    setPage(1);
    setLimit(10);
    // No need to call refetch here, as useEffect will handle it when state changes
  };

  const getPageNumbers = () => {
    const totalPages = data?.totalPages || 1;
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(page - 2, totalPages - 4));
    let end = Math.min(start + 4, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-600";
      case "inactive":
        return "bg-red-100 text-red-600";
      case "on_hold":
        return "bg-yellow-100 text-yellow-600";
      case "suspended":
        return "bg-gray-200 text-gray-700 line-through";
      case "under_maintenance":
        return "bg-blue-100 text-blue-600";
      case "decommissioned":
        return "bg-gray-200 text-gray-700 line-through";
      case "available":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleOpenVehicleDialog = async (vendor) => {
    // Fetch the latest vendor data to ensure vehicles are up to date
    try {
      const { data: vendorData } = await getVendorById(vendor._id);
      if (vendorData?.success) {
        setVehicleDialogVendor(vendorData.vendor);
        setOpenVehicleDialog(true);
      } else {
        toast.error(vendorData?.message || "Failed to fetch vendor vehicles.");
      }
    } catch (err) {
      toast.error("Error fetching vendor vehicles.");
    }
  };

  const [statusDialog, setStatusDialog] = useState({ open: false, vehicle: null });
  const [statusValue, setStatusValue] = useState("");
  const [maintenanceDialog, setMaintenanceDialog] = useState({ open: false, vehicle: null });
  
  const handleUpdateVehicleStatus = (vehicle) => {
    setOpen(false); // Close the drawer
    setStatusDialog({ open: true, vehicle });
    setStatusValue(vehicle.status || "");
  };

  const handleAddMaintenance = (vehicle) => {
    setOpen(false); // Close the drawer
    setMaintenanceDialog({ open: true, vehicle });
  };

  const handleRemoveVehicle = async (vehicleId) => {
    if (!selectedVendor) return;
    const updatedVehicles = selectedVendor.availableVehicles.filter(v => v._id !== vehicleId);
    try {
      await updateVendor({ vendorId: selectedVendor._id, availableVehicles: updatedVehicles }).unwrap();
      toast.success('Vehicle removed successfully!');
      handleView(selectedVendor._id);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove vehicle.');
    }
  };

  return (
    <section className=" min-h-screen">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">Total Vendors</p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">{data?.total || 0}</p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <Users className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">Current Page</p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">{page}</p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <Building2 className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">Items Per Page</p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">{limit}</p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <Car className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>
        </div>
        {/* Controls Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">All Vendors</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] dark:text-[#FFD249] border-[#FFD249]/30"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search vendor name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-[#202020] dark:text-[#FFD249] placeholder-[#828083] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD249]/50 focus:border-transparent backdrop-blur-sm"
                />
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#828083] dark:text-gray-400" />
              </div>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[100px] bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 50].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                className="p-2 bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] dark:text-[#FFD249] border-[#FFD249]/30"
              >
                <GrPowerCycle className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => navigate("/admin/create-vendor")}
                className="bg-[#FFD249] hover:bg-[#FFD249]/90 text-[#202020] font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Vendor
              </Button>
            </div>
          </div>
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50/80 dark:bg-gray-700/80 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
                {isSuperAdmin && (
                  <>
                    {/* Company Select */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="company-filter" className="text-[#202020] dark:text-[#FFD249]">Company</Label>
                      <Select
                        value={companyId}
                        onValueChange={(val) => {
                          setCompanyId(val);
                          setBranchId("");
                          setPage(1);
                        }}
                      >
                        <SelectTrigger id="company-filter" className="w-full">
                          <SelectValue placeholder="Filter by Company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyData?.companies?.map((comp) => (
                            <SelectItem key={comp._id} value={comp._id}>
                              {comp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Branch Select */}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="branch-filter" className="text-[#202020] dark:text-[#FFD249]">Branch</Label>
                      <Select
                        value={branchId}
                        onValueChange={(val) => {
                          setBranchId(val);
                          setPage(1);
                        }}
                        disabled={!companyId || branches.length === 0}
                      >
                        <SelectTrigger id="branch-filter" className="w-full">
                          <SelectValue placeholder="Filter by Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches?.map((br) => (
                            <SelectItem key={br._id} value={br._id}>
                              {br.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                {/* Status Select */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="status-filter" className="text-[#202020] dark:text-[#FFD249]">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => {
                      setStatus(val === "all" ? "" : val);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger id="status-filter" className="w-full">
                      <SelectValue placeholder="Filter by Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleClearFilters}
                className="text-xs bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] dark:text-[#FFD249] border-[#FFD249]/30"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
        {/* Vendor Table */}
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
          <table className="min-w-full text-sm">
            {/* Top thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Phone</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Branch</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-6">
                    <Loader2 className="animate-spin mx-auto text-[#FFD249]" /> Loading...
                  </td>
                </tr>
              ) : data?.vendors?.length ? (
                data.vendors.map((vendor, i) => (
                  <tr
                    key={vendor._id}
                    className={
                      i % 2 === 0
                        ? "bg-white/60 dark:bg-gray-900/60"
                        : "bg-[#FFD249]/10 dark:bg-[#FFD249]/5" +
                          " hover:bg-[#FFD249]/20 dark:hover:bg-[#FFD249]/10 transition "
                    }
                  >
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">{limit * (page - 1) + (i + 1)}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-semibold">{vendor.name}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{vendor.email}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{vendor.phone}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{vendor.company?.name || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{vendor.branch?.name || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${renderStatusBadge(vendor.status)}`}>{vendor.status}</span>
                    </td>
                    <td className="p-3 flex gap-2 items-center justify-center">
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() => handleView(vendor._id)}
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                        title="View Full Details"
                      >
                        <Users className="w-4 h-4" />
                      </Button>
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() => { setVehicleDialogVendor(vendor); setShowAddVehicleDialog(true); }}
                        title="Add Vehicle"
                      >
                        <Car className="w-4 h-4" />
                      </Button>
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() =>
                          navigate("/admin/update-vendor", {
                            state: { vendorId: vendor._id },
                          })
                        }
                        title="Edit Vendor"
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                            title="Delete Vendor"
                          >
                            <FaRegTrashCan />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the vendor and remove their data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(vendor._id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-10 text-[#828083]">
                    <Users className="w-8 h-8 mx-auto text-[#828083]" />
                    <p className="text-[#828083] font-medium">No Vendors Available</p>
                    <p className="text-sm text-[#828083]">Add a new vendor to begin</p>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Bottom thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Phone</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Branch</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-[#202020] dark:text-[#FFD249] text-center lg:text-left">
            Showing {data?.vendors?.length ? (data?.page - 1) * data?.limit + 1 : 0} to {Math.min(data?.page * data?.limit, data?.total || 0)} of <span className="font-medium">{data?.total || 0}</span> entries
          </div>
        </div>
        {/* Pagination */}
        {data?.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(page - 1)}
                    className={
                      page === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-[#FFD249]/10"
                    }
                  />
                </PaginationItem>
                {getPageNumbers().map((num) => (
                  <PaginationItem key={num}>
                    <PaginationLink
                      onClick={() => handlePageChange(num)}
                      isActive={num === page}
                      className="cursor-pointer hover:bg-[#FFD249]/10"
                    >
                      {num}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(page + 1)}
                    className={
                      page === data.totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-[#FFD249]/10"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        {/* Drawer and Dialogs remain unchanged */}
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          title={null}
          width={400}
          styles={{
            body: {
              padding: 0,
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            },
            header: {
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
              borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
              padding: "20px 24px",
            },
            content: {
              background: "transparent",
            },
            wrapper: {
              background: "rgba(0, 0, 0, 0.25)",
              backdropFilter: "blur(4px)",
            },
          }}
        >
          {!selectedVendor ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="p-6 space-y-6 overflow-x-hidden">
              {/* Header with View Full Details button */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-700/50">
                <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249]">
                  Vendor Information
                </h3>
                <Button
                  onClick={() => navigate(`/admin/vendors/${selectedVendor._id}`)}
                  className="bg-[#FFD249] hover:bg-[#FFD249]/90 text-[#202020] font-semibold px-4 py-2 rounded-xl"
                >
                  View Full Details
                </Button>
              </div>
              
              <InfoCard icon={Users} title="Vendor Information">
                <InfoRow label="Name" value={selectedVendor.name} icon={Users} />
                <InfoRow label="Email" value={selectedVendor.email} icon={Mail} />
                <InfoRow label="Phone" value={selectedVendor.phone} icon={Phone} />
                <InfoRow label="Status" value={selectedVendor.status} icon={EyeIcon} />
              </InfoCard>
              <InfoCard icon={Building2} title="Company & Branch">
                <InfoRow label="Company" value={selectedVendor.company?.name} icon={Building2} />
                <InfoRow label="Branch" value={selectedVendor.branch?.name} icon={MapPin} />
              </InfoCard>
              <InfoCard icon={MapPin} title="Location">
                <InfoRow label="Address" value={selectedVendor.address} icon={MapPin} />
              </InfoCard>
              <InfoCard icon={Building2} title="Account Details">
                <InfoRow label="Bank Name" value={selectedVendor.bankName} icon={Building2} />
                <InfoRow label="Account Number" value={selectedVendor.accountNumber} icon={Building2} />
                <InfoRow label="IFSC" value={selectedVendor.ifsc} icon={Building2} />
                <InfoRow label="PAN Number" value={selectedVendor.panNumber} icon={Building2} />
                <InfoRow label="GST Number" value={selectedVendor.gstNumber} icon={Building2} />
              </InfoCard>
              <InfoCard icon={Car} title="Vehicles">
                <InfoRow label="Total Vehicles" value={selectedVendor.availableVehicles?.length || 0} icon={Car} />
                {selectedVendor.availableVehicles?.length ? (
                  <div className="space-y-3 mt-2">
                    {selectedVendor.availableVehicles.map((vehicle, idx) => (
                      <div key={vehicle._id || idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-sm dark:bg-yellow-950 dark:border-yellow-700">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-yellow-300 text-yellow-900 text-xs px-2 py-1 rounded font-semibold dark:bg-yellow-700 dark:text-yellow-100">
                            {vehicle.vehicleNumber}
                          </span>
                          <span className="text-gray-600 text-sm dark:text-gray-300">
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <span className="bg-blue-300 text-blue-900 text-xs px-2 py-1 rounded font-semibold dark:bg-blue-700 dark:text-blue-100">
                            {vehicle.type}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          <p><strong>Year:</strong> {vehicle.yearOfManufacture || 'N/A'}</p>
                          <p><strong>Status:</strong> {vehicle.status}</p>
                          <p><strong>Registration Date:</strong> {vehicle.registrationDate ? new Date(vehicle.registrationDate).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>FC Expiry:</strong> {vehicle.fitnessCertificateExpiry ? new Date(vehicle.fitnessCertificateExpiry).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>Insurance Expiry:</strong> {vehicle.insuranceExpiry ? new Date(vehicle.insuranceExpiry).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>Pollution Cert Expiry:</strong> {vehicle.pollutionCertificateExpiry ? new Date(vehicle.pollutionCertificateExpiry).toLocaleDateString() : 'N/A'}</p>
                          <p><strong>Insurance No:</strong> {vehicle.vehicleInsuranceNo || 'N/A'}</p>
                          <p><strong>Fitness No:</strong> {vehicle.fitnessNo || 'N/A'}</p>
                        </div>
                        
                        {/* Certificate Images */}
                        {(vehicle.fitnessCertificateImage?.url || vehicle.pollutionCertificateImage?.url || vehicle.registrationCertificateImage?.url || vehicle.insuranceImage?.url) && (
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded border">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Certificates:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {vehicle.fitnessCertificateImage?.url && (
                                <div className="text-center">
                                  <img 
                                    src={vehicle.fitnessCertificateImage.url} 
                                    alt="Fitness Certificate" 
                                    className="w-16 h-16 object-cover rounded border mx-auto"
                                  />
                                  <p className="text-xs text-gray-500">FC</p>
                                </div>
                              )}
                              {vehicle.pollutionCertificateImage?.url && (
                                <div className="text-center">
                                  <img 
                                    src={vehicle.pollutionCertificateImage.url} 
                                    alt="Pollution Certificate" 
                                    className="w-16 h-16 object-cover rounded border mx-auto"
                                  />
                                  <p className="text-xs text-gray-500">PC</p>
                                </div>
                              )}
                              {vehicle.registrationCertificateImage?.url && (
                                <div className="text-center">
                                  <img 
                                    src={vehicle.registrationCertificateImage.url} 
                                    alt="Registration Certificate" 
                                    className="w-16 h-16 object-cover rounded border mx-auto"
                                  />
                                  <p className="text-xs text-gray-500">RC</p>
                                </div>
                              )}
                              {vehicle.insuranceImage?.url && (
                                <div className="text-center">
                                  <img 
                                    src={vehicle.insuranceImage.url} 
                                    alt="Insurance" 
                                    className="w-16 h-16 object-cover rounded border mx-auto"
                                  />
                                  <p className="text-xs text-gray-500">INS</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-2 mt-2">
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-yellow-400 hover:bg-yellow-500 text-yellow-900 dark:bg-yellow-700 dark:hover:bg-yellow-600 dark:text-yellow-100 border-none" onClick={() => handleRemoveVehicle(vehicle._id)}>
                              Remove
                            </Button>
                            <Button size="sm" className="bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100 border-none" onClick={() => handleUpdateVehicleStatus(vehicle)}>
                              Update Status
                            </Button>
                          </div>
                          <Button size="sm" className="bg-blue-400 hover:bg-blue-500 text-blue-900 dark:bg-blue-700 dark:hover:bg-blue-600 dark:text-blue-100 border-none w-full" onClick={() => handleAddMaintenance(vehicle)}>
                            Add Maintenance
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 italic mt-2">No vehicles found for this vendor.</div>
                )}
              </InfoCard>
            </div>
          )}
        </Drawer>
        {/* AddVehicleDialog, now controlled by showAddVehicleDialog */}
        <AddVehicleDialog
          open={showAddVehicleDialog}
          onClose={() => setShowAddVehicleDialog(false)}
          vendorId={vehicleDialogVendor?._id}
          onAddVehicle={async (vendorId, formData) => {
            await handleAddVehicle(vendorId, formData);
            setShowAddVehicleDialog(false);
            // Refresh the vendor data in the vehicle dialog and keep it open
            if (vendorId) {
              const { data: vendorData } = await getVendorById(vendorId);
              if (vendorData?.success) {
                setVehicleDialogVendor(vendorData.vendor);
              }
            }
          }}
        />
        <Dialog open={statusDialog.open} onOpenChange={open => setStatusDialog(s => ({ ...s, open }))}>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Update Vehicle Status</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Select value={statusValue} onValueChange={setStatusValue}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="decommissioned">Decommissioned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={async () => {
                if (!statusDialog.vehicle) return;
                try {
                  await updateVendorVehicleStatus({
                    vendorId: selectedVendor._id,
                    vehicleId: statusDialog.vehicle._id,
                    status: statusValue,
                  }).unwrap();
                  toast.success('Vehicle status updated!');
                  setStatusDialog({ open: false, vehicle: null });
                  setStatusValue("");
                  // Reopen the drawer with updated data
                  await handleView(selectedVendor._id);
                } catch (err) {
                  console.error('Update vehicle status error:', err);
                  toast.error(err?.data?.message || 'Failed to update status.');
                }
              }} className="bg-blue-500 hover:bg-blue-600 text-white">Update</Button>
              <Button variant="outline" onClick={async () => {
                setStatusDialog({ open: false, vehicle: null });
                setStatusValue("");
                // Reopen the drawer with current data
                await handleView(selectedVendor._id);
              }}>Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Maintenance Dialog */}
        <Dialog open={maintenanceDialog.open} onOpenChange={open => setMaintenanceDialog(s => ({ ...s, open }))}>
          <DialogContent className="dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle>Add Maintenance Record</DialogTitle>
            </DialogHeader>
            <AddMaintenanceForm 
              vehicle={maintenanceDialog.vehicle}
              vendorId={selectedVendor?._id}
              onSuccess={async () => {
                setMaintenanceDialog({ open: false, vehicle: null });
                // Reopen the drawer with updated data
                await handleView(selectedVendor._id);
              }}
              addMaintenance={addVendorVehicleMaintenance}
            />
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default Vendors;

// AddVehicleDialog component (no changes needed for filter/design, but included for completeness)
const AddVehicleDialog = ({ open, onClose, vendorId, onAddVehicle }) => {
  const [form, setForm] = useState({
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

  const [files, setFiles] = useState({
    fitnessCertificateImage: null,
    pollutionCertificateImage: null,
    registrationCertificateImage: null,
    insuranceImage: null,
  });

  // Debug form state
  useEffect(() => {
    console.log("Form state updated:", form);
  }, [form]);

  const handleFileChange = (field, file) => {
    setFiles(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = () => {
    if (!form.vehicleNumber || !form.brand || !form.model || !form.type) {
      toast.error("Vehicle Number, Type, Brand, and Model are required.");
      return;
    }

    console.log("Form data before submission:", form);

    // Create FormData for file uploads
    const formData = new FormData();
    
    // Add vehicle data
    Object.keys(form).forEach(key => {
      if (form[key] !== "") {
        formData.append(key, form[key]);
        console.log(`Appending ${key}: ${form[key]}`);
      } else {
        console.log(`Skipping ${key}: ${form[key]} (empty)`);
      }
    });

    // Add files
    Object.keys(files).forEach(key => {
      if (files[key]) {
        formData.append(`vendorVehicle${key.charAt(0).toUpperCase() + key.slice(1)}`, files[key]);
        console.log(`Appending file ${key}: ${files[key].name}`);
      }
    });

    console.log("FormData entries:");
    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    onAddVehicle(vendorId, formData);
    onClose();

    // Reset form
    setForm({
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
    setFiles({
      fitnessCertificateImage: null,
      pollutionCertificateImage: null,
      registrationCertificateImage: null,
      insuranceImage: null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dark:bg-gray-800 dark:text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            Add Vehicle to Vendor
          </DialogTitle>
        </DialogHeader>
        {/* Card style for add vehicle form */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 shadow-sm dark:bg-yellow-950 dark:border-yellow-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Vehicle Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 border-b border-yellow-300 pb-2">
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="vehicleNumber" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Vehicle Number *
                  </Label>
                  <Input
                    id="vehicleNumber"
                    name="vehicleNumber"
                    placeholder="e.g. MH 04 AB 1234"
                    value={form.vehicleNumber}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, vehicleNumber: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Vehicle Type *
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(val) => {
                      console.log("Setting type to:", val);
                      setForm((prev) => ({ ...prev, type: val }));
                    }}
                  >
                    <SelectTrigger className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600">
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
                  <Label htmlFor="brand" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Brand *
                  </Label>
                  <Input
                    id="brand"
                    name="brand"
                    placeholder="e.g., Toyota"
                    value={form.brand}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, brand: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="model" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Model *
                  </Label>
                  <Input
                    id="model"
                    name="model"
                    placeholder="e.g., Camry"
                    value={form.model}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, model: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="yearOfManufacture" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Year of Manufacture
                  </Label>
                  <Input
                    id="yearOfManufacture"
                    name="yearOfManufacture"
                    type="number"
                    placeholder="e.g., 2020"
                    value={form.yearOfManufacture}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, yearOfManufacture: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="status" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Status
                  </Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => setForm((prev) => ({ ...prev, status: val }))}
                  >
                    <SelectTrigger className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="under_maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="decommissioned">Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dates and Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 border-b border-yellow-300 pb-2">
                Dates & Documents
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="registrationDate" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Registration Date
                  </Label>
                  <Input
                    id="registrationDate"
                    name="registrationDate"
                    type="date"
                    value={form.registrationDate}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, registrationDate: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="fitnessCertificateExpiry" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Fitness Certificate Expiry
                  </Label>
                  <Input
                    id="fitnessCertificateExpiry"
                    name="fitnessCertificateExpiry"
                    type="date"
                    value={form.fitnessCertificateExpiry}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fitnessCertificateExpiry: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="insuranceExpiry" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Insurance Expiry
                  </Label>
                  <Input
                    id="insuranceExpiry"
                    name="insuranceExpiry"
                    type="date"
                    value={form.insuranceExpiry}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, insuranceExpiry: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="pollutionCertificateExpiry" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Pollution Certificate Expiry
                  </Label>
                  <Input
                    id="pollutionCertificateExpiry"
                    name="pollutionCertificateExpiry"
                    type="date"
                    value={form.pollutionCertificateExpiry}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, pollutionCertificateExpiry: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="vehicleInsuranceNo" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Vehicle Insurance Number
                  </Label>
                  <Input
                    id="vehicleInsuranceNo"
                    name="vehicleInsuranceNo"
                    placeholder="e.g., INS123456789"
                    value={form.vehicleInsuranceNo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, vehicleInsuranceNo: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>

                <div>
                  <Label htmlFor="fitnessNo" className="text-yellow-800 dark:text-yellow-200 font-medium">
                    Fitness Certificate Number
                  </Label>
                  <Input
                    id="fitnessNo"
                    name="fitnessNo"
                    placeholder="e.g., FC123456789"
                    value={form.fitnessNo}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, fitnessNo: e.target.value }))
                    }
                    className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* File Uploads */}
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 border-b border-yellow-300 pb-2">
              Certificate Images
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fitnessCertificateImage" className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Fitness Certificate Image
                </Label>
                <Input
                  id="fitnessCertificateImage"
                  name="fitnessCertificateImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('fitnessCertificateImage', e.target.files[0])}
                  className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="pollutionCertificateImage" className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Pollution Certificate Image
                </Label>
                <Input
                  id="pollutionCertificateImage"
                  name="pollutionCertificateImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('pollutionCertificateImage', e.target.files[0])}
                  className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="registrationCertificateImage" className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Registration Certificate Image
                </Label>
                <Input
                  id="registrationCertificateImage"
                  name="registrationCertificateImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('registrationCertificateImage', e.target.files[0])}
                  className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>

              <div>
                <Label htmlFor="insuranceImage" className="text-yellow-800 dark:text-yellow-200 font-medium">
                  Insurance Image
                </Label>
                <Input
                  id="insuranceImage"
                  name="insuranceImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange('insuranceImage', e.target.files[0])}
                  className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSubmit}
              className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
            >
              Add Vehicle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// AddMaintenanceForm component for vendor vehicles
const AddMaintenanceForm = ({ vehicle, vendorId, onSuccess, addMaintenance }) => {
  const [form, setForm] = useState({
    serviceDate: "",
    serviceType: "",
    cost: "",
    description: "",
    servicedBy: "",
  });

  const [billImage, setBillImage] = useState(null);

  const handleSubmit = async () => {
    if (!form.serviceDate || !form.serviceType || !form.description) {
      toast.error("Service Date, Type, and Description are required.");
      return;
    }

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add vendorId and vehicleId
      formData.append('vendorId', vendorId);
      formData.append('vehicleId', vehicle._id);
      
      // Add maintenance data
      Object.keys(form).forEach(key => {
        if (form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      // Add bill image if present
      if (billImage) {
        formData.append('vendorVehicleBillImage', billImage);
      }

      await addMaintenance({
        maintenance: formData,
      }).unwrap();

      toast.success("Maintenance record added successfully!");
      onSuccess();

      // Reset form
      setForm({
        serviceDate: "",
        serviceType: "",
        cost: "",
        description: "",
        servicedBy: "",
      });
      setBillImage(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to add maintenance record.");
      console.error("Failed to add maintenance record:", err);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950 dark:border-blue-700">
        <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-3">
          Vehicle: {vehicle?.vehicleNumber} - {vehicle?.brand} {vehicle?.model}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="serviceDate" className="text-blue-800 dark:text-blue-200 font-medium">
              Service Date *
            </Label>
            <Input
              id="serviceDate"
              name="serviceDate"
              type="date"
              value={form.serviceDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, serviceDate: e.target.value }))
              }
              className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <Label htmlFor="serviceType" className="text-blue-800 dark:text-blue-200 font-medium">
              Service Type *
            </Label>
            <Input
              id="serviceType"
              name="serviceType"
              placeholder="e.g., Oil Change, Brake Service"
              value={form.serviceType}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, serviceType: e.target.value }))
              }
              className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <Label htmlFor="cost" className="text-blue-800 dark:text-blue-200 font-medium">
              Cost (₹)
            </Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              placeholder="e.g., 1500"
              value={form.cost}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, cost: e.target.value }))
              }
              className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div>
            <Label htmlFor="servicedBy" className="text-blue-800 dark:text-blue-200 font-medium">
              Serviced By
            </Label>
            <Input
              id="servicedBy"
              name="servicedBy"
              placeholder="e.g., ABC Service Center"
              value={form.servicedBy}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, servicedBy: e.target.value }))
              }
              className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description" className="text-blue-800 dark:text-blue-200 font-medium">
              Description *
            </Label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the service performed..."
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              rows="3"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="billImage" className="text-blue-800 dark:text-blue-200 font-medium">
              Bill Image
            </Label>
            <Input
              id="billImage"
              name="billImage"
              type="file"
              accept="image/*"
              onChange={(e) => setBillImage(e.target.files[0])}
              className="mt-1 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={handleSubmit}
            className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          >
            Add Maintenance Record
          </Button>
        </div>
      </div>
    </div>
  );
};
