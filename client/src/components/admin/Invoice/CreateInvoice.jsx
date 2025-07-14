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
  Weight
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

// API imports
import { useCreateInvoiceMutation } from "@/features/api/Invoice/invoiceApi.js";
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

const CreateInvoice = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "superAdmin";
  const isBranchAdmin = user?.role === "branchAdmin";

  // Initialize with user's company/branch for branch admins
  const [companyId, setCompanyId] = useState(user?.company?._id || "");
  const [branchId, setBranchId] = useState(user?.branch?._id || "");
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
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceBill, setInvoiceBill] = useState("");
  const [ewayBillNo, setEwayBillNo] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sealNo, setSealNo] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [selectedSiteType, setSelectedSiteType] = useState("");
  const [orderNumber, setOrderNumber] = useState("");

  // Add state for vehicle size
  const [vehicleSize, setVehicleSize] = useState("");

  // State for "From" address fields - Set default country as India
  const [fromRegion, setFromRegion] = useState({
    country: "",
    state: "",
    city: "",
    locality: "",
    pincode: "",
  });

  const [toRegion, setToRegion] = useState({
    country: "",
    state: "",
    city: "",
    locality: "",
    pincode: "",
  });

  const [selectedTransportMode, setSelectedTransportMode] = useState("");

  const [getFromStatesByCountry, { data: fromStateData }] =
    useGetStatesByCountryMutation();
  const [getFromCitiesByState, { data: fromCityData }] =
    useGetCitiesByStateMutation();
  const [getFromLocalitiesByCity, { data: fromLocalityData }] =
    useGetLocalitiesByCityMutation();
  const [getFromPincodesByLocality, { data: fromPincodeData }] =
    useGetPincodesByLocalityMutation();

  const [getToStatesByCountry, { data: toStateData }] =
    useGetStatesByCountryMutation();
  const [getToCitiesByState, { data: toCityData }] =
    useGetCitiesByStateMutation();
  const [getToLocalitiesByCity, { data: toLocalityData }] =
    useGetLocalitiesByCityMutation();
  const [getToPincodesByLocality, { data: toPincodeData }] =
    useGetPincodesByLocalityMutation();

  const { data: companies } = useGetAllCompaniesQuery({});
  const [getBranchesByCompany] = useGetBranchesByCompanyMutation();
  const { data: customersData } = useGetAllCustomersQuery(
    { companyId, branchId },
    { skip: !companyId || !branchId }
  );
  console.log(customersData)
  const { data: countries } = useGetAllCountriesQuery({
    page: 1,
    limit: 10000,
  });
  const { data: driversData, isLoading: isDriversLoading } =
    useGetAllDriversQuery({});
  const { data: goodsData } = useGetAllGoodsQuery({ page: 1, limit: 1000 });
  
  const { data: vehicleData, refetch: refetchVehicles } = useGetAllVehiclesQuery({
    page: 1,
    limit: 1000,
    companyId: companyId,
    branchId: branchId,
  }, {
    skip: !companyId || !branchId
  });
  
  const { data: vendorData, refetch: refetchVendors } = useGetAllVendorsQuery({
    companyId: companyId,
    branchId: branchId,
    status: "active",
  }, {
    skip: !companyId || !branchId
  });

  const { data: siteTypesData } = useGetAllSiteTypesQuery({
    page: 1,
    limit: 1000,
    status: "true"
  });

  const { data: transportModesData } = useGetAllTransportModesQuery({ page: 1, limit: 1000, status: "true" });

  const [getVendorById, { data: vendorDetails }] = useGetVendorByIdMutation();
  const [createInvoice, { isLoading }] = useCreateInvoiceMutation();

  useEffect(() => {
    if (countries?.countries) {
      const indiaCountry = countries.countries.find(country => 
        country.name.toLowerCase() === 'india'
      );
      if (indiaCountry) {
        setFromRegion(prev => ({ ...prev, country: indiaCountry._id }));
        setToRegion(prev => ({ ...prev, country: indiaCountry._id }));
      }
    }
  }, [countries]);

  useEffect(() => {
    if (companyId && branchId) {
      refetchVehicles();
      refetchVendors();
    }
  }, [companyId, branchId, refetchVehicles, refetchVendors]);

  // Region fetch logic for "From" address
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

  // Region fetch logic for "To" address
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
    if (selectedDriver && driversData?.drivers) {
      const driverObj = driversData.drivers.find(d => d._id === selectedDriver);
      setDriverContactNumber(driverObj?.mobile || "");
    } else {
      setDriverContactNumber("");
    }
  }, [selectedDriver, driversData]);

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

  const handleSubmit = async () => {
    // Basic validation for required fields
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
      customer: customerId,
      invoiceDate,
      dispatchDateTime,
      paymentType,
      company: companyId,
      branch: branchId,
      remarks,
      vehicleType,
      totalWeight,
      freightCharges,
      numberOfPackages,
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
      driverContactNumber,
      siteId,
      sealNo,
      vehicleModel,
      siteType: selectedSiteType,
      vehicleSize,
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
      const res = await createInvoice(payload).unwrap();
      if (res?.success) {
        toast.success("Invoice created successfully");
        navigate("/admin/invoices");
      } else {
        toast.error(res?.message || "Failed to create invoice");
      }
    } catch (err) {
      toast.error(err?.data?.message || "Error creating invoice");
    }
  };

  // Add effect to auto-select driver when Dellcube vehicle is selected
  useEffect(() => {
    if (vehicleType === "Dellcube" && selectedVehicle && vehicleData?.vehicles?.length) {
      const foundVehicle = vehicleData.vehicles.find(v => v._id === selectedVehicle);
      if (foundVehicle && foundVehicle.currentDriver && foundVehicle.currentDriver._id) {
        setSelectedDriver(foundVehicle.currentDriver._id);
      }
    }
    // Do not auto-clear driver if vehicle changes, to allow manual override
  }, [selectedVehicle, vehicleType, vehicleData]);

  // Add effect to set vehicleSize when Dellcube vehicle is selected
  useEffect(() => {
    if (vehicleType === "Dellcube" && selectedVehicle && vehicleData?.vehicles?.length) {
      const foundVehicle = vehicleData.vehicles.find(v => v._id === selectedVehicle);
      if (foundVehicle && foundVehicle.type) {
        setVehicleSize(foundVehicle.type);
      } else {
        setVehicleSize("");
      }
    } else {
      setVehicleSize("");
    }
  }, [selectedVehicle, vehicleType, vehicleData]);

  // Helper component for Address fields
  const AddressFields = ({
    type,
    region,
    handleRegionChange,
    countries,
    stateData,
    cityData,
    localityData,
    pincodeData,
  }) => (
    <Card className="border border-gray-200 hover:border-blue-300 transition-colors">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="w-4 h-4 text-blue-600" />
          {type === "from" ? "Pickup Address" : "Delivery Address"}
          <Badge variant={type === "from" ? "default" : "secondary"} className="ml-auto text-xs">
            {type === "from" ? "FROM" : "TO"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-3">
          <Select
            value={region.country}
            onValueChange={(val) => handleRegionChange(type, "country", val)}
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
            disabled={!region.country || !stateData?.data?.length}
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
            disabled={!region.state || !cityData?.cities?.length}
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
            disabled={!region.city || !localityData?.data?.length}
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
            disabled={!region.locality || !pincodeData?.pincodes?.length}
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
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen  ">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin/invoices")}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowRight className="w-4 h-4 rotate-180 mr-2" />
              Back to Invoices
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Invoice
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Fill in the details below to create a new invoice
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
                  <FileText className="w-5 h-5 text-blue-600" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {customersData?.customers?.length ? (
                          customersData?.customers?.map((cust) => (
                            <SelectItem key={cust?._id} value={cust?._id}>
                              {cust?.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-customers" disabled>
                            No customers found for this branch/company
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Invoice Date
                    </Label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
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
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Delivery Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
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
                      <MapPin className="w-4 h-4" />
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
                  />
                </div>
                {/* Remaining Delivery Details fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Consignor/Sender
                    </Label>
                    <Input
                      type="text"
                      value={consignor}
                      onChange={e => setConsignor(e.target.value)}
                      placeholder="Enter consignor/sender"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Site Type
                    </Label>
                    <Select value={selectedSiteType} onValueChange={setSelectedSiteType}>
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
                      <Hash className="w-4 h-4" />
                      Site ID
                    </Label>
                    <Input
                      type="text"
                      value={siteId}
                      onChange={e => setSiteId(e.target.value)}
                      placeholder="Enter site ID"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Consignee/Receiver
                    </Label>
                    <Input
                      type="text"
                      value={consignee}
                      onChange={e => setConsignee(e.target.value)}
                      placeholder="Enter consignee/receiver"
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Goods / Order Details */}
            <Card className="shadow-sm border border-gray-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="w-5 h-5 text-green-600" />
                  Goods / Order Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Goods Type
                    </Label>
                    <Select value={selectedGood} onValueChange={setSelectedGood}>
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
                      <Package className="w-4 h-4" />
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
                      <Weight className="w-4 h-4" />
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
                  <Truck className="w-5 h-5 text-blue-600" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vehicle Owner (Dellcube/Vendor) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Vehicle Owner
                    </Label>
                    <Select
                      value={vehicleType}
                      onValueChange={(val) => {
                        setVehicleType(val);
                        setSelectedVendor("");
                        setSelectedVehicle("");
                      }}
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
                        <Truck className="w-4 h-4" />
                        Vehicle Number
                      </Label>
                      <Select
                        value={selectedVehicle}
                        onValueChange={setSelectedVehicle}
                        disabled={!vehicleData?.vehicles?.length}
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
                          <User className="w-4 h-4" />
                          Vendor
                        </Label>
                        <Select
                          value={selectedVendor}
                          onValueChange={setSelectedVendor}
                          disabled={!vendorData?.vendors?.length}
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
                            <Truck className="w-4 h-4" />
                            Vendor Vehicle Number
                          </Label>
                          <Select
                            value={selectedVendorVehicle?._id || ""}
                            onValueChange={(val) => {
                              const vehicleObj = vendorDetails.vendor.availableVehicles.find(v => v._id === val);
                              setSelectedVendorVehicle(vehicleObj);
                            }}
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
                        <Truck className="w-4 h-4" />
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
                      <User className="w-4 h-4" />
                      Driver Name
                    </Label>
                    <Select
                      value={selectedDriver}
                      onValueChange={setSelectedDriver}
                      disabled={isDriversLoading}
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
                  <FileText className="w-5 h-5 text-purple-600" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Payment Mode/Type</Label>
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
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Eway Bill No</Label>
                  <Input
                    type="text"
                    value={ewayBillNo}
                    onChange={e => setEwayBillNo(e.target.value)}
                    placeholder="Enter eway bill no"
                    className="w-full"
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
                    onChange={e => setFreightCharges(e.target.value)}
                    placeholder="Enter freight charges"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>
            {/* Submit Button */}
            <Card className="shadow-sm border border-gray-200">
              <CardContent className="pt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="w-full bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium py-3 text-base border border-[#FFD249] transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin w-4 h-4" />
                      Creating Invoice...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Create Invoice
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

export default CreateInvoice;
