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
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { MdOutlineEdit } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import { GrPowerCycle } from "react-icons/gr";
import { Drawer } from "antd";
import { useSelector } from "react-redux";

import {
  useDeleteDriverMutation,
  useGetAllDriversQuery,
  useBulkUploadDriversMutation,
} from "@/features/api/authApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useDebounce } from "@/hooks/Debounce";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
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

const DELLCUBE_COLORS = {
  gold: "#FFD249",
  dark: "#202020",
  gray: "#828083",
};

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

// Helper function to format companies - shows all companies
const formatCompanies = (driver) => {
  if (!driver) return null;
  
  // Check if company is an array
  if (driver.company && Array.isArray(driver.company) && driver.company.length > 0) {
    const companyNames = driver.company
      .map(c => {
        if (typeof c === 'object' && c !== null) {
          return c.name || c.companyCode || String(c);
        }
        return String(c);
      })
      .filter(name => name && name.trim() !== '');
    
    return companyNames.length > 0 ? companyNames.join(", ") : null;
  }
  
  return null;
};

// Helper function to format branches - shows all branches
const formatBranches = (driver) => {
  if (!driver) return null;
  
  // Check if branch is an array
  if (driver.branch && Array.isArray(driver.branch) && driver.branch.length > 0) {
    const branchNames = driver.branch
      .map(b => {
        if (typeof b === 'object' && b !== null) {
          return b.name || b.branchCode || String(b);
        }
        return String(b);
      })
      .filter(name => name && name.trim() !== '');
    
    return branchNames.length > 0 ? branchNames.join(", ") : null;
  }
  
  return null;
};

const Drivers = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isSuperAdmin = user?.role === "superAdmin";
  const isVendor = user?.role === "vendor";

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [companyId, setCompanyId] = useState(
    isBranchAdmin ? user?.company?._id : "all"
  );
  const [branchId, setBranchId] = useState(
    isBranchAdmin ? user?.branch?._id : "all"
  );
  const [driverType, setDriverType] = useState(isVendor ? "vendor" : "all");
  const debouncedSearch = useDebounce(search, 500);
  const [branches, setBranches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState(null);
  const [open, setOpen] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadResults, setUploadResults] = useState(null);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [parsedCsvData, setParsedCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);

  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const [bulkUploadDrivers, { isLoading: isBulkUploading }] = useBulkUploadDriversMutation();
  const { data: companyData } = useGetAllCompaniesQuery({});
  const { data, isLoading, refetch } = useGetAllDriversQuery({
    page,
    limit,
    search: debouncedSearch,
    status: status === "all" ? "" : status,
    company: isBranchAdmin
      ? user?.company?._id
      : companyId === "all"
      ? ""
      : companyId,
    branch: isBranchAdmin
      ? user?.branch?._id
      : branchId === "all"
      ? ""
      : branchId,
    driverType: isVendor ? "vendor" : driverType === "all" ? "" : driverType,
  });

  const [deleteDriver] = useDeleteDriverMutation();

  const formatDriverType = (driverType) => {
    if (!driverType) return "N/A";
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
    if (totalPages <= 5)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    let start = Math.max(1, Math.min(page - 2, totalPages - 4));
    let end = Math.min(start + 4, totalPages);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  // Driver stats for summary cards
  const totalDrivers = data?.total || 0;
  const activeDrivers = data?.drivers?.filter((d) => d.status === true).length || 0;
  const inactiveDrivers = data?.drivers?.filter((d) => d.status === false).length || 0;
  const vendorDrivers =
    data?.drivers?.filter(
      (d) => (d.driverType || "").toLowerCase() === "vendor"
    ).length || 0;

  // Download sample CSV
  const downloadSampleCSV = () => {
    const headers = [
      "name",
      "mobile",
      "password",
      "licenseNumber",
      "experienceYears",
      "driverType",
      "company",
      "branch",
      "vendor",
      "aadharNumber",
      "panNumber",
      "accountHolderName",
      "bankName",
      "accountNumber",
      "ifscCode",
      "status"
    ];

    // Get actual company and branch IDs from user context or current filters
    const defaultCompany = isBranchAdmin 
      ? user?.company?._id 
      : companyId === "all" || !companyId 
        ? "" 
        : companyId;
    const defaultBranch = isBranchAdmin 
      ? user?.branch?._id 
      : branchId === "all" || !branchId 
        ? "" 
        : branchId;

    // Get company/branch names for display in comments
    const companyName = isBranchAdmin 
      ? user?.company?.name 
      : companyData?.companies?.find(c => c._id === companyId)?.name || "";
    const branchName = isBranchAdmin 
      ? user?.branch?.name 
      : branches.find(b => b._id === branchId)?.name || "";

    // Create CSV with actual IDs if available, or leave empty (will use defaults from backend)
    // Only include dellcube driver type examples (vendor type requires vendor ID which can be confusing)
    const sampleData = [
      [
        "John Doe",
        "9876543210",
        "Password123",
        "DL-1234567890",
        "5",
        "dellcube",
        defaultCompany || "", // Empty if not available - backend will use user's default
        defaultBranch || "", // Empty if not available - backend will use user's default
        "",
        "123456789012",
        "ABCDE1234F",
        "John Doe",
        "State Bank of India",
        "1234567890123456",
        "SBIN0001234",
        "true"
      ],
      [
        "Jane Smith",
        "9876543211",
        "Password123",
        "DL-0987654321",
        "3",
        "dellcube",
        defaultCompany || "", // Empty if not available - backend will use user's default
        defaultBranch || "", // Empty if not available - backend will use user's default
        "",
        "987654321098",
        "FGHIJ5678K",
        "Jane Smith",
        "HDFC Bank",
        "9876543210987654",
        "HDFC0009876",
        "true"
      ]
    ];

    // Add a comment row at the top explaining company/branch fields
    let csvContent = "";
    if (defaultCompany || defaultBranch) {
      csvContent += "# NOTE: Company and Branch fields are auto-filled based on your account.\n";
      csvContent += "# You can leave them empty or fill with different IDs if needed.\n";
      if (defaultCompany) {
        csvContent += `# Default Company: ${companyName || defaultCompany}\n`;
      }
      if (defaultBranch) {
        csvContent += `# Default Branch: ${branchName || defaultBranch}\n`;
      }
      csvContent += "\n";
    } else {
      csvContent += "# NOTE: Company and Branch fields can be left empty if you have a default company/branch.\n";
      csvContent += "# Or fill them with the actual company and branch IDs.\n\n";
    }

    csvContent += [
      headers.join(","),
      ...sampleData.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "driver_bulk_upload_sample.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Parse CSV file
  const parseCSVFile = (text) => {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
    
    if (lines.length < 2) {
      throw new Error("CSV file must have at least a header row and one data row");
    }

    // Parse headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        rows.push(row);
      }
    }
    
    return { headers, rows };
  };

  // Helper function to filter out placeholder values
  const filterPlaceholder = (value) => {
    if (!value) return '';
    const trimmed = String(value).trim();
    // Filter out common placeholder patterns
    if (trimmed.includes('_ID_HERE') || 
        trimmed.includes('_HERE') || 
        trimmed.toLowerCase().includes('placeholder') ||
        trimmed.toLowerCase().includes('example') ||
        trimmed === 'COMPANY_ID_HERE' ||
        trimmed === 'BRANCH_ID_HERE' ||
        trimmed === 'VENDOR_ID_HERE') {
      return '';
    }
    return trimmed;
  };

  // Validate CSV data
  const validateCsvData = (data, headers) => {
    const errors = [];
    const requiredFields = ['name', 'mobile', 'password', 'licenseNumber', 'experienceYears', 'driverType', 'aadharNumber', 'panNumber', 'accountHolderName', 'bankName', 'accountNumber', 'ifscCode'];
    
    // Check for missing headers
    const missingHeaders = requiredFields.filter(field => !headers.includes(field));
    if (missingHeaders.length > 0) {
      errors.push({
        type: 'header',
        message: `Missing required columns: ${missingHeaders.join(', ')}`
      });
      return errors; // Don't validate rows if headers are missing
    }

    // Get default company/branch from user context
    const defaultCompany = isBranchAdmin 
      ? user?.company?._id 
      : companyId === "all" || !companyId 
        ? "" 
        : companyId;
    const defaultBranch = isBranchAdmin 
      ? user?.branch?._id 
      : branchId === "all" || !branchId 
        ? "" 
        : branchId;

    // Validate each row
    data.forEach((row, index) => {
      const rowNum = index + 2; // +2 because row 1 is header, arrays are 0-indexed
      
      // Required fields validation
      if (!row.name || !row.name.trim()) {
        errors.push({ type: 'row', row: rowNum, field: 'name', message: 'Name is required' });
      }
      if (!row.mobile || !row.mobile.trim()) {
        errors.push({ type: 'row', row: rowNum, field: 'mobile', message: 'Mobile is required' });
      } else if (!/^\d{10}$/.test(row.mobile.replace(/\D/g, ''))) {
        errors.push({ type: 'row', row: rowNum, field: 'mobile', message: 'Mobile must be exactly 10 digits' });
      }
      if (!row.password || !row.password.trim()) {
        errors.push({ type: 'row', row: rowNum, field: 'password', message: 'Password is required' });
      }
      if (!row.licenseNumber || !row.licenseNumber.trim()) {
        errors.push({ type: 'row', row: rowNum, field: 'licenseNumber', message: 'License number is required' });
      } else if (row.licenseNumber.length < 5 || row.licenseNumber.length > 20) {
        errors.push({ type: 'row', row: rowNum, field: 'licenseNumber', message: 'License number must be between 5 and 20 characters' });
      }
      if (!row.experienceYears || isNaN(parseInt(row.experienceYears))) {
        errors.push({ type: 'row', row: rowNum, field: 'experienceYears', message: 'Experience years is required and must be a number' });
      } else {
        const expYears = parseInt(row.experienceYears);
        if (expYears < 0 || expYears > 50) {
          errors.push({ type: 'row', row: rowNum, field: 'experienceYears', message: 'Experience years must be between 0 and 50' });
        }
      }
      // Normalize driverType early
      const normalizedDriverType = row.driverType ? row.driverType.trim().toLowerCase() : '';
      
      if (!row.driverType || !row.driverType.trim()) {
        errors.push({ type: 'row', row: rowNum, field: 'driverType', message: 'Driver type is required' });
      } else if (!['dellcube', 'vendor', 'temporary'].includes(normalizedDriverType)) {
        errors.push({ type: 'row', row: rowNum, field: 'driverType', message: 'Driver type must be dellcube, vendor, or temporary' });
      }
      
      // Filter placeholder values for company, branch, vendor
      const companyValue = filterPlaceholder(row.company) || defaultCompany || '';
      const branchValue = filterPlaceholder(row.branch) || defaultBranch || '';
      const vendorValue = filterPlaceholder(row.vendor);

      // Validate company and branch (can use defaults)
      if (!companyValue) {
        errors.push({ type: 'row', row: rowNum, field: 'company', message: 'Company is required. Please provide a valid company ID or ensure you have a default company set.' });
      } else if (companyValue && !/^[0-9a-fA-F]{24}$/.test(companyValue)) {
        errors.push({ type: 'row', row: rowNum, field: 'company', message: `Invalid company ID format: "${row.company}". Please provide a valid MongoDB ObjectId or leave empty to use default.` });
      }

      if (!branchValue) {
        errors.push({ type: 'row', row: rowNum, field: 'branch', message: 'Branch is required. Please provide a valid branch ID or ensure you have a default branch set.' });
      } else if (branchValue && !/^[0-9a-fA-F]{24}$/.test(branchValue)) {
        errors.push({ type: 'row', row: rowNum, field: 'branch', message: `Invalid branch ID format: "${row.branch}". Please provide a valid MongoDB ObjectId or leave empty to use default.` });
      }

      // Only validate vendor if driver type is actually "vendor" (case-insensitive)
      if (normalizedDriverType === 'vendor') {
        if (!vendorValue || !vendorValue.trim()) {
          errors.push({ type: 'row', row: rowNum, field: 'vendor', message: 'Vendor is required when driver type is vendor' });
        } else if (!/^[0-9a-fA-F]{24}$/.test(vendorValue)) {
          errors.push({ type: 'row', row: rowNum, field: 'vendor', message: `Invalid vendor ID format: "${row.vendor}". Please provide a valid MongoDB ObjectId.` });
        }
      }

      // Aadhar and PAN validation (required only for dellcube drivers)
      if (normalizedDriverType === 'dellcube') {
        if (!row.aadharNumber || !row.aadharNumber.trim()) {
          errors.push({ type: 'row', row: rowNum, field: 'aadharNumber', message: 'Aadhar number is required for company drivers' });
        } else if (!/^\d{12}$/.test(row.aadharNumber.replace(/\D/g, ''))) {
          errors.push({ type: 'row', row: rowNum, field: 'aadharNumber', message: 'Aadhar number must be exactly 12 digits' });
        }
        if (!row.panNumber || !row.panNumber.trim()) {
          errors.push({ type: 'row', row: rowNum, field: 'panNumber', message: 'PAN number is required for company drivers' });
        } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.panNumber.toUpperCase())) {
          errors.push({ type: 'row', row: rowNum, field: 'panNumber', message: 'PAN number must be in format ABCDE1234F' });
        }
      } else {
        // For vendor and temporary drivers, Aadhar and PAN are optional
        // But if provided, validate format
        if (row.aadharNumber && row.aadharNumber.trim()) {
          if (!/^\d{12}$/.test(row.aadharNumber.replace(/\D/g, ''))) {
            errors.push({ type: 'row', row: rowNum, field: 'aadharNumber', message: 'Aadhar number must be exactly 12 digits' });
          }
        }
        if (row.panNumber && row.panNumber.trim()) {
          if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(row.panNumber.toUpperCase())) {
            errors.push({ type: 'row', row: rowNum, field: 'panNumber', message: 'PAN number must be in format ABCDE1234F' });
          }
        }
      }

      // Bank Details validation (required only for dellcube drivers)
      if (normalizedDriverType === 'dellcube') {
        if (!row.accountHolderName || !row.accountHolderName.trim()) {
          errors.push({ type: 'row', row: rowNum, field: 'accountHolderName', message: 'Account holder name is required for company drivers' });
        }
        if (!row.bankName || !row.bankName.trim()) {
          errors.push({ type: 'row', row: rowNum, field: 'bankName', message: 'Bank name is required for company drivers' });
        }
        if (!row.accountNumber || !row.accountNumber.trim()) {
          errors.push({ type: 'row', row: rowNum, field: 'accountNumber', message: 'Account number is required for company drivers' });
        }
        if (!row.ifscCode || !row.ifscCode.trim()) {
          errors.push({ type: 'row', row: rowNum, field: 'ifscCode', message: 'IFSC code is required for company drivers' });
        } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(row.ifscCode.toUpperCase())) {
          errors.push({ type: 'row', row: rowNum, field: 'ifscCode', message: 'IFSC code must be in format ABCD0123456' });
        }
      } else {
        // For vendor and temporary drivers, bank details are optional
        // But if provided, validate IFSC format
        if (row.ifscCode && row.ifscCode.trim()) {
          if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(row.ifscCode.toUpperCase())) {
            errors.push({ type: 'row', row: rowNum, field: 'ifscCode', message: 'IFSC code must be in format ABCD0123456' });
          }
        }
      }
    });

    return errors;
  };

  // Handle CSV file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }
      
      setCsvFile(file);
      setUploadResults(null);
      setParsedCsvData([]);
      setCsvHeaders([]);
      setValidationErrors([]);

      // Read and parse the file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const { headers, rows } = parseCSVFile(text);
          
          setCsvHeaders(headers);
          setParsedCsvData(rows);
          
          // Validate the data
          const errors = validateCsvData(rows, headers);
          setValidationErrors(errors);
          
          if (errors.length > 0) {
            const headerErrors = errors.filter(e => e.type === 'header');
            const rowErrors = errors.filter(e => e.type === 'row');
            if (headerErrors.length > 0) {
              toast.error(headerErrors[0].message);
            } else {
              toast.error(`Found ${rowErrors.length} validation error(s). Please fix them before uploading.`);
            }
          } else {
            toast.success(`CSV parsed successfully. ${rows.length} row(s) ready to upload.`);
          }
        } catch (error) {
          toast.error(`Failed to parse CSV: ${error.message}`);
          console.error("CSV parsing error:", error);
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    // Check for validation errors before uploading
    if (validationErrors.length > 0) {
      toast.error("Please fix all validation errors before uploading");
      return;
    }

    if (parsedCsvData.length === 0) {
      toast.error("No data to upload");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("csvFile", csvFile);
      const defaultCompany = isBranchAdmin ? user?.company?._id : companyId === "all" ? "" : companyId;
      const defaultBranch = isBranchAdmin ? user?.branch?._id : branchId === "all" ? "" : branchId;
      if (defaultCompany) formDataToSend.append("company", defaultCompany);
      if (defaultBranch) formDataToSend.append("branch", defaultBranch);

      const result = await bulkUploadDrivers(formDataToSend).unwrap();
      
      if (result?.success) {
        setUploadResults(result.results);
        toast.success(result.message);
        setCsvFile(null);
        setParsedCsvData([]);
        setCsvHeaders([]);
        setValidationErrors([]);
        // Reset file input
        const fileInput = document.getElementById("csv-upload-drivers");
        if (fileInput) fileInput.value = "";
        // Refresh drivers list
        refetch();
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to upload drivers");
      console.error("Bulk upload error:", error);
    }
  };

  return (
    <section className="min-h-[100vh] rounded-md">
      <div className="p-2 md:p-6">
        {/* Header with Summary Cards (aligned like other pages) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">
                  Total Drivers
                </p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                  {totalDrivers}
                </p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <UserRound className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">
                  Active Drivers (this page)
                </p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                  {activeDrivers}
                </p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <CheckCircle className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">
                  Inactive Drivers (this page)
                </p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                  {inactiveDrivers}
                </p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <XCircle className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#828083] dark:text-gray-400">
                  Vendor Drivers (this page)
                </p>
                <p className="text-2xl font-bold text-[#202020] dark:text-[#FFD249]">
                  {vendorDrivers}
                </p>
              </div>
              <div className="p-3 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-xl">
                <Truck className="w-6 h-6 text-[#202020] dark:text-[#FFD249]" />
              </div>
            </div>
          </div>
        </div>

        {/* Header & actions */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 md:mb-4">
          <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 dark:text-white tracking-tight">
            {isVendor ? "Vendor Drivers" : "All Drivers"}
          </h2>
          <div className="flex gap-3 items-center flex-wrap">
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
            <Dialog 
              open={bulkUploadOpen} 
              onOpenChange={(open) => {
                setBulkUploadOpen(open);
                if (!open) {
                  // Reset state when dialog closes
                  setCsvFile(null);
                  setParsedCsvData([]);
                  setCsvHeaders([]);
                  setValidationErrors([]);
                  setUploadResults(null);
                  const fileInput = document.getElementById("csv-upload-drivers");
                  if (fileInput) fileInput.value = "";
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  className="rounded-full bg-[#FFD249]/80 text-[#202020] hover:bg-[#FFD249] font-semibold shadow-md px-4 py-2 flex items-center gap-2 border border-[#FFD249]"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Bulk Upload
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0">
                  <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-[#FFD249]" />
                    Bulk Upload Drivers
                  </DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to create multiple drivers at once. Download the sample CSV to see the required format.
                    <br />
                    <span className="text-sm text-gray-600 dark:text-gray-400 mt-2 block">
                      <strong>Note:</strong> Company and Branch fields in the CSV are optional - they will be auto-filled from your account settings if left empty.
                    </span>
                  </DialogDescription>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto space-y-4 px-6">
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={downloadSampleCSV}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Sample CSV
                    </Button>
                    <div className="flex-1">
                      <Label htmlFor="csv-upload-drivers" className="cursor-pointer">
                        <div className="flex items-center gap-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-[#FFD249] transition-colors">
                          <Upload className="w-5 h-5" />
                          <span className="text-sm">
                            {csvFile ? csvFile.name : "Choose CSV file to upload"}
                          </span>
                        </div>
                      </Label>
                      <input
                        id="csv-upload-drivers"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Validation Errors Display */}
                  {validationErrors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-red-600 dark:text-red-400 font-semibold">
                          Validation Errors ({validationErrors.length})
                        </span>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {validationErrors.map((error, idx) => (
                          <div key={idx} className="text-sm text-red-600 dark:text-red-400">
                            {error.type === 'header' ? (
                              <span className="font-medium">{error.message}</span>
                            ) : (
                              <span>
                                <strong>Row {error.row}</strong> - {error.field}: {error.message}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium">
                        Please fix all errors before uploading.
                      </p>
                    </div>
                  )}

                  {/* CSV Data Preview */}
                  {parsedCsvData.length > 0 && validationErrors.length === 0 && (
                    <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-700 dark:text-green-400 font-semibold">
                          Preview ({parsedCsvData.length} row(s) ready to upload)
                        </span>
                        <span className="text-xs text-green-600 dark:text-green-400">
                          ✓ All validations passed
                        </span>
                      </div>
                      <div className="overflow-x-auto max-h-[500px] overflow-y-auto border border-green-300 dark:border-green-700 rounded-lg">
                        <table className="min-w-full text-xs border-collapse">
                          <thead className="bg-green-100 dark:bg-green-900/40 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 py-2 border border-green-300 dark:border-green-700 text-left font-semibold bg-green-100 dark:bg-green-900/40">
                                Row
                              </th>
                              {csvHeaders.map((header, idx) => (
                                <th 
                                  key={idx} 
                                  className="px-3 py-2 border border-green-300 dark:border-green-700 text-left font-semibold bg-green-100 dark:bg-green-900/40 whitespace-nowrap"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {parsedCsvData.map((row, idx) => (
                              <tr 
                                key={idx} 
                                className={idx % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-green-50/50 dark:bg-green-900/10"}
                              >
                                <td className="px-3 py-2 border border-green-300 dark:border-green-700 font-medium text-center">
                                  {idx + 2}
                                </td>
                                {csvHeaders.map((header, hIdx) => (
                                  <td 
                                    key={hIdx} 
                                    className="px-3 py-2 border border-green-300 dark:border-green-700 whitespace-nowrap"
                                  >
                                    {row[header] ? (
                                      <span className="max-w-[200px] block truncate" title={row[header]}>
                                        {row[header]}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 italic">-</span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Showing all {parsedCsvData.length} row(s). Scroll to see all data.
                      </p>
                    </div>
                  )}

                {uploadResults && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-y-auto max-h-96">
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {uploadResults.total}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {uploadResults.successCount}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Success</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {uploadResults.errorCount}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
                        </div>
                      </div>

                      {uploadResults.errors.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-red-600 mb-2">Errors:</h4>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {uploadResults.errors.slice(0, 10).map((err, idx) => (
                              <div key={idx} className="text-sm text-red-600">
                                Row {err.row}: {err.name} - {err.error}
                              </div>
                            ))}
                            {uploadResults.errors.length > 10 && (
                              <div className="text-sm text-gray-500">
                                ... and {uploadResults.errors.length - 10} more errors
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {uploadResults.success.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-green-600 mb-2">Successfully Created:</h4>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {uploadResults.success.slice(0, 10).map((succ, idx) => (
                              <div key={idx} className="text-sm text-green-600">
                                Row {succ.row}: {succ.name}
                              </div>
                            ))}
                            {uploadResults.success.length > 10 && (
                              <div className="text-sm text-gray-500">
                                ... and {uploadResults.success.length - 10} more
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Fixed Upload Button at Bottom */}
                <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-900">
                  <Button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={!csvFile || isBulkUploading || validationErrors.length > 0 || parsedCsvData.length === 0}
                    className="w-full bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isBulkUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV {parsedCsvData.length > 0 && `(${parsedCsvData.length} row${parsedCsvData.length !== 1 ? 's' : ''})`}
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog> 
            <Button
              onClick={() => navigate("/admin/create-driver")}
              className="rounded-full bg-[#FFD249] text-[#202020] hover:bg-[#FFD249]/90 font-semibold shadow-md px-4 py-2"
            >
              Add Driver
            </Button>
            <Button
              className="p-2 rounded-full bg-[#FFD249]/20 text-[#202020] hover:bg-[#FFD249]/40"
              onClick={refetch}
              title="Refresh"
            >
              <GrPowerCycle />
            </Button>
            <Select
              value={limit.toString()}
              onValueChange={(val) => setLimit(Number(val))}
            >
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

        {showFilters && (
          <div className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg shadow mb-4 p-4 border border-[#FFD249]/40 dark:border-[#FFD249]/30">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status:
                </span>
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
              {!isVendor && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Driver Type:
                  </span>
                  <Select value={driverType} onValueChange={setDriverType}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="dellcube">Dellcube Driver</SelectItem>
                      <SelectItem value="vendor">Vendor Driver</SelectItem>
                      <SelectItem value="temporary">
                        Temporary Driver
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              {isSuperAdmin && (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Company:
                    </span>
                    <SearchableSelect
                      value={companyId}
                      onValueChange={(val) => {
                        setCompanyId(val);
                        setBranchId("all");
                      }}
                      options={[
                        { value: "all", label: "All Companies" },
                        ...(companyData?.companies?.map((comp) => ({
                          value: comp._id,
                          label: comp.name,
                        })) || [])
                      ]}
                      placeholder="All Companies"
                      emptyMessage="No companies found"
                      className="w-[200px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Branch:
                    </span>
                    <SearchableSelect
                      value={branchId}
                      onValueChange={setBranchId}
                      options={[
                        { value: "all", label: "All Branches" },
                        ...branches.map((b) => ({
                          value: b._id,
                          label: b.name,
                        }))
                      ]}
                      placeholder="All Branches"
                      disabled={companyId === "all"}
                      emptyMessage="No branches found"
                      className="w-[200px]"
                    />
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
                  if (!isVendor) {
                    setDriverType("all");
                  }
                }}
                className="text-xs"
              >
                Clear Filters
              </Button>
            </div>

            {(status !== "all" ||
              (driverType !== "all" && !isVendor) ||
              companyId !== "all" ||
              branchId !== "all" ||
              isVendor) && (
              <div className="mt-4 pt-3 border-t border-[#FFD249]/30">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Active Filters:</span>
                  {status !== "all" && (
                    <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                      Status: {status === "true" ? "Active" : "Inactive"}
                    </span>
                  )}
                  {isVendor && (
                    <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                      Type: Vendor Driver
                    </span>
                  )}
                  {!isVendor && driverType !== "all" && (
                    <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                      Type: {formatDriverType(driverType)}
                    </span>
                  )}
                  {companyId !== "all" &&
                    companyData?.companies?.find(
                      (c) => c._id === companyId
                    ) && (
                      <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                        Company:{" "}
                        {
                          companyData.companies.find((c) => c._id === companyId)
                            ?.name
                        }
                      </span>
                    )}
                  {branchId !== "all" &&
                    branches.find((b) => b._id === branchId) && (
                      <span className="px-2 py-1 bg-[#FFD249]/30 text-[#202020] rounded-full text-xs">
                        Branch: {branches.find((b) => b._id === branchId)?.name}
                      </span>
                    )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white/80 dark:bg-gray-900/80 rounded-2xl shadow-lg overflow-x-auto border border-gray-100 dark:border-gray-800 backdrop-blur-md">
          <table className="min-w-full text-sm">
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Driver Type
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Aadhar
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  PAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Companies
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Branches
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
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="text-center py-6">
                    <Loader2 className="animate-spin mx-auto text-[#FFD249]" />{" "}
                    Loading...
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
                    <td className="p-3 font-medium text-[#202020] dark:text-[#FFD249] text-center">
                      {limit * (page - 1) + (i + 1)}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-semibold">
                      {driver.name}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">
                      {driver.mobile}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-mono text-xs">
                      {formatDriverType(driver.driverType)}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-mono text-xs">
                      {driver.aadharNumber || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249] font-mono text-xs">
                      {driver.panNumber || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">
                      {formatCompanies(driver) || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-[#202020] dark:text-[#FFD249]">
                      {formatBranches(driver) || (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold text-center ${
                          driver.status
                            ? "bg-[#FFD249]/80 text-[#202020]"
                            : "bg-[#828083]/30 text-[#828083]"
                        }`}
                      >
                        {driver.status ? "Active" : "Inactive"}
                      </span>
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
                          <Button className="p-2 rounded-full bg-[#FFD249]/30 text-[#202020] hover:bg-[#FFD249]/60">
                            <FaRegTrashCan />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Driver?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the driver and remove their
                              data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(driver._id)}
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
                  <td colSpan="10" className="text-center py-10 text-[#828083]">
                    <Truck className="w-8 h-8 mx-auto text-[#828083]" />
                    <p className="text-[#828083] font-medium">
                      No Drivers Available
                    </p>
                    <p className="text-sm text-[#828083]">
                      Add a new driver to begin
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
            <thead className="bg-[#FFD249]/20 dark:bg-[#FFD249]/10 text-center">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  No
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Driver Type
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Aadhar
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  PAN
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Companies
                </th>
                <th className="px-6 py-3 text-xs font-semibold uppercase text-[#202020] dark:text-[#FFD249] tracking-wider">
                  Branches
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
            {data?.drivers?.length ? (data?.page - 1) * data?.limit + 1 : 0} to{" "}
            {Math.min(data?.page * data?.limit, data?.total || 0)} of{" "}
            <span className="font-medium">{data?.total || 0}</span> entries
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
                <span
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-full font-medium ${
                    selectedDriver?.status
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  }`}
                >
                  {selectedDriver?.status ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          }
          placement="right"
          width={480}
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
                <InfoRow
                  label="Name"
                  value={selectedDriver.name}
                  icon={UserRound}
                />
                <InfoRow
                  label="Status"
                  value={selectedDriver.status ? "Active" : "Inactive"}
                  icon={UserRound}
                />
                <InfoRow
                  label="Driver Type"
                  value={
                    selectedDriver.driverType
                      ? selectedDriver.driverType.charAt(0).toUpperCase() +
                        selectedDriver.driverType.slice(1)
                      : "N/A"
                  }
                  icon={Truck}
                />
                <InfoRow
                  label="Companies"
                  value={formatCompanies(selectedDriver)}
                  icon={Building2}
                />
                <InfoRow
                  label="Branches"
                  value={formatBranches(selectedDriver)}
                  icon={MapPin}
                />
                <InfoRow
                  label="License Number"
                  value={selectedDriver.licenseNumber}
                  icon={Truck}
                />
                <InfoRow
                  label="Experience"
                  value={
                    selectedDriver.experienceYears
                      ? `${selectedDriver.experienceYears} Years`
                      : ""
                  }
                  icon={Truck}
                />
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
