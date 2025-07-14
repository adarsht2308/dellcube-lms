import React, { useEffect, useState } from "react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { GrPowerCycle } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetAllLocalitiesQuery,
  useDeleteLocalityMutation,
  useGetLocalityByIdMutation,
} from "@/features/api/Region/LocalityApi.js";
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
import { Loader2, Globe2, EyeIcon, MapPin } from "lucide-react";
import { Drawer } from "antd";
import { useDebounce } from "@/hooks/Debounce";

// 1. Add Dellcube color theme variables for easy reuse
const DELLCUBE_COLORS = {
  gold: '#FFD249',
  dark: '#202020',
  gray: '#828083',
};

// InfoCard and InfoRow components for Drawer, styled like Companies.jsx
const InfoCard = ({ icon: Icon, title, children, className = "" }) => (
  <div
    className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-gray-300/50 dark:hover:border-gray-600/50 ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative flex items-center gap-3 mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
        {Icon && <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
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

const Localities = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data, isLoading, refetch } = useGetAllLocalitiesQuery({
    page: currentPage,
    limit,
    search: debouncedSearchQuery,
  });

  const [deleteLocality, { isSuccess, isError }] = useDeleteLocalityMutation();
  const [getLocalityById] = useGetLocalityByIdMutation();
  const [open, setOpen] = useState(false);
  const [selectedLocality, setSelectedLocality] = useState(null);

  const handleViewLocality = async (id) => {
    setOpen(true);
    try {
      const { data } = await getLocalityById(id);
      if (data?.success) setSelectedLocality(data.data);
    } catch (error) {
      console.error("Error fetching locality:", error);
    }
  };

  const handleDelete = async (id) => {
    await deleteLocality(id);
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
      toast.success("Locality Deleted Successfully");
      refetch();
    } else if (isError) {
      toast.error("Failed to delete locality");
    }
  }, [isSuccess, isError]);

  return (
    <section className=" min-h-[100vh] rounded-md">
      <div className="md:p-6 p-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white">
            All Localities
          </h2>
          <div className="flex gap-4 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border rounded-md text-sm w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-[#FFD249] focus:ring-[#FFD249]"
            />
            <Button onClick={() => navigate("/admin/create-locality")}
              className="rounded-full bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90 font-semibold shadow-md px-4 py-2">
              Add Locality
            </Button>
            <Button className="p-2 rounded-full bg-[#FFD249]/20 text-[#FFD249] hover:bg-[#FFD249]/40" onClick={() => refetch()}>
              <GrPowerCycle />
            </Button>
            {/* Limit dropdown outside filter panel, top right */}
            <Select value={limit.toString()} onValueChange={handleLimitChange}>
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
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
          <table className="min-w-full text-sm">
            {/* Top thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Locality</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">City</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-6">
                    <Loader2 className="animate-spin mx-auto text-[#FFD249]" /> Loading...
                  </td>
                </tr>
              ) : data?.data?.length ? (
                data.data.map((locality, i) => (
                  <tr
                    key={locality._id}
                    className={
                      i % 2 === 0
                        ? "bg-white/60 dark:bg-gray-900/60"
                        : "bg-[#FFD249]/10 dark:bg-[#FFD249]/5" +
                          " hover:bg-[#FFD249]/20 dark:hover:bg-[#FFD249]/10 transition "
                    }
                  >
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">{limit * (currentPage - 1) + (i + 1)}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{locality.name}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{locality.city?.name}</td>
                    <td className="p-3 flex gap-2 items-center justify-center">
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60"
                        onClick={() => handleViewLocality(locality._id)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Drawer
                        title={selectedLocality?.name || "Locality Info"}
                        placement="right"
                        width={360}
                        onClose={() => {
                          setOpen(false);
                          setSelectedLocality(null);
                        }}
                        open={open}
                        mask={false}
                      >
                        {!selectedLocality ? (
                          <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin" />
                          </div>
                        ) : (
                          <InfoCard icon={MapPin} title={selectedLocality.name}>
                            <InfoRow label="Locality Name" value={selectedLocality.name} icon={MapPin} />
                            <InfoRow label="City" value={selectedLocality.city?.name} icon={Globe2} />
                            <InfoRow label="Status" value={selectedLocality.status ? 'Active' : 'Inactive'} icon={Globe2} />
                          </InfoCard>
                        )}
                      </Drawer>
                      <Button
                        className="p-2 bg-orange-100 text-orange-600 hover:bg-orange-200"
                        onClick={() =>
                          navigate("/admin/update-locality", {
                            state: { localityId: locality._id },
                          })
                        }
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="p-2 bg-red-100 text-red-600 hover:bg-red-200">
                            <FaRegTrashCan />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete Locality?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(locality._id)}
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
                  <td colSpan="4" className="text-center py-10">
                    <Globe2 className="w-8 h-8 mx-auto text-[#FFD249]" />
                    <p className="text-[#202020] dark:text-[#FFD249] font-medium">
                      No Localities Available
                    </p>
                    <p className="text-sm text-[#828083] dark:text-[#FFD249]/60">
                      Add a new locality to begin
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Bottom thead for usability */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky bottom-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Locality</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">City</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Action</th>
              </tr>
            </thead>
          </table>
          {/* Pagination and summary */}
          <div className="border-t border-gray-200 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white/70 dark:bg-gray-900/70 rounded-b-2xl">
            <div className="mb-4 lg:mb-0">
              <p className="text-sm text-[#202020] dark:text-[#FFD249]">
                Showing {data?.data?.length ? (data?.page - 1) * data?.limit + 1 : 0} to {Math.min(data?.page * data?.limit, data?.total || 0)} of <span className="font-medium">{data?.total || 0}</span> entries
              </p>
            </div>
            <div>
              {data?.totalPage > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {getPageNumbers().map((num) => (
                      <PaginationItem key={num}>
                        <PaginationLink
                          onClick={() => handlePageChange(num)}
                          isActive={num === currentPage}
                          className="cursor-pointer rounded-full px-3 py-1 bg-[#FFD249]/30 text-[#202020] dark:text-[#FFD249] font-semibold mx-1"
                        >
                          {num}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={currentPage === data.totalPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Localities;
