import React, { useEffect, useState } from "react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { GrPowerCycle } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useGetAllCompaniesQuery,
  useDeleteCompanyMutation,
  useGetCompanyByIdMutation,
} from "@/features/api/Company/companyApi.js";
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
import { Loader2, EyeIcon, Briefcase, Building2, Mail, MapPin, Phone, Globe, SlidersHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { Drawer } from "antd";
import { useDebounce } from "@/hooks/Debounce";

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
        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
        {title}
      </h3>
    </div>
    <div className="relative space-y-3">{children}</div>
  </div>
);

const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start justify-between py-2 px-3 rounded-lg hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors duration-200">
    <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
      {Icon && <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />}
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}:</span>
    </div>
    <div className="flex-1 ml-3 text-right">
      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium break-words">{value || <span className="text-gray-400 italic">N/A</span>}</span>
    </div>
  </div>
);

const Companies = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, refetch } = useGetAllCompaniesQuery({
    page: currentPage,
    limit,
    search: debouncedSearchQuery,
    status: statusFilter === "all" ? "" : statusFilter,
  });

  const [deleteCompany, { isSuccess, isError }] = useDeleteCompanyMutation();
  const [open, setOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [getCompanyById, { isLoading: getCompanyLoading }] =
    useGetCompanyByIdMutation();

  const handleView = async (companyId) => {
    setOpen(true);

    try {
      const { data } = await getCompanyById(companyId);
      if (data?.success) {
        setSelectedCompany(data.company);
      }
    } catch (error) {
      console.error("Error fetching company:", error);
    }
  };

  const handleDelete = async (id) => {
    await deleteCompany(id);
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
      toast.success("Company Deleted Successfully");
      refetch();
    } else if (isError) {
      toast.error("Failed to delete company");
    }
  }, [isSuccess, isError]);

  return (
    <section className=" min-h-[100vh] rounded-md">
      <div className="md:p-6 p-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-white">
            All Companies
          </h2>
          <div className="flex gap-4 items-center flex-wrap">
            <input
              type="text"
              placeholder="Search company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 border rounded-md text-sm w-64 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:border-[#FFD249] focus:ring-[#FFD249]"
            />
            <Button onClick={() => navigate("/admin/create-company")}
              className="rounded-full bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90 font-semibold shadow-md px-4 py-2">
              Add Company
            </Button>
            <Button className="p-2 rounded-full bg-[#FFD249]/20 text-[#FFD249] hover:bg-[#FFD249]/40" onClick={() => refetch()}>
              <GrPowerCycle />
            </Button>
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

        {/* Filter Section */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
          <table className="min-w-full text-sm">
            {/* Top thead */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Logo</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Code</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-center">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-6">
                    <Loader2 className="animate-spin mx-auto text-[#FFD249]" /> Loading...
                  </td>
                </tr>
              ) : data?.companies?.length ? (
                data.companies.map((company, i) => (
                  <tr
                    key={company._id}
                    className={
                      i % 2 === 0
                        ? "bg-white/60 dark:bg-gray-900/60"
                        : "bg-[#FFD249]/10 dark:bg-[#FFD249]/5" +
                          " hover:bg-[#FFD249]/20 dark:hover:bg-[#FFD249]/10 transition "
                    }
                  >
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">{limit * (currentPage - 1) + (i + 1)}</td>
                    <td className="p-3 text-center">
                      {company.companyLogoUrl ? (
                        <img
                          src={company.companyLogoUrl}
                          alt={company.name}
                          className="h-10 w-10 object-cover rounded-full mx-auto"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 mx-auto flex items-center justify-center text-xs text-white">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{company.name}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{company.companyCode}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{company.emailId}</td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">{company.companyType}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${company.status ? 'bg-[#FFD249]/80 text-[#202020]' : 'bg-[#828083]/30 text-[#828083]'}`}>{company.status ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td className="p-3 flex gap-2 items-center justify-center">
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60"
                        onClick={() => handleView(company)}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Drawer
                        title={
                          <div className="flex items-center gap-4 py-2">
                            {selectedCompany?.companyLogoUrl ? (
                              <img
                                src={selectedCompany.companyLogoUrl}
                                alt={selectedCompany.name}
                                className="h-12 w-12 object-cover rounded-full border-2 border-blue-200 shadow"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-xs text-white font-bold">
                                <Building2 className="w-6 h-6" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate max-w-[160px]">
                                {selectedCompany?.name || "Company Details"}
                              </h2>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[160px]">
                                {selectedCompany?.gstNumber}
                              </p>
                            </div>
                            <div className="ml-auto">
                              <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium ${selectedCompany?.status ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>{selectedCompany?.status ? 'Active' : 'Inactive'}</span>
                            </div>
                          </div>
                        }
                        placement="right"
                        width={380}
                        onClose={() => {
                          setOpen(false);
                          setSelectedCompany(null);
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
                        {!selectedCompany ? (
                          <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                          </div>
                        ) : (
                          <div className="p-6 space-y-6 overflow-x-hidden">
                            <InfoCard icon={Building2} title="Company Information">
                              <InfoRow label="Name" value={selectedCompany.name} icon={Building2} />
                              <InfoRow label="Code" value={selectedCompany.companyCode} icon={Building2} />
                              <InfoRow label="Email" value={selectedCompany.emailId} icon={Mail} />
                              <InfoRow label="Website" value={selectedCompany.website || "N/A"} icon={Globe} />
                              <InfoRow label="GST Number" value={selectedCompany.gstNumber} icon={Building2} />
                              {/* <InfoRow label="GST NO" value={selectedCompany.gstNo} icon={Building2} /> */}
                              <InfoRow label="GST Value" value={selectedCompany.gstValue} icon={Building2} />
                              <InfoRow label="PAN" value={selectedCompany.pan} icon={Building2} />
                              <InfoRow label="SAC/HSN" value={selectedCompany.sacHsnCode} icon={Building2} />
                              <InfoRow label="Company Type" value={selectedCompany.companyType} icon={Building2} />
                              <InfoRow label="Contact" value={selectedCompany.contactPhone} icon={Phone} />
                              <InfoRow label="Status" value={selectedCompany.status ? 'Active' : 'Inactive'} icon={Building2} />
                            </InfoCard>
                            <InfoCard icon={MapPin} title="Address & Region">
                              <InfoRow label="Address" value={selectedCompany.address} icon={MapPin} />
                              {/* <InfoRow label="Country" value={selectedCompany?.region?.country?.name} icon={Globe} />
                              <InfoRow label="State" value={selectedCompany?.region?.state?.name} icon={MapPin} />
                              <InfoRow label="City" value={selectedCompany?.region?.city?.name} icon={MapPin} />
                              <InfoRow label="Locality" value={selectedCompany?.region?.locality?.name} icon={MapPin} />
                              <InfoRow label="Pincode" value={selectedCompany?.region?.pincode?.code} icon={MapPin} /> */}
                            </InfoCard>

                            {/* Enhanced Bank Details */}
                            <InfoCard icon={Building2} title="Bank Details">
                              <InfoRow label="Bank Name" value={selectedCompany?.bankDetails?.bankName} icon={Building2} />
                              <InfoRow label="Account Number" value={selectedCompany?.bankDetails?.accountNumber} icon={Building2} />
                              <InfoRow label="IFSC Code" value={selectedCompany?.bankDetails?.ifsc} icon={Building2} />
                            </InfoCard>

                            {/* Enhanced Emergency Contact */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                              <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-xl flex items-center justify-center">
                                  <svg
                                    className="w-5 h-5 text-red-600 dark:text-red-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                    />
                                  </svg>
                                </div>
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                  Emergency Contact
                                </h2>
                              </div>

                              {selectedCompany?.emergencyContact?.name ||
                              selectedCompany?.emergencyContact?.mobile ? (
                                <div className="grid md:grid-cols-2 gap-6 w-full overflow-x-auto">
                                  {/* Contact Name */}
                                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 w-full max-w-full">
                                    <div className="flex items-center gap-3 mb-2">
                                      <svg
                                        className="w-5 h-5 text-red-600 dark:text-red-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                      </svg>
                                      <div className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                                        Name
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-red-900 dark:text-red-100 break-words max-w-full w-full">
                                      {selectedCompany?.emergencyContact?.name || (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </div>
                                  </div>
                                  {/* Contact Mobile */}
                                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 w-full max-w-full">
                                    <div className="flex items-center gap-3 mb-2">
                                      <svg
                                        className="w-5 h-5 text-red-600 dark:text-red-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                      </svg>
                                      <div className="text-xs font-semibold text-red-700 dark:text-red-300 uppercase tracking-wider">
                                        Mobile
                                      </div>
                                    </div>
                                    <div className="text-sm font-medium text-red-900 dark:text-red-100 break-all max-w-full w-full">
                                      {selectedCompany?.emergencyContact?.mobile || (
                                        <span className="text-gray-400">—</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-8">
                                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                    <svg
                                      className="w-8 h-8 text-gray-400"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                                      />
                                    </svg>
                                  </div>
                                  <span className="text-gray-400">No bank details available</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Drawer>
                      <Button
                        className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60"
                        onClick={() =>
                          navigate("/admin/update-company", {
                            state: { companyId: company._id },
                          })
                        }
                      >
                        <MdOutlineEdit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60">
                            <FaRegTrashCan className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Company?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(company._id)}
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
                  <td colSpan="8" className="text-center py-10">
                    <Briefcase className="w-8 h-8 mx-auto text-[#FFD249]" />
                    <p className="text-[#202020] dark:text-[#FFD249] font-medium">
                      No Companies Available
                    </p>
                    <p className="text-sm text-[#828083] dark:text-[#FFD249]/60">
                      Add a new company to begin
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
            {/* Bottom thead for usability */}
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky bottom-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">No</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Logo</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Name</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Code</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Email</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Type</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Status</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">Action</th>
              </tr>
            </thead>
          </table>

          {/* Pagination and summary */}
          <div className="border-t border-gray-200 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between bg-white/70 dark:bg-gray-900/70 rounded-b-2xl">
            <div className="mb-4 lg:mb-0">
              <p className="text-sm text-[#202020] dark:text-[#FFD249]">
                Showing {data?.companies?.length ? (data?.page - 1) * data?.limit + 1 : 0} to {Math.min(data?.page * data?.limit, data?.total || 0)} of <span className="font-medium">{data?.total || 0}</span> entries
              </p>
            </div>
            <div>
              {data?.totalPage > 1 && (
                <Pagination>
                  <PaginationContent className="flex gap-2 justify-center">
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

export default Companies;
