import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Box,
  EyeIcon,
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Car,
  Building2,
  MapPin,
  Calendar,
  ImageIcon,
  Hash,
} from "lucide-react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { GrPowerCycle } from "react-icons/gr";
import { useSelector } from "react-redux";
import {
  useAddMaintenanceMutation,
  useDeleteVehicleMutation,
  useGetAllVehiclesQuery,
  useGetVehicleByIdMutation,
} from "@/features/api/Vehicle/vehicleApi";
import { useGetAllVendorVehiclesQuery } from "@/features/api/Vendor/vendorApi";
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
import { Drawer } from "antd";
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
import { useDebounce } from "@/hooks/Debounce";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorBoundary from "@/components/ErrorBoundary";
import { BASE_URL } from "@/utils/BaseUrl.jsx";
import { getTokenData } from "@/utils/getTokenData";

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
      {Icon && (
        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      )}
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">
        {label}:
      </span>
    </div>
    <div className="flex-shrink-0 ml-3">
      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
        {value || <span className="text-gray-400 italic">N/A</span>}
      </span>
    </div>
  </div>
);

// Dellcube color theme constants
const DELLCUBE_COLORS = {
  gold: "#FFD249",
  dark: "#202020",
  gray: "#828083",
};

const Vehicles = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isSuperAdmin = user?.role === "superAdmin";
  const isVendor = user?.role === "vendor";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  // Update state defaults and query logic for 'all' value
  const [status, setStatus] = useState("all");
  
  // Get companyId and branchId from token (current session)
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
  
  // Helper functions to get company/branch ID - prioritize token (current session)
  const getUserCompanyId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenCompanyId) return tokenCompanyId;
    // Fallback to user profile data
    if (Array.isArray(user?.company) && user.company.length > 0) {
      return String(user.company[0]._id || user.company[0]);
    }
    return user?.company?._id ? String(user.company._id) : "";
  };
  
  const getUserBranchId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenBranchId) return tokenBranchId;
    // Fallback to user profile data
    if (Array.isArray(user?.branch) && user.branch.length > 0) {
      return String(user.branch[0]._id || user.branch[0]);
    }
    return user?.branch?._id ? String(user.branch._id) : "";
  };
  
  const [companyId, setCompanyId] = useState(
    isBranchAdmin ? getUserCompanyId() : "all"
  );
  const [branchId, setBranchId] = useState(
    isBranchAdmin ? getUserBranchId() : "all"
  );
  const [open, setOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const [branches, setBranches] = useState([]);
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const { data: companyData } = useGetAllCompaniesQuery({});

  useEffect(() => {
    const fetchBranches = async () => {
      if (companyId && companyId !== "all" && isSuperAdmin) {
        try {
          const res = await getBranchesByCompany(companyId);
          if (res?.data?.branches) {
            setBranches(res.data.branches);
          }
        } catch (error) {
          console.error("Failed to fetch branches by company", error);
        }
      }
    };
    fetchBranches();
  }, [companyId, isSuperAdmin, getBranchesByCompany]);

  const { data, isLoading, refetch } = useGetAllVehiclesQuery({
    page,
    limit,
    search: debouncedSearch,
    status: status === "all" ? "" : status,
    companyId: isBranchAdmin
      ? getUserCompanyId()
      : companyId === "all"
      ? ""
      : companyId,
    branchId: isBranchAdmin
      ? getUserBranchId()
      : branchId === "all"
      ? ""
      : branchId,
    // If vendor, backend should filter by creator/vendor user id
    vendorId: isVendor ? user?._id : undefined,
  });

  // Fetch vendor vehicles for superadmin (shows all vendor vehicles regardless of branch)
  // Vendors should use their own vendor-vehicles page, not see vendor vehicles here
  const { data: vendorVehiclesData, isLoading: isLoadingVendorVehicles } = useGetAllVendorVehiclesQuery(
    {
      companyId: companyId === "all" ? "" : companyId,
      branchId: branchId === "all" ? "" : branchId,
      search: debouncedSearch,
      status: status === "all" ? "" : status,
    },
    { skip: !isSuperAdmin } // Only superadmin sees vendor vehicles in main vehicles page
  );

  // Combine Dellcube vehicles and vendor vehicles for superadmin
  const allVehicles = React.useMemo(() => {
    if (!isSuperAdmin) {
      return data?.vehicles || [];
    }
    
    const dellcubeVehicles = (data?.vehicles || []).map(v => ({ ...v, ownerType: "Dellcube" }));
    const vendorVehicles = (vendorVehiclesData?.vehicles || []).map(v => ({ ...v, ownerType: "Vendor" }));
    
    // Combine and sort by vehicle number
    return [...dellcubeVehicles, ...vendorVehicles].sort((a, b) => {
      const aNum = a.vehicleNumber || "";
      const bNum = b.vehicleNumber || "";
      return aNum.localeCompare(bNum);
    });
  }, [data?.vehicles, vendorVehiclesData?.vehicles, isSuperAdmin]);

  const combinedIsLoading = isLoading || (isSuperAdmin && isLoadingVendorVehicles);
  const combinedTotal = isSuperAdmin 
    ? (data?.total || 0) + (vendorVehiclesData?.total || 0)
    : data?.total || 0;

  const [deleteVehicle, { isSuccess, isError }] = useDeleteVehicleMutation();
  const [getVehicleById] = useGetVehicleByIdMutation();

  const [openMaintenance, setOpenMaintenance] = useState(false);
  const [targetVehicle, setTargetVehicle] = useState(null);

  const [addMaintenance] = useAddMaintenanceMutation();

  const handleOpenMaintenance = (vehicleId) => {
    setTargetVehicle(vehicleId);
    setOpenMaintenance(true);
  };

  const handleView = async (id) => {
    setOpen(true);
    try {
      const { data } = await getVehicleById(id);

      if (data?.success) setSelectedVehicle(data.vehicle);
    } catch (err) {
      console.error("Error fetching vehicle:", err);
    }
  };

  const handleDelete = async (id) => {
    await deleteVehicle(id);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Vehicle deleted successfully");
      refetch();
    } else if (isError) {
      toast.error("Failed to delete vehicle");
    }
  }, [isSuccess, isError, refetch]);

  const handlePageChange = (newPage) => {
    const totalPages = isSuperAdmin 
      ? Math.ceil(combinedTotal / limit)
      : (data?.totalPages || 1);
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  const getPageNumbers = () => {
    const totalPages = isSuperAdmin 
      ? Math.ceil(combinedTotal / limit)
      : (data?.totalPages || 1);
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
      case "under_maintenance":
        return "bg-blue-100 text-blue-600";
      case "decommissioned":
        return "bg-gray-200 text-gray-700 line-through";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const [openCertDialog, setOpenCertDialog] = useState({
    type: null,
    url: "",
  });

  // Ensure BASE_URL is available
  // eslint-disable-next-line @typescript-eslint/no-var-requires

  // Check for expiring documents when data loads
  useEffect(() => {
    if (data?.vehicles) {
      try {
        // Check if there are any expiring documents and show a simple toast
        const hasExpiringDocs = data.vehicles.some((vehicle) => {
          if (
            !vehicle.fitnessCertificateExpiry &&
            !vehicle.insuranceExpiry &&
            !vehicle.pollutionCertificateExpiry
          ) {
            return false;
          }

          const today = new Date();
          const thirtyDaysFromNow = new Date(
            today.getTime() + 30 * 24 * 60 * 60 * 1000
          );

          return [
            vehicle.fitnessCertificateExpiry,
            vehicle.insuranceExpiry,
            vehicle.pollutionCertificateExpiry,
          ].some((date) => {
            if (!date) return false;
            const expiryDate = new Date(date);
            return expiryDate <= thirtyDaysFromNow;
          });
        });

        if (hasExpiringDocs) {
          toast(
            "⚠️ Some vehicle documents are expiring soon. Check the expiry status column for details.",
            {
              duration: 8000,
              icon: "⚠️",
            }
          );
        }
      } catch (error) {
        console.error("Error checking for expiring documents:", error);
        // Don't show error toast to user, just log it
      }
    }
  }, [data?.vehicles]);

  // Helper function to get expiry status for display
  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { status: "none", color: "text-gray-400" };

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return {
        status: "expired",
        color: "text-red-600",
        days: Math.abs(daysUntilExpiry),
      };
    } else if (daysUntilExpiry <= 30) {
      return {
        status: "expiring",
        color: "text-orange-600",
        days: daysUntilExpiry,
      };
    } else {
      return {
        status: "valid",
        color: "text-green-600",
        days: daysUntilExpiry,
      };
    }
  };

  return (
    <ErrorBoundary>
      <section className=" min-h-screen">
        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* Header with Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#828083] dark:text-gray-400">
                    Total Vehicles
                  </p>
                  <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                    {combinedTotal || 0}
                  </p>
                </div>
                <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                  <Car className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#828083] dark:text-gray-400">
                    Current Page
                  </p>
                  <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                    {page}
                  </p>
                </div>
                <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                  <Building2 className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#828083] dark:text-gray-400">
                    Items Per Page
                  </p>
                  <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                    {limit}
                  </p>
                </div>
                <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                  <Calendar className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
                </div>
              </div>
            </div>
          </div>
          {/* Controls Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                  All Vehicles
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] dark:text-[#FFD249] border-[#FFD249]/30"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {showFilters ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search vehicles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 px-4 py-2 pl-10 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-[#202020] dark:text-[#FFD249] placeholder-[#828083] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD249]/50 focus:border-transparent backdrop-blur-sm"
                  />
                  <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#828083] dark:text-gray-400" />
                </div>
                <Select value={limit.toString()} onValueChange={setLimit}>
                  <SelectTrigger className="w-[100px] bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50">
                    <SelectValue placeholder="Limit" />
                  </SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15].map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n}
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
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      toast.loading("Checking for expiring documents...", {
                        duration: 2000,
                      });

                      // Call the scheduler API to trigger expiry check
                      // BASE_URL already includes /api
                      const base = BASE_URL.endsWith("/")
                        ? BASE_URL.slice(0, -1)
                        : BASE_URL;
                      const response = await fetch(
                        `${base}/vehicles/trigger-scheduler`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          credentials: "include",
                        }
                      );

                      if (!response.ok) {
                        throw new Error(
                          `HTTP error! status: ${response.status}`
                        );
                      }

                      const result = await response.json();

                      if (result.success) {
                        toast.success(
                          `Expiry check completed: ${
                            result.result?.message || "Success"
                          }`,
                          { duration: 5000 }
                        );
                        // Refresh the vehicle data
                        refetch();
                      } else {
                        toast.error(
                          `Expiry check failed: ${
                            result.message || "Unknown error"
                          }`
                        );
                      }
                    } catch (error) {
                      console.error("Error checking expiry:", error);
                      toast.error(`Failed to check expiry: ${error.message}`);
                    }
                  }}
                  className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-300"
                  title="Check for expiring documents and send email notifications"
                >
                  📧 Check Expiry
                </Button>
                <Button
                  onClick={() => navigate("/admin/create-vehicle")}
                  className="bg-[#FFD249] hover:bg-[#FFD249]/90 text-[#202020] font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Add Vehicle
                </Button>
              </div>
            </div>
            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-6 p-4 bg-gray-50/80 dark:bg-gray-700/80 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Status:
                    </span>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="under_maintenance">
                          Under Maintenance
                        </SelectItem>
                        <SelectItem value="decommissioned">
                          Decommissioned
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isSuperAdmin && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Company:
                        </span>
                        <Select
                          value={companyId}
                          onValueChange={(val) => {
                            setCompanyId(val);
                            setBranchId("all");
                          }}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Companies" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Companies</SelectItem>
                            {companyData?.companies?.map((comp) => (
                              <SelectItem key={comp._id} value={comp._id}>
                                {comp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Branch:
                        </span>
                        <Select
                          value={branchId}
                          onValueChange={setBranchId}
                          disabled={companyId === "all"}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="All Branches" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branches.map((branch) => (
                              <SelectItem key={branch._id} value={branch._id}>
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStatus("all");
                      setCompanyId("all");
                      setBranchId("all");
                    }}
                    className="text-xs"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
          {/* Vehicle Table */}
          <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
            <table className="min-w-[1100px] w-full text-sm">
              {/* Top thead */}
              <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Vehicle No
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Cargo Type
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Expiry Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-center">
                {combinedIsLoading ? (
                  <tr>
                    <td colSpan="9" className="text-center py-6">
                      <Loader2 className="animate-spin mx-auto text-[#FFD249]" />{" "}
                      Loading...
                    </td>
                  </tr>
                ) : allVehicles?.length ? (
                  allVehicles.map((veh, i) => (
                    <tr
                      key={veh._id}
                      className={
                        i % 2 === 0
                          ? "bg-white/60 dark:bg-gray-900/60"
                          : "bg-[#FFD249]/10 dark:bg-[#FFD249]/5" +
                            " hover:bg-[#FFD249]/20 dark:hover:bg-[#FFD249]/10 transition "
                      }
                    >
                      <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">
                        {limit * (page - 1) + (i + 1)}
                      </td>
                      <td className="p-3 text-[#202020] dark:text-[#FFD249] font-semibold">
                        <div className="flex items-center gap-2">
                          {veh.vehicleNumber}
                          {isSuperAdmin && veh.ownerType === "Vendor" && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full font-medium">
                              Vendor
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-[#202020] dark:text-[#FFD249]">
                        {veh.type}
                      </td>
                      <td className="p-3 text-[#202020] dark:text-[#FFD249]">
                        {veh.cargoType || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col gap-1">
                          {veh.fitnessCertificateExpiry && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                getExpiryStatus(veh.fitnessCertificateExpiry)
                                  .color
                              }`}
                            >
                              Fitness:{" "}
                              {getExpiryStatus(veh.fitnessCertificateExpiry)
                                .status === "expired"
                                ? "EXPIRED"
                                : getExpiryStatus(veh.fitnessCertificateExpiry)
                                    .status === "expiring"
                                ? `${
                                    getExpiryStatus(
                                      veh.fitnessCertificateExpiry
                                    ).days
                                  }d`
                                : "Valid"}
                            </span>
                          )}
                          {veh.insuranceExpiry && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                getExpiryStatus(veh.insuranceExpiry).color
                              }`}
                            >
                              Insurance:{" "}
                              {getExpiryStatus(veh.insuranceExpiry).status ===
                              "expired"
                                ? "EXPIRED"
                                : getExpiryStatus(veh.insuranceExpiry)
                                    .status === "expiring"
                                ? `${
                                    getExpiryStatus(veh.insuranceExpiry).days
                                  }d`
                                : "Valid"}
                            </span>
                          )}
                          {veh.pollutionCertificateExpiry && (
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                getExpiryStatus(veh.pollutionCertificateExpiry)
                                  .color
                              }`}
                            >
                              Pollution:{" "}
                              {getExpiryStatus(veh.pollutionCertificateExpiry)
                                .status === "expired"
                                ? "EXPIRED"
                                : getExpiryStatus(
                                    veh.pollutionCertificateExpiry
                                  ).status === "expiring"
                                ? `${
                                    getExpiryStatus(
                                      veh.pollutionCertificateExpiry
                                    ).days
                                  }d`
                                : "Valid"}
                            </span>
                          )}
                          {!veh.fitnessCertificateExpiry &&
                            !veh.insuranceExpiry &&
                            !veh.pollutionCertificateExpiry && (
                              <span className="text-xs text-gray-400">
                                No expiry dates
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="p-3 text-[#202020] dark:text-[#FFD249]">
                        {veh.ownerType === "Vendor" && veh.vendor ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                              {veh.vendor.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {veh.company?.name || "N/A"}
                            </span>
                          </div>
                        ) : (
                          veh.company?.name || <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-[#202020] dark:text-[#FFD249]">
                        {veh.branch?.name || (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${renderStatusBadge(
                            veh.status
                          )}`}
                        >
                          {veh.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-2 items-center justify-center">
                        <Button
                          className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                          onClick={() => handleView(veh._id)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        <Button
                          className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                          onClick={() => {
                            // If it's a vendor vehicle, redirect to vendor-vehicles page
                            // Otherwise, use the regular update-vehicle route
                            if (veh.ownerType === "Vendor" && isVendor) {
                              navigate("/admin/vendor-vehicles");
                              toast.info("Please edit vendor vehicles from the Vendor Vehicles page");
                            } else {
                              navigate("/admin/update-vehicle", {
                                state: { vehicleId: veh._id },
                              });
                            }
                          }}
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </Button>
                        <Button
                          className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                          onClick={() => handleOpenMaintenance(veh._id)}
                        >
                          + Maint
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]">
                              <FaRegTrashCan />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Vehicle?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(veh._id)}
                              >
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
                    <td
                      colSpan="11"
                      className="text-center py-10 text-[#828083]"
                    >
                      <Box className="w-8 h-8 mx-auto text-[#828083]" />
                      <p className="text-[#828083] font-medium">
                        No Vehicles Available
                      </p>
                      <p className="text-sm text-[#828083]">
                        Add a new vehicle to begin
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
              {/* Bottom thead */}
              <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    No
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Vehicle No
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Cargo Type
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Expiry Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Branch
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
            </table>
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-[#202020] dark:text-[#FFD249] text-center lg:text-left">
              Showing{" "}
              {allVehicles?.length ? (page - 1) * limit + 1 : 0}{" "}
              to {Math.min(page * limit, combinedTotal || 0)} of{" "}
              <span className="font-medium">{combinedTotal || 0}</span> entries
            </div>
          </div>
          {/* Pagination */}
          {((isSuperAdmin ? Math.ceil(combinedTotal / limit) : data?.totalPages) || 0) > 1 && (
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
                        page === (isSuperAdmin ? Math.ceil(combinedTotal / limit) : data?.totalPages || 1)
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer hover:bg-[#FFD249]/10"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Vehicle Details Drawer */}
          <Drawer
            title={
              <div className="flex items-center gap-4 py-2">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-blue-200 shadow">
                  <Car className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[160px]">
                    {selectedVehicle?.vehicleNumber || "Vehicle Details"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                    {selectedVehicle?.type}
                  </p>
                </div>
                <div className="ml-auto">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium ${renderStatusBadge(
                      selectedVehicle?.status
                    )}`}
                  >
                    {selectedVehicle?.status}
                  </span>
                </div>
              </div>
            }
            placement="right"
            width={480}
            onClose={() => {
              setOpen(false);
              setSelectedVehicle(null);
            }}
            open={open}
            mask={true}
            maskClosable={true}
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
            {!selectedVehicle ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="p-6 space-y-6 overflow-x-hidden">
                <InfoCard icon={Car} title="Basic Vehicle Information">
                  <InfoRow
                    label="Vehicle Number"
                    value={selectedVehicle.vehicleNumber}
                    icon={Car}
                  />
                  <InfoRow
                    label="Type"
                    value={selectedVehicle.type}
                    icon={Car}
                  />
                  <InfoRow
                    label="Cargo Type"
                    value={selectedVehicle.cargoType || "N/A"}
                    icon={Car}
                  />
                  <InfoRow
                    label="Status"
                    value={selectedVehicle.status}
                    icon={Car}
                  />
                  <InfoRow
                    label="Company"
                    value={selectedVehicle.company?.name}
                    icon={Building2}
                  />
                  <InfoRow
                    label="Branch"
                    value={selectedVehicle.branch?.name}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Current Driver"
                    value={
                      selectedVehicle.currentDriver?.name || "Not Assigned"
                    }
                    icon={Car}
                  />
                  <InfoRow
                    label="Vehicle Insurance No"
                    value={selectedVehicle.vehicleInsuranceNo || "N/A"}
                    icon={Hash}
                  />
                  <InfoRow
                    label="Fitness No"
                    value={selectedVehicle.fitnessNo || "N/A"}
                    icon={Hash}
                  />
                </InfoCard>

                <InfoCard icon={Car} title="Vehicle Specifications">
                  <InfoRow
                    label="Brand"
                    value={selectedVehicle.brand || "N/A"}
                    icon={Car}
                  />
                  <InfoRow
                    label="Model"
                    value={selectedVehicle.model || "N/A"}
                    icon={Car}
                  />
                  <InfoRow
                    label="Year of Manufacture"
                    value={selectedVehicle.yearOfManufacture || "N/A"}
                    icon={Calendar}
                  />
                  <InfoRow
                    label="Registration Date"
                    value={
                      selectedVehicle.registrationDate
                        ? new Date(
                            selectedVehicle.registrationDate
                          ).toLocaleDateString()
                        : "N/A"
                    }
                    icon={Calendar}
                  />
                </InfoCard>

                <InfoCard icon={ImageIcon} title="Fitness Certificate">
                  <InfoRow
                    label="Fitness Certificate Expiry"
                    value={
                      selectedVehicle.fitnessCertificateExpiry
                        ? new Date(
                            selectedVehicle.fitnessCertificateExpiry
                          ).toLocaleDateString()
                        : "N/A"
                    }
                    icon={Calendar}
                  />
                  {selectedVehicle.fitnessCertificateImage && (
                    <InfoRow
                      label="Certificate Image"
                      value="Available"
                      icon={ImageIcon}
                    />
                  )}
                </InfoCard>

                <InfoCard icon={ImageIcon} title="Insurance Details">
                  <InfoRow
                    label="Insurance Expiry"
                    value={
                      selectedVehicle.insuranceExpiry
                        ? new Date(
                            selectedVehicle.insuranceExpiry
                          ).toLocaleDateString()
                        : "N/A"
                    }
                    icon={Calendar}
                  />
                  {selectedVehicle.insuranceImage && (
                    <InfoRow
                      label="Insurance Image"
                      value="Available"
                      icon={ImageIcon}
                    />
                  )}
                </InfoCard>

                <InfoCard icon={ImageIcon} title="Pollution Certificate">
                  <InfoRow
                    label="Pollution Certificate Expiry"
                    value={
                      selectedVehicle.pollutionCertificateExpiry
                        ? new Date(
                            selectedVehicle.pollutionCertificateExpiry
                          ).toLocaleDateString()
                        : "N/A"
                    }
                    icon={Calendar}
                  />
                  {selectedVehicle.pollutionCertificateImage && (
                    <InfoRow
                      label="Certificate Image"
                      value="Available"
                      icon={ImageIcon}
                    />
                  )}
                </InfoCard>

                <InfoCard icon={ImageIcon} title="Registration Certificate">
                  {selectedVehicle.registrationCertificateImage && (
                    <InfoRow
                      label="Registration Certificate Image"
                      value="Available"
                      icon={ImageIcon}
                    />
                  )}
                </InfoCard>

                {/* Additional fields that might exist in the database */}
                {selectedVehicle.registrationNumber && (
                  <InfoCard icon={ImageIcon} title="Registration Details">
                    <InfoRow
                      label="Registration Number"
                      value={selectedVehicle.registrationNumber}
                      icon={ImageIcon}
                    />
                    {selectedVehicle.registrationExpiry && (
                      <InfoRow
                        label="Registration Expiry"
                        value={new Date(
                          selectedVehicle.registrationExpiry
                        ).toLocaleDateString()}
                        icon={Calendar}
                      />
                    )}
                  </InfoCard>
                )}

                {selectedVehicle.insuranceNumber && (
                  <InfoCard icon={ImageIcon} title="Insurance Details">
                    <InfoRow
                      label="Insurance Number"
                      value={selectedVehicle.insuranceNumber}
                      icon={ImageIcon}
                    />
                    {selectedVehicle.insuranceExpiry && (
                      <InfoRow
                        label="Insurance Expiry"
                        value={new Date(
                          selectedVehicle.insuranceExpiry
                        ).toLocaleDateString()}
                        icon={Calendar}
                      />
                    )}
                  </InfoCard>
                )}

                {selectedVehicle.fitnessNumber && (
                  <InfoCard icon={ImageIcon} title="Fitness Details">
                    <InfoRow
                      label="Fitness Number"
                      value={selectedVehicle.fitnessNumber}
                      icon={ImageIcon}
                    />
                    {selectedVehicle.fitnessExpiry && (
                      <InfoRow
                        label="Fitness Expiry"
                        value={new Date(
                          selectedVehicle.fitnessExpiry
                        ).toLocaleDateString()}
                        icon={Calendar}
                      />
                    )}
                  </InfoCard>
                )}

                {selectedVehicle.permitNumber && (
                  <InfoCard icon={ImageIcon} title="Permit Details">
                    <InfoRow
                      label="Permit Number"
                      value={selectedVehicle.permitNumber}
                      icon={ImageIcon}
                    />
                    {selectedVehicle.permitExpiry && (
                      <InfoRow
                        label="Permit Expiry"
                        value={new Date(
                          selectedVehicle.permitExpiry
                        ).toLocaleDateString()}
                        icon={Calendar}
                      />
                    )}
                  </InfoCard>
                )}

                {selectedVehicle.pucNumber && (
                  <InfoCard icon={ImageIcon} title="PUC Details">
                    <InfoRow
                      label="PUC Number"
                      value={selectedVehicle.pucNumber}
                      icon={ImageIcon}
                    />
                    {selectedVehicle.pucExpiry && (
                      <InfoRow
                        label="PUC Expiry"
                        value={new Date(
                          selectedVehicle.pucExpiry
                        ).toLocaleDateString()}
                        icon={Calendar}
                      />
                    )}
                  </InfoCard>
                )}

                {/* Maintenance History */}
                {selectedVehicle.maintenanceHistory &&
                  selectedVehicle.maintenanceHistory.length > 0 && (
                    <InfoCard icon={Car} title="Recent Maintenance">
                      {selectedVehicle.maintenanceHistory
                        .slice(0, 3)
                        .map((maintenance, index) => (
                          <div
                            key={index}
                            className="border-l-2 border-blue-200 pl-3 mb-2"
                          >
                            <InfoRow
                              label="Service Date"
                              value={new Date(
                                maintenance.serviceDate
                              ).toLocaleDateString()}
                              icon={Calendar}
                            />
                            <InfoRow
                              label="Service Type"
                              value={maintenance.serviceType}
                              icon={Car}
                            />
                            <InfoRow
                              label="Cost"
                              value={`₹${maintenance.cost}`}
                              icon={Car}
                            />
                          </div>
                        ))}
                    </InfoCard>
                  )}
                {selectedVehicle && (
                  <Button
                    className="w-full mt-4 bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-semibold py-2 px-4 rounded-lg shadow border border-[#FFD249]"
                    onClick={() =>
                      navigate(`/admin/vehicles/${selectedVehicle._id}`)
                    }
                  >
                    View Detail Page
                  </Button>
                )}
              </div>
            )}
          </Drawer>

          {/* Add Maintenance Dialog */}
          <AddMaintenanceDialog
            open={openMaintenance}
            onClose={() => setOpenMaintenance(false)}
            vehicleId={targetVehicle}
          />
        </div>
      </section>
    </ErrorBoundary>
  );
};

export default Vehicles;

// AddMaintenanceDialog component remains the same, but include dark mode styling
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const AddMaintenanceDialog = ({ open, onClose, vehicleId }) => {
  const [form, setForm] = useState({
    serviceDate: "",
    serviceType: "",
    cost: "",
    description: "",
    servicedBy: "",
    billImage: null,
  });

  const [billPreview, setBillPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addMaintenance] = useAddMaintenanceMutation();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, billImage: file });
      setBillPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) return;

    // Validate required fields
    if (
      !form.serviceDate ||
      !form.serviceType ||
      !form.cost ||
      !form.description ||
      !form.servicedBy
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create maintenance data object
      const maintenanceData = {
        serviceDate: form.serviceDate,
        serviceType: form.serviceType,
        cost: parseFloat(form.cost),
        description: form.description,
        servicedBy: form.servicedBy,
      };

      // If there's a bill image, use FormData for file upload
      if (form.billImage) {
        const formData = new FormData();
        formData.append("vehicleId", vehicleId);
        formData.append("maintenance", JSON.stringify(maintenanceData));
        formData.append("billImage", form.billImage);

        console.log("=== Sending FormData ===");
        console.log("vehicleId:", vehicleId);
        console.log("maintenance:", maintenanceData);
        console.log("billImage:", form.billImage);
        console.log("FormData entries:");
        for (let [key, value] of formData.entries()) {
          console.log(key, ":", value);
        }

        // Use the RTK Query mutation with FormData
        await addMaintenance(formData);
      } else {
        // No file, send JSON data directly
        console.log("=== Sending JSON ===");
        console.log("vehicleId:", vehicleId);
        console.log("maintenance:", maintenanceData);

        await addMaintenance({
          vehicleId,
          maintenance: maintenanceData,
        });
      }

      toast.success("Maintenance record added successfully");

      // Close dialog and reset form
      onClose();
      setForm({
        serviceDate: "",
        serviceType: "",
        cost: "",
        description: "",
        servicedBy: "",
        billImage: null,
      });
      setBillPreview(null);
    } catch (error) {
      console.error("Error submitting maintenance:", error);
      toast.error(
        `Failed to submit maintenance: ${
          error?.data?.message || error.message || "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="dark:bg-gray-800 dark:text-white">
        {" "}
        {/* Added dark mode class */}
        <DialogHeader>
          <DialogTitle className="dark:text-white">Add Maintenance</DialogTitle>{" "}
          {/* Added dark mode class */}
        </DialogHeader>
        <div className="grid gap-2">
          <Input
            type="date"
            name="serviceDate"
            onChange={handleChange}
            value={form.serviceDate}
            required
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <Input
            name="serviceType"
            placeholder="Service Type *"
            onChange={handleChange}
            value={form.serviceType}
            required
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <Input
            name="cost"
            type="number"
            placeholder="Cost *"
            onChange={handleChange}
            value={form.cost}
            required
            min="0"
            step="0.01"
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <Input
            name="servicedBy"
            placeholder="Serviced By *"
            onChange={handleChange}
            value={form.servicedBy}
            required
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
          <Input
            name="description"
            placeholder="Description *"
            onChange={handleChange}
            value={form.description}
            required
            className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />

          {/* Bill Upload Section */}
          <div>
            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Bill Image
            </Label>
            <Input
              type="file"
              name="billImage"
              accept="image/*"
              onChange={handleFileChange}
              className="dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
            {billPreview && (
              <div className="mt-2">
                <img
                  src={billPreview}
                  alt="Bill Preview"
                  className="w-32 h-24 object-contain rounded border"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setForm({ ...form, billImage: null });
                    setBillPreview(null);
                  }}
                  className="mt-2 text-xs"
                >
                  Remove
                </Button>
              </div>
            )}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Maintenance"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
