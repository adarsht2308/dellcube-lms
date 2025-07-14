import React, { useEffect, useState } from "react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { GrPowerCycle } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetAllTransportModesQuery,
  useDeleteTransportModeMutation,
  useGetTransportModeByIdMutation,
} from "@/features/api/TransportMode/transportModeApi.js";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, EyeIcon, Truck, FileText, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Drawer } from "antd";
import { useDebounce } from "@/hooks/Debounce";

// Dellcube color theme constants
const DELLCUBE_COLORS = {
  gold: '#FFD249',
  dark: '#202020',
  gray: '#828083',
};

const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
  <div className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-gray-300/50 dark:hover:border-gray-600/50 ${className}`}>
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative flex items-center gap-3 mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
        <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
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

const TransportModes = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data, isLoading, refetch } = useGetAllTransportModesQuery({
    page: currentPage,
    limit,
    search: debouncedSearchQuery,
    status: "",
  });

  const [deleteTransportMode, { isSuccess, isError }] = useDeleteTransportModeMutation();
  const [open, setOpen] = useState(false);
  const [selectedTransportMode, setSelectedTransportMode] = useState(null);
  const [getTransportModeById, { isLoading: getTransportModeLoading }] = useGetTransportModeByIdMutation();

  const handleView = async (transportModeId) => {
    setOpen(true);
    try {
      const { data } = await getTransportModeById(transportModeId);
      if (data?.success) {
        setSelectedTransportMode(data.transportMode);
      }
    } catch (error) {
      console.error("Error fetching transport mode:", error);
    }
  };

  const handleDelete = async (id) => {
    await deleteTransportMode(id);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPage || 1)) {
      setCurrentPage(newPage);
    }
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const totalPages = data?.totalPage || 1;
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    let end = Math.min(start + 4, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Transport Mode Deleted Successfully");
      refetch();
    } else if (isError) {
      toast.error("Failed to delete transport mode");
    }
  }, [isSuccess, isError, refetch]);

  return (
    <section className=" min-h-screen">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">Total Transport Modes</p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">{data?.total || 0}</p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <Truck className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">Current Page</p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">{currentPage}</p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <FileText className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
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
                <Calendar className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>
        </div>
        {/* Controls Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">All Transport Modes</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transport mode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-[#202020] dark:text-[#FFD249] placeholder-[#828083] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD249]/50 focus:border-transparent backdrop-blur-sm"
                />
                <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#828083] dark:text-gray-400" />
              </div>
              <Select value={limit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[100px] bg-white/80 dark:bg-gray-700/80 border-gray-200/50 dark:border-gray-600/50">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15].map((n) => (
                    <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => navigate("/admin/create-transport-mode")}
                className="bg-[#FFD249] hover:bg-[#FFD249]/90 text-[#202020] font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Transport Mode
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                className="p-2 bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] dark:text-[#FFD249] border-[#FFD249]/30"
              >
                <GrPowerCycle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Transport Modes Table */}
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
          <table className="min-w-full text-sm">
            {/* Top thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Description</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Created At</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#FFD249]" />
                  </td>
                </tr>
              ) : data?.transportModes?.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-[#828083]">
                    <Truck className="w-8 h-8 mx-auto text-[#828083]" />
                    <p className="text-[#828083] font-medium">No Transport Modes Available</p>
                    <p className="text-sm text-[#828083]">Add a new transport mode to begin</p>
                  </td>
                </tr>
              ) : (
                data?.transportModes?.map((transportMode, index) => (
                  <tr
                    key={transportMode._id}
                    className={
                      index % 2 === 0
                        ? "bg-white/60 dark:bg-gray-900/60"
                        : "bg-[#FFD249]/10 dark:bg-[#FFD249]/5" +
                          " hover:bg-[#FFD249]/20 dark:hover:bg-[#FFD249]/10 transition "
                    }
                  >
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">{(currentPage - 1) * limit + index + 1}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-semibold">{transportMode.name}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] max-w-xs truncate">{transportMode.desc}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${transportMode.status ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>{transportMode.status ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{new Date(transportMode.createdAt).toLocaleDateString()}</td>
                    <td className="p-3 flex gap-2 items-center justify-center">
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() => handleView(transportMode._id)}
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() =>
                          navigate("/admin/update-transport-mode", {
                            state: { transportModeId: transportMode._id },
                          })
                        }
                        title="Edit Transport Mode"
                      >
                        <MdOutlineEdit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                            title="Delete Transport Mode"
                          >
                            <FaRegTrashCan className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Transport Mode</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{transportMode.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(transportMode._id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Bottom thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Description</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Created At</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-[#202020] dark:text-[#FFD249] text-center lg:text-left">
            Showing {data?.transportModes?.length ? (data?.page - 1) * data?.limit + 1 : 0} to {Math.min(data?.page * data?.limit, data?.total || 0)} of <span className="font-medium">{data?.total || 0}</span> entries
          </div>
        </div>
        {/* Pagination */}
        {data?.totalPage > 1 && (
          <div className="flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-[#FFD249]/10"
                    }
                  />
                </PaginationItem>
                {getPageNumbers().map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer hover:bg-[#FFD249]/10"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === data.totalPage
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer hover:bg-[#FFD249]/10"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
        {/* Drawer for viewing transport mode details remains unchanged */}
        <Drawer
          title="Transport Mode Details"
          placement="right"
          onClose={() => setOpen(false)}
          open={open}
          width={400}
        >
          {getTransportModeLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : selectedTransportMode ? (
            <div className="space-y-6">
              <InfoCard icon={Truck} title="Basic Information">
                <InfoRow label="Name" value={selectedTransportMode.name} icon={Truck} />
                <InfoRow label="Description" value={selectedTransportMode.desc} icon={FileText} />
                <InfoRow
                  label="Status"
                  value={selectedTransportMode.status ? "Active" : "Inactive"}
                  icon={selectedTransportMode.status ? CheckCircle : XCircle}
                />
              </InfoCard>

              <InfoCard icon={Calendar} title="Timestamps">
                <InfoRow
                  label="Created At"
                  value={new Date(selectedTransportMode.createdAt).toLocaleString()}
                  icon={Calendar}
                />
                <InfoRow
                  label="Updated At"
                  value={new Date(selectedTransportMode.updatedAt).toLocaleString()}
                  icon={Calendar}
                />
              </InfoCard>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No transport mode details available
            </div>
          )}
        </Drawer>
      </div>
    </section>
  );
};

export default TransportModes; 