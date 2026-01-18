import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import {
  Loader2,
  Truck,
  Building2,
  User,
  Calendar,
  CreditCard,
  Package,
  MapPin,
  FileText,
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Hash,
  Weight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MultiValueInput from "./MultiValueInput.jsx";

// API imports
import { useCreateInvoiceMutation } from "@/features/api/Invoice/invoiceApi.js";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import { useGetAllCustomersQuery, useUpdateCustomerMutation } from "@/features/api/Customer/customerApi.js";
// Remove unused region API imports since we're no longer using the region system
// import { useGetAllCountriesQuery } from "@/features/api/Region/countryApi.js";
// import { useGetStatesByCountryMutation } from "@/features/api/Region/stateApi.js";
// import { useGetCitiesByStateMutation } from "@/features/api/Region/cityApi.js";
// import { useGetLocalitiesByCityMutation } from "@/features/api/Region/LocalityApi.js";
// import { useGetPincodesByLocalityMutation } from "@/features/api/Region/pincodeApi.js";
import { useGetAllGoodsQuery } from "@/features/api/Goods/goodsApi.js";
import {
  useGetAllVehiclesQuery,
  useSearchVehiclesMutation,
  useCreateVehicleMutation,
} from "@/features/api/Vehicle/vehicleApi.js";
import {
  useGetAllVendorsQuery,
  useGetVendorByIdMutation,
} from "@/features/api/Vendor/vendorApi.js";
import {
  useGetAllDriversQuery,
  useCreateDriverMutation,
} from "@/features/api/authApi";
import { useGetAllSiteTypesQuery } from "@/features/api/SiteType/siteTypeApi.js";
import { useGetAllTransportModesQuery } from "@/features/api/TransportMode/transportModeApi.js";
import { useDebounce } from "@/hooks/Debounce.jsx";
import { getTokenData } from "@/utils/getTokenData";

// AddressFields Component (extracted to prevent re-creation on every render)
const AddressFields = ({
  type,
  pincode,
  setPincode,
  addressDetails,
  isLoading,
  address,
  setAddress,
  fetchAddressFromPincode,
  selectPostOffice,
}) => {
  return (
    <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-4 h-4 text-blue-600" />
          {type === "from" ? "Pickup Address" : "Delivery Address"}
          <Badge
            variant={type === "from" ? "default" : "secondary"}
            className="ml-auto text-xs"
          >
            {type === "from" ? "FROM" : "TO"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Address</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={`Enter ${
                type === "from" ? "pickup" : "delivery"
              } address`}
              className="w-full"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Pincode</Label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={pincode}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow digits and limit to 6 characters
                  if (/^\d*$/.test(value) && value.length <= 6) {
                    setPincode(value);
                  }
                }}
                onKeyPress={(e) => {
                  // Only allow digits
                  if (!/\d/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                placeholder="Enter 6-digit pincode"
                className="w-full"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
              />
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {pincode.length === 6 && !isLoading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fetchAddressFromPincode(pincode, type)}
                  className="px-3"
                  title="Refresh address details"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Post Office Selection Dropdown */}
          {addressDetails?.allPostOffices &&
            addressDetails.allPostOffices.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Select Post Office
                </Label>
                <Select
                  value={
                    addressDetails.selectedPostOffice
                      ? String(addressDetails.allPostOffices.findIndex(
                          po => po.Name === addressDetails.selectedPostOffice.Name &&
                                po.District === addressDetails.selectedPostOffice.District
                        ))
                      : ""
                  }
                  onValueChange={(indexStr) => {
                    const index = parseInt(indexStr, 10);
                    console.log(`Dropdown changed for ${type}, index:`, index);
                    const selectedPostOffice = addressDetails.allPostOffices[index];
                    console.log(`Selected post office:`, selectedPostOffice);
                    if (selectedPostOffice) {
                      selectPostOffice(selectedPostOffice, type);
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a post office" />
                  </SelectTrigger>
                  <SelectContent>
                    {addressDetails.allPostOffices.map(
                      (postOffice, index) => (
                        <SelectItem 
                          key={`${type}-po-${index}`} 
                          value={String(index)}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {postOffice.Name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {postOffice.Block || postOffice.Taluk},{" "}
                              {postOffice.District}, {postOffice.State}
                            </span>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

          {/* Display selected address details */}
          {addressDetails?.name && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
              <Label className="text-sm font-medium mb-2 block text-blue-800 dark:text-blue-200">
                Selected Address Details
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">City:</span>{" "}
                  {addressDetails.name}
                </div>
                <div>
                  <span className="font-medium">District:</span>{" "}
                  {addressDetails.district}
                </div>
                <div>
                  <span className="font-medium">State:</span>{" "}
                  {addressDetails.state}
                </div>
                <div>
                  <span className="font-medium">Country:</span>{" "}
                  {addressDetails.country}
                </div>
                {addressDetails.taluk && (
                  <div>
                    <span className="font-medium">Taluk:</span>{" "}
                    {addressDetails.taluk}
                  </div>
                )}
                {addressDetails.division && (
                  <div>
                    <span className="font-medium">Division:</span>{" "}
                    {addressDetails.division}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CreateInvoice = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "superAdmin";
  const isBranchAdmin = user?.role === "branchAdmin";
  const isVendor = user?.role === "vendor";

  // Get companyId and branchId from token (current session)
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
  
  // Helper functions to get company/branch ID from user object (handles arrays)
  const getUserCompanyId = () => {
    if (Array.isArray(user?.company) && user.company.length > 0) {
      return String(user.company[0]._id || user.company[0]);
    }
    return user?.company?._id ? String(user.company._id) : tokenCompanyId || "";
  };
  
  const getUserBranchId = () => {
    if (Array.isArray(user?.branch) && user.branch.length > 0) {
      return String(user.branch[0]._id || user.branch[0]);
    }
    return user?.branch?._id ? String(user.branch._id) : tokenBranchId || "";
  };

  // Initialize with user's company/branch for branch admins, or token values
  const [companyId, setCompanyId] = useState(
    isBranchAdmin || isVendor ? getUserCompanyId() : tokenCompanyId || ""
  );
  const [branchId, setBranchId] = useState(
    isBranchAdmin || isVendor ? getUserBranchId() : tokenBranchId || ""
  );
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dispatchDateTime, setDispatchDateTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [paymentType, setPaymentType] = useState("");
  const [remarks, setRemarks] = useState("");

  const [totalWeight, setTotalWeight] = useState("");
  const [freightCharges, setFreightCharges] = useState("");
  const [numberOfPackages, setNumberOfPackages] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedGood, setSelectedGood] = useState("");
  const [selectedItems, setselectedItems] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedVendorVehicle, setSelectedVendorVehicle] = useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [driverContactNumber, setDriverContactNumber] = useState("");

  // Add new state variables for the new fields
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [consignor, setConsignor] = useState("");
  const [consignee, setConsignee] = useState("");
  const [address, setAddress] = useState("");
  const [invoiceNumbers, setInvoiceNumbers] = useState([]);
  const [invoiceBill, setInvoiceBill] = useState("");
  const [ewayBillNumbers, setEwayBillNumbers] = useState([]);
  const [siteId, setSiteId] = useState("");
  const [sealNo, setSealNo] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [selectedSiteType, setSelectedSiteType] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [searchedVehicle, setSearchedVehicle] = useState(null);
  const [vehicleSearchError, setVehicleSearchError] = useState("");
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const debouncedSearchTerm = useDebounce(vehicleNumber, 500);
  const vehicleSearchRef = React.useRef(null);
  const [suggestionsPosition, setSuggestionsPosition] = useState("top");

  // Add state for vehicle size
  const [vehicleSize, setVehicleSize] = useState("");

  // Replace with simple pincode-based address fields

  // Replace with simple pincode-based address fields
  const [fromPincode, setFromPincode] = useState("");
  const [fromAddressDetails, setFromAddressDetails] = useState(null);
  const [toPincode, setToPincode] = useState("");
  const [toAddressDetails, setToAddressDetails] = useState(null);
  const [isLoadingFromPincode, setIsLoadingFromPincode] = useState(false);
  const [isLoadingToPincode, setIsLoadingToPincode] = useState(false);

  const [selectedTransportMode, setSelectedTransportMode] = useState("");

  // Function to fetch address details from pincode
  const fetchAddressFromPincode = async (pincode, type) => {
    if (!pincode || pincode.length !== 6) return;

    const setIsLoading =
      type === "from" ? setIsLoadingFromPincode : setIsLoadingToPincode;
    const setAddressDetails =
      type === "from" ? setFromAddressDetails : setToAddressDetails;
    const setAddress = type === "from" ? setPickupAddress : setDeliveryAddress;

    setIsLoading(true);
    try {
      // Try multiple CORS proxies and direct API calls
      let response;
      let data;

      // Try different approaches in sequence
      const attempts = [
        // Direct HTTPS call
        () => fetch(`https://www.postalpincode.in/api/pincode/${pincode}`),
        // Alternative API endpoint
        () => fetch(`https://api.postalpincode.in/pincode/${pincode}`),
        // CORS proxy 1
        () =>
          fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(
              `http://www.postalpincode.in/api/pincode/${pincode}`
            )}`
          ),
        // CORS proxy 2
        () =>
          fetch(
            `https://cors-anywhere.herokuapp.com/https://www.postalpincode.in/api/pincode/${pincode}`
          ),
        // CORS proxy 3
        () =>
          fetch(
            `https://thingproxy.freeboard.io/fetch/https://www.postalpincode.in/api/pincode/${pincode}`
          ),
      ];

      for (let i = 0; i < attempts.length; i++) {
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          response = await attempts[i]();
          clearTimeout(timeoutId);

          if (response.ok) {
            data = await response.json();
            break;
          }
        } catch (error) {
          console.log(`Attempt ${i + 1} failed:`, error);
          continue;
        }
      }

      if (!data) {
        throw new Error("All API attempts failed");
      }

      // Debug logging
      console.log("API Response:", data);
      console.log("Response type:", typeof data);
      console.log("Is array:", Array.isArray(data));

      // Handle different API response formats
      let postOfficeData = data;

      // Check if response is wrapped in an array (like your API response)
      if (Array.isArray(data) && data.length > 0) {
        postOfficeData = data[0];
      }

      console.log("Processed postOfficeData:", postOfficeData);

      if (
        postOfficeData.Status === "Success" &&
        postOfficeData.PostOffice &&
        postOfficeData.PostOffice.length > 0
      ) {
        if (postOfficeData.PostOffice.length === 1) {
          // Single post office, set directly
          const postOffice = postOfficeData.PostOffice[0];
          const addressData = {
            name: postOffice.Name,
            taluk: postOffice.Block || postOffice.Taluk, // Handle different field names
            district: postOffice.District,
            division: postOffice.Division,
            region: postOffice.Region,
            state: postOffice.State,
            country: postOffice.Country,
            branchType: postOffice.BranchType,
            deliveryStatus: postOffice.DeliveryStatus,
            allPostOffices: postOfficeData.PostOffice,
            selectedPostOffice: postOffice,
          };

          console.log("Setting address details:", addressData);
          setAddressDetails(addressData);
          
          // Auto-update the address field
          const addressText = `${postOffice.Name}, ${postOffice.Block || postOffice.Taluk}, ${postOffice.District}, ${postOffice.State} - ${postOffice.Country}`;
          setAddress(addressText);
        } else {
          // Multiple post offices, store all for selection
          setAddressDetails({
            allPostOffices: postOfficeData.PostOffice,
            selectedPostOffice: null,
            name: null,
            taluk: null,
            district: null,
            division: null,
            region: null,
            state: null,
            country: null,
            branchType: null,
            deliveryStatus: null,
          });
        }
      } else {
        setAddressDetails(null);
        toast.error("Invalid pincode or no data found");
      }
    } catch (error) {
      console.error("Error fetching pincode data:", error);
      setAddressDetails(null);

      // Provide more specific error messages
      if (error.message.includes("Failed to fetch")) {
        toast.error(
          "Network error. Please check your internet connection or try again later."
        );
      } else if (error.message.includes("CORS")) {
        toast.error("Service temporarily unavailable. Please try again later.");
      } else if (error.message.includes("All API attempts failed")) {
        toast.error(
          "Unable to fetch address details. Please try again later or enter address manually."
        );
      } else {
        toast.error("Error fetching address details. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to select a specific post office from multiple options
  const selectPostOffice = (postOffice, type) => {
    console.log(`Selecting post office for ${type}:`, postOffice);
    
    const setAddressDetails =
      type === "from" ? setFromAddressDetails : setToAddressDetails;
    const setAddress = type === "from" ? setPickupAddress : setDeliveryAddress;

    // Auto-update the address field with selected post office details
    const addressText = `${postOffice.Name}, ${postOffice.Block || postOffice.Taluk}, ${postOffice.District}, ${postOffice.State} - ${postOffice.Country}`;
    
    console.log(`Setting address text for ${type}:`, addressText);
    
    // Update address details for display
    setAddressDetails((prev) => {
      const updated = {
        allPostOffices: prev?.allPostOffices || [], // Explicitly preserve the post offices list
        name: postOffice.Name,
        taluk: postOffice.Block || postOffice.Taluk,
        district: postOffice.District,
        division: postOffice.Division,
        region: postOffice.Region,
        state: postOffice.State,
        country: postOffice.Country,
        branchType: postOffice.BranchType,
        deliveryStatus: postOffice.DeliveryStatus,
        selectedPostOffice: postOffice,
      };
      console.log(`Updated ${type} addressDetails:`, updated);
      return updated;
    });

    // Set the address text
    setAddress(addressText);
  };

  // Remove old region-related API calls since they're no longer needed
  // const [getFromStatesByCountry, { data: fromStateData }] =
  //   useGetStatesByCountryMutation();
  // const [getFromCitiesByState, { data: fromCityData }] =
  //   useGetCitiesByStateMutation();
  // const [getFromLocalitiesByCity, { data: fromLocalityData }] =
  //   useGetLocalitiesByCityMutation();
  // const [getFromPincodesByLocality, { data: fromPincodeData }] =
  //   useGetPincodesByLocalityMutation();

  // const [getToStatesByCountry, { data: toStateData }] =
  //   useGetStatesByCountryMutation();
  // const [getToCitiesByState, { data: toCityData }] =
  //   useGetCitiesByStateMutation();
  // const [getToLocalitiesByCity, { data: toLocalityData }] =
  //   useGetLocalitiesByCityMutation();
  // const [getToPincodesByLocality, { data: toPincodeData }] =
  //   useGetPincodesByLocalityMutation();

  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  
  // Use token values as fallback for customer query
  const finalCompanyIdForQuery = companyId || tokenCompanyId || "";
  const finalBranchIdForQuery = branchId || tokenBranchId || "";
  
  const { data: customersData } = useGetAllCustomersQuery(
    { companyId: finalCompanyIdForQuery, branchId: finalBranchIdForQuery, status: "true" },
    { skip: !finalCompanyIdForQuery || !finalBranchIdForQuery }
  );
  // console.log(customersData)
  // Remove unused countries query since we're no longer using the region system
  // const { data: countries } = useGetAllCountriesQuery({
  //   page: 1,
  //   limit: 10000,
  // });
  const { data: driversData, isLoading: isDriversLoading } =
    useGetAllDriversQuery({});
  const { data: goodsData } = useGetAllGoodsQuery({ page: 1, limit: 1000 });

  const { data: vehicleData, refetch: refetchVehicles } =
    useGetAllVehiclesQuery(
      {
        page: 1,
        limit: 1000,
        companyId: finalCompanyIdForQuery,
        branchId: finalBranchIdForQuery,
      },
      {
        skip: !finalCompanyIdForQuery || !finalBranchIdForQuery,
      }
    );

  const { data: vendorData, refetch: refetchVendors } = useGetAllVendorsQuery(
    {
      companyId: finalCompanyIdForQuery,
      branchId: finalBranchIdForQuery,
      status: "active",
    },
    {
      skip: !finalCompanyIdForQuery || !finalBranchIdForQuery,
    }
  );

  const { data: siteTypesData } = useGetAllSiteTypesQuery({
    page: 1,
    limit: 1000,
    status: "true",
  });

  const { data: transportModesData } = useGetAllTransportModesQuery({
    page: 1,
    limit: 1000,
    status: "true",
  });

  const [getVendorById, { data: vendorDetails }] = useGetVendorByIdMutation();
  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();
  const [searchVehicles, { isLoading: isSearchingVehicle }] =
    useSearchVehiclesMutation();
  const [updateCustomer, { isLoading: isUpdatingCustomer }] = useUpdateCustomerMutation();
  const [createVehicle, { isLoading: isCreatingVehicle }] = useCreateVehicleMutation();

  // Add new state for consignor/consignee dropdowns
  const [selectedConsignor, setSelectedConsignor] = useState("");
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [availableConsignors, setAvailableConsignors] = useState([]);
  const [availableConsignees, setAvailableConsignees] = useState([]);
  const [consignorAddress, setConsignorAddress] = useState("");
  const [consigneeAddress, setConsigneeAddress] = useState("");
  
  // Add modal states for adding new consignee/consignor
  const [showAddConsigneeModal, setShowAddConsigneeModal] = useState(false);
  const [showAddConsignorModal, setShowAddConsignorModal] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    siteId: "",
    name: "",
    address: "",
  });

  // Add driver creation state
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [newDriverData, setNewDriverData] = useState({
    name: "",
    mobile: "",
    password: "",
    licenseNumber: "",
    experienceYears: "",
    driverType: user?.role === "vendor" ? "vendor" : "dellcube",
    vendor: "",
  });

  // Add vehicle creation state
  const [showAddVehicleDialog, setShowAddVehicleDialog] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({
    vehicleNumber: "",
    type: "14 Feet", // Default to a valid enum value
  });

  // Add driver creation mutation
  const [createDriver, { isLoading: isCreatingDriver }] =
    useCreateDriverMutation();

  // If vendor, auto-select assigned customer if only one is assigned
  useEffect(() => {
    // If vendor has only one assigned client, auto-select it
    if (isVendor && user?.assignedClients?.length === 1) {
      const clientId = user.assignedClients[0]._id || user.assignedClients[0];
      setCustomerId(clientId);
    }
  }, [isVendor, user?.assignedClients]);

  useEffect(() => {
    if (companyId && branchId) {
      refetchVehicles();
      refetchVendors();
    }
  }, [companyId, branchId, refetchVehicles, refetchVendors]);

  // Add pincode change handlers with debounce to prevent input focus loss
  useEffect(() => {
    if (fromPincode.length === 6) {
      // Add a small delay to prevent immediate API calls on every keystroke
      const timer = setTimeout(() => {
        fetchAddressFromPincode(fromPincode, "from");
      }, 500); // 500ms delay

      return () => clearTimeout(timer);
    }
  }, [fromPincode]);

  useEffect(() => {
    if (toPincode.length === 6) {
      // Add a small delay to prevent immediate API calls on every keystroke
      const timer = setTimeout(() => {
        fetchAddressFromPincode(toPincode, "to");
      }, 500); // 500ms delay

      return () => clearTimeout(timer);
    }
  }, [toPincode]);

  // Remove old handleRegionChange function since it's no longer needed
  // const handleRegionChange = (type, field, value) => {
  //   const reset = { state: "", city: "", locality: "", pincode: "" };
  //   let updated;

  //   if (type === "from") {
  //     updated = {
  //       ...fromRegion,
  //       [field]: value,
  //       ...(field === "country" ? reset : {}),
  //       ...(field === "state" ? { city: "", locality: "", pincode: "" } : {}),
  //       ...(field === "city" ? { locality: "", pincode: "" } : {}),
  //       ...(field === "locality" ? { pincode: "" } : {}),
  //     };
  //     setFromRegion(updated);
  //   } else if (type === "to") {
  //     updated = {
  //       ...toRegion,
  //       ...(field === "country" ? reset : {}),
  //       ...(field === "state" ? { city: "", locality: "", pincode: "" } : {}),
  //       ...(field === "city" ? { locality: "", pincode: "" } : {}),
  //       ...(field === "locality" ? { pincode: "" } : {}),
  //     };
  //     setToRegion(updated);
  //   }
  // };

  useEffect(() => {
    if (selectedVendor) {
      getVendorById(selectedVendor);
      setSelectedVendorVehicle("");
    }
  }, [selectedVendor, getVendorById]);

  useEffect(() => {
    if (selectedDriver && driversData?.drivers) {
      const driverObj = driversData.drivers.find(
        (d) => d._id === selectedDriver
      );
      setDriverContactNumber(driverObj?.mobile || "");
    } else {
      setDriverContactNumber("");
    }
  }, [selectedDriver, driversData]);

  // Initialize companyId and branchId from token if empty
  useEffect(() => {
    if (!companyId && tokenCompanyId) {
      setCompanyId(tokenCompanyId);
    }
    if (!branchId && tokenBranchId) {
      setBranchId(tokenBranchId);
    }
  }, [tokenCompanyId, tokenBranchId]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (companyId && isSuperAdmin) {
        const res = await getBranchesByCompany(companyId);
        if (res?.data?.branches) setBranches(res.data.branches);
      }
    };
    fetchBranches();
  }, [companyId, isSuperAdmin, getBranchesByCompany]);

  useEffect(() => {
    setselectedItems([]);
  }, [selectedGood]);

  const handleItemCheckbox = (item) => {
    setselectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  useEffect(() => {
    const search = async () => {
      if (debouncedSearchTerm && !searchedVehicle) {
        setVehicleSearchError("");
        setVehicleSuggestions([]);
        try {
          const res = await searchVehicles({
            vehicleNumber: debouncedSearchTerm,
            companyId,
            branchId,
          }).unwrap();
          if (res.success) {
            setVehicleSuggestions(res.vehicles);
          }
        } catch (err) {
          setVehicleSearchError(err.data?.message || "No vehicles found.");
          setVehicleSuggestions([]);
        }
      } else {
        setVehicleSuggestions([]);
      }
    };
    if (debouncedSearchTerm) {
      const inputRect = vehicleSearchRef.current?.getBoundingClientRect();
      if (inputRect) {
        const spaceBelow = window.innerHeight - inputRect.bottom;
        setSuggestionsPosition(spaceBelow < 250 ? "bottom" : "top"); // 250px is a rough height for the suggestions card
      }
    }
    search();
  }, [
    debouncedSearchTerm,
    companyId,
    branchId,
    searchVehicles,
    searchedVehicle,
  ]);

  const handleVehicleSelect = (vehicle) => {
    setSearchedVehicle(vehicle);
    setVehicleNumber(vehicle.vehicleNumber);
    setVehicleSuggestions([]);
    setVehicleSearchError("");

    // Auto-fill vehicle-related fields
    if (vehicle.ownerType === "Dellcube") {
      setVehicleType("Dellcube");
      setSelectedVehicle(vehicle._id);
      setVehicleSize(vehicle.type || "");
      setVehicleModel(vehicle.model || "");
      setSelectedDriver(vehicle.currentDriver?._id || "");
      setDriverContactNumber(vehicle.currentDriver?.mobile || "");
      setSelectedVendor("");
      setSelectedVendorVehicle("");
      setSelectedVendorVehicleNumber("");
    } else if (vehicle.ownerType === "Vendor") {
      setVehicleType("Vendor");
      setSelectedVendor(vehicle.vendor);
      setSelectedVendorVehicle(vehicle);
      setSelectedVendorVehicleNumber(vehicle.vehicleNumber);
      setVehicleSize(vehicle.type || "");
      setVehicleModel(vehicle.model || "");
      setSelectedDriver(vehicle.currentDriver?._id || "");
      setDriverContactNumber(vehicle.currentDriver?.mobile || "");
      setSelectedVehicle("");
    }
  };

  // Handler to add new consignee
  const handleAddConsignee = async () => {
    if (!newItemForm.siteId || !newItemForm.name) {
      toast.error("Site ID and Consignee name are required");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer first");
      return;
    }

    try {
      const selectedCustomer = customersData.customers.find(c => c._id === customerId);
      const updatedConsignees = [
        ...(selectedCustomer.consignees || []),
        {
          siteId: newItemForm.siteId,
          consignee: newItemForm.name,
          address: newItemForm.address,
        },
      ];

      await updateCustomer({
        customerId,
        consignees: updatedConsignees,
      }).unwrap();

      toast.success("Consignee added successfully");
      setShowAddConsigneeModal(false);
      setNewItemForm({ siteId: "", name: "", address: "" });
      
      // Refresh customer data
      // The useEffect will automatically update availableConsignees
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add consignee");
    }
  };

  // Handler to add new consignor
  const handleAddConsignor = async () => {
    if (!newItemForm.name) {
      toast.error("Consignor name is required");
      return;
    }
    if (!customerId) {
      toast.error("Please select a customer first");
      return;
    }

    try {
      const selectedCustomer = customersData.customers.find(c => c._id === customerId);
      const updatedConsignors = [
        ...(selectedCustomer.consignors || []),
        {
          siteId: newItemForm.siteId,
          consignor: newItemForm.name,
          address: newItemForm.address,
        },
      ];

      await updateCustomer({
        customerId,
        consignors: updatedConsignors,
      }).unwrap();

      toast.success("Consignor added successfully");
      setShowAddConsignorModal(false);
      setNewItemForm({ siteId: "", name: "", address: "" });
      
      // Refresh customer data
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add consignor");
    }
  };

  const handleSubmit = async () => {
    // Auto-select vehicle if input matches a suggestion and searchedVehicle is null
    if (!searchedVehicle && vehicleSuggestions.length > 0) {
      const match = vehicleSuggestions.find(
        (v) => v.vehicleNumber === vehicleNumber
      );
      if (match) {
        handleVehicleSelect(match);
      }
    }
    // Basic validation for required fields
    if (!customerId) {
      toast.error("Please select a customer to create the docket.");
      return;
    }

    // Get companyId and branchId from token as fallback
    const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
    const finalCompanyId = companyId || tokenCompanyId;
    const finalBranchId = branchId || tokenBranchId;

    if (!finalCompanyId || !finalBranchId) {
      toast.error("Company and Branch are required");
      return;
    }

    let payload = {
      customer: customerId,
      company: finalCompanyId,
      branch: finalBranchId,
      ...(invoiceDate && { invoiceDate }),
      ...(dispatchDateTime && { dispatchDateTime }),
      ...(paymentType && { paymentType }),
      ...(remarks && { remarks }),
      ...(vehicleNumber && { vehicleNumber }),
      ...(searchedVehicle?.ownerType && {
        vehicleType: searchedVehicle.ownerType,
      }),
      ...(totalWeight && { totalWeight }),
      ...(freightCharges && { freightCharges }),
      ...(numberOfPackages && { numberOfPackages }),
      ...(selectedGood && { goodsType: selectedGood }),
      ...(selectedItems.length > 0 && {
        goodItems: selectedItems.map((name) => ({ name })),
      }),
      fromAddress: {
        ...(pickupAddress && { pickupAddress }),
        ...(fromPincode && { pincode: fromPincode }),
        ...(fromAddressDetails && { addressDetails: fromAddressDetails }),
      },
      toAddress: {
        ...(deliveryAddress && { deliveryAddress }),
        ...(toPincode && { pincode: toPincode }),
        ...(toAddressDetails && { addressDetails: toAddressDetails }),
      },
      ...(selectedDriver && { driver: selectedDriver }),
      ...(pickupAddress && { pickupAddress }),
      ...(deliveryAddress && { deliveryAddress }),
      ...(consignor && { consignor }),
      ...(consignee && { consignee }),
      ...(address && { address }),
      ...(invoiceNumbers.length > 0 && { invoiceNumber: invoiceNumbers }),
      ...(invoiceBill && { invoiceBill }),
      ...(ewayBillNumbers.length > 0 && { ewayBillNo: ewayBillNumbers }),
      ...(driverContactNumber && { driverContactNumber }),
      ...(siteId && { siteId }),
      ...(sealNo && { sealNo }),
      ...(vehicleModel && { vehicleModel }),
      ...(selectedSiteType && { siteType: selectedSiteType }),
      ...(vehicleSize && { vehicleSize }),
      ...(orderNumber && { orderNumber }),
      ...(selectedTransportMode && { transportMode: selectedTransportMode }),
    };

    // Assign driver to payload
    // Priority: 1. Manually selected driver, 2. Driver from searched vehicle
    if (selectedDriver) {
      payload.driver = selectedDriver;
    } else if (searchedVehicle?.currentDriver?._id) {
      payload.driver = searchedVehicle.currentDriver._id;
    }

    Object.keys(payload).forEach(
      (key) =>
        (payload[key] === undefined || payload[key] === null) &&
        delete payload[key]
    );

    try {
      const res = await createInvoice(payload).unwrap();
      if (res?.success) {
        toast.success("Invoice created successfully");
        navigate(isVendor ? "/admin/vendor-invoices" : "/admin/invoices");
      } else {
        toast.error(res?.message || "Failed to create invoice");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Error creating invoice");
    }
  };

  // Add effect to auto-select driver when Dellcube vehicle is selected
  useEffect(() => {
    if (
      vehicleType === "Dellcube" &&
      selectedVehicle &&
      vehicleData?.vehicles?.length
    ) {
      const foundVehicle = vehicleData.vehicles.find(
        (v) => v._id === selectedVehicle
      );
      if (
        foundVehicle &&
        foundVehicle.currentDriver &&
        foundVehicle.currentDriver._id
      ) {
        setSelectedDriver(foundVehicle.currentDriver._id);
      }
    }
    // Do not auto-clear driver if vehicle changes, to allow manual override
  }, [selectedVehicle, vehicleType, vehicleData]);

  useEffect(() => {
    if (searchedVehicle) {
      if (searchedVehicle.ownerType === "Dellcube") {
        setVehicleSize(searchedVehicle.type || "");
        setSelectedDriver(searchedVehicle.currentDriver?._id || "");
        setDriverContactNumber(searchedVehicle.currentDriver?.mobile || "");
      } else if (searchedVehicle.ownerType === "Vendor") {
        setVehicleSize(searchedVehicle.type || ""); // Assuming vendor vehicles also have a 'type' for size
        // For vendor vehicles, driver info might not be directly available or needs manual input
        setSelectedDriver("");
        setDriverContactNumber("");
      }
    } else {
      setVehicleSize("");
      setSelectedDriver("");
      setDriverContactNumber("");
    }
  }, [searchedVehicle]);

  // Add effect to set vehicleSize when Dellcube vehicle is selected
  useEffect(() => {
    if (
      vehicleType === "Dellcube" &&
      selectedVehicle &&
      vehicleData?.vehicles?.length
    ) {
      const foundVehicle = vehicleData.vehicles.find(
        (v) => v._id === selectedVehicle
      );
      if (foundVehicle && foundVehicle.type) {
        setVehicleSize(foundVehicle.type);
      } else {
        setVehicleSize("");
      }
    } else {
      setVehicleSize("");
    }
  }, [selectedVehicle, vehicleType, vehicleData]);

  // Effect to update consignor/consignee lists when customer changes
  useEffect(() => {
    if (customerId && customersData?.customers) {
      const selectedCustomer = customersData.customers.find(
        (c) => c._id === customerId
      );
      if (selectedCustomer) {
        setAvailableConsignors(selectedCustomer.consignors || []);
        setAvailableConsignees(selectedCustomer.consignees || []);
        // Reset selections
        setSelectedConsignor("");
        setSelectedConsignee("");
        setConsignor("");
        setConsignee("");
      }
    }
  }, [customerId, customersData]);

  // Effect to auto-fill consignee when site ID changes
  useEffect(() => {
    if (siteId && availableConsignees.length > 0) {
      const matchingConsignee = availableConsignees.find(
        (c) => c.siteId === siteId
      );
      if (matchingConsignee) {
        setSelectedConsignee(matchingConsignee._id);
        setConsignee(matchingConsignee.consignee);
      }
    }
  }, [siteId, availableConsignees]);

  // Effect to update consignor/consignee text when dropdowns change
  useEffect(() => {
    if (selectedConsignor && availableConsignors.length > 0) {
      const consignorObj = availableConsignors.find(
        (c) => c._id === selectedConsignor
      );
      if (consignorObj) {
        setConsignor(consignorObj.consignor);
        setConsignorAddress(consignorObj.address || "");
        if (consignorObj.siteId) {
          setSiteId(consignorObj.siteId);
        }
      }
    }
  }, [selectedConsignor, availableConsignors]);

  useEffect(() => {
    if (selectedConsignee && availableConsignees.length > 0) {
      const consigneeObj = availableConsignees.find(
        (c) => c._id === selectedConsignee
      );
      if (consigneeObj) {
        setSiteId(consigneeObj.siteId);
        setConsignee(consigneeObj.consignee);
        setConsigneeAddress(consigneeObj.address || "");
      }
    }
  }, [selectedConsignee, availableConsignees]);

  // Auto-fetch address details when pincode reaches 6 digits
  useEffect(() => {
    if (fromPincode.length === 6) {
      fetchAddressFromPincode(fromPincode, "from");
    }
  }, [fromPincode]);

  useEffect(() => {
    if (toPincode.length === 6) {
      fetchAddressFromPincode(toPincode, "to");
    }
  }, [toPincode]);

  // Handle vehicle creation
  const handleCreateVehicle = async () => {
    // Prevent duplicate calls
    if (isCreatingVehicle) {
      return;
    }

    if (!newVehicleData.vehicleNumber || !newVehicleData.type) {
      toast.error("Vehicle Number and Type are required");
      return;
    }

    // Validate vehicle number format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576)
    const cleanedVehicleNumber = newVehicleData.vehicleNumber.trim().replace(/[\s-]/g, '').toUpperCase();
    const vehicleNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/;
    
    if (!vehicleNumberRegex.test(cleanedVehicleNumber)) {
      toast.error("Vehicle number must be in format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576). No dashes or spaces allowed.");
      return;
    }

    if (!companyId || !branchId) {
      toast.error("Company and Branch are required");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("vehicleNumber", cleanedVehicleNumber);
      payload.append("type", newVehicleData.type);
      payload.append("company", companyId);
      payload.append("branch", branchId);
      payload.append("status", "active");
      payload.append("createdBy", user?._id || "");

      const result = await createVehicle(payload).unwrap();

      // Check if vehicle was created successfully
      if (result?.success && result?.vehicle) {
        // Close dialog and reset form first
        setShowAddVehicleDialog(false);
        setNewVehicleData({ vehicleNumber: "", type: "14 Feet" });
        
        // Show success toast
        toast.success("Vehicle created successfully");
        
        // Handle post-creation operations in a separate try-catch
        // so errors here don't affect the success message
        try {
          // Auto-select the newly created vehicle
          const newVehicle = result.vehicle;
          handleVehicleSelect({
            _id: newVehicle._id,
            vehicleNumber: newVehicle.vehicleNumber,
            ownerType: "Dellcube",
            type: newVehicle.type,
            currentDriver: newVehicle.currentDriver,
          });
        } catch (selectError) {
          console.error("Error selecting vehicle:", selectError);
          // Silently fail - vehicle was created successfully
        }
        
        // Refresh vehicles list (don't show error if this fails)
        try {
          await refetchVehicles();
        } catch (refetchError) {
          console.error("Error refreshing vehicles list:", refetchError);
          // Silently fail - vehicle was created successfully
        }
      } else {
        // Vehicle creation didn't return success
        toast.error(result?.message || "Failed to create vehicle");
      }
    } catch (error) {
      console.error("Vehicle creation error:", error);
      // Check if this is actually an error or a successful response with error structure
      // RTK Query unwrap() throws on non-2xx status codes
      if (error?.data?.success === true && error?.data?.vehicle) {
        // This shouldn't happen, but handle it just in case
        toast.success("Vehicle created successfully");
        setShowAddVehicleDialog(false);
        setNewVehicleData({ vehicleNumber: "", type: "14 Feet" });
      } else {
        // Actual error - show error toast
        const errorMessage = error?.data?.message || error?.message || "Failed to create vehicle";
        toast.error(errorMessage);
      }
    }
  };

  // Handle driver creation
  const handleCreateDriver = async () => {
    if (
      !newDriverData.name ||
      !newDriverData.mobile ||
      !newDriverData.password ||
      !newDriverData.licenseNumber ||
      !newDriverData.experienceYears
    ) {
      toast.error(
        "Driver name, mobile, password, license number, and experience years are required"
      );
      return;
    }

    // Validate mobile number format (10 digits)
    if (!/^\d{10}$/.test(newDriverData.mobile)) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }

    // Validate experience years (0-50)
    const expYears = Number(newDriverData.experienceYears);
    if (expYears < 0 || expYears > 50) {
      toast.error("Experience years must be between 0 and 50");
      return;
    }

    // Validate vendor is required when driver type is vendor
    if (newDriverData.driverType === "vendor" && !newDriverData.vendor) {
      toast.error("Vendor is required when driver type is 'vendor'");
      return;
    }

    try {
      const payload = {
        ...newDriverData,
        experienceYears: Number(newDriverData.experienceYears),
        companies: companyId ? [companyId] : [],
        branches: branchId ? [branchId] : [],
        ...(newDriverData.driverType === "vendor" && newDriverData.vendor && { vendor: newDriverData.vendor }),
      };

      // Remove vendor from payload if not vendor driver type
      if (newDriverData.driverType !== "vendor") {
        delete payload.vendor;
      }

      console.log("Creating driver with payload:", payload);

      const result = await createDriver(payload).unwrap();

      if (result?.success) {
        toast.success("Driver created successfully");
        setShowAddDriverDialog(false);
        setNewDriverData({
          name: "",
          mobile: "",
          password: "",
          licenseNumber: "",
          experienceYears: "",
          driverType: "dellcube",
          vendor: "",
        });
        // Refresh drivers list
        // Note: You might need to add a refetch function to the drivers query
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create driver");
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 md:gap-3 mb-2">
            <Button
              variant="ghost"
              onClick={() => navigate(isVendor ? "/admin/vendor-invoices" : "/admin/invoices")}
              className="text-gray-600 hover:text-gray-900 p-2 md:p-3"
            >
              <ArrowRight className="w-4 h-4 rotate-180 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Back to Dockets</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            Create New Docket
          </h1>
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
            Fill in the details below to create a new docket
          </p>
        </div>

        {/* Single column layout for mobile, two-sided for desktop */}
        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          {/* Left side - Main form (100% on mobile, 70% on desktop) */}
          <div className="w-full lg:flex-1 space-y-4 md:space-y-6">
            {/* 1. Basic Information */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {isSuperAdmin && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Company
                        </Label>
                        <Select
                          value={companyId}
                          onValueChange={(val) => {
                            setCompanyId(val);
                            setBranchId("");
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Company" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies?.companies?.map((comp) => (
                              <SelectItem key={comp._id} value={comp._id}>
                                {comp.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Branch
                        </Label>
                        <Select
                          value={branchId}
                          onValueChange={setBranchId}
                          disabled={!companyId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer
                    </Label>
                    <Select
                      value={customerId}
                      onValueChange={setCustomerId}
                      disabled={false}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customersData?.customers?.length ? (
                          customersData.customers
                            .filter((cust) => {
                              // Filter by active status
                              if (cust.status !== true && cust.status !== "true") {
                                return false;
                              }
                              // For vendors, only show assigned clients
                              if (isVendor && user?.assignedClients?.length > 0) {
                                return user.assignedClients.some(
                                  (client) =>
                                    (client._id || client) === cust._id
                                );
                              }
                              return true;
                            })
                            .map((cust) => (
                              <SelectItem key={cust._id} value={cust._id}>
                                {cust.name}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-customers" disabled>
                            {isVendor 
                              ? "No active assigned customers found" 
                              : "No customers found for this branch/company"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Docket Date
                    </Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Dispatch Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={dispatchDateTime}
                      onChange={(e) => setDispatchDateTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Delivery Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Pickup/Delivery Address fields with pincode-based location */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                  <AddressFields
                    type="from"
                    pincode={fromPincode}
                    setPincode={setFromPincode}
                    addressDetails={fromAddressDetails}
                    isLoading={isLoadingFromPincode}
                    address={pickupAddress}
                    setAddress={setPickupAddress}
                    fetchAddressFromPincode={fetchAddressFromPincode}
                    selectPostOffice={selectPostOffice}
                  />
                  <AddressFields
                    type="to"
                    pincode={toPincode}
                    setPincode={setToPincode}
                    addressDetails={toAddressDetails}
                    isLoading={isLoadingToPincode}
                    address={deliveryAddress}
                    setAddress={setDeliveryAddress}
                    fetchAddressFromPincode={fetchAddressFromPincode}
                    selectPostOffice={selectPostOffice}
                  />
                </div>
                  {/* Site Type */}
                  <div className="space-y-2 mt-4">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Site Type
                    </Label>
                    <Select
                      value={selectedSiteType}
                      onValueChange={setSelectedSiteType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Site Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {siteTypesData?.siteTypes?.map((siteType) => (
                          <SelectItem key={siteType._id} value={siteType._id}>
                            {siteType.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                {/* Consignor/Sender Section */}
                <div className="mt-4 space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Consignor/Sender Details
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!customerId) {
                            toast.error("Please select a customer first");
                            return;
                          }
                          setShowAddConsignorModal(true);
                        }}
                        className="px-3 whitespace-nowrap"
                        title="Add New Consignor"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Add New</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Select Consignor</Label>
                        <Select
                          value={selectedConsignor}
                          onValueChange={setSelectedConsignor}
                          disabled={!customerId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={customerId ? "Select Consignor" : "Select Customer First"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableConsignors.map((consignor) => (
                              <SelectItem key={consignor._id} value={consignor._id}>
                                {consignor.siteId ? `${consignor.siteId} - ` : ""}{consignor.consignor}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Consignor Name</Label>
                        <Input
                          type="text"
                          value={consignor}
                          onChange={(e) => setConsignor(e.target.value)}
                          placeholder="Consignor name"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-medium">Consignor Address</Label>
                        <Input
                          type="text"
                          value={consignorAddress}
                          onChange={(e) => setConsignorAddress(e.target.value)}
                          placeholder="Consignor address"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Consignee/Receiver Section */}
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Consignee/Receiver Details
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!customerId) {
                            toast.error("Please select a customer first");
                            return;
                          }
                          setShowAddConsigneeModal(true);
                        }}
                        className="px-3 whitespace-nowrap"
                        title="Add New Consignee"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Add New</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Site ID</Label>
                        <Select
                          value={siteId}
                          onValueChange={(value) => {
                            setSiteId(value);
                            // Auto-fill consignee details if site ID exists in list
                            const matchingConsignee = availableConsignees.find(c => c.siteId === value);
                            if (matchingConsignee) {
                              setSelectedConsignee(matchingConsignee._id);
                            }
                          }}
                          disabled={!customerId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={customerId ? "Select Site ID" : "Select Customer First"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableConsignees.map((consignee) => (
                              <SelectItem key={consignee._id} value={consignee.siteId}>
                                {consignee.siteId}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-medium">Consignee Name</Label>
                        <Input
                          type="text"
                          value={consignee}
                          onChange={(e) => setConsignee(e.target.value)}
                          placeholder="Consignee name"
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-xs font-medium">Consignee Address</Label>
                        <Input
                          type="text"
                          value={consigneeAddress}
                          onChange={(e) => setConsigneeAddress(e.target.value)}
                          placeholder="Consignee address"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>

                 
                </div>
              </CardContent>
            </Card>

            {/* 3. Goods / Order Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Package className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  Goods / Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {/* Goods Type Dropdown and Items Checkboxes grouped together */}
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Goods Type
                    </Label>
                    <Select
                      value={selectedGood}
                      onValueChange={setSelectedGood}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Goods" />
                      </SelectTrigger>
                      <SelectContent>
                        {goodsData?.goodss?.map((good) => (
                          <SelectItem key={good._id} value={good._id}>
                            {good.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Goods Items Selection (checkboxes) - directly below dropdown */}
                    {selectedGood && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Label className="text-sm font-medium mb-2 block">
                          Select Items from{" "}
                          {
                            goodsData?.goodss?.find(
                              (g) => g._id === selectedGood
                            )?.name
                          }
                          :
                        </Label>
                        <div className="flex flex-wrap gap-2 md:gap-3">
                          {goodsData?.goodss
                            ?.find((g) => g._id === selectedGood)
                            ?.items?.map((item) => (
                              <div
                                key={item}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`item-${item}`}
                                  checked={selectedItems.includes(item)}
                                  onChange={() => handleItemCheckbox(item)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                <label
                                  htmlFor={`item-${item}`}
                                  className="text-sm font-medium cursor-pointer hover:text-blue-600"
                                >
                                  {item}
                                </label>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Other fields */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Order Number
                    </Label>
                    <Input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="Enter order number"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Number of Boxes/Packages
                    </Label>
                    <Input
                      type="number"
                      value={numberOfPackages}
                      onChange={(e) => setNumberOfPackages(e.target.value)}
                      placeholder="Enter number of boxes/packages"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Weight className="w-4 h-4" />
                      Total Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      value={totalWeight}
                      onChange={(e) => setTotalWeight(e.target.value)}
                      placeholder="Enter total weight"
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Vehicle Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Truck className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2 relative" ref={vehicleSearchRef}>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Vehicle Number
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (!companyId || !branchId) {
                            toast.error("Please select company and branch first");
                            return;
                          }
                          setShowAddVehicleDialog(true);
                        }}
                        className="px-3 whitespace-nowrap"
                        title="Add New Vehicle"
                      >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline ml-1">Add Vehicle</span>
                        <span className="sm:hidden ml-1">Add</span>
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          setVehicleNumber(val);
                          if (
                            !searchedVehicle ||
                            searchedVehicle.vehicleNumber !== val
                          ) {
                            setSearchedVehicle(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (
                            e.key === "Enter" &&
                            vehicleSuggestions.length > 0
                          ) {
                            handleVehicleSelect(vehicleSuggestions[0]);
                            e.preventDefault();
                          }
                        }}
                        placeholder="Start typing to search for a vehicle..."
                        className="w-full"
                      />
                      {isSearchingVehicle && (
                        <Loader2 className="animate-spin" />
                      )}
                    </div>

                    {vehicleSuggestions.length > 0 && (
                      <Card
                        className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg ${
                          suggestionsPosition === "bottom"
                            ? "bottom-full mb-1"
                            : ""
                        }`}
                      >
                        <CardContent className="p-2 max-h-60 overflow-y-auto">
                          {vehicleSuggestions.map((v) => (
                            <div
                              key={v._id || v.vehicleNumber}
                              onClick={() => handleVehicleSelect(v)}
                              className="p-2 hover:bg-gray-100 cursor-pointer rounded-md"
                            >
                              {v.vehicleNumber} ({v.ownerType})
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {vehicleSearchError && !vehicleSuggestions.length && (
                      <div className="text-red-500 text-sm mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {vehicleSearchError}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/admin/create-vehicle")}
                            className="text-xs"
                          >
                            Create Dellcube Vehicle
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate("/admin/vendors")}
                            className="text-xs"
                          >
                            Add to Vendor
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Display Searched Vehicle Info */}
                  {searchedVehicle && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Owner</Label>
                        <Input
                          value={
                            searchedVehicle.ownerType === "Vendor"
                              ? `Vendor: ${searchedVehicle.vendor.name}`
                              : "Dellcube"
                          }
                          disabled
                        />
                      </div>
                      {/* Only show disabled Vehicle Type/Size if type exists */}
                      {searchedVehicle.type && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Vehicle Type/Size
                          </Label>
                          <Input value={searchedVehicle.type} disabled />
                        </div>
                      )}
                      {/* Only show dropdown if type is missing */}
                      {!searchedVehicle.type && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">
                            Vehicle Type/Size
                          </Label>
                          <Select
                            value={vehicleSize}
                            onValueChange={setVehicleSize}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Vehicle Size" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "14 Feet",
                                "17 Feet",
                                "19 Feet",
                                "20 Feet",
                                "22 Feet",
                                "24 Feet",
                                "32FTMXL-14MT",
                                "Biker",
                                "BYHAND",
                                "FLAT BED TRAILER 20FT",
                                "Pickup",
                                "TAURUS 16 TON",
                                "Tata 407",
                                "TRUCK/LORRY",
                                "SFBT40",
                                "TATA/EICHER 709",
                                "32FTMXL-18MT",
                                "32FTSXL-7MT",
                                "32FTSXL-9MT",
                                "FLAT BED TRAILER 40FT",
                                "SEMI FLAT BED TRAILER 40FT",
                                "TAURUS 18 TON",
                                "TAURUS 21 TON",
                                "TAURUS 25 TON",
                                "TAURUS 30 TON",
                                "TATA ACE"
                              ].map((size) => (
                                <SelectItem key={size} value={size}>
                                  {size}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-sm font-medium">
                          Assign / Override Driver
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select
                            value={selectedDriver}
                            onValueChange={setSelectedDriver}
                            className="flex-1"
                            disabled={!driversData?.drivers?.length}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a Driver" />
                            </SelectTrigger>
                            <SelectContent>
                              {driversData?.drivers?.length ? (
                                driversData.drivers.map((driver) => (
                                  <SelectItem
                                    key={driver._id}
                                    value={driver._id}
                                  >
                                    {driver.name} - {driver.mobile} -{" "}
                                    {driver.driverType}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value="no-drivers" disabled>
                                  No drivers available
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddDriverDialog(true)}
                            className="px-3 whitespace-nowrap"
                            title="Add New Driver"
                          >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline ml-1">Add</span>
                          </Button>
                        </div>
                        {searchedVehicle.currentDriver && (
                          <p className="text-xs text-gray-500 mt-1">
                            Default driver: {searchedVehicle.currentDriver.name}
                          </p>
                        )}
                      </div>
                      {/* Driver Contact always shown */}
                      <div className="space-y-2 sm:col-span-2">
                        <Label className="text-sm font-medium">
                          Driver Contact
                        </Label>
                        <Input
                          value={
                            searchedVehicle.currentDriver?.mobile ||
                            driversData?.drivers?.find(
                              (d) => d._id === selectedDriver
                            )?.mobile ||
                            "N/A"
                          }
                          disabled
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Invoice Details and submit (100% on mobile, 30% on desktop) */}
          <div className="w-full lg:w-80 space-y-4 md:space-y-6 mt-4 lg:mt-0">
            {/* 5. Invoice Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-3 md:pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                  Docket Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 md:space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Payment Mode/Type
                  </Label>
                  <Select value={paymentType} onValueChange={setPaymentType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Payment Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prepaid">Prepaid</SelectItem>
                      <SelectItem value="To-Pay">To-Pay</SelectItem>
                      <SelectItem value="Billing">Billing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <MultiValueInput
                  label="E-Way Bill No"
                  placeholder="Enter 12-digit e-way bill number"
                  values={ewayBillNumbers}
                  onChange={setEwayBillNumbers}
                  helperText="Add multiple e-way bill numbers (must be exactly 12 digits each); press Enter or click Add after each value."
                  validateValue={(value) => {
                    if (!/^\d{12}$/.test(value)) {
                      return "E-way bill number must be exactly 12 digits";
                    }
                    return null;
                  }}
                  maxLength={12}
                  inputType="tel"
                  inputMode="numeric"
                />
                <MultiValueInput
                  label="Invoice No"
                  placeholder="Enter invoice number and press Enter"
                  values={invoiceNumbers}
                  onChange={setInvoiceNumbers}
                  helperText="Optional. Add one or more invoice numbers for this docket."
                />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Invoice Amount</Label>
                  <Input
                    type="number"
                    value={invoiceBill}
                    onChange={(e) => setInvoiceBill(e.target.value)}
                    placeholder="Enter invoice amount"
                    className="w-full"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Transport Mode
                  </Label>
                  <Select
                    value={selectedTransportMode}
                    onValueChange={setSelectedTransportMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Transport Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportModesData?.transportModes?.map((mode) => (
                        <SelectItem key={mode._id} value={mode._id}>
                          {mode.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Freight Charges</Label>
                  <Input
                    type="number"
                    value={freightCharges}
                    onChange={(e) => setFreightCharges(e.target.value)}
                    placeholder="Enter freight charges"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="pt-4 md:pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium py-3 text-base border border-[#FFD249] transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Creating Docket...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Docket
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Driver Dialog */}
      <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Driver Name *</Label>
              <Input
                value={newDriverData.name}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter driver name"
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile Number * (10 digits)</Label>
              <Input
                value={newDriverData.mobile}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    mobile: e.target.value,
                  }))
                }
                placeholder="Enter 10 digit mobile number"
                maxLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label>Password *</Label>
              <Input
                type="password"
                value={newDriverData.password}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder="Enter password"
              />
            </div>
            <div className="space-y-2">
              <Label>License Number *</Label>
              <Input
                value={newDriverData.licenseNumber}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    licenseNumber: e.target.value,
                  }))
                }
                placeholder="Enter license number"
              />
            </div>
            <div className="space-y-2">
              <Label>Experience Years * (0-50)</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={newDriverData.experienceYears}
                onChange={(e) =>
                  setNewDriverData((prev) => ({
                    ...prev,
                    experienceYears: e.target.value,
                  }))
                }
                placeholder="Enter experience years (0-50)"
              />
            </div>
            <div className="space-y-2">
              <Label>Driver Type</Label>
              <Select
                value={newDriverData.driverType}
                onValueChange={(value) =>
                  setNewDriverData((prev) => ({ ...prev, driverType: value, vendor: "" }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dellcube">Dellcube</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="temporary">Temporary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newDriverData.driverType === "vendor" && (
              <div className="space-y-2">
                <Label>Select Vendor *</Label>
                <Select
                  value={newDriverData.vendor}
                  onValueChange={(value) =>
                    setNewDriverData((prev) => ({ ...prev, vendor: value }))
                  }
                  disabled={!companyId || !branchId}
                >
                  <SelectTrigger className={!companyId || !branchId ? "bg-gray-100 dark:bg-gray-800" : ""}>
                    <SelectValue placeholder={
                      !companyId || !branchId
                        ? "Company and branch must be selected first"
                        : vendorData?.vendors?.length > 0
                        ? "Select a vendor"
                        : "No vendors available"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorData?.vendors?.length > 0 ? (
                      vendorData.vendors.map((v) => (
                        <SelectItem key={v._id} value={v._id}>
                          {v.name} {v.email ? `(${v.email})` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        {!companyId || !branchId
                          ? "Please select company and branch first"
                          : "No vendors available for selected company/branch"}
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {newDriverData.driverType === "vendor" && companyId && branchId && vendorData?.vendors?.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    No vendors found. Please create a vendor first or select a different company/branch.
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddDriverDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDriver}
                disabled={isCreatingDriver}
                className="flex-1 bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
              >
                {isCreatingDriver ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Driver"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Consignee Modal */}
      <Dialog open={showAddConsigneeModal} onOpenChange={setShowAddConsigneeModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FFD249]" />
              Add New Consignee
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="consignee-siteId">
                Site ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="consignee-siteId"
                placeholder="e.g., MB5979"
                value={newItemForm.siteId}
                onChange={(e) => setNewItemForm({ ...newItemForm, siteId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consignee-name">
                Consignee Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="consignee-name"
                placeholder="e.g., WNS CENTAURUS"
                value={newItemForm.name}
                onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consignee-address">Address</Label>
              <Input
                id="consignee-address"
                placeholder="e.g., 123 Main Street, City"
                value={newItemForm.address}
                onChange={(e) => setNewItemForm({ ...newItemForm, address: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddConsigneeModal(false);
                setNewItemForm({ siteId: "", name: "", address: "" });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddConsignee}
              disabled={isUpdatingCustomer}
              className="flex-1 bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
            >
              {isUpdatingCustomer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Consignee"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Vehicle Modal */}
      <Dialog open={showAddVehicleDialog} onOpenChange={setShowAddVehicleDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FFD249]" />
              Add New Vehicle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vehicle-number">
                Vehicle Number <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vehicle-number"
                placeholder="e.g., CG04MM9576"
                value={newVehicleData.vehicleNumber}
                onChange={(e) => {
                  // Remove spaces, dashes, and convert to uppercase
                  const cleaned = e.target.value.replace(/[\s-]/g, '').toUpperCase();
                  // Limit to 10 characters (2 letters + 2 digits + 2 letters + 4 digits)
                  const limited = cleaned.slice(0, 10);
                  setNewVehicleData({
                    ...newVehicleData,
                    vehicleNumber: limited,
                  });
                }}
                maxLength={10}
              />
              {newVehicleData.vehicleNumber && newVehicleData.vehicleNumber.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Format: 2 letters + 2 digits + 2 letters + 4 digits (e.g., CG04MM9576)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicle-type">
                Vehicle Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newVehicleData.type}
                onValueChange={(value) =>
                  setNewVehicleData({ ...newVehicleData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Vehicle Type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "14 Feet",
                    "17 Feet",
                    "19 Feet",
                    "20 Feet",
                    "22 Feet",
                    "24 Feet",
                    "32FTMXL-14MT",
                    "32FTMXL-18MT",
                    "32FTSXL-7MT",
                    "32FTSXL-9MT",
                    "Biker",
                    "BYHAND",
                    "FLAT BED TRAILER 20FT",
                    "FLAT BED TRAILER 40FT",
                    "SEMI FLAT BED TRAILER 40FT",
                    "Pickup",
                    "TAURUS 16 TON",
                    "TAURUS 18 TON",
                    "TAURUS 21 TON",
                    "TAURUS 25 TON",
                    "TAURUS 30 TON",
                    "Tata 407",
                    "TRUCK/LORRY",
                    "SFBT40",
                    "TATA/EICHER 709",
                    "TATA ACE"
                  ].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <strong>Note:</strong> The vehicle will be created for the selected
                company and branch. You can add more details later from the Vehicles
                page.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddVehicleDialog(false);
                setNewVehicleData({ vehicleNumber: "", type: "14 Feet" });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateVehicle}
              disabled={isCreatingVehicle || !companyId || !branchId}
              className="flex-1 bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
            >
              {isCreatingVehicle ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                "Create Vehicle"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Consignor Modal */}
      <Dialog open={showAddConsignorModal} onOpenChange={setShowAddConsignorModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FFD249]" />
              Add New Consignor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="consignor-siteId">Site ID</Label>
              <Input
                id="consignor-siteId"
                placeholder="e.g., WH001 (Optional)"
                value={newItemForm.siteId}
                onChange={(e) => setNewItemForm({ ...newItemForm, siteId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consignor-name">
                Consignor Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="consignor-name"
                placeholder="e.g., Warehouse A"
                value={newItemForm.name}
                onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="consignor-address">Address</Label>
              <Input
                id="consignor-address"
                placeholder="e.g., 456 Depot Road, City"
                value={newItemForm.address}
                onChange={(e) => setNewItemForm({ ...newItemForm, address: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddConsignorModal(false);
                setNewItemForm({ siteId: "", name: "", address: "" });
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddConsignor}
              disabled={isUpdatingCustomer}
              className="flex-1 bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
            >
              {isUpdatingCustomer ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Consignor"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateInvoice;
