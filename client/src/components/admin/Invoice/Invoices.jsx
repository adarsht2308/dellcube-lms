import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import {
  Loader2,
  EyeIcon,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  FileText,
  Building2,
  Truck,
  MapPin,
  Download,
  MoreVertical,
  X,
} from "lucide-react";
import {
  Package,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Phone,
  Mail,
  Hash,
  Weight,
  DollarSign,
  Navigation,
  Map,
} from "lucide-react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";

import {
  useGetAllInvoicesQuery,
  useDeleteInvoiceMutation,
  useGetInvoicePdfMutation,
  useExportInvoicesCSVMutation,
  useCreateReservedDocketsMutation,
} from "@/features/api/Invoice/invoiceApi.js";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi.js";
import { Button } from "@/components/ui/button";
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
import { useDebounce } from "@/hooks/Debounce";
import { Drawer } from "antd";
import { GrPowerCycle } from "react-icons/gr";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFDownloadLink, PDFViewer, pdf } from "@react-pdf/renderer";
import InvoicePDFDocument from "./InvoicePDFDocument";
import logoUrl from "/images/dellcube_logo-og.png";
import { imageUrlToBase64 } from "@/utils/imageUrlToBase64.js";
import { Input } from "@/components/ui/input";

// Adjust path as needed

const InvoiceDetailCard = ({ title, children }) => {
  return (
    <div className="bg-white/80 backdrop-filter backdrop-blur-lg border border-gray-200/50 rounded-xl shadow-lg p-6 space-y-3 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-blue-300/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-purple-300/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-300/50 flex items-center">
        {title}
      </h3>
      <div className="text-gray-700 dark:text-gray-200 text-base leading-relaxed">
        {children}
      </div>
    </div>
  );
};

const CSV_COLUMNS = [
  { key: "DocketNumber", label: "Docket Number" },
  { key: "Company", label: "Company" },
  { key: "CompanyAddress", label: "Company Address" },
  { key: "CompanyGST", label: "Company GST" },
  { key: "CompanyPAN", label: "Company PAN" },
  { key: "Branch", label: "Branch" },
  { key: "Customer", label: "Customer" },
  { key: "CustomerPhone", label: "Customer Phone" },
  { key: "CustomerEmail", label: "Customer Email" },
  { key: "GoodsType", label: "Goods Type" },
  { key: "GoodsItems", label: "Goods Items" },
  { key: "VehicleType", label: "Vehicle Type" },
  { key: "VehicleNumber", label: "Vehicle Number" },
  { key: "Vendor", label: "Vendor" },
  { key: "Driver", label: "Driver" },
  { key: "DriverPhone", label: "Driver Phone" },
  { key: "Status", label: "Status" },
  { key: "InvoiceDate", label: "Invoice Date" },
  { key: "DispatchDateTime", label: "Dispatch DateTime" },
  { key: "FromCountry", label: "From Country" },
  { key: "FromState", label: "From State" },
  { key: "FromCity", label: "From City" },
  { key: "FromLocality", label: "From Locality" },
  { key: "FromPincode", label: "From Pincode" },
  { key: "ToCountry", label: "To Country" },
  { key: "ToState", label: "To State" },
  { key: "ToCity", label: "To City" },
  { key: "ToLocality", label: "To Locality" },
  { key: "ToPincode", label: "To Pincode" },
  { key: "TotalWeight", label: "Total Weight" },
  { key: "NumberOfPackages", label: "Number Of Packages" },
  { key: "FreightCharges", label: "Freight Charges" },
  { key: "PaymentType", label: "Payment Type" },
  { key: "Remarks", label: "Remarks" },
  { key: "DeliveredAt", label: "Delivered At" },
  { key: "DeliveryProofReceiverName", label: "DeliveryProof Receiver Name" },
  {
    key: "DeliveryProofReceiverMobile",
    label: "DeliveryProof Receiver Mobile",
  },
  { key: "DeliveryProofRemarks", label: "DeliveryProof Remarks" },
  { key: "CreatedAt", label: "Created At" },
  { key: "UpdatedAt", label: "Updated At" },
  { key: "OrderNumber", label: "Order Number" },
];

// Move this hook OUTSIDE the Invoices component so it is not redefined on every render
function useReverseGeocode(updates) {
  const [locations, setLocations] = useState({});
  useEffect(() => {
    if (!updates) return;
    const fetchLocations = async () => {
      const newLocations = {};
      const fetches = updates.map(async (update) => {
        const { lat, lng } = update.location || {};
        if (lat && lng && !locations[`${lat},${lng}`]) {
          const cacheKey = `geocode_${lat},${lng}`;
          // Try localStorage cache first
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            newLocations[`${lat},${lng}`] = cached;
            return;
          }
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();
            const address = data.display_name || `${lat}, ${lng}`;
            newLocations[`${lat},${lng}`] = address;
            localStorage.setItem(cacheKey, address);
          } catch {
            newLocations[`${lat},${lng}`] = `${lat}, ${lng}`;
          }
        }
      });
      await Promise.all(fetches);
      setLocations((prev) => ({ ...prev, ...newLocations }));
    };
    fetchLocations();
    // eslint-disable-next-line
  }, [updates]);
  return locations;
}

const Invoices = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isSuperAdmin = user?.role === "superAdmin";
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [companyId, setCompanyId] = useState(
    isBranchAdmin ? user?.company?._id : ""
  );
  const [branchId, setBranchId] = useState(
    isBranchAdmin ? user?.branch?._id : ""
  );
  const [status, setStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: companyData } = useGetAllCompaniesQuery({});
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation({});
  const [branches, setBranches] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const { data: customersData } = useGetAllCustomersQuery({});

  const [openDrawer, setOpenDrawer] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [logoBase64, setLogoBase64] = useState("");
  const [invoiceForPdf, setInvoiceForPdf] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(null);

  // CSV Export Modal State
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvColumns, setCsvColumns] = useState(
    CSV_COLUMNS.map((col) => ({ ...col, checked: true, custom: col.label }))
  );
  const [exportInvoicesCSV, { isLoading: isExporting }] =
    useExportInvoicesCSVMutation();

  const [reservedDialogOpen, setReservedDialogOpen] = useState(false);
  const [reservedForm, setReservedForm] = useState({
    customer: "",
    count: 1,
    fromAddress: "",
    toAddress: "",
  });
  const [createReservedDockets, { isLoading: isCreatingReserved }] =
    useCreateReservedDocketsMutation();

  const { data: companiesData } = useGetAllCompaniesQuery({ status: "active" });
  const [branchOptions, setBranchOptions] = useState([]);

  // Watch for company change in reservedForm (for superAdmin/operation)
  useEffect(() => {
    if (user?.role === "superAdmin" && reservedForm.company) {
      getBranchesByCompany(reservedForm.company).then((res) => {
        if (res?.data?.branches) setBranchOptions(res.data.branches);
        else setBranchOptions([]);
      });
    }
  }, [reservedForm.company, user?.role, getBranchesByCompany]);

  useEffect(() => {
    fetch(logoUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoBase64(reader.result);
        };
        reader.readAsDataURL(blob);
      })
      .catch((error) => {
        console.error("Error loading logo:", error);
        toast.error("Could not load company logo for PDF.");
      });
  }, []);

  const filters = {
    page,
    limit,
    search: debouncedSearch,
  };

  if (status) filters.status = status;
  if (isBranchAdmin || companyId)
    filters.companyId = isBranchAdmin ? user?.company?._id : companyId;
  if (isBranchAdmin || branchId)
    filters.branchId = isBranchAdmin ? user?.branch?._id : branchId;
  if (customerId) filters.customerId = customerId;
  if (paymentType) filters.paymentType = paymentType;
  if (vehicleType) filters.vehicleType = vehicleType;
  if (fromDate) filters.fromDate = fromDate;
  if (toDate) filters.toDate = toDate;
  const { data, isLoading, refetch } = useGetAllInvoicesQuery(filters);

  const [deleteInvoice, { isSuccess, isError }] = useDeleteInvoiceMutation();
  const [getInvoicePdf] = useGetInvoicePdfMutation();

  useEffect(() => {
    if (companyId && isSuperAdmin) {
      getBranchesByCompany(companyId).then((res) => {
        if (res?.data?.branches) setBranches(res.data.branches);
      });
    }
  }, [companyId, isSuperAdmin, getBranchesByCompany]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Invoice deleted successfully");
      refetch();
    } else if (isError) {
      toast.error("Failed to delete invoice");
    }
  }, [isSuccess, isError, refetch]);

  const handleDelete = async (id) => {
    await deleteInvoice(id);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) setPage(newPage);
  };

  const getPageNumbers = () => {
    const totalPages = data?.totalPages || 1;
    if (!data?.page) return [1];
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(data.page - 2, totalPages - 4));
    let end = Math.min(start + 4, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setOpenDrawer(true);
  };

  const currentPage = page;

  const handleClearFilters = () => {
    setCompanyId(isBranchAdmin ? user?.company?._id : "");
    setBranchId(isBranchAdmin ? user?.branch?._id : "");
    setCustomerId("");
    setPaymentType("");
    setVehicleType("");
    setFromDate("");
    setToDate("");
    setStatus("");
    setPage(1);
    setLimit(5);
  };

  const handleViewPDF = async (invoice) => {
    setIsGeneratingPdf({ id: invoice._id, type: "view" });

    // Create a deep, mutable copy of the invoice object to avoid read-only errors.
    let processedInvoice = JSON.parse(JSON.stringify(invoice));

    if (processedInvoice.deliveryProof?.signature) {
      try {
        const signatureBase64 = await imageUrlToBase64(
          processedInvoice.deliveryProof.signature
        );
        if (signatureBase64) {
          processedInvoice.deliveryProof.signature = signatureBase64;
        } else {
          toast.error("Could not convert signature for PDF.");
        }
      } catch (error) {
        toast.error("Failed to process signature image.");
        console.error("Signature conversion error:", error);
      }
    }

    setInvoiceForPdf(processedInvoice);
    setPdfDialogOpen(true);
    // Add a small delay to ensure the PDF viewer has the data before the drawer closes.
    setTimeout(() => {
      setOpenDrawer(false); // Close the drawer
    }, 100);
    setIsGeneratingPdf(null);
  };

  const handleDownloadPdf = async (invoice) => {
    setIsGeneratingPdf({ id: invoice._id, type: "download" });
    try {
      if (!logoBase64) {
        toast.error("Logo not loaded yet. Please wait a moment.");
        throw new Error("Logo not loaded");
      }

      // Create a deep, mutable copy of the invoice object to avoid read-only errors.
      let processedInvoice = JSON.parse(JSON.stringify(invoice));

      if (processedInvoice.deliveryProof?.signature) {
        const signatureBase64 = await imageUrlToBase64(
          processedInvoice.deliveryProof.signature
        );
        if (signatureBase64) {
          processedInvoice.deliveryProof.signature = signatureBase64;
        } else {
          toast.error(
            "Could not convert signature image. PDF will be generated without it."
          );
        }
      }

      const doc = (
        <InvoicePDFDocument
          invoice={processedInvoice}
          logoBase64={logoBase64}
        />
      );
      const blob = await pdf(doc).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice_${invoice.docketNumber}.pdf`);
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate PDF for download:", error);
      toast.error("An error occurred while generating the PDF.");
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  useEffect(() => {
    // When invoiceForPdf is updated and the type was 'download', we can reset the state
    // The actual download will be handled by the PDFDownloadLink component
    if (invoiceForPdf && isGeneratingPdf?.type === "download") {
      // The state is ready for the link to be clicked. We can reset the loading state.
      // A short timeout can help ensure the link has time to re-render.
      setTimeout(() => {
        setIsGeneratingPdf(null);
      }, 500);
    } else if (invoiceForPdf && isGeneratingPdf?.type === "view") {
      setIsGeneratingPdf(null); // It's ready for viewing
    }
  }, [invoiceForPdf, isGeneratingPdf]);

  // Handle column checkbox toggle
  const handleColumnToggle = (idx) => {
    setCsvColumns((cols) =>
      cols.map((col, i) =>
        i === idx ? { ...col, checked: !col.checked } : col
      )
    );
  };
  // Handle custom header change
  const handleHeaderChange = (idx, value) => {
    setCsvColumns((cols) =>
      cols.map((col, i) => (i === idx ? { ...col, custom: value } : col))
    );
  };
  // Handle export
  const handleExportCSV = async () => {
    const selected = csvColumns.filter((col) => col.checked);
    if (selected.length === 0) {
      toast.error("Select at least one column to export.");
      return;
    }
    const columns = selected.map((col) => col.key);
    const headers = selected.map((col) => col.custom || col.label);
    try {
      const params = {
        ...filters,
        columns: JSON.stringify(columns),
        headers: JSON.stringify(headers),
        page: undefined, // remove pagination for export
        limit: undefined,
      };
      const blob = await exportInvoicesCSV(params).unwrap();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "invoices_export.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setCsvModalOpen(false);
      toast.success("CSV exported successfully!");
    } catch (error) {
      toast.error("Failed to export CSV.");
    }
  };

  const InfoCard = ({ icon: Icon, title, children, className = "" }) => {
    return (
      <div
        className={`group relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-white/80 dark:hover:bg-gray-800/80 hover:border-gray-300/50 dark:hover:border-gray-600/50 ${className}`}
      >
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-900/10 dark:via-transparent dark:to-purple-900/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Header */}
        <div className="relative flex items-center gap-3 mb-4 pb-3 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {title}
          </h3>
        </div>

        {/* Content */}
        <div className="relative space-y-3">{children}</div>
      </div>
    );
  };

  const InfoRow = ({
    label,
    value,
    icon: Icon,
    badge = false,
    badgeColor = "gray",
  }) => {
    const getBadgeStyles = (color) => {
      const styles = {
        green:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        yellow:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        purple:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        gray: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      };
      return styles[color] || styles.gray;
    };

    return (
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
          {badge && value ? (
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getBadgeStyles(
                badgeColor
              )}`}
            >
              {value}
            </span>
          ) : (
            <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">
              {value || <span className="text-gray-400 italic">N/A</span>}
            </span>
          )}
        </div>
      </div>
    );
  };

  const StatusBadge = ({ status }) => {
    const getStatusConfig = (status) => {
      switch (status?.toLowerCase()) {
        case "delivered":
          return {
            color: "green",
            icon: CheckCircle,
            bg: "bg-green-50 dark:bg-green-900/20",
            text: "text-green-700 dark:text-green-400",
          };
        case "cancelled":
          return {
            color: "red",
            icon: XCircle,
            bg: "bg-red-50 dark:bg-red-900/20",
            text: "text-red-700 dark:text-red-400",
          };
        case "pending":
          return {
            color: "yellow",
            icon: Clock,
            bg: "bg-yellow-50 dark:bg-yellow-900/20",
            text: "text-yellow-700 dark:text-yellow-400",
          };
        default:
          return {
            color: "blue",
            icon: Clock,
            bg: "bg-blue-50 dark:bg-blue-900/20",
            text: "text-blue-700 dark:text-blue-400",
          };
      }
    };

    const config = getStatusConfig(status);
    const StatusIcon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-full ${config.bg} ${config.text} font-medium`}
      >
        <StatusIcon className="w-4 h-4" />
        <span className="text-sm">{status || "Created"}</span>
      </div>
    );
  };

  // 1. Add Dellcube color theme variables for easy reuse
  const DELLCUBE_COLORS = {
    gold: "#FFD249",
    dark: "#202020",
    gray: "#828083",
  };

  // Call the hook here so it always runs when selectedInvoice changes
  const driverUpdateLocations = useReverseGeocode(
    selectedInvoice?.driverUpdates
  );

  const handleReservedDocketSubmit = async (e) => {
    e.preventDefault();
    if (!reservedForm.customer || !reservedForm.count) {
      toast.error("Please select a customer and enter count.");
      return;
    }
    // For superAdmin/operation, require company and branch
    if (
      (user?.role === "superAdmin" || user?.role === "operation") &&
      (!reservedForm.company || !reservedForm.branch)
    ) {
      toast.error("Please select company and branch.");
      return;
    }
    try {
      await createReservedDockets({
        customer: reservedForm.customer,
        quantity: reservedForm.count, // Backend expects 'quantity'
        fromAddress: reservedForm.fromAddress,
        toAddress: reservedForm.toAddress,
        company:
          user?.role === "superAdmin" || user?.role === "operation"
            ? reservedForm.company
            : user?.company?._id,
        branch:
          user?.role === "superAdmin" || user?.role === "operation"
            ? reservedForm.branch
            : user?.branch?._id,
      }).unwrap();
      toast.success("Reserved dockets created successfully!");
      setReservedDialogOpen(false);
      setReservedForm({
        customer: "",
        count: 1,
        fromAddress: "",
        toAddress: "",
      });
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to create reserved dockets");
    }
  };

  return (
    <section className="min-h-[100vh] ">
      <div className="px-4 md:pc-10">
        {/* Component Title */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-sm px-6 py-5 border border-gray-100 dark:border-gray-800">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2 md:mb-0">
              Invoices
            </h1>
            <div className="flex flex-wrap gap-2 md:gap-3 items-center justify-end">
              <Button
                onClick={() => setCsvModalOpen(true)}
                variant="outline"
                className="rounded-full px-5 py-2 flex items-center gap-2 text-base shadow-sm border border-[#FFD249] text-[#202020] bg-white hover:bg-[#FFD249]/20 hover:text-[#202020] dark:bg-[#202020] dark:text-[#FFD249] dark:border-[#FFD249] dark:hover:bg-[#FFD249]/10"
              >
                <Download className="w-5 h-5" /> Export CSV
              </Button>
              <Button
                onClick={() => setReservedDialogOpen(true)}
                className="rounded-full px-5 py-2 flex items-center gap-2 text-base bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/80 hover:text-[#202020] shadow-sm border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
              >
                + Create Reserved Docket
              </Button>
              <Button
                onClick={() => navigate("/admin/create-invoice")}
                className="rounded-full px-5 py-2 flex items-center gap-2 text-base bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/80 hover:text-[#202020] shadow-sm border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
              >
                + Add Invoice
              </Button>
              <Button
                className="rounded-full p-2 bg-[#FFD249]/20 text-[#202020] hover:bg-[#FFD249]/40 hover:text-[#202020] border border-[#FFD249] shadow-sm dark:bg-[#202020] dark:text-[#FFD249] dark:hover:bg-[#FFD249]/10 dark:border-[#FFD249]"
                onClick={() => refetch()}
                title="Refresh"
              >
                <GrPowerCycle className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status Filter Dropdown - moved beside Items per page */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
          <div className="flex-1 flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex flex-col gap-1 w-full md:w-1/3">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search docket number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full text-sm w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              />
            </div>
            <div className="flex gap-2 items-end w-full md:w-auto">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  From
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-full text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 min-w-[120px] shadow-sm"
                  placeholder="From Date"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  To
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-full text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 min-w-[120px] shadow-sm"
                  placeholder="To Date"
                />
              </div>
              {(fromDate || toDate) && (
                <button
                  type="button"
                  aria-label="Clear date range"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="ml-1 mb-1 p-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-red-500 transition shadow-sm"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-end md:ml-auto">
            <div className="flex flex-col gap-1 min-w-[120px]">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Items per page
              </Label>
              <Select
                value={limit.toString()}
                onValueChange={(val) => setLimit(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 30].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Status filter beside items per page */}
            <div className="flex flex-col gap-1 min-w-[160px]">
              <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Reserved">Reserved</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Dispatched">Dispatched</SelectItem>
                  <SelectItem value="In Transit">In Transit</SelectItem>
                  <SelectItem value="Arrived at Destination">
                    Arrived at Destination
                  </SelectItem>
                  <SelectItem value="Delivered">Delivered</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              className="rounded-full flex items-center gap-2 px-5 py-2 bg-[#FFD249]/20 text-[#202020] hover:bg-[#FFD249]/40 hover:text-[#202020] border border-[#FFD249] shadow-sm dark:bg-[#202020] dark:text-[#FFD249] dark:hover:bg-[#FFD249]/10 dark:border-[#FFD249]"
            >
              <SlidersHorizontal /> Filter{" "}
              {showFilters ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 mb-8 transition-all duration-300 ease-in-out">
            <div className="mb-6 flex items-center gap-2 border-b pb-4 border-gray-200 dark:border-gray-700">
              <SlidersHorizontal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                Filter Invoices
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                {isSuperAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Company
                      </Label>
                      <Select
                        value={companyId}
                        onValueChange={(val) => {
                          setCompanyId(val);
                          setBranchId("");
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filter Company" />
                        </SelectTrigger>
                        <SelectContent>
                          {companyData?.companies?.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        Branch
                      </Label>
                      <Select
                        value={branchId}
                        onValueChange={setBranchId}
                        disabled={!companyId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Filter Branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {branches?.map((b) => (
                            <SelectItem key={b._id} value={b._id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Customer
                  </Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customersData?.customers?.map((cust) => (
                        <SelectItem key={cust._id} value={cust._id}>
                          {cust.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Payment Type
                  </Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Payment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prepaid">Prepaid</SelectItem>
                      <SelectItem value="To-Pay">To-Pay</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Vehicle Type
                  </Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vehicle Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dellcube">Dellcube</SelectItem>
                      <SelectItem value="Vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8 border-t pt-6 border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Add summary cards at the top */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Total Invoices
            </span>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              {data?.total || 0}
            </span>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Total Weight (kg)
            </span>
            <span className="text-3xl font-bold text-green-600 dark:text-green-400 group-hover:scale-105 transition-transform">
              {data?.invoices?.reduce(
                (sum, inv) => sum + (inv.totalWeight || 0),
                0
              )}
            </span>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Total Freight (₹)
            </span>
            <span className="text-3xl font-bold text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform">
              {data?.invoices?.reduce(
                (sum, inv) => sum + (inv.freightCharges || 0),
                0
              )}
            </span>
          </div>
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-2xl shadow-md p-6 flex flex-col items-center border border-gray-100 dark:border-gray-700 hover:shadow-lg transition group">
            <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Unique Customers
            </span>
            <span className="text-3xl font-bold text-pink-600 dark:text-pink-400 group-hover:scale-105 transition-transform">
              {
                [
                  ...new Set(
                    data?.invoices
                      ?.map((inv) => inv.customer?._id)
                      .filter(Boolean)
                  ),
                ].length
              }
            </span>
          </div>
        </div>

        {/* Table container with modern card style */}
        <div className="bg-white/90 dark:bg-[#202020]/90 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-[#202020]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[#FFD249]/90 dark:bg-[#202020]/90 text-center rounded-t-2xl">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Docket Number
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <Loader2 className="animate-spin mx-auto text-[#FFD249] w-8 h-8" />
                    <div className="mt-2 text-[#828083]">
                      Loading invoices...
                    </div>
                  </td>
                </tr>
              ) : data?.invoices?.length ? (
                data.invoices.map((inv, i) => (
                  <tr
                    key={inv._id}
                    className={
                      (i % 2 === 0
                        ? "bg-white/80 dark:bg-[#202020]/80"
                        : "bg-[#FFD249]/10 dark:bg-[#828083]/10") +
                      " hover:bg-[#FFD249]/30 dark:hover:bg-[#FFD249]/20 transition "
                    }
                  >
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">
                      {limit * (page - 1) + i + 1}
                    </td>
                    <td
                      className={`p-3 font-semibold text-center 
    ${
      inv.status === "Reserved"
        ? "text-red-500"
        : "text-[#ad8a21] dark:text-[#FFD249]"
    }
  `}
                    >
                      {inv.docketNumber}
                    </td>

                    <td className="p-3 text-center">
                      {inv.customer?.name || (
                        <span className="text-[#828083]">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {inv.company?.name || (
                        <span className="text-[#828083]">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {inv.branch?.name || (
                        <span className="text-[#828083]">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${
                          inv.paymentType === "Prepaid"
                            ? "bg-[#FFD249]/80 text-[#202020]"
                            : inv.paymentType === "To-Pay"
                            ? "bg-[#828083]/30 text-[#202020]"
                            : "bg-[#FFD249]/30 text-[#202020]"
                        }`}
                      >
                        {inv.paymentType}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${
                          inv.status === "Delivered"
                            ? "bg-[#FFD249]/80 text-[#202020]"
                            : inv.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-[#FFD249]/30 text-[#202020]"
                        }`}
                      >
                        {inv.status || "Created"}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-2 justify-center text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(inv)}
                        className="text-[#FFD249] hover:text-[#202020] dark:text-[#FFD249] dark:hover:text-[#FFD249] rounded-full p-2 border border-[#FFD249]/40 hover:bg-[#FFD249]/20"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate("/admin/update-invoice", {
                            state: { invoiceId: inv._id },
                          })
                        }
                        className="text-[#202020] hover:text-[#FFD249] dark:text-[#FFD249] dark:hover:text-[#FFD249] rounded-full p-2 border border-[#FFD249]/40 hover:bg-[#FFD249]/20"
                        title="Edit Invoice"
                      >
                        <MdOutlineEdit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded-full p-2 border border-red-200/40 hover:bg-red-100/20"
                          >
                            <FaRegTrashCan className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(inv._id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      {isGeneratingPdf?.id === inv._id &&
                      isGeneratingPdf?.type === "download" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#202020] hover:text-[#FFD249] rounded-full p-2 border border-[#FFD249]/40 hover:bg-[#FFD249]/20"
                          title="Downloading..."
                          disabled
                        >
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPdf(inv)}
                          className="text-[#202020] hover:text-[#FFD249] rounded-full p-2 border border-[#FFD249]/40 hover:bg-[#FFD249]/20"
                          title="Download PDF"
                          disabled={!logoBase64}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-10 h-10 text-[#FFD249] mb-2" />
                      <span className="text-lg text-[#828083]">
                        No invoices found.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            <thead className="sticky top-0 z-10 bg-[#FFD249]/90 dark:bg-[#202020]/90 text-center rounded-t-2xl">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Docket Number
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Enhance Drawer UI */}
        <Drawer
          title={
            <div className="flex items-center gap-4 py-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    Invoice Details
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedInvoice?.docketNumber}
                  </p>
                </div>
              </div>
              <div className="ml-auto">
                <StatusBadge status={selectedInvoice?.status} />
              </div>
            </div>
          }
          placement="right"
          width={720}
          onClose={() => setOpenDrawer(false)}
          open={openDrawer}
          mask={true}
          maskClosable={true}
          className="invoice-drawer"
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
          {selectedInvoice ? (
            <div className="h-full overflow-y-auto">
              {/* Hero Section */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-2xl font-bold mb-1">
                        {selectedInvoice?.docketNumber}
                      </h1>
                      <p className="text-blue-100 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(
                          selectedInvoice?.invoiceDate
                        ).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-100 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold">
                        ₹{selectedInvoice?.freightCharges?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>{selectedInvoice?.customer?.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Weight className="w-4 h-4" />
                      <span>{selectedInvoice?.totalWeight} kg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Container */}
              <div className="p-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mx-auto mb-2">
                      <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Weight
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {selectedInvoice?.totalWeight} kg
                    </p>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg w-fit mx-auto mb-2">
                      <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Packages
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {selectedInvoice?.numberOfPackages || "N/A"}
                    </p>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg w-fit mx-auto mb-2">
                      <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Payment
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {selectedInvoice?.paymentType}
                    </p>
                  </div>
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 text-center border border-gray-200/50">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg w-fit mx-auto mb-2">
                      <Truck className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vehicle
                    </p>
                    <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
                      {selectedInvoice?.vehicleType}
                    </p>
                  </div>
                </div>

                {/* Invoice & Order Information */}
                <InfoCard icon={FileText} title="Invoice & Order Information">
                  <InfoRow
                    label="Docket Number"
                    value={selectedInvoice?.docketNumber}
                    icon={Hash}
                  />
                  <InfoRow
                    label="Order Number"
                    value={selectedInvoice?.orderNumber}
                    icon={FileText}
                  />
                  <InfoRow
                    label="Invoice Number"
                    value={selectedInvoice?.invoiceNumber}
                    icon={FileText}
                  />
                  <InfoRow
                    label="Invoice Bill"
                    value={selectedInvoice?.invoiceBill}
                    icon={FileText}
                  />
                  <InfoRow
                    label="E-Way Bill No"
                    value={selectedInvoice?.ewayBillNo}
                    icon={FileText}
                  />
                  <InfoRow
                    label="Site ID"
                    value={selectedInvoice?.siteId}
                    icon={Hash}
                  />
                  <InfoRow
                    label="Seal No"
                    value={selectedInvoice?.sealNo}
                    icon={Hash}
                  />
                  {/* <InfoRow label="Site Type" value={selectedInvoice?.siteType?.name} icon={Building2} />   */}
                  <InfoRow
                    label="Dispatch Date"
                    value={
                      selectedInvoice?.dispatchDateTime
                        ? new Date(
                            selectedInvoice?.dispatchDateTime
                          ).toLocaleDateString("en-IN")
                        : "N/A"
                    }
                    icon={Calendar}
                  />
                  {selectedInvoice?.deliveredAt && (
                    <InfoRow
                      label="Delivered At"
                      value={new Date(
                        selectedInvoice?.deliveredAt
                      ).toLocaleDateString("en-IN")}
                      icon={Calendar}
                    />
                  )}
                </InfoCard>

                {/* Customer & Company Details */}
                <InfoCard icon={Building2} title="Customer & Company Details">
                  <InfoRow
                    label="Customer"
                    value={selectedInvoice?.customer?.name}
                    icon={User}
                  />
                  <InfoRow
                    label="Phone"
                    value={selectedInvoice?.customer?.phone}
                    icon={Phone}
                  />
                  <InfoRow
                    label="Email"
                    value={selectedInvoice?.customer?.email}
                    icon={Mail}
                  />
                  <InfoRow
                    label="Company"
                    value={selectedInvoice?.company?.name}
                    icon={Building2}
                  />
                  <InfoRow
                    label="Branch"
                    value={selectedInvoice?.branch?.name}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Consignor"
                    value={selectedInvoice?.consignor}
                    icon={User}
                  />
                  <InfoRow
                    label="Consignee"
                    value={selectedInvoice?.consignee}
                    icon={User}
                  />
                </InfoCard>

                {/* Vehicle & Driver Information */}
                <InfoCard icon={Truck} title="Vehicle & Driver Information">
                  <InfoRow
                    label="Vehicle Type"
                    value={selectedInvoice?.vehicleType}
                    icon={Truck}
                    badge={true}
                    badgeColor={
                      selectedInvoice?.vehicleType === "Dellcube"
                        ? "blue"
                        : "yellow"
                    }
                  />
                  <InfoRow
                    label="Vehicle Size"
                    value={selectedInvoice?.vehicleSize}
                    icon={Truck}
                  />
                  <InfoRow
                    label="Driver"
                    value={selectedInvoice?.driver?.name}
                    icon={User}
                  />
                  <InfoRow
                    label="Driver Contact"
                    value={selectedInvoice?.driverContactNumber}
                    icon={Phone}
                  />

                  {selectedInvoice?.vehicleType === "Vendor" && (
                    <>
                      <InfoRow
                        label="Vendor"
                        value={selectedInvoice?.vendor?.name}
                        icon={Building2}
                      />
                      <InfoRow
                        label="Vehicle Number"
                        value={selectedInvoice?.vendorVehicle?.vehicleNumber}
                        icon={Hash}
                      />
                    </>
                  )}
                </InfoCard>

                {/* Contact Information */}
                {/* <InfoCard icon={Phone} title="Contact Information">
          <InfoRow label="Loading Contact Name" value={selectedInvoice?.loadingContact?.name} icon={User} />
          <InfoRow label="Loading Contact Mobile" value={selectedInvoice?.loadingContact?.mobile} icon={Phone} />
          <InfoRow label="Unloading Contact Name" value={selectedInvoice?.unloadingContact?.name} icon={User} />
          <InfoRow label="Unloading Contact Mobile" value={selectedInvoice?.unloadingContact?.mobile} icon={Phone} />
        </InfoCard> */}

                {/* Payment & Charges */}
                <InfoCard icon={CreditCard} title="Payment & Charges">
                  <InfoRow
                    label="Payment Type"
                    value={selectedInvoice?.paymentType}
                    icon={CreditCard}
                    badge={true}
                    badgeColor={
                      selectedInvoice?.paymentType === "Prepaid"
                        ? "green"
                        : selectedInvoice?.paymentType === "To-Pay"
                        ? "yellow"
                        : "purple"
                    }
                  />
                  <InfoRow
                    label="Freight Charges"
                    value={`₹${selectedInvoice?.freightCharges?.toLocaleString()}`}
                    icon={DollarSign}
                  />
                  <InfoRow
                    label="Total Weight"
                    value={`${selectedInvoice?.totalWeight} kg`}
                    icon={Weight}
                  />
                  <InfoRow
                    label="Number of Packages"
                    value={selectedInvoice?.numberOfPackages}
                    icon={Package}
                  />
                </InfoCard>

                {/* Goods Information */}
                <InfoCard icon={Package} title="Goods Information">
                  <InfoRow
                    label="Goods Type"
                    value={selectedInvoice?.goodsType?.name}
                    icon={Package}
                  />
                  {selectedInvoice?.goodsType?.items?.length > 0 && (
                    <div className="mt-3 p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Items:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedInvoice.goodsType.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-md text-xs font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </InfoCard>

                {/* Addresses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InfoCard
                    icon={Navigation}
                    title="Origin Address"
                    className="h-fit"
                  >
                    <div className="space-y-2">
                      <InfoRow
                        label="Country"
                        value={selectedInvoice?.fromAddress?.country?.name}
                      />
                      <InfoRow
                        label="State"
                        value={selectedInvoice?.fromAddress?.state?.name}
                      />
                      <InfoRow
                        label="City"
                        value={selectedInvoice?.fromAddress?.city?.name}
                      />
                      <InfoRow
                        label="Locality"
                        value={selectedInvoice?.fromAddress?.locality?.name}
                      />
                      <InfoRow
                        label="Pincode"
                        value={selectedInvoice?.fromAddress?.pincode?.code}
                      />
                    </div>
                  </InfoCard>

                  <InfoCard
                    icon={Map}
                    title="Destination Address"
                    className="h-fit"
                  >
                    <div className="space-y-2">
                      <InfoRow
                        label="Country"
                        value={selectedInvoice?.toAddress?.country?.name}
                      />
                      <InfoRow
                        label="State"
                        value={selectedInvoice?.toAddress?.state?.name}
                      />
                      <InfoRow
                        label="City"
                        value={selectedInvoice?.toAddress?.city?.name}
                      />
                      <InfoRow
                        label="Locality"
                        value={selectedInvoice?.toAddress?.locality?.name}
                      />
                      <InfoRow
                        label="Pincode"
                        value={selectedInvoice?.toAddress?.pincode?.code}
                      />
                    </div>
                  </InfoCard>
                </div>

                {/* Pickup & Delivery Addresses */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InfoCard
                    icon={Navigation}
                    title="Pickup Address"
                    className="!p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/10 border border-blue-100 dark:border-blue-800 rounded-lg shadow-sm"
                  >
                    <div className="text-center font-semibold text-blue-900 dark:text-blue-200 text-base leading-snug px-2 py-2">
                      {[
                        selectedInvoice?.pickupAddress,
                        selectedInvoice?.fromAddress?.locality?.name,
                        selectedInvoice?.fromAddress?.pincode?.code,
                        selectedInvoice?.fromAddress?.city?.name,
                        selectedInvoice?.fromAddress?.state?.name,
                        selectedInvoice?.fromAddress?.country?.name,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </InfoCard>

                  <InfoCard
                    icon={Map}
                    title="Delivery Address"
                    className="!p-3 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/10 border border-green-100 dark:border-green-800 rounded-lg shadow-sm"
                  >
                    <div className="text-center font-semibold text-blue-900 dark:text-blue-200 text-base leading-snug px-2 py-2">
                      {[
                        selectedInvoice?.deliveryAddress,
                        selectedInvoice?.toAddress?.locality?.name,
                        selectedInvoice?.toAddress?.pincode?.code,
                        selectedInvoice?.toAddress?.city?.name,
                        selectedInvoice?.toAddress?.state?.name,
                        selectedInvoice?.toAddress?.country?.name,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  </InfoCard>
                </div>

                {/* Delivery Proof (if available) */}
                {selectedInvoice?.deliveryProof && (
                  <InfoCard icon={CheckCircle} title="Delivery Proof">
                    <InfoRow
                      label="Receiver Name"
                      value={selectedInvoice?.deliveryProof?.receiverName}
                      icon={User}
                    />
                    <InfoRow
                      label="Receiver Mobile"
                      value={selectedInvoice?.deliveryProof?.receiverMobile}
                      icon={Phone}
                    />
                    <InfoRow
                      label="Remarks"
                      value={selectedInvoice?.deliveryProof?.remarks}
                      icon={FileText}
                    />
                  </InfoCard>
                )}

                {/* Driver Updates (if available) */}
                {selectedInvoice?.driverUpdates?.length > 0 && (
                  <InfoCard icon={MapPin} title="Driver Updates">
                    <div className="space-y-3">
                      {selectedInvoice.driverUpdates.map((update, idx) => {
                        const { lat, lng } = update.location || {};
                        const address =
                          lat && lng
                            ? driverUpdateLocations[`${lat},${lng}`]
                            : null;
                        return (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50/50 dark:bg-gray-700/30 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                  {update.note || "Location Update"}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(update.timestamp).toLocaleString(
                                    "en-IN"
                                  )}
                                </p>
                                {update.location && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Lat: {update.location.lat}, Lng:{" "}
                                    {update.location.lng}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Address: {address || "Loading..."}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </InfoCard>
                )}

                {/* Additional Information */}
                <InfoCard icon={FileText} title="Additional Information">
                  <InfoRow
                    label="Address"
                    value={selectedInvoice?.address}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Site Type"
                    value={selectedInvoice?.siteType?.name}
                    icon={Building2}
                  />
                  <InfoRow
                    label="Transport Mode"
                    value={selectedInvoice?.transportMode?.name}
                    icon={Building2}
                  />
                  {/* <InfoRow
                    label="Remarks"
                    value={selectedInvoice?.remarks}
                    icon={FileText}
                  /> */}
                </InfoCard>

                {/* Action Buttons */}
                {/* <div className="grid grid-cols-1 gap-4">
                  <Button
                    onClick={() => handleViewPDF(selectedInvoice)}
                    className="w-full bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3 group border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
                    size="lg"
                  >
                    <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                      <EyeIcon className="w-5 h-5" />
                    </div>
                    <span className="text-base">View PDF Invoice</span>
                    <div className="ml-auto opacity-70 group-hover:opacity-100 transition-opacity">
                      →
                    </div>
                  </Button>
                </div> */}
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-gray-500">Loading invoice details...</p>
              </div>
            </div>
          )}
          {selectedInvoice && (
            <div
              style={{
                position: "sticky",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 20,
              }}
              className="bg-white border-t border-gray-200 p-4 flex justify-center shadow-lg"
            >
              <Button
                onClick={() => handleViewPDF(selectedInvoice)}
                className="w-full max-w-xs bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-3 group border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
                size="lg"
              >
                <div className="p-1 bg-white/20 rounded-lg group-hover:bg-white/30 transition-colors">
                  <EyeIcon className="w-5 h-5" />
                </div>
                <span className="text-base">View PDF Invoice</span>
                <div className="ml-auto opacity-70 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </Button>
            </div>
          )}
        </Drawer>

        <Dialog
          open={pdfDialogOpen}
          onOpenChange={(open) => {
            setPdfDialogOpen(open);
            if (!open) {
              setInvoiceForPdf(null); // Clear data when closing dialog
            }
          }}
        >
          <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Invoice PDF Preview</DialogTitle>
            </DialogHeader>
            {isGeneratingPdf?.id === invoiceForPdf?._id ? (
              <div className="flex-1 flex items-center justify-center text-lg">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
                Processing images...
              </div>
            ) : invoiceForPdf && logoBase64 ? (
              <PDFViewer
                style={{
                  flex: 1,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
              >
                <InvoicePDFDocument
                  invoice={invoiceForPdf}
                  logoBase64={logoBase64}
                />
              </PDFViewer>
            ) : (
              <div className="flex-1 flex items-center justify-center text-lg">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-2" />
                Loading PDF...
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* CSV Export Modal */}
        <Dialog open={csvModalOpen} onOpenChange={setCsvModalOpen}>
          <DialogContent className="max-w-lg w-full">
            <DialogHeader>
              <DialogTitle>Export Invoices as CSV</DialogTitle>
            </DialogHeader>
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
              Select columns to include and optionally rename headers:
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {csvColumns.map((col, idx) => (
                <div key={col.key} className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    checked={col.checked}
                    onChange={() => handleColumnToggle(idx)}
                    className="accent-blue-600 w-4 h-4"
                    id={`csv-col-${col.key}`}
                  />
                  <label
                    htmlFor={`csv-col-${col.key}`}
                    className="text-gray-800 dark:text-gray-100 text-sm min-w-[120px]"
                  >
                    {col.label}
                  </label>
                  <input
                    type="text"
                    value={col.custom}
                    onChange={(e) => handleHeaderChange(idx, e.target.value)}
                    className="border px-2 py-1 rounded-md text-sm bg-white dark:bg-gray-900 text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500 flex-1"
                    placeholder="Header name"
                    disabled={!col.checked}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCsvModalOpen(false)}
                disabled={isExporting}
                className="border border-[#FFD249] text-[#202020] bg-white hover:bg-[#FFD249]/20 hover:text-[#202020] dark:bg-[#202020] dark:text-[#FFD249] dark:border-[#FFD249] dark:hover:bg-[#FFD249]/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExportCSV}
                disabled={isExporting}
                className="bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/80 border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}{" "}
                Export
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="border-t border-gray-200 px-4 py-6 flex flex-col items-center">
          {data?.totalPages > 1 && (
            <Pagination>
              <PaginationContent className="flex gap-2 justify-center">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer rounded-full px-4 py-2 bg-[#FFD249]/20 text-[#202020] hover:bg-[#FFD249]/40 hover:text-[#202020] border border-[#FFD249] dark:bg-[#202020] dark:text-[#FFD249] dark:hover:bg-[#FFD249]/10 dark:border-[#FFD249]"
                    }
                  />
                </PaginationItem>

                {getPageNumbers().map((num) => (
                  <PaginationItem key={num}>
                    <PaginationLink
                      onClick={() => handlePageChange(num)}
                      isActive={num === currentPage}
                      className={
                        "cursor-pointer rounded-full px-4 py-2 border " +
                        (num === currentPage
                          ? "bg-[#FFD249] text-[#202020] border-[#FFD249]"
                          : "bg-[#FFD249]/20 text-[#202020] border-[#FFD249] hover:bg-[#FFD249]/40 hover:text-[#202020] dark:bg-[#202020] dark:text-[#FFD249] dark:hover:bg-[#FFD249]/10 dark:border-[#FFD249]")
                      }
                    >
                      {num}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={
                      currentPage === data?.totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer rounded-full px-4 py-2 bg-[#FFD249]/20 text-[#202020] hover:bg-[#FFD249]/40 hover:text-[#202020] border border-[#FFD249] dark:bg-[#202020] dark:text-[#FFD249] dark:hover:bg-[#FFD249]/10 dark:border-[#FFD249]"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>

        {/* Reserved Docket Dialog */}
        <Dialog open={reservedDialogOpen} onOpenChange={setReservedDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Reserved Dockets</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReservedDocketSubmit} className="space-y-4">
              {/* Company/Branch dropdowns for superAdmin/operation */}
              {(user?.role === "superAdmin" || user?.role === "operation") && (
                <>
                  <div>
                    <Label>Company</Label>
                    <Select
                      value={reservedForm.company}
                      onValueChange={(val) =>
                        setReservedForm((f) => ({
                          ...f,
                          company: val,
                          branch: "",
                        }))
                      }
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company" />
                      </SelectTrigger>
                      <SelectContent>
                        {companiesData?.companies?.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Select
                      value={reservedForm.branch}
                      onValueChange={(val) =>
                        setReservedForm((f) => ({ ...f, branch: val }))
                      }
                      required
                      disabled={!reservedForm.company}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branchOptions.map((b) => (
                          <SelectItem key={b._id} value={b._id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div>
                <Label>Customer</Label>
                <Select
                  value={reservedForm.customer}
                  onValueChange={(val) =>
                    setReservedForm((f) => ({ ...f, customer: val }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customersData?.customers?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Count</Label>
                <Input
                  type="number"
                  min={1}
                  value={reservedForm.count}
                  onChange={(e) =>
                    setReservedForm((f) => ({
                      ...f,
                      count: Number(e.target.value),
                    }))
                  }
                  placeholder="How many dockets to create?"
                  required
                />
              </div>
              <div>
                <Label>From Address (optional)</Label>
                <Input
                  value={reservedForm.fromAddress}
                  onChange={(e) =>
                    setReservedForm((f) => ({
                      ...f,
                      fromAddress: e.target.value,
                    }))
                  }
                  placeholder="Pickup address (optional)"
                />
              </div>
              <div>
                <Label>To Address (optional)</Label>
                <Input
                  value={reservedForm.toAddress}
                  onChange={(e) =>
                    setReservedForm((f) => ({
                      ...f,
                      toAddress: e.target.value,
                    }))
                  }
                  placeholder="Delivery address (optional)"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium py-2 text-base border border-[#FFD249]"
                disabled={
                  isCreatingReserved ||
                  ((user?.role === "superAdmin" ||
                    user?.role === "operation") &&
                    (!reservedForm.company || !reservedForm.branch))
                }
              >
                {isCreatingReserved ? "Creating..." : "Create Reserved Dockets"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default Invoices;
