import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Loader2,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  FileText,
  Banknote,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  useGetVendorByIdMutation,
  useUpdateVendorMutation,
} from "@/features/api/Vendor/vendorApi";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import { BASE_URL } from "@/utils/BaseUrl";
import { useSelector } from "react-redux";
import { getTokenData } from "@/utils/getTokenData";

const UpdateVendor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = location.state?.vendorId;
  const user = useSelector((state) => state.auth.user);
  const isBranchAdmin = user?.role === "branchAdmin";
  const isOperation = user?.role === "operation";
  const isVendor = user?.role === "vendor";
  const shouldHideCompanyBranch = isBranchAdmin || isOperation || isVendor;
  
  // Get companyId and branchId from token (current session)
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
  
  // Helper functions to get company/branch ID - prioritize token (current session)
  const getUserCompanyId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenCompanyId) return tokenCompanyId;
    // Fallback to user profile data
    if (user?.company?._id) return user.company._id;
    if (Array.isArray(user?.company) && user.company.length > 0) {
      return String(user.company[0]._id || user.company[0]);
    }
    return "";
  };
  
  const getUserBranchId = () => {
    // Prioritize token data (current session selected company/branch)
    if (tokenBranchId) return tokenBranchId;
    // Fallback to user profile data
    if (user?.branch?._id) return user.branch._id;
    if (Array.isArray(user?.branch) && user.branch.length > 0) {
      return String(user.branch[0]._id || user.branch[0]);
    }
    return "";
  };

  const [vendorData, setVendorData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
    panNumber: "",
    bankName: "",
    accountNumber: "",
    ifsc: "",
    status: true,
    companies: [],
    branches: [],
    assignedClients: [],
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState("");

  // Store branches for each selected company
  const [branchesByCompany, setBranchesByCompany] = useState({});
  const [allCustomers, setAllCustomers] = useState([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  
  // State to store current session's company and branch names for display
  const [currentSessionCompanyName, setCurrentSessionCompanyName] = useState("");
  const [currentSessionBranchName, setCurrentSessionBranchName] = useState("");

  const [getVendorById, { data: viewData, isSuccess: isGetSuccess, isLoading: isVendorLoading }] =
    useGetVendorByIdMutation();
  const [updateVendor, { isLoading, isSuccess: isUpdateSuccess, error }] =
    useUpdateVendorMutation();

  useEffect(() => {
    if (vendorId) {
      getVendorById(vendorId);
    } else {
      toast.error("No vendor ID provided for update.");
      navigate("/admin/vendors");
    }
  }, [vendorId, getVendorById, navigate]);

  const { data: companyData } = useGetAllCompaniesQuery({
    page: 1,
    limit: 100,
  });
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();

  // Fetch and set current session's company and branch names for display
  useEffect(() => {
    if (shouldHideCompanyBranch) {
      const companyId = getUserCompanyId();
      const branchId = getUserBranchId();
      
      if (companyId && branchId) {
        // Fetch branches and find current branch name
        getBranchesByCompany(companyId).then((res) => {
          if (res?.data?.branches) {
            const currentBranch = res.data.branches.find(b => b._id === branchId);
            if (currentBranch) {
              setCurrentSessionBranchName(currentBranch.name);
            }
          }
        });
        
        // Find current company name
        if (companyData?.companies) {
          const currentCompany = companyData.companies.find(c => c._id === companyId);
          if (currentCompany) {
            setCurrentSessionCompanyName(currentCompany.name);
          }
        }
      }
    }
  }, [shouldHideCompanyBranch, companyData, tokenCompanyId, tokenBranchId]);

  useEffect(() => {
    if (isGetSuccess && viewData?.vendor) {
      const v = viewData.vendor;
      
      // Get companies (from companies array or single company)
      let companyIds = [];
      if (Array.isArray(v.company) && v.company.length > 0) {
        companyIds = v.company.map(c => String(c._id || c)).filter(Boolean);
      } else if (v.company?._id) {
        companyIds = [String(v.company._id)];
      } else if (shouldHideCompanyBranch) {
        const companyId = getUserCompanyId() || getTokenData().companyId || "";
        if (companyId) companyIds = [String(companyId)];
      }
      
      // Get branches (from branches array or single branch)
      let branchIds = [];
      if (Array.isArray(v.branch) && v.branch.length > 0) {
        branchIds = v.branch.map(b => String(b._id || b)).filter(Boolean);
      } else if (v.branch?._id) {
        branchIds = [String(v.branch._id)];
      } else if (shouldHideCompanyBranch) {
        const branchId = getUserBranchId() || getTokenData().branchId || "";
        if (branchId) branchIds = [String(branchId)];
      }
      
      setVendorData({
        name: v.name || "",
        phone: v.phone || "",
        email: v.email || "",
        address: v.address || "",
        gstNumber: v.gstNumber || "",
        panNumber: v.panNumber || "",
        bankName: v.bankName || "",
        accountNumber: v.accountNumber || "",
        ifsc: v.ifsc || "",
        status: v.vendorStatus === "active" || v.status === "active" || v.status === true,
        companies: companyIds,
        branches: branchIds,
        assignedClients: v.assignedClients?.map((client) => client._id || client) || [],
      });
      setSignaturePreview(v.signature?.url || "");

      // Fetch branches for all companies
      const fetchBranchesForCompanies = async () => {
        const branchesMap = {};
        for (const companyId of companyIds) {
          if (companyId) {
            try {
              const result = await getBranchesByCompany(companyId);
              branchesMap[companyId] = result?.data?.branches || [];
            } catch (err) {
              console.error(`Failed to fetch branches for company ${companyId}`, err);
            }
          }
        }
        setBranchesByCompany(branchesMap);
      };
      
      if (companyIds.length > 0) {
        fetchBranchesForCompanies();
      }
    }
  }, [isGetSuccess, viewData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendorData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle company selection (multiple)
  const handleCompanyToggle = async (companyId) => {
    // Don't allow changing company for operation, branchAdmin, vendor
    if (shouldHideCompanyBranch) {
      return;
    }

    const isSelected = vendorData.companies.includes(companyId);
    let newCompanies = [];
    
    if (isSelected) {
      // Remove company
      newCompanies = vendorData.companies.filter(id => id !== companyId);
      // Remove branches for this company
      const newBranchesByCompany = { ...branchesByCompany };
      delete newBranchesByCompany[companyId];
      setBranchesByCompany(newBranchesByCompany);
      // Remove branches that belong to this company
      const companyBranches = branchesByCompany[companyId] || [];
      const companyBranchIds = companyBranches.map(b => b._id);
      const newBranches = vendorData.branches.filter(bId => !companyBranchIds.includes(bId));
      setVendorData(prev => ({ ...prev, companies: newCompanies, branches: newBranches }));
    } else {
      // Add company
      newCompanies = [...vendorData.companies, companyId];
      setVendorData(prev => ({ ...prev, companies: newCompanies }));
      // Fetch branches for this company
      try {
        const result = await getBranchesByCompany(companyId);
        const branches = result?.data?.branches || [];
        setBranchesByCompany(prev => ({
          ...prev,
          [companyId]: branches
        }));
      } catch (err) {
        toast.error("Failed to fetch branches for selected company");
      }
    }
  };

  // Handle branch selection (multiple)
  const handleBranchToggle = (branchId) => {
    const isSelected = vendorData.branches.includes(branchId);
    if (isSelected) {
      setVendorData(prev => ({
        ...prev,
        branches: prev.branches.filter(id => id !== branchId)
      }));
    } else {
      setVendorData(prev => ({
        ...prev,
        branches: [...prev.branches, branchId]
      }));
    }
  };

  // Fetch customers for all selected companies and branches
  useEffect(() => {
    const fetchCustomers = async () => {
      if (vendorData.companies.length === 0 || vendorData.branches.length === 0) {
        setAllCustomers([]);
        return;
      }

      setIsLoadingCustomers(true);
      try {
        // Fetch customers for each company/branch combination
        const customerPromises = [];
        for (const companyId of vendorData.companies) {
          for (const branchId of vendorData.branches) {
            // Fetch customers for this company/branch combination
            // BASE_URL already includes /api, so we use /customers/all
            // Use credentials: 'include' to send cookies (token is in cookies)
            customerPromises.push(
              fetch(`${BASE_URL}/customers/all?companyId=${companyId}&branchId=${branchId}&status=true&page=1&limit=1000`, {
                method: 'GET',
                credentials: 'include', // This sends cookies automatically
                headers: {
                  'Content-Type': 'application/json'
                }
              })
              .then(async (res) => {
                if (!res.ok) {
                  const errorText = await res.text();
                  console.error(`Failed to fetch customers for company ${companyId}, branch ${branchId}:`, res.status, errorText);
                  return { success: false, customers: [] };
                }
                const data = await res.json();
                console.log(`Customers fetched for company ${companyId}, branch ${branchId}:`, data);
                return data;
              })
              .catch((error) => {
                console.error(`Error fetching customers for company ${companyId}, branch ${branchId}:`, error);
                return { success: false, customers: [] };
              })
            );
          }
        }

        const results = await Promise.all(customerPromises);
        const allCustomersList = [];
        const customerMap = new Map();

        console.log("Customer fetch results:", results);
        
        results.forEach((result, index) => {
          console.log(`Processing result ${index}:`, result);
          if (result.success && result.customers && Array.isArray(result.customers)) {
            console.log(`Found ${result.customers.length} customers in result ${index}`);
            result.customers.forEach((customer) => {
              // Avoid duplicates based on customer ID
              if (customer._id && !customerMap.has(customer._id)) {
                customerMap.set(customer._id, customer);
                allCustomersList.push(customer);
              }
            });
          } else {
            console.warn(`Result ${index} is not valid:`, result);
          }
        });

        console.log("Total unique customers found:", allCustomersList.length);
        setAllCustomers(allCustomersList);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to fetch customers");
        setAllCustomers([]);
      } finally {
        setIsLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [vendorData.companies, vendorData.branches]);


  const handleStatusToggle = (checked) => {
    setVendorData((prev) => ({
      ...prev,
      status: checked,
    }));
  };

  const handleUpdate = async () => {
    const {
      name,
      phone,
      email,
      company,
      branch,
      assignedClients,
      status: isStatusActive,
      panNumber,
    } = vendorData;

    // Detailed validation with specific error messages
    if (!name?.trim()) {
      toast.error("Vendor Name is required");
      return;
    }

    // Email is optional for vendors - only validate format if provided
    if (email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (!phone?.trim()) {
      toast.error("Phone number is required");
      return;
    }

    // Phone number validation
    if (phone.length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    // For superAdmin, use form values; for others, use profile/token
    let finalCompanies = [];
    let finalBranches = [];
    
    if (shouldHideCompanyBranch) {
      // For operation, branchAdmin, vendor - use profile data
      const companyId = getUserCompanyId() || tokenCompanyId || "";
      const branchId = getUserBranchId() || tokenBranchId || "";
      if (companyId) finalCompanies = [companyId];
      if (branchId) finalBranches = [branchId];
    } else {
      // For superAdmin - use form values
      finalCompanies = vendorData.companies || [];
      finalBranches = vendorData.branches || [];
    }

    if (finalCompanies.length === 0) {
      toast.error("At least one company is required");
      return;
    }

    if (finalBranches.length === 0) {
      toast.error("At least one branch is required");
      return;
    }

    if (!panNumber?.trim()) {
      toast.error("PAN Number is required");
      return;
    }

    if (!assignedClients || assignedClients.length === 0) {
      toast.error("At least one customer must be assigned");
      return;
    }

    if (!vendorId) {
      toast.error("Vendor ID is missing. Please try again.");
      return;
    }

    try {
      const statusString = isStatusActive ? "active" : "inactive";
      const payload = new FormData();
      payload.append("vendorId", vendorId);
      console.log("Updating vendor with ID:", vendorId);
      payload.append("name", vendorData.name);
      payload.append("email", vendorData.email);
      payload.append("phone", vendorData.phone);
      payload.append("address", vendorData.address);
      payload.append("gstNumber", vendorData.gstNumber || "");
      payload.append("panNumber", vendorData.panNumber);
      payload.append("bankName", vendorData.bankName || "");
      payload.append("accountNumber", vendorData.accountNumber || "");
      payload.append("ifsc", vendorData.ifsc || "");
      payload.append("status", statusString);
      // Append companies and branches as arrays
      finalCompanies.forEach(compId => payload.append("company", compId));
      finalBranches.forEach(branchId => payload.append("branch", branchId));
      // Append each assigned client
      vendorData.assignedClients.forEach((clientId) => {
        payload.append("assignedClients", clientId);
      });
      if (signatureFile) {
        payload.append("signature", signatureFile);
      }

      const result = await updateVendor(payload).unwrap();
      // Success is handled in useEffect
    } catch (err) {
      // Detailed error handling
      if (err?.data?.message) {
        toast.error(err.data.message);
      } else if (err?.data?.error) {
        toast.error(err.data.error);
      } else if (err?.message) {
        toast.error(err.message);
      } else {
        toast.error("Failed to update vendor. Please try again.");
      }
      console.error("Update vendor error:", err);
    }
  };

  useEffect(() => {
    if (isUpdateSuccess) {
      toast.success("Vendor updated successfully");
      setTimeout(() => navigate("/admin/vendors"), 1500);
    }
  }, [isUpdateSuccess, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/vendors")}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Vendors
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Users className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Vendor
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update vendor details and information
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Fields marked with <span className="text-red-500">*</span> are required.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        {isVendorLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#FFD249]" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-[#202020]" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Vendor Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Eg. ABC Logistics"
                      value={vendorData.name}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Email Address (Optional)"
                      value={vendorData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="10-digit phone number"
                      value={vendorData.phone}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      }}
                      maxLength="10"
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      value={vendorData.address}
                      onChange={handleChange}
                      placeholder="Address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Companies *</Label>
                    {shouldHideCompanyBranch ? (
                      <Input
                        value={currentSessionCompanyName || "Loading..."}
                        disabled
                        className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                      />
                    ) : (
                      <>
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                          {companyData?.companies?.length > 0 ? (
                            companyData.companies.map((c) => (
                              <div key={c._id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`company-${c._id}`}
                                  checked={vendorData.companies.includes(c._id)}
                                  onCheckedChange={() => handleCompanyToggle(c._id)}
                                />
                                <label
                                  htmlFor={`company-${c._id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {c.name} ({c.companyCode})
                                </label>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No companies available</p>
                          )}
                        </div>
                        {vendorData.companies.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {vendorData.companies.length} company(s) selected
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Branches *</Label>
                    {shouldHideCompanyBranch ? (
                      <Input
                        value={currentSessionBranchName || "Loading..."}
                        disabled
                        className="bg-gray-100 cursor-not-allowed dark:bg-gray-800"
                      />
                    ) : (
                      <>
                        <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                          {vendorData.companies.length === 0 ? (
                            <p className="text-sm text-gray-500">Please select at least one company first</p>
                          ) : Object.keys(branchesByCompany).length === 0 ? (
                            <p className="text-sm text-gray-500">Loading branches...</p>
                          ) : (
                            Object.entries(branchesByCompany).map(([companyId, branches]) => {
                              const company = companyData?.companies?.find(c => c._id === companyId);
                              return (
                                <div key={companyId} className="space-y-2">
                                  {company && (
                                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-2 first:mt-0">
                                      {company.name}:
                                    </p>
                                  )}
                                  {branches.map((b) => (
                                    <div key={b._id} className="flex items-center space-x-2 ml-4">
                                      <Checkbox
                                        id={`branch-${b._id}`}
                                        checked={vendorData.branches.includes(b._id)}
                                        onCheckedChange={() => handleBranchToggle(b._id)}
                                      />
                                      <label
                                        htmlFor={`branch-${b._id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {b.name} ({b.branchCode})
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              );
                            })
                          )}
                        </div>
                        {vendorData.branches.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {vendorData.branches.length} branch(es) selected
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="assignedClients">Assigned Customers *</Label>
                    <div className="mt-2 border rounded-md p-4 max-h-80 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                      {isLoadingCustomers ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">Loading customers...</p>
                      ) : vendorData.companies.length === 0 || vendorData.branches.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Please select at least one company and branch to view customers
                        </p>
                      ) : allCustomers.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No customers available for selected companies and branches
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {(() => {
                            // Group customers by company and branch
                            const groupedCustomers = {};
                            allCustomers.forEach((customer) => {
                              const companyId = customer.company?._id || customer.company || 'unknown';
                              const branchId = customer.branch?._id || customer.branch || 'unknown';
                              const companyName = customer.company?.name || 'Unknown Company';
                              const branchName = customer.branch?.name || 'Unknown Branch';
                              const key = `${companyId}-${branchId}`;
                              
                              if (!groupedCustomers[key]) {
                                groupedCustomers[key] = {
                                  companyName,
                                  branchName,
                                  companyId,
                                  branchId,
                                  customers: []
                                };
                              }
                              groupedCustomers[key].customers.push(customer);
                            });

                            return Object.values(groupedCustomers).map((group) => (
                              <div key={`${group.companyId}-${group.branchId}`} className="space-y-2">
                                <div className="sticky top-0 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-800">
                                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                    {group.companyName} → {group.branchName}
                                  </p>
                                </div>
                                <div className="ml-2 space-y-2">
                                  {group.customers.map((customer) => (
                                    <div
                                      key={customer._id}
                                      className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md border-l-2 border-blue-200 dark:border-blue-800"
                                    >
                                      <Checkbox
                                        id={`customer-${customer._id}`}
                                        checked={vendorData.assignedClients.includes(
                                          customer._id
                                        )}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setVendorData({
                                              ...vendorData,
                                              assignedClients: [
                                                ...vendorData.assignedClients,
                                                customer._id,
                                              ],
                                            });
                                          } else {
                                            setVendorData({
                                              ...vendorData,
                                              assignedClients: vendorData.assignedClients.filter(
                                                (id) => id !== customer._id
                                              ),
                                            });
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={`customer-${customer._id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        <span className="font-semibold">{customer.name}</span>
                                        {customer.email && (
                                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                                            ({customer.email})
                                          </span>
                                        )}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Select one or more customers to assign to this vendor. The
                      vendor will be able to create dockets for these customers
                      only.
                    </p>
                    {vendorData.assignedClients.length > 0 && (
                      <p className="text-xs text-[#FFD249] mt-1 font-medium">
                        {vendorData.assignedClients.length} customer(s) selected
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="status"
                      checked={vendorData.status}
                      onCheckedChange={handleStatusToggle}
                    />
                    <Label htmlFor="status">
                      {vendorData.status ? "Active" : "Inactive"} Vendor
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Signature Upload */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#202020]" />
                Authorized Signature
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <Label>Upload Signature</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setSignatureFile(file || null);
                      setSignaturePreview(
                        file ? URL.createObjectURL(file) : signaturePreview
                      );
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PNG, JPG. Recommended transparent
                    background.
                  </p>
                <p className="text-xs text-blue-600 mt-1">
                  This signature will print automatically on dockets handled by
                  this vendor.
                </p>
                </div>
                {signaturePreview && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <Label className="text-xs text-gray-600">Current Preview</Label>
                    <img
                      src={signaturePreview}
                      alt="Signature preview"
                      className="mt-2 max-h-32 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

            {/* Business Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-[#202020]" />
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gstNumber">GST Number</Label>
                    <Input
                      id="gstNumber"
                      name="gstNumber"
                      value={vendorData.gstNumber}
                      onChange={handleChange}
                      placeholder="GST Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="panNumber">PAN Number *</Label>
                    <Input
                      id="panNumber"
                      name="panNumber"
                      value={vendorData.panNumber}
                      onChange={handleChange}
                      placeholder="PAN Number"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Banknote className="w-5 h-5 text-[#202020]" />
                  Bank Account Details (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      name="bankName"
                      value={vendorData.bankName}
                      onChange={handleChange}
                      placeholder="Bank Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      name="accountNumber"
                      value={vendorData.accountNumber}
                      onChange={handleChange}
                      placeholder="Account Number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    <Input
                      id="ifsc"
                      name="ifsc"
                      value={vendorData.ifsc}
                      onChange={handleChange}
                      placeholder="IFSC Code"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
              <Button
                variant="outline"
                onClick={() => navigate("/admin/vendors")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={isLoading}
                className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Vendor"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateVendor;
