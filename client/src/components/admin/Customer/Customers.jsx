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
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
} from "lucide-react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { GrPowerCycle } from "react-icons/gr";
import {
  useDeleteCustomerMutation,
  useGetAllCustomersQuery,
  useGetCustomerByIdMutation,
} from "@/features/api/Customer/customerApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
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
import { useDebounce } from "@/hooks/Debounce";
import { Drawer } from "antd";
import { useSelector } from "react-redux";

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

const Customers = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const isBranchAdmin = user?.role === "branchAdmin";
  const isSuperAdmin = user?.role === "superAdmin";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [status, setStatus] = useState("");
  const [companyId, setCompanyId] = useState(
    isBranchAdmin ? user?.company?._id : ""
  );
  const [branchId, setBranchId] = useState(
    isBranchAdmin ? user?.branch?._id : ""
  );
  // State to manage filter visibility
  const [showFilters, setShowFilters] = useState(false);

  const [branches, setBranches] = useState([]);
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();

  const { data: companyData } = useGetAllCompaniesQuery({});

  useEffect(() => {
    const fetchBranches = async () => {
      if (companyId && isSuperAdmin) {
        try {
          const res = await getBranchesByCompany(companyId);
          console.log(res);
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

  const skipQuery = isBranchAdmin
    ? !(user?.company?._id && user?.branch?._id)
    : false;
  const { data, isLoading, refetch } = useGetAllCustomersQuery(
    {
      page,
      limit,
      search: debouncedSearch,
      status,
      companyId: isBranchAdmin ? user?.company?._id : companyId,
      branchId: isBranchAdmin ? user?.branch?._id : branchId,
    },
    { skip: skipQuery }
  );

  const [deleteCustomer, { isSuccess, isError }] = useDeleteCustomerMutation();
  const [open, setOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [getCustomerById] = useGetCustomerByIdMutation();

  const handleView = async (id) => {
    setOpen(true);
    try {
      const { data } = await getCustomerById(id);
      if (data?.success) setSelectedCustomer(data.customer);
    } catch (err) {
      console.error("Error fetching customer:", err);
    }
  };

  const handleDelete = async (id) => {
    await deleteCustomer(id);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPage || 1)) setPage(newPage);
  };

  const getPageNumbers = () => {
    const totalPages = data?.totalPage || 1;
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(page - 2, totalPages - 4));
    let end = Math.min(start + 4, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Customer deleted successfully");
      refetch();
    } else if (isError) {
      toast.error("Failed to delete customer");
    }
  }, [isSuccess, isError, refetch]);

  return (
    <section className="  min-h-screen">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header with Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">Total Customers</p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">{data?.total || 0}</p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <User className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
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
                <Box className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>
        </div>
        {/* Controls Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">All Customers</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 bg-[#FFD249]/10 hover:bg-[#FFD249]/20 text-[#202020] dark:text-[#FFD249] border-[#FFD249]/30"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filter
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 px-4 py-2 pl-10 bg-white/80 dark:bg-gray-700/80 border border-gray-200/50 dark:border-gray-600/50 rounded-xl text-[#202020] dark:text-[#FFD249] placeholder-[#828083] dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FFD249]/50 focus:border-transparent backdrop-blur-sm"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#828083] dark:text-gray-400" />
              </div>
              <Select value={limit.toString()} onValueChange={(val) => setLimit(Number(val))}>
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
                onClick={() => navigate("/admin/create-customer")}
                className="bg-[#FFD249] hover:bg-[#FFD249]/90 text-[#202020] font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Add Customer
              </Button>
            </div>
          </div>
          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50/80 dark:bg-gray-700/80 rounded-xl border border-gray-200/50 dark:border-gray-600/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                {isSuperAdmin && (
                  <>
                    <Select
                      value={companyId}
                      onValueChange={(val) => {
                        setCompanyId(val);
                        setBranchId("");
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter Company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companyData?.companies?.map((comp) => (
                          <SelectItem key={comp._id} value={comp._id}>
                            {comp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={branchId}
                      onValueChange={(val) => setBranchId(val)}
                      disabled={!companyId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch._id} value={branch._id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Customer Table */}
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
          <table className="min-w-full text-sm">
            {/* Top thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Branch</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6">
                    <Loader2 className="animate-spin mx-auto text-[#FFD249]" /> Loading...
                  </td>
                </tr>
              ) : data?.customers?.length ? (
                data.customers.map((cust, i) => (
                  <tr
                    key={cust._id}
                    className={
                      i % 2 === 0
                        ? "bg-white/60 dark:bg-gray-900/60"
                        : "bg-[#FFD249]/10 dark:bg-[#FFD249]/5" +
                          " hover:bg-[#FFD249]/20 dark:hover:bg-[#FFD249]/10 transition "
                    }
                  >
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">{limit * (page - 1) + (i + 1)}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-semibold">{cust.name}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{cust.email}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{cust.company?.name || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] text-center">{cust.branch?.name || <span className="text-gray-400">N/A</span>}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${cust.status === true ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                      >
                        {cust.status === true ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 items-center justify-center">
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() => handleView(cust._id)}
                        title="View Details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                        onClick={() =>
                          navigate("/admin/update-customer", {
                            state: { customerId: cust._id },
                          })
                        }
                        title="Edit Customer"
                      >
                        <MdOutlineEdit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60 dark:text-[#FFD249]"
                            title="Delete Customer"
                          >
                            <FaRegTrashCan />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the customer and remove their data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(cust._id)}>
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
                  <td colSpan="7" className="text-center py-10 text-[#828083]">
                    <User className="w-8 h-8 mx-auto text-[#828083]" />
                    <p className="text-[#828083] font-medium">No Customers Available</p>
                    <p className="text-sm text-[#828083]">Add a new customer to begin</p>
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
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Company</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Branch</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Actions</th>
              </tr>
            </thead>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-[#202020] dark:text-[#FFD249] text-center lg:text-left">
            Showing {data?.customers?.length ? (data?.page - 1) * data?.limit + 1 : 0} to {Math.min(data?.page * data?.limit, data?.total || 0)} of <span className="font-medium">{data?.total || 0}</span> entries
          </div>
        </div>
        {/* Pagination */}
        {data?.totalPage > 1 && (
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
                      page === data.totalPage
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
        {open && selectedCustomer && (
          <Drawer
            title={
              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[180px]">
                      Customer Details
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                      {selectedCustomer.email}
                    </p>
                  </div>
                </div>
                <div className="ml-auto">
                  <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium ${selectedCustomer.status ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>{selectedCustomer.status ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            }
            placement="right"
            width={380}
            onClose={() => {
              setOpen(false);
              setSelectedCustomer(null);
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
            {!selectedCustomer ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
              </div>
            ) : (
              <div className="p-6 space-y-6 overflow-x-hidden">
                <InfoCard icon={User} title="Contact Information">
                  <InfoRow label="Name" value={selectedCustomer.name} icon={User} />
                  <InfoRow label="Email" value={selectedCustomer.email} icon={Mail} />
                  <InfoRow label="Phone" value={selectedCustomer.phone} icon={Phone} />
                </InfoCard>
                <InfoCard icon={Building2} title="Organizational Details">
                  <InfoRow label="Company" value={selectedCustomer.company?.name} icon={Building2} />
                  <InfoRow label="Branch" value={selectedCustomer.branch?.name} icon={MapPin} />
                  {selectedCustomer.companyName && <InfoRow label="Company Name" value={selectedCustomer.companyName} />}
                  {selectedCustomer.companyContactName && <InfoRow label="Contact Person" value={selectedCustomer.companyContactName} />}
                  {selectedCustomer.companyContactInfo && <InfoRow label="Contact Info" value={selectedCustomer.companyContactInfo} />}
                </InfoCard>

                {/* Tax Information */}
                {(selectedCustomer.taxType || selectedCustomer.taxValue) && (
                  <InfoCard icon={Building2} title="Tax Information">
                    {selectedCustomer.taxType && <InfoRow label="Tax Type" value={selectedCustomer.taxType} />}
                    {selectedCustomer.taxValue && <InfoRow label="Tax Value" value={`${selectedCustomer.taxValue}%`} />}
                  </InfoCard>
                )}

                {/* Consignees */}
                {selectedCustomer.consignees && selectedCustomer.consignees.length > 0 && (
                  <InfoCard icon={MapPin} title="Consignees">
                    <div className="space-y-3">
                      {selectedCustomer.consignees.map((consignee, index) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="font-medium">Site ID:</span> {consignee.siteId}</div>
                            <div><span className="font-medium">Consignee:</span> {consignee.consignee}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                )}

                {/* Consignors */}
                {selectedCustomer.consignors && selectedCustomer.consignors.length > 0 && (
                  <InfoCard icon={MapPin} title="Consignors">
                    <div className="space-y-2">
                      {selectedCustomer.consignors.map((consignor, index) => (
                        <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg border">
                          <div className="text-sm">
                            <span className="font-medium">Consignor:</span> {consignor.consignor}
                          </div>
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                )}

                {selectedCustomer.address && (
                  <InfoCard icon={MapPin} title="Address">
                    <div className="text-gray-800 dark:text-gray-200 text-left">
                      {selectedCustomer.address}
                    </div>
                  </InfoCard>
                )}
              </div>
            )}
          </Drawer>
        )}
      </div>
    </section>
  );
};

export default Customers;
