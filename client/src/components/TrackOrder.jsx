import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Package, MapPin, User, Truck, Calendar, FileText, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";
import { useLazyTrackByDocketNumberQuery } from "@/features/api/Tracking/trackingApi";
import { toast } from "react-hot-toast";

const TIMELINE_STEPS = [
  { status: "Reserved", label: "Reserved", icon: Clock },
  { status: "Created", label: "Created", icon: FileText },
  { status: "Dispatched", label: "Dispatched", icon: Package },
  { status: "In Transit", label: "In Transit", icon: Truck },
  { status: "Arrived at Destination", label: "Arrived", icon: MapPin },
  { status: "Undelivered", label: "Undelivered", icon: AlertCircle },
  { status: "Delivered", label: "Delivered", icon: CheckCircle2 },
];

const TrackOrder = () => {
  const [searchParams] = useSearchParams();
  const docketFromUrl = searchParams.get("docket") || "";
  
  const [docketNumber, setDocketNumber] = useState(docketFromUrl);
  const [trackInvoice, { data, isLoading, isError, error }] = useLazyTrackByDocketNumberQuery();

  const handleTrack = async () => {
    if (!docketNumber.trim()) {
      toast.error("Please enter a docket number");
      return;
    }
    await trackInvoice(docketNumber.trim());
  };

  const invoice = data?.invoice;
  const currentStepIndex = invoice
    ? Math.max(
        TIMELINE_STEPS.findIndex((step) => step.status === invoice.status),
        0
      )
    : 0;
  const progressPercent =
    TIMELINE_STEPS.length > 1
      ? (currentStepIndex / (TIMELINE_STEPS.length - 1)) * 100
      : 0;
  const isExceptionStatus =
    invoice && ["Cancelled", "Returned", "Undelivered"].includes(invoice.status);

  const getStatusColor = (status) => {
    const statusColors = {
      "Reserved": "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      "Created": "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20",
      "Dispatched": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
      "In Transit": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
      "Arrived at Destination": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
      "Undelivered": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      "Delivered": "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
      "Cancelled": "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
      "Returned": "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20",
    };
    return statusColors[status] || "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
  };

  const getStatusIcon = (status) => {
    const icons = {
      "Reserved": <Clock className="w-5 h-5" />,
      "Created": <FileText className="w-5 h-5" />,
      "Dispatched": <Package className="w-5 h-5" />,
      "In Transit": <Truck className="w-5 h-5" />,
      "Arrived at Destination": <MapPin className="w-5 h-5" />,
      "Undelivered": <AlertCircle className="w-5 h-5" />,
      "Delivered": <CheckCircle2 className="w-5 h-5" />,
      "Cancelled": <XCircle className="w-5 h-5" />,
      "Returned": <AlertCircle className="w-5 h-5" />,
    };
    return icons[status] || <AlertCircle className="w-5 h-5" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF0] via-white to-[#FFF9E6] dark:from-gray-900 dark:via-[#1a1a1a] dark:to-gray-900">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Header with improved styling */}
        <div className="text-center mb-8 md:mb-10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-[#FFD249] blur-xl opacity-30 animate-pulse hidden sm:block"></div>
              <div className="relative p-4 bg-gradient-to-br from-[#FFD249] to-[#FFC107] rounded-2xl shadow-lg mx-auto sm:mx-0">
                <Package className="w-9 h-9 sm:w-10 sm:h-10 text-[#202020]" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#202020] to-gray-700 dark:from-[#FFD249] dark:to-[#FFC107] bg-clip-text text-transparent">
                Track Your Order
              </h1>
              <div className="h-1 w-24 sm:w-32 bg-gradient-to-r from-[#FFD249] to-[#FFC107] rounded-full mt-2 mx-auto sm:mx-0"></div>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg px-2">
            Enter your docket number to track your shipment in real-time
          </p>
        </div>

        {/* Search Box with enhanced design */}
        <Card className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl mb-8 md:mb-10 border-2 border-[#FFD249]/20 dark:border-[#FFD249]/10">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Input
                placeholder="Enter Docket Number (e.g., DISPL-GUJ-251112-0001)"
                value={docketNumber}
                onChange={(e) => setDocketNumber(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleTrack()}
                className="text-base sm:text-lg h-12 sm:h-14 pl-4 pr-4 border-2 border-gray-200 dark:border-gray-700 focus:border-[#FFD249] dark:focus:border-[#FFD249] rounded-xl transition-all"
                disabled={isLoading}
              />
            </div>
            <Button
              onClick={handleTrack}
              disabled={isLoading}
              className="bg-gradient-to-r from-[#FFD249] to-[#FFC107] hover:from-[#FFC107] hover:to-[#FFD249] text-[#202020] font-semibold px-8 sm:px-10 h-12 sm:h-14 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                  <span className="text-sm sm:text-base">Track Order</span>
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Error State with improved design */}
        {isError && (
          <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-2 border-red-300 dark:border-red-700 rounded-2xl p-6 mb-10 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500 rounded-xl">
                <XCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-red-900 dark:text-red-200 mb-1">Tracking Failed</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error?.data?.message || "Could not find any shipment with this docket number. Please check the docket number and try again."}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Results with enhanced design */}
        {invoice && (
          <div className="space-y-6">
            {/* Status Card with gradient border */}
            <Card className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl border-2 border-[#FFD249]/30 dark:border-[#FFD249]/20 relative overflow-hidden">
              {/* Decorative gradient background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FFD249]/10 to-transparent rounded-full blur-3xl"></div>
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                  <div>
                    <div className="inline-block px-3 py-1 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg mb-3">
                      <p className="text-xs font-semibold text-[#202020] dark:text-[#FFD249]">DOCKET NUMBER</p>
                    </div>
                    <h2 className="text-3xl font-bold text-[#202020] dark:text-white mb-2 tracking-wide">
                      {invoice.docketNumber}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Invoice:{" "}
                      <span className="font-medium">
                        {Array.isArray(invoice.invoiceNumber)
                          ? invoice.invoiceNumber.join(", ")
                          : invoice.invoiceNumber || "-"}
                      </span>
                    </p>
                    {invoice.status === "Undelivered" && invoice.undeliveredReason && (
                      <p className="text-sm text-red-500 mt-2">
                        Last Attempt: {invoice.undeliveredReason}
                      </p>
                    )}
                  </div>
                  <Badge className={`${getStatusColor(invoice.status)} px-6 py-3 text-base font-bold flex items-center gap-2 shadow-lg border-2`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status?.toUpperCase().replace("-", " ")}
                  </Badge>
                </div>
              </div>

              {/* Timeline with improved header */}
              <div className="border-t-2 border-[#FFD249]/30 dark:border-[#FFD249]/20 pt-8 relative">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                  <div className="p-2 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-[#202020] dark:text-[#FFD249]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#202020] dark:text-white">
                    Shipment Timeline
                  </h3>
                </div>
                
                {/* Desktop timeline */}
                <div className="hidden md:block">
                  <div className="relative mb-10">
                    <div className="absolute left-0 right-0 top-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    {!isExceptionStatus && (
                      <div
                        className="absolute left-0 top-6 h-2 bg-gradient-to-r from-[#FFD249] via-[#FFC107] to-[#FFD249] rounded-full transition-all duration-700 shadow-lg"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(100, progressPercent)
                          )}%`,
                        }}
                      ></div>
                    )}
                    <div className="relative flex justify-between">
                      {TIMELINE_STEPS.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted =
                          !isExceptionStatus && index <= currentStepIndex;
                        return (
                          <div
                            key={step.status}
                            className="flex flex-col items-center text-center px-2"
                          >
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all z-10 shadow ${
                                isCompleted
                                  ? "bg-gradient-to-br from-[#FFD249] to-[#FFC107] border-[#FFD249]"
                                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                              }`}
                            >
                              <Icon
                                className={`w-6 h-6 ${
                                  isCompleted
                                    ? "text-[#202020]"
                                    : "text-gray-400 dark:text-gray-500"
                                }`}
                              />
                            </div>
                            <p className="text-xs font-semibold mt-3 text-gray-700 dark:text-gray-300">
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mobile-friendly vertical timeline */}
                <div className="flex flex-col gap-3 md:hidden">
                  {TIMELINE_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isCompleted =
                      !isExceptionStatus && index <= currentStepIndex;
                    return (
                      <div
                        key={step.status}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isCompleted
                            ? "border-[#FFD249]/70 bg-[#FFD249]/10"
                            : "border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted
                              ? "bg-gradient-to-br from-[#FFD249] to-[#FFC107]"
                              : "bg-gray-100 dark:bg-gray-800"
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isCompleted
                                ? "text-[#202020]"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {step.label}
                          </p>
                          {index === currentStepIndex && !isExceptionStatus && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last update:{" "}
                              {formatDate(
                                invoice.updatedAt || invoice.createdAt
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Cancelled/Returned Status with enhanced design */}
                {(invoice.status === "Cancelled" || invoice.status === "Returned") && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-2xl border-2 border-red-300 dark:border-red-700 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg ${
                        invoice.status === "Cancelled" ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-gray-500 to-gray-600"
                      }`}>
                        {invoice.status === "Cancelled" ? (
                          <XCircle className="w-8 h-8 text-white" />
                        ) : (
                          <AlertCircle className="w-8 h-8 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-900 dark:text-red-200">
                          Order {invoice.status}
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300">
                          {formatDate(invoice.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Shipment Details with theme styling */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* From Location */}
              <Card className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-[#FFD249]/50 transition-all shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#202020] dark:text-[#FFD249]" />
                  </div>
                  <h3 className="text-base font-bold text-[#202020] dark:text-white">
                    From
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 dark:text-white">{invoice.from.address}</p>
                  {invoice.from.city && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.from.city}</p>}
                  {invoice.from.state && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.from.state}</p>}
                  {invoice.from.pincode && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">PIN: {invoice.from.pincode}</p>
                  )}
                </div>
              </Card>

              {/* To Location */}
              <Card className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-[#FFD249]/50 transition-all shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#202020] dark:text-[#FFD249]" />
                  </div>
                  <h3 className="text-base font-bold text-[#202020] dark:text-white">
                    To
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 dark:text-white">{invoice.to.address}</p>
                  {invoice.to.city && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.to.city}</p>}
                  {invoice.to.state && <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.to.state}</p>}
                  {invoice.to.pincode && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">PIN: {invoice.to.pincode}</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Package Details */}
            <Card className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-[#FFD249]/50 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg">
                  <Package className="w-5 h-5 text-[#202020] dark:text-[#FFD249]" />
                </div>
                <h3 className="text-base font-bold text-[#202020] dark:text-white">
                  Package Details
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consignor</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.consignor || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Consignee</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.consignee || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Number of Packages</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.packageDetails?.numberOfPackages || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Weight</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.packageDetails?.weight ? `${invoice.packageDetails.weight} kg` : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Goods Type</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.packageDetails?.goodsType || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Goods Value</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {invoice.packageDetails?.goodsValue ? `₹${invoice.packageDetails.goodsValue}` : "-"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Driver & Vehicle Info */}
            {(invoice.driver || invoice.vehicle) && (
              <div className="grid md:grid-cols-2 gap-6">
                {invoice.driver && (
                  <Card className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-[#FFD249]/50 transition-all shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg">
                        <User className="w-5 h-5 text-[#202020] dark:text-[#FFD249]" />
                      </div>
                      <h3 className="text-base font-bold text-[#202020] dark:text-white">
                        Driver Information
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.driver.name}
                        </p>
                      </div>
                      {invoice.driver.phone && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.driver.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {invoice.vehicle && (
                  <Card className="bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-gray-100 dark:border-gray-700 hover:border-[#FFD249]/50 transition-all shadow-lg">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-[#FFD249]/20 dark:bg-[#FFD249]/10 rounded-lg">
                        <Truck className="w-5 h-5 text-[#202020] dark:text-[#FFD249]" />
                      </div>
                      <h3 className="text-base font-bold text-[#202020] dark:text-white">
                        Vehicle Information
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Registration Number</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.vehicle.registrationNumber}
                        </p>
                      </div>
                      {invoice.vehicle.type && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.vehicle.type}
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* Delivery Proof with theme styling */}
            {invoice.deliveryProof && invoice.status === "Delivered" && (
              <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-green-900 dark:text-green-200">
                    Delivery Confirmation
                  </h3>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400 mb-1">Receiver Name</p>
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">
                      {invoice.deliveryProof.receiverName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700 dark:text-green-400 mb-1">Receiver Mobile</p>
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">
                      {invoice.deliveryProof.receiverMobile}
                    </p>
                  </div>
                  {invoice.deliveryProof.floor && (
                    <div>
                      <p className="text-xs text-green-700 dark:text-green-400 mb-1">Floor</p>
                      <p className="text-sm font-medium text-green-900 dark:text-green-200">
                        {invoice.deliveryProof.floor}
                      </p>
                    </div>
                  )}
                  {invoice.deliveryProof.remarks && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-green-700 dark:text-green-400 mb-1">Remarks</p>
                      <p className="text-sm font-medium text-green-900 dark:text-green-200">
                        {invoice.deliveryProof.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Company Contact with theme styling */}
            {invoice.company && (
              <Card className="bg-gradient-to-br from-[#FFD249]/10 to-[#FFC107]/10 dark:from-[#FFD249]/5 dark:to-[#FFC107]/5 rounded-2xl p-6 border-2 border-[#FFD249]/30 dark:border-[#FFD249]/20 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-gradient-to-br from-[#FFD249] to-[#FFC107] rounded-xl shadow-lg">
                    <FileText className="w-6 h-6 text-[#202020]" />
                  </div>
                  <h3 className="text-lg font-bold text-[#202020] dark:text-white">
                    Need Help?
                  </h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {invoice.company.name}
                  </p>
                  {invoice.company.contactPhone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Phone: {invoice.company.contactPhone}
                    </p>
                  )}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;

