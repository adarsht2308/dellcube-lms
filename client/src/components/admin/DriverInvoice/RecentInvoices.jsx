import React, { useEffect, useState } from "react";
import { EyeIcon, Loader2, FileText } from "lucide-react";
import { GrPowerCycle } from "react-icons/gr";
import { Button } from "@/components/ui/button";
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
import { Drawer } from "antd";
import { useSelector } from "react-redux";
import dayjs from "dayjs";
import { useDebounce } from "@/hooks/Debounce";
import {
  useGetRecentDriverInvoicesMutation,
  useUpdateDriverInvoiceMutation,
} from "@/features/api/DriverInvoice/driverInvoiceApi.js";
import { MdOutlineEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Truck, MapPin } from "lucide-react";

const RecentInvoices = () => {
  const driverId = useSelector((state) => state.auth.user?._id);
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [fetchRecentInvoices, { data, isLoading }] =
    useGetRecentDriverInvoicesMutation({});

  useEffect(() => {
    if (driverId) {
      fetchRecentInvoices({
        driverId,
        page: currentPage,
        limit,
        search: debouncedSearch,
      });
    }
  }, [driverId, currentPage, limit, debouncedSearch]);

  const [updateDriverInvoice, { isLoading: isUpdating }] =
    useUpdateDriverInvoiceMutation();

  const statusOptions = [
    "Created",
    "Dispatched",
    "In Transit",
    "Arrived at Destination",
    "Delivered",
    "Cancelled",
    "Returned",
  ];

  const [open, setOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const handleLimitChange = (value) => {
    setLimit(Number(value));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const getPageNumbers = () => {
    const totalPages = data?.totalPages || 1;
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    let end = Math.min(start + 4, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setOpen(true);
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-[100vh] rounded-md">
      <div className="md:p-6 p-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide">
            Recent Invoices (Last 24 Hours)
          </h2>
          <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl shadow px-4 py-2 border border-gray-200">
            <input
              type="text"
              placeholder="Search by docket no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 h-9 border border-gray-200 rounded-md text-sm w-44 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <Select value={limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-[80px] h-9 text-xs border border-gray-200 bg-gray-50 rounded-md">
                <SelectValue placeholder="Limit" />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 15].map((n) => (
                  <SelectItem key={n} value={n.toString()} className="text-xs">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="h-9 px-3 text-xs font-semibold bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-md shadow hover:from-blue-500 hover:to-blue-700 border-0"
              onClick={() =>
                fetchRecentInvoices({
                  driverId,
                  page: currentPage,
                  limit,
                  search: debouncedSearch,
                })
              }
            >
              <GrPowerCycle />
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-12 border border-gray-200 relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden border border-gray-100 shadow-md">
              <thead className="bg-gradient-to-r from-blue-50 to-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    Docket
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    Branch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-extrabold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-gray-400 text-base font-semibold"
                    >
                      <Loader2 className="w-6 h-6 mx-auto animate-spin" />
                    </td>
                  </tr>
                ) : data?.invoices?.length ? (
                  data.invoices.map((invoice, i) => (
                    <tr
                      key={invoice._id}
                      className={`transition-all duration-150 ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50/60`}
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {limit * (currentPage - 1) + i + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                        {invoice.docketNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {invoice?.company?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {invoice?.branch?.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                        {invoice?.customer?.name}
                      </td>
                      <td className="px-6 py-4">
                        <Select
                          value={invoice.status}
                          onValueChange={async (value) => {
                            try {
                              await updateDriverInvoice({
                                driverId,
                                invoiceId: invoice?._id,
                                status: value,
                              }).unwrap();

                              toast.success("Status updated successfully");

                              // Re-fetch manually if needed:
                              await fetchRecentInvoices({
                                driverId,
                                page: currentPage,
                                limit,
                                search: debouncedSearch,
                              });
                            } catch (err) {
                              console.error("Status update error:", err);
                              toast.error("Failed to update status");
                            }
                          }}
                        >
                          <SelectTrigger className="w-[180px] text-sm">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>

                      <td className="px-4 py-3 flex gap-2 items-center justify-center">
                        <Button
                          className="p-2 bg-orange-100 text-orange-600 hover:bg-orange-200 rounded-md"
                          onClick={() =>
                            navigate("/admin/update-invoices", {
                              state: { 
                                invoiceId: invoice._id,
                                previousPage: "/admin/recent-invoices"
                              },
                            })
                          }
                        >
                          <MdOutlineEdit className="w-4 h-4" />
                        </Button>
                        <Button
                          className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-md"
                          onClick={() => handleView(invoice)}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-center py-8 text-gray-400 text-base font-semibold"
                    >
                      <FileText className="w-8 h-8 mx-auto text-gray-400" />
                      <p className="text-gray-500 font-medium">
                        No Recent Invoices
                      </p>
                      <p className="text-sm text-gray-400">
                        No invoices created in the last 24 hours.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="border-t border-gray-200 px-4 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <p className="text-sm text-gray-700 dark:text-white">
                Showing{" "}
                {data?.invoices?.length
                  ? (data?.page - 1) * data?.limit + 1
                  : 0}{" "}
                to {Math.min(data?.page * data?.limit, data?.total || 0)} of{" "}
                <span className="font-medium">{data?.total || 0}</span> entries
              </p>
            </div>
            <div>
              {data?.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(currentPage - 1)}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {getPageNumbers().map((num) => (
                      <PaginationItem key={num}>
                        <PaginationLink
                          onClick={() => handlePageChange(num)}
                          isActive={num === currentPage}
                          className="cursor-pointer"
                        >
                          {num}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(currentPage + 1)}
                        className={
                          currentPage === data.totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
          </div>
        </div>

        {/* Drawer */}
        <Drawer
          title={
            <div className="flex items-center flex-wrap min-w-0 max-w-full py-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0 max-w-[140px]">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
                    Invoice: {selectedInvoice?.docketNumber || "Loading..."}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {selectedInvoice?.customer?.name}
                  </p>
                </div>
              </div>
              <div className="ml-auto min-w-0 flex-shrink flex items-center">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full font-medium text-xs max-w-[110px] truncate shadow-sm border border-blue-100 dark:border-blue-900/30 ${
                    selectedInvoice?.status === 'Delivered'
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}
                  title={selectedInvoice?.status}
                >
                  {selectedInvoice?.status}
                </span>
              </div>
            </div>
          }
          placement="right"
          width={380}
          onClose={() => {
            setOpen(false);
            setSelectedInvoice(null);
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
          {!selectedInvoice ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="p-6 space-y-6 overflow-x-hidden">
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Docket No:</div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-400">{selectedInvoice.docketNumber}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"><User className="w-4 h-4" /> Customer</div>
                  <div className="text-gray-600 dark:text-gray-300">{selectedInvoice?.customer?.name}</div>
                  <div className="text-xs text-gray-400">{selectedInvoice?.customer?.email}</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"><Truck className="w-4 h-4" /> Vehicle</div>
                  <div className="text-gray-600 dark:text-gray-300">{selectedInvoice?.vehicle?.vehicleNumber}</div>
                  <div className="text-xs text-gray-400">Driver: {selectedInvoice?.driver?.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> From</div>
                  <div className="text-gray-600 dark:text-gray-300">{selectedInvoice?.fromAddress?.locality?.name}, {selectedInvoice?.fromAddress?.city?.name}, {selectedInvoice?.fromAddress?.state?.name}, {selectedInvoice?.fromAddress?.country?.name} - {selectedInvoice?.fromAddress?.pincode?.code}</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow">
                  <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4" /> To</div>
                  <div className="text-gray-600 dark:text-gray-300">{selectedInvoice?.toAddress?.locality?.name}, {selectedInvoice?.toAddress?.city?.name}, {selectedInvoice?.toAddress?.state?.name}, {selectedInvoice?.toAddress?.country?.name} - {selectedInvoice?.toAddress?.pincode?.code}</div>
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-gray-200/50 dark:border-gray-700/50 shadow">
                <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Goods</div>
                <div className="text-gray-600 dark:text-gray-300">{selectedInvoice?.goodsType?.name}</div>
                <div className="text-xs text-gray-400">Items: {selectedInvoice?.goodsType?.items?.join(", ")}</div>
              </div>
              <div className="text-xs text-gray-400 mt-4">Created At: {selectedInvoice.createdAt ? dayjs(selectedInvoice.createdAt).format("DD MMM YYYY hh:mm A") : "-"}</div>
            </div>
          )}
        </Drawer>
      </div>
    </section>
  );
};

export default RecentInvoices;
