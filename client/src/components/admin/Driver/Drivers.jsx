import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Loader2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Box,
  EyeIcon,
  UserRound,
  Truck,
  Building2,
  MapPin,
} from "lucide-react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { GrPowerCycle } from "react-icons/gr";
import { Drawer } from "antd";
import { useSelector } from "react-redux";

import {
  useDeleteDriverMutation,
  useGetAllDriversQuery,
} from "@/features/api/authApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useDebounce } from "@/hooks/Debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

// 1. Add Dellcube color theme variables for easy reuse
const DELLCUBE_COLORS = {
  gold: '#FFD249',
  dark: '#202020',
  gray: '#828083',
};

// InfoCard and InfoRow components for Drawer, styled like Invoices.jsx
const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
  <div
    className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-gray-300/50 dark:hover:border-gray-600/50 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative flex items-center gap-3 mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
        <UserRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

const Drivers = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isSuperAdmin = user?.role === "superAdmin";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  // Update state defaults and query logic for 'all' value
  const [status, setStatus] = useState("all");
  const [companyId, setCompanyId] = useState(isBranchAdmin ? user?.company?._id : "all");
  const [branchId, setBranchId] = useState(isBranchAdmin ? user?.branch?._id : "all");
  const [driverType, setDriverType] = useState("all");
  const debouncedSearch = useDebounce(search, 500);
  const [branches, setBranches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [open, setOpen] = useState(false);

  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const { data: companyData } = useGetAllCompaniesQuery({});
  const { data, isLoading, refetch } = useGetAllDriversQuery({
    page,
    limit,
    search: debouncedSearch,
    status: status === "all" ? "" : status,
    company: isBranchAdmin ? user?.company?._id : (companyId === "all" ? "" : companyId),
    branch: isBranchAdmin ? user?.branch?._id : (branchId === "all" ? "" : branchId),
    driverType: driverType === "all" ? "" : driverType,
  });

  const [deleteDriver] = useDeleteDriverMutation();

  // Helper function to format driver type
  const formatDriverType = (driverType) => {
    if (!driverType) return 'N/A';
    return driverType.charAt(0).toUpperCase() + driverType.slice(1);
  };

  useEffect(() => {
    const fetchBranches = async () => {
      if (companyId && isSuperAdmin) {
        const res = await getBranchesByCompany(companyId);
        if (res?.data?.branches) setBranches(res.data.branches);
      }
    };
    fetchBranches();
  }, [companyId]);

  const handleDelete = async (id) => {
    const res = await deleteDriver(id);
    if (res?.data?.success) {
      toast.success("Driver deleted successfully");
      refetch();
    } else {
      toast.error(res?.error?.data?.message || "Failed to delete");
    }
  };

  const handleView = (driver) => {
    setSelectedDriver(driver);
    setOpen(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPage || 1)) {
      setPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const totalPages = data?.totalPage || 1;
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(page - 2, totalPages - 4));
    let end = Math.min(start + 4, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <section className=" min-h-[100vh] rounded-md">
      <div className="md:p-6 p-2">
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white">
            All Drivers
          </h2>
          <div className="flex gap-4 items-center flex-wrap">
            <Input
              placeholder="Search driver..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border rounded-md text-sm w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-[#FFD249] focus:ring-[#FFD249]"
            />
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-full bg-[#FFD249]/20 text-[#202020] hover:bg-[#FFD249]/40 px-4 py-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filter
              {showFilters ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
            <Button onClick={() => navigate("/admin/create-driver")}
              className="rounded-full bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90 font-semibold shadow-md px-4 py-2">
              Add Driver
            </Button>
            <Button className="p-2 rounded-full bg-[#FFD249]/20 text-[#FFD249] hover:bg-[#FFD249]/40" onClick={refetch}>
              <GrPowerCycle />
            </Button>
            {/* Limit dropdown outside filter panel, top right */}
            <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
              <SelectTrigger className="w-[80px] border-gray-300 dark:border-gray-700 focus:border-[#FFD249] focus:ring-[#FFD249]">
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
          </div>
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg shadow mb-4 p-4 border border-[#FFD249]/40 dark:border-[#FFD249]/30">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Driver Type:</span>
                <Select value={driverType} onValueChange={setDriverType}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="dellcube">Dellcube Driver</SelectItem>
                    <SelectItem value="vendor">Vendor Driver</SelectItem>
                    <SelectItem value="temporary">Temporary Driver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isSuperAdmin && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Company:</span>
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
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Branch:</span>
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
                        {branches.map((b) => (
                          <SelectItem key={b._id} value={b._id}>
                            {b.name}
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
                  setDriverType("all");
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
            
            {/* Active Filters Display */}
            {(status !== "all" || driverType !== "all" || companyId !== "all" || branchId !== "all") && (
              <div className="mt-4 pt-3 border-t border-[#FFD249]/30">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Active Filters:</span>
                  {status !== "all" && (
                    <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                      Status: {status === "true" ? "Active" : "Inactive"}
                    </span>
                  )}
                  {driverType !== "all" && (
                    <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                      Type: {formatDriverType(driverType)}
                    </span>
                  )}
                  {companyId !== "all" && companyData?.companies?.find(c => c._id === companyId) && (
                    <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                      Company: {companyData.companies.find(c => c._id === companyId)?.name}
                    </span>
                  )}
                  {branchId !== "all" && branches.find(b => b._id === branchId) && (
                    <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                      Branch: {branches.find(b => b._id === branchId)?.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drivers Table */}
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
          <table className="min-w-full text-sm">
            {/* Top thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Driver Type</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Aadhar</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">PAN</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Branch</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-6">
                    <Loader2 className="animate-spin mx-auto text-[#FFD249]" /> Loading...
                  </td>
                </tr>
              ) : data?.drivers?.length ? (
                data.drivers.map((driver, i) => (
                  <tr
                    key={driver._id}
                    className={
                      i % 2 === 0
                        ? "bg-white/60 dark:bg-gray-900/60"
                        : "bg-[#FFD249]/10 dark:bg-[#FFD249]/5" +
                          " hover:bg-[#FFD249]/20 dark:hover:bg-[#FFD249]/10 transition "
                    }
                  >
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">{limit * (page - 1) + (i + 1)}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-semibold">{driver.name}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{driver.mobile}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-mono text-xs">{formatDriverType(driver.driverType)}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-mono text-xs">{driver.aadharNumber || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-mono text-xs">{driver.panNumber || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{driver.company?.name || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{driver.branch?.name || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${driver.status ? 'bg-[#FFD249]/80 text-[#202020]' : 'bg-[#828083]/30 text-[#828083]'}`}>{driver.status ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="p-3 flex gap-2 items-center justify-center">
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60"
                        onClick={() => handleView(driver)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60"
                        onClick={() =>
                          navigate("/admin/update-driver", {
                            state: { driverId: driver._id },
                          })
                        }
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60"
                          >
                            <FaRegTrashCan />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Driver?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the driver and remove their data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(driver._id)}>
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
                  <td colSpan="10" className="text-center py-10 text-[#828083]">
                    <Truck className="w-8 h-8 mx-auto text-[#828083]" />
                    <p className="text-[#828083] font-medium">No Drivers Available</p>
                    <p className="text-sm text-[#828083]">Add a new driver to begin</p>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Bottom thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Mobile</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Driver Type</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Aadhar</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">PAN</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Branch</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Action</th>
              </tr>
            </thead>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-[#202020] dark:text-[#FFD249] text-center lg:text-left">
            Showing {data?.drivers?.length ? (data?.page - 1) * data?.limit + 1 : 0} to {Math.min(data?.page * data?.limit, data?.total || 0)} of <span className="font-medium">{data?.total || 0}</span> entries
          </div>
        </div>
      
                <Drawer
                  title={
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
                          <UserRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[180px]">
                            Driver Details
                          </h2>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                            {selectedDriver?.name}
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto">
                        <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium ${selectedDriver?.status ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>{selectedDriver?.status ? 'Active' : 'Inactive'}</span>
                      </div>
                    </div>
                  }
                  placement="right"
                  width={380}
                  onClose={() => {
                    setOpen(false);
                    setSelectedDriver(null);
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
                  {!selectedDriver ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                    </div>
                  ) : (
                    <div className="p-6 space-y-6 overflow-x-hidden">
                      <InfoCard icon={UserRound} title="Driver Information">
                        <InfoRow label="Name" value={selectedDriver.name} icon={UserRound} />
                        <InfoRow label="Status" value={selectedDriver.status ? 'Active' : 'Inactive'} icon={UserRound} />
                        <InfoRow label="Driver Type" value={selectedDriver.driverType ? selectedDriver.driverType.charAt(0).toUpperCase() + selectedDriver.driverType.slice(1) : 'N/A'} icon={Truck} />
                        <InfoRow label="Company" value={selectedDriver.company?.name} icon={Building2} />
                        <InfoRow label="Branch" value={selectedDriver.branch?.name} icon={MapPin} />
                        <InfoRow label="License Number" value={selectedDriver.licenseNumber} icon={Truck} />
                        <InfoRow label="Experience" value={selectedDriver.experienceYears ? `${selectedDriver.experienceYears} Years` : ''} icon={Truck} />
                      </InfoCard>

                      <InfoCard icon={UserRound} title="Identity Documents">
                        <InfoRow 
                          label="Aadhar Number" 
                          value={selectedDriver.aadharNumber} 
                          icon={UserRound} 
                        />
                        <InfoRow 
                          label="PAN Number" 
                          value={selectedDriver.panNumber} 
                          icon={UserRound} 
                        />
                      </InfoCard>

                      <InfoCard icon={Box} title="Bank Account Details">
                        <InfoRow 
                          label="Account Holder" 
                          value={selectedDriver.bankDetails?.accountHolderName} 
                          icon={UserRound} 
                        />
                        <InfoRow 
                          label="Bank Name" 
                          value={selectedDriver.bankDetails?.bankName} 
                          icon={Building2} 
                        />
                        <InfoRow 
                          label="Account Number" 
                          value={selectedDriver.bankDetails?.accountNumber} 
                          icon={UserRound} 
                        />
                        <InfoRow 
                          label="IFSC Code" 
                          value={selectedDriver.bankDetails?.ifscCode} 
                          icon={UserRound} 
                        />
                      </InfoCard>
                    </div>
                  )}
                </Drawer>
      
                {/* Pagination */}
                {data?.totalPage > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(page - 1)}
                          className={
                            page === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                      {getPageNumbers().map((num) => (
                        <PaginationItem key={num}>
                          <PaginationLink
                            onClick={() => handlePageChange(num)}
                            isActive={num === page}
                            className="cursor-pointer"
                          >
                            {num}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(page + 1)}
                          className={
                            page === data.totalPage
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
    </section>
  );
};

export default Drivers;
