import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { Loader2 } from "lucide-react";
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
import { Truck } from "lucide-react";
import { Hash } from "lucide-react";
import { FileText } from "lucide-react";

// API imports
import {
  useGetInvoiceByIdMutation,
  useUpdateInvoiceMutation,
} from "@/features/api/Invoice/invoiceApi.js";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi.js";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi.js";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi.js";
import { useGetAllCountriesQuery } from "@/features/api/Region/countryApi.js";
import { useGetStatesByCountryMutation } from "@/features/api/Region/stateApi.js";
import { useGetCitiesByStateMutation } from "@/features/api/Region/cityApi.js";
import { useGetLocalitiesByCityMutation } from "@/features/api/Region/LocalityApi.js";
import { useGetPincodesByLocalityMutation } from "@/features/api/Region/pincodeApi.js";
import { useGetAllGoodsQuery } from "@/features/api/Goods/goodsApi.js";
import { useGetAllVehiclesQuery } from "@/features/api/Vehicle/vehicleApi.js";
import {
  useGetAllVendorsQuery,
  useGetVendorByIdMutation,
} from "@/features/api/Vendor/vendorApi.js";
import { useGetAllDriversQuery } from "@/features/api/authApi";
import { useGetAllSiteTypesQuery } from "@/features/api/SiteType/siteTypeApi.js";
import { useGetAllTransportModesQuery } from "@/features/api/TransportMode/transportModeApi.js";

const UpdateInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "superAdmin";

  // Extract invoiceId from location state
  let receivedInvoiceId = location.state?.invoiceId;
  // Defensive check: Ensure invoiceId is always the plain string ID
  const invoiceId =
    typeof receivedInvoiceId === "object" &&
    receivedInvoiceId !== null &&
    receivedInvoiceId.invoiceId
      ? receivedInvoiceId.invoiceId // If it's an object like { invoiceId: "..." }, extract the nested ID
      : receivedInvoiceId; // Otherwise, use it directly (should be the string ID)


  // Mutation hook to fetch existing invoice data
  const [
    getInvoiceById,
    {
      data: fetchedInvoiceData,
      isLoading: isInvoiceLoading,
      isError: isInvoiceError,
      error: invoiceError,
    },
  ] = useGetInvoiceByIdMutation();
  console.log(fetchedInvoiceData);

  // State variables, initialized to empty or default values
  const [companyId, setCompanyId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dispatchDateTime, setDispatchDateTime] = useState("");
  const [paymentType, setPaymentType] = useState("");
  const [remarks, setRemarks] = useState("");

  const [totalWeight, setTotalWeight] = useState("");
  const [freightCharges, setFreightCharges] = useState("");
  const [numberOfPackages, setNumberOfPackages] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedGood, setSelectedGood] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const [vehicleType, setVehicleType] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [selectedVendorVehicle, setSelectedVendorVehicle] = useState("");
  const [selectedVendorVehicleNumber, setSelectedVendorVehicleNumber] =
    useState("");
  const [selectedDriver, setSelectedDriver] = useState("");
  const [driverContactNumber, setDriverContactNumber] = useState("");
  const [vehicleSize, setVehicleSize] = useState("");

  // Add new state variables for the new fields
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [consignor, setConsignor] = useState("");
  const [consignee, setConsignee] = useState("");
  const [address, setAddress] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceBill, setInvoiceBill] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sealNo, setSealNo] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  // Add state for selected site type
  const [selectedSiteType, setSelectedSiteType] = useState("");
  const [selectedTransportMode, setSelectedTransportMode] = useState("");

  // State for "From" address fields
  const [fromRegion, setFromRegion] = useState({
    country: "",
    state: "",
    city: "",
    locality: "",
    pincode: "",
  });

  // State for "To" address fields
  const [toRegion, setToRegion] = useState({
    country: "",
    state: "",
    city: "",
    locality: "",
    pincode: "",
  });

  // API hooks for "From" address
  const [getFromStatesByCountry, { data: fromStateData }] =
    useGetStatesByCountryMutation();
  const [getFromCitiesByState, { data: fromCityData }] =
    useGetCitiesByStateMutation(); // Corrected this line, was getCitiesByStateMutation
  const [getFromLocalitiesByCity, { data: fromLocalityData }] =
    useGetLocalitiesByCityMutation();
  const [getFromPincodesByLocality, { data: fromPincodeData }] =
    useGetPincodesByLocalityMutation();

  // API hooks for "To" address
  const [getToStatesByCountry, { data: toStateData }] =
    useGetStatesByCountryMutation();
  const [getToCitiesByState, { data: toCityData }] =
    useGetCitiesByStateMutation(); // Corrected this line, was getCitiesByStateMutation
  const [getToLocalitiesByCity, { data: toLocalityData }] =
    useGetLocalitiesByCityMutation();
  const [getToPincodesByLocality, { data: toPincodeData }] =
    useGetPincodesByLocalityMutation();

  // Common API hooks
  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const { data: customersData } = useGetAllCustomersQuery({});
  const { data: countries } = useGetAllCountriesQuery({
    page: 1,
    limit: 10000,
  });
  const { data: driversData, isLoading: isDriversLoading } =
    useGetAllDriversQuery({});
  const { data: goodsData } = useGetAllGoodsQuery({ page: 1, limit: 1000 });
  const { data: siteTypesData } = useGetAllSiteTypesQuery({
    page: 1,
    limit: 1000,
    status: "true"
  });
  const { data: transportModesData } = useGetAllTransportModesQuery({ page: 1, limit: 1000, status: "true" });

  const { data: vehicleData } = useGetAllVehiclesQuery({
    page: 1,
    limit: 1000,
    companyId: companyId,
    branchId: branchId,
  });
  const { data: vendorData } = useGetAllVendorsQuery({
    companyId: companyId,
    branchId: branchId,
  });
  console.log(vendorData);

  const [getVendorById, { data: vendorDetails }] = useGetVendorByIdMutation();
  console.log("venodrByrid", vendorDetails);
  const [updateInvoice, { isLoading: isUpdating }] = useUpdateInvoiceMutation();

  useEffect(() => {
    getInvoiceById(invoiceId);
  }, [invoiceId, getInvoiceById]);

  //fetch invoice by ID
  useEffect(() => {
    if (fetchedInvoiceData && fetchedInvoiceData.invoice) {
      const invoice = fetchedInvoiceData.invoice;
      console.log(invoice);
      setCompanyId(invoice.company?._id || user?.company?._id || "");
      setBranchId(invoice.branch?._id || user?.branch?._id || "");
      setCustomerId(invoice.customer?._id || "");

      if (invoice.invoiceDate) {
        setInvoiceDate(
          new Date(invoice.invoiceDate).toISOString().split("T")[0]
        );
      }
      if (invoice.dispatchDateTime) {
        setDispatchDateTime(
          new Date(invoice.dispatchDateTime).toISOString().slice(0, 16)
        );
      }

      setPaymentType(invoice.paymentType || "");
      setRemarks(invoice.remarks || "");
      setTotalWeight(invoice.totalWeight || "");
      setFreightCharges(invoice.freightCharges || "");
      setNumberOfPackages(invoice.numberOfPackages || "");
      setSelectedGood(invoice.goodsType?._id || "");
      setSelectedItems(invoice.goodItems?.map((item) => item.name) || []);
      setVehicleType(invoice.vehicleType || "");
      setSelectedVehicle(invoice.vehicle?._id || "");
      setSelectedVendor(invoice.vendor?._id || "");
      setSelectedDriver(invoice.driver?._id || "");
      setDriverContactNumber(invoice.driverContactNumber || "");
      setVehicleSize(invoice.vehicleSize || "");
      setOrderNumber(invoice.orderNumber || "");
      setSelectedTransportMode(invoice.transportMode?._id || "");

      setFromRegion({
        country: invoice.fromAddress?.country?._id || "",
        state: invoice.fromAddress?.state?._id || "",
        city: invoice.fromAddress?.city?._id || "",
        locality: invoice.fromAddress?.locality?._id || "",
        pincode: invoice.fromAddress?.pincode?._id || "",
      });

      setToRegion({
        country: invoice.toAddress?.country?._id || "",
        state: invoice.toAddress?.state?._id || "",
        city: invoice.toAddress?.city?._id || "",
        locality: invoice.toAddress?.locality?._id || "",
        pincode: invoice.toAddress?.pincode?._id || "",
      });
      // If Vendor, fetch vendor details and set vendor vehicle after vendor details load
      if (invoice.vehicleType === "Vendor" && invoice.vendor?._id) {
        setSelectedVendor(invoice.vendor._id);
      }
      // Add new prefill logic for new fields
      setPickupAddress(invoice.pickupAddress || "");
      setDeliveryAddress(invoice.deliveryAddress || "");
      setConsignor(invoice.consignor || "");
      setConsignee(invoice.consignee || "");
      setAddress(invoice.address || "");
      setInvoiceNumber(invoice.invoiceNumber || "");
      setInvoiceBill(invoice.invoiceBill || "");
      setEwayBillNo(invoice.ewayBillNo || "");
      setSiteId(invoice.siteId || "");
      setSealNo(invoice.sealNo || "");
      setSelectedSiteType(invoice.siteType?._id || "");
    }
  }, [fetchedInvoiceData, user, isInvoiceLoading, isInvoiceError]);

  useEffect(() => {
    if (isInvoiceError) {
      console.error("UpdateInvoice: Error fetching invoice:", invoiceError);
      toast.error(
        invoiceError?.data?.message || "Failed to load invoice data."
      );
    }
  }, [isInvoiceError, invoiceError]);

  useEffect(() => {
    if (fromRegion.country) getFromStatesByCountry(fromRegion.country);
  }, [fromRegion.country, getFromStatesByCountry]);

  useEffect(() => {
    if (fromRegion.state) getFromCitiesByState(fromRegion.state);
  }, [fromRegion.state, getFromCitiesByState]);

  useEffect(() => {
    if (fromRegion.city) getFromLocalitiesByCity(fromRegion.city);
  }, [fromRegion.city, getFromLocalitiesByCity]);

  useEffect(() => {
    if (fromRegion.locality) getFromPincodesByLocality(fromRegion.locality);
  }, [fromRegion.locality, getFromPincodesByLocality]);

  useEffect(() => {
    if (toRegion.country) getToStatesByCountry(toRegion.country);
  }, [toRegion.country, getToStatesByCountry]);

  useEffect(() => {
    if (toRegion.state) getToCitiesByState(toRegion.state);
  }, [toRegion.state, getToCitiesByState]);

  useEffect(() => {
    if (toRegion.city) getToLocalitiesByCity(toRegion.city);
  }, [toRegion.city, getToLocalitiesByCity]);

  useEffect(() => {
    if (toRegion.locality) getToPincodesByLocality(toRegion.locality);
  }, [toRegion.locality, getToPincodesByLocality]);

  const handleRegionChange = (type, field, value) => {
    const reset = { state: "", city: "", locality: "", pincode: "" };
    let updated;

    if (type === "from") {
      updated = {
        ...fromRegion,
        [field]: value,
        ...(field === "country" ? reset : {}),
        ...(field === "state" ? { city: "", locality: "", pincode: "" } : {}),
        ...(field === "city" ? { locality: "", pincode: "" } : {}),
        ...(field === "locality" ? { pincode: "" } : {}),
      };
      setFromRegion(updated);
    } else if (type === "to") {
      updated = {
        ...toRegion,
        [field]: value,
        ...(field === "country" ? reset : {}),
        ...(field === "state" ? { city: "", locality: "", pincode: "" } : {}),
        ...(field === "city" ? { locality: "", pincode: "" } : {}),
        ...(field === "locality" ? { pincode: "" } : {}),
      };
      setToRegion(updated);
    }
  };

  useEffect(() => {
    if (selectedVendor) {
      getVendorById(selectedVendor);
      setSelectedVendorVehicle("");
    }
  }, [selectedVendor, getVendorById]);

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
    if (
      fetchedInvoiceData &&
      selectedGood !== (fetchedInvoiceData.invoice?.goodsType?._id || "")
    ) {
      setSelectedItems([]);
    }
  }, [selectedGood, fetchedInvoiceData]);

  const handleItemCheckbox = (item) => {
    setSelectedItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  // useEffect(() => {
  //   if (
  //     vendorDetails?.vendor?.availableVehicles?.length > 0 &&
  //     fetchedInvoiceData?.vehicle?._id
  //   ) {
  //     const match = vendorDetails.vendor.availableVehicles.find(
  //       (v) => String(v._id) === String(fetchedInvoiceData.vehicle._id)
  //     );

  //     if (match) {
  //       setSelectedVendorVehicle(match);
  //       setSelectedVendorVehicleNumber(match.vehicleNumber);
  //     }
  //   }
  // }, [vendorDetails, fetchedInvoiceData]);

  // --- 2. When vendor details are loaded, auto-select the correct vendor vehicle object ---
  useEffect(() => {
    if (
      fetchedInvoiceData?.invoice?.vehicleType === "Vendor" &&
      vendorDetails?.vendor?.availableVehicles?.length > 0 &&
      fetchedInvoiceData.invoice.vendorVehicle?.vehicleNumber
    ) {
      const match = vendorDetails.vendor.availableVehicles.find(
        (v) => v.vehicleNumber === fetchedInvoiceData.invoice.vendorVehicle.vehicleNumber
      );
      if (match) {
        setSelectedVendorVehicle(match);
        setSelectedVendorVehicleNumber(match.vehicleNumber);
      }
    }
  }, [vendorDetails, fetchedInvoiceData]);

  useEffect(() => {
    // Prefill with invoice's driverContactNumber on mount
    if (fetchedInvoiceData && fetchedInvoiceData.invoice) {
      setDriverContactNumber(fetchedInvoiceData.invoice.driverContactNumber || "");
    }
  }, [fetchedInvoiceData]);

  useEffect(() => {
    // When driver changes, update to selected driver's mobile
    if (selectedDriver && driversData?.drivers) {
      const driverObj = driversData.drivers.find(d => d._id === selectedDriver);
      setDriverContactNumber(driverObj?.mobile || "");
    } else if (fetchedInvoiceData?.invoice?.driverContactNumber) {
      setDriverContactNumber(fetchedInvoiceData.invoice.driverContactNumber);
    } else {
      setDriverContactNumber("");
    }
  }, [selectedDriver, driversData, fetchedInvoiceData]);

  //Validations
  const handleSubmit = async () => {
    if (
      !customerId ||
      !invoiceDate ||
      !dispatchDateTime ||
      !paymentType ||
      !vehicleType ||
      !fromRegion.country ||
      !fromRegion.state ||
      !fromRegion.city ||
      !fromRegion.locality ||
      !fromRegion.pincode ||
      !toRegion.country ||
      !toRegion.state ||
      !toRegion.city ||
      !toRegion.locality ||
      !toRegion.pincode
    ) {
      toast.error(
        "Please fill all required fields, including From and To addresses."
      );
      return;
    }

    let payload = {
      invoiceId,
      customer: customerId,
      invoiceDate,
      dispatchDateTime,
      paymentType,
      company: companyId,
      branch: branchId,
      remarks,
      vehicleType,
      totalWeight: totalWeight === "" ? null : Number(totalWeight),
      freightCharges: freightCharges === "" ? null : Number(freightCharges),
      numberOfPackages:
        numberOfPackages === "" ? null : Number(numberOfPackages),
      goodsType: selectedGood,
      goodItems: selectedItems.map((name) => ({ name })),
      fromAddress: fromRegion,
      toAddress: toRegion,
      driver: selectedDriver,
      pickupAddress,
      deliveryAddress,
      consignor,
      consignee,
      address,
      invoiceNumber,
      invoiceBill,
      ewayBillNo,
      siteId,
      sealNo,
      vehicleSize,
      siteType: selectedSiteType,
      orderNumber,
      transportMode: selectedTransportMode,
    };

    if (vehicleType === "Dellcube") {
      payload.vehicle = selectedVehicle;
      delete payload.vendor;
      delete payload.vendorVehicleNumber;
      delete payload.vendorVehicle;
    } else if (vehicleType === "Vendor") {
      payload.vendor = selectedVendor;
      payload.vendorVehicleNumber = selectedVendorVehicle?.vehicleNumber;
      payload.vendorVehicle = selectedVendorVehicle;
      delete payload.vehicle;
    } else {
      delete payload.vehicle;
      delete payload.vendor;
      delete payload.vendorVehicleNumber;
      delete payload.vendorVehicle;
    }

    Object.keys(payload).forEach(
      (key) =>
        (payload[key] === undefined || payload[key] === null) &&
        delete payload[key]
    );

    try {
      const res = await updateInvoice(payload).unwrap();
      if (res?.success) {
        toast.success("Invoice updated successfully");
        navigate("/admin/invoices");
      } else {
        toast.error(res?.message || "Failed to update invoice");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Error updating invoice");
    }
  };

  const AddressFields = ({
    type,
    region,
    handleRegionChange,
    countries,
    stateData,
    cityData,
    localityData,
    pincodeData,
    isDisabled,
  }) => (
    <div className="space-y-4 p-4 border rounded-lg shadow-sm dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white capitalize">
        {type} Address
      </h3>
      <Select
        value={region.country}
        onValueChange={(val) => handleRegionChange(type, "country", val)}
        disabled={isDisabled}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Country" />
        </SelectTrigger>
        <SelectContent>
          {countries?.countries?.map((c) => (
            <SelectItem key={c._id} value={c._id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={region.state}
        onValueChange={(val) => handleRegionChange(type, "state", val)}
        disabled={isDisabled || !region.country || !stateData?.data?.length}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select State" />
        </SelectTrigger>
        <SelectContent>
          {stateData?.data?.map((s) => (
            <SelectItem key={s._id} value={s._id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={region.city}
        onValueChange={(val) => handleRegionChange(type, "city", val)}
        disabled={isDisabled || !region.state || !cityData?.cities?.length}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select City" />
        </SelectTrigger>
        <SelectContent>
          {cityData?.cities?.map((c) => (
            <SelectItem key={c._id} value={c._id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={region.locality}
        onValueChange={(val) => handleRegionChange(type, "locality", val)}
        disabled={isDisabled || !region.city || !localityData?.data?.length}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Locality" />
        </SelectTrigger>
        <SelectContent>
          {localityData?.data?.map((l) => (
            <SelectItem key={l._id} value={l._id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={region.pincode}
        onValueChange={(val) => handleRegionChange(type, "pincode", val)}
        disabled={
          isDisabled || !region.locality || !pincodeData?.pincodes?.length
        }
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Pincode" />
        </SelectTrigger>
        <SelectContent>
          {pincodeData?.pincodes?.map((p) => (
            <SelectItem key={p._id} value={p._id}>
              {p.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const isFormDisabled = isInvoiceLoading || !fetchedInvoiceData?.invoice;

  if (isInvoiceLoading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-gray-500" />
        <p className="text-gray-500 ml-2">Loading Invoice Data...</p>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/invoices")}
              className="text-gray-600 hover:text-gray-900"
            >
              {/* You can use an icon here if desired */}
              Back to Invoices
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Update Invoice
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Edit the details below to update the invoice
          </p>
        </div>

        {/* Two-sided layout */}
        <div className="flex gap-6">
          {/* Left side - Main form (70%) */}
          <div className="flex-1 space-y-6">
            {/* 1. Basic Information */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isSuperAdmin && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          Company
                        </Label>
                        <Select
                          value={companyId}
                          onValueChange={(val) => {
                            setCompanyId(val);
                            setBranchId("");
                          }}
                          disabled={!isSuperAdmin || isFormDisabled}
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
                          Branch
                        </Label>
                        <Select
                          value={branchId}
                          onValueChange={setBranchId}
                          disabled={
                            !companyId || !isSuperAdmin || isFormDisabled
                          }
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
                      Customer
                    </Label>
                    <Select
                      value={customerId}
                      onValueChange={setCustomerId}
                      disabled={isFormDisabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Customer" />
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Invoice Date
                    </Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full"
                      disabled={isFormDisabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Dispatch Date & Time
                    </Label>
                    <Input
                      type="datetime-local"
                      value={dispatchDateTime}
                      onChange={(e) => setDispatchDateTime(e.target.value)}
                      className="w-full"
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Delivery Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Pickup Address
                    </Label>
                    <Input
                      type="text"
                      value={pickupAddress}
                      onChange={e => setPickupAddress(e.target.value)}
                      placeholder="Enter pickup address"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Delivery Address
                    </Label>
                    <Input
                      type="text"
                      value={deliveryAddress}
                      onChange={e => setDeliveryAddress(e.target.value)}
                      placeholder="Enter delivery address"
                      className="w-full"
                    />
                  </div>
                </div>
                {/* Add Pickup/Delivery Address region fields side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <AddressFields
                    type="from"
                    region={fromRegion}
                    handleRegionChange={handleRegionChange}
                    countries={countries}
                    stateData={fromStateData}
                    cityData={fromCityData}
                    localityData={fromLocalityData}
                    pincodeData={fromPincodeData}
                    isDisabled={isFormDisabled}
                  />
                  <AddressFields
                    type="to"
                    region={toRegion}
                    handleRegionChange={handleRegionChange}
                    countries={countries}
                    stateData={toStateData}
                    cityData={toCityData}
                    localityData={toLocalityData}
                    pincodeData={toPincodeData}
                    isDisabled={isFormDisabled}
                  />
                </div>
                {/* Remaining Delivery Details fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Consignor/Sender
                    </Label>
                    <Input
                      type="text"
                      value={consignor}
                      onChange={e => setConsignor(e.target.value)}
                      placeholder="Enter consignor/sender"
                      className="w-full"
                      disabled={isFormDisabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Site Type
                    </Label>
                    <Select
                      value={selectedSiteType}
                      onValueChange={setSelectedSiteType}
                      disabled={isFormDisabled}
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
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Site ID
                    </Label>
                    <Input
                      type="text"
                      value={siteId}
                      onChange={e => setSiteId(e.target.value)}
                      placeholder="Enter site ID"
                      className="w-full"
                      disabled={isFormDisabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Consignee/Receiver
                    </Label>
                    <Input
                      type="text"
                      value={consignee}
                      onChange={e => setConsignee(e.target.value)}
                      placeholder="Enter consignee/receiver"
                      className="w-full"
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Goods / Order Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Goods / Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Goods Type
                    </Label>
                    <Select
                      value={selectedGood}
                      onValueChange={setSelectedGood}
                      disabled={isFormDisabled}
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
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Order Number
                    </Label>
                    <Input
                      type="text"
                      value={orderNumber}
                      onChange={e => setOrderNumber(e.target.value)}
                      placeholder="Enter order number"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Number of Boxes/Packages
                    </Label>
                    <Input
                      type="number"
                      value={numberOfPackages}
                      onChange={e => setNumberOfPackages(e.target.value)}
                      placeholder="Enter number of boxes/packages"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Total Weight (kg)
                    </Label>
                    <Input
                      type="number"
                      value={totalWeight}
                      onChange={e => setTotalWeight(e.target.value)}
                      placeholder="Enter total weight"
                      className="w-full"
                    />
                  </div>
                </div>
                {/* Goods Items Selection (checkboxes) */}
                {selectedGood && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Label className="text-sm font-medium mb-2 block">
                      Select Items from {goodsData?.goodss?.find((g) => g._id === selectedGood)?.name}:
                    </Label>
                    <div className="flex flex-wrap gap-3">
                      {goodsData?.goodss
                        ?.find((g) => g._id === selectedGood)
                        ?.items?.map((item) => (
                          <div key={item} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`item-${item}`}
                              checked={selectedItems.includes(item)}
                              onChange={() => handleItemCheckbox(item)}
                              className="w-4 h-4 text-blue-600 rounded"
                              disabled={isFormDisabled}
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
              </CardContent>
            </Card>

            {/* 4. Vehicle Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vehicle Owner (Dellcube/Vendor) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Vehicle Owner
                    </Label>
                    <Select
                      value={vehicleType}
                      onValueChange={(val) => {
                        setVehicleType(val);
                        setSelectedVendor("");
                        setSelectedVehicle("");
                        setSelectedVendorVehicle("");
                      }}
                      disabled={isFormDisabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Owner" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dellcube">Dellcube</SelectItem>
                        <SelectItem value="Vendor">Vendor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Vehicle Number */}
                  {vehicleType === "Dellcube" && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Vehicle Number
                      </Label>
                      <Select
                        value={selectedVehicle}
                        onValueChange={setSelectedVehicle}
                        disabled={!vehicleData?.vehicles?.length || isFormDisabled}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Vehicle Number" />
                        </SelectTrigger>
                        <SelectContent>
                          {vehicleData?.vehicles?.map((vehicle) => (
                            <SelectItem key={vehicle._id} value={vehicle._id}>
                              {vehicle.vehicleNumber} - {vehicle.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {vehicleType === "Vendor" && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          Vendor
                        </Label>
                        <Select
                          value={selectedVendor}
                          onValueChange={setSelectedVendor}
                          disabled={!vendorData?.vendors?.length || isFormDisabled}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Vendor" />
                          </SelectTrigger>
                          <SelectContent>
                            {vendorData?.vendors?.map((vendor) => (
                              <SelectItem key={vendor._id} value={vendor._id}>
                                {vendor.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedVendor && vendorDetails?.vendor?.availableVehicles?.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium flex items-center gap-2">
                            Vendor Vehicle Number
                          </Label>
                          <Select
                            value={selectedVendorVehicle?._id || ""}
                            onValueChange={(val) => {
                              const vehicleObj = vendorDetails.vendor.availableVehicles.find(v => v._id === val);
                              setSelectedVendorVehicle(vehicleObj);
                            }}
                            disabled={isFormDisabled}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select Vendor Vehicle" />
                            </SelectTrigger>
                            <SelectContent>
                              {vendorDetails?.vendor?.availableVehicles?.map((v) => (
                                <SelectItem key={v._id} value={v._id}>
                                  {v.vehicleNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </>
                  )}
                  {/* Vehicle Type/Size */}
                  {vehicleType === "Dellcube" && selectedVehicle && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium flex items-center gap-2">
                        Vehicle Type/Size
                      </Label>
                      <Select value={vehicleSize} onValueChange={setVehicleSize} disabled>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Vehicle Size" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const foundVehicle = vehicleData?.vehicles?.find(v => v._id === selectedVehicle);
                            return foundVehicle && foundVehicle.type ? (
                              <SelectItem value={foundVehicle.type}>{foundVehicle.type}</SelectItem>
                            ) : null;
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {/* Driver Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      Driver Name
                    </Label>
                    <Select
                      value={selectedDriver}
                      onValueChange={setSelectedDriver}
                      disabled={isDriversLoading || isFormDisabled}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Driver" />
                      </SelectTrigger>
                      <SelectContent>
                        {driversData?.drivers?.map((driver) => (
                          <SelectItem key={driver._id} value={driver._id}>
                            {driver.name} ({driver.mobile})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Invoice Details (previously Additional Details) and submit (30%) */}
          <div className="w-80 space-y-6">
            {/* 5. Invoice Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Mode/Type</Label>
                  <Select
                    value={paymentType}
                    onValueChange={setPaymentType}
                    disabled={isFormDisabled}
                  >
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Eway Bill No</Label>
                  <Input
                    type="text"
                    value={ewayBillNo}
                    onChange={e => setEwayBillNo(e.target.value)}
                    placeholder="Enter eway bill no"
                    className="w-full"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Invoice No</Label>
                  <Input
                    type="text"
                    value={invoiceNumber}
                    onChange={e => setInvoiceNumber(e.target.value)}
                    placeholder="Enter invoice no"
                    className="w-full"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Invoice Amount</Label>
                  <Input
                    type="number"
                    value={invoiceBill}
                    onChange={e => setInvoiceBill(e.target.value)}
                    placeholder="Enter invoice amount"
                    className="w-full"
                    disabled={isFormDisabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Transport Mode</Label>
                  <Select value={selectedTransportMode} onValueChange={setSelectedTransportMode} disabled={isFormDisabled}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Transport Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {transportModesData?.transportModes?.map((mode) => (
                        <SelectItem key={mode._id} value={mode._id}>{mode.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Freight Charges</Label>
                  <Input
                    type="number"
                    value={freightCharges}
                    onChange={e => setFreightCharges(e.target.value)}
                    placeholder="Enter freight charges"
                    className="w-full"
                    disabled={isFormDisabled}
                  />
                </div>
              </CardContent>
            </Card>
            {/* Submit Button */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={isUpdating || isFormDisabled}
                  className="w-full bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium py-3 text-base border border-[#FFD249] transition-colors"
                >
                  {isUpdating ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Updating Invoice...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Update Invoice
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateInvoice;
