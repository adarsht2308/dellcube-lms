import React, { useEffect, useRef, useState } from "react";

import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import SignatureCanvas from "react-signature-canvas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import {
  Loader2,
  FileText,
  Package,
  MapPin,
  User,
  Phone,
  Calendar,
  Camera,
  PenTool,
  CheckCircle,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";


import {
  useGetDriverInvoicesQuery,
  useUpdateDriverInvoiceMutation,
} from "@/features/api/DriverInvoice/driverInvoiceApi.js";
import { useGetInvoiceByIdMutation } from "@/features/api/Invoice/invoiceApi.js";
const statusOptions = [
  "Created",
  "Dispatched",
  "In Transit",
  "Arrived at Destination",
  "Delivered",
  "Cancelled",
  "Returned",
];

const UpdateInvoice = () => {
  const location = useLocation();
  const invoiceId = location.state?.invoiceId;
  const previousPage = location.state?.previousPage || "/admin/driver-dashboard";

  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const driverId = user?._id;

  // Add loading state
  const [loading, setLoading] = useState(true);
  const [toAddressLine, setToAddressLine] = useState("");
  const [toCity, setToCity] = useState("");
  const [toState, setToState] = useState("");
  const [toPincode, setToPincode] = useState("");
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [deliveredAt, setDeliveredAt] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverMobile, setReceiverMobile] = useState("");
  const [floor, setFloor] = useState("");
  const [signature, setSignature] = useState("");
  const [remarks, setRemarks] = useState("");
  const [fullDestinationAddress, setFullDestinationAddress] = useState("");

  const [orderPhoto, setOrderPhoto] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [existingOrderPhotoUrl, setExistingOrderPhotoUrl] = useState("");

  const [getInvoiceById] = useGetInvoiceByIdMutation();
  const [updateDriverInvoice, { isLoading }] = useUpdateDriverInvoiceMutation();

  const signaturePadRef = useRef(null);
  const [signatureUrl, setSignatureUrl] = useState(""); // preview URL
  const [signatureFile, setSignatureFile] = useState(null); // file to upload
  const [invoice, setInvoice] = useState(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // 🔁 Fetch invoice data on mount or when invoiceId changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    const fetchInvoice = async () => {
      try {
        const res = await getInvoiceById(invoiceId).unwrap();
        const invoice = res.invoice;
        if (!isMounted) return;
        
        console.log("Fetched invoice data:", invoice);
        
        // Set invoice state
        setInvoice(invoice);
        setStatus(invoice.status || "");
        setNote(
          invoice?.driverUpdates?.[invoice.driverUpdates.length - 1]?.note || ""
        );
        setLat(
          invoice?.driverUpdates?.[invoice.driverUpdates.length - 1]?.location
            ?.lat || ""
        );
        setLng(
          invoice?.driverUpdates?.[invoice.driverUpdates.length - 1]?.location
            ?.lng || ""
        );
        // Set deliveredAt from invoice, or use current date/time if not set
        if (invoice?.deliveredAt) {
          setDeliveredAt(invoice.deliveredAt.slice(0, 16));
        } else {
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          setDeliveredAt(`${year}-${month}-${day}T${hours}:${minutes}`);
        }

        const proof = invoice.deliveryProof || {};
        setReceiverName(proof.receiverName || "");
        setReceiverMobile(proof.receiverMobile || "");
        setFloor(proof.floor || "");
        setSignature(proof.signature || "");
        setRemarks(proof.remarks || "");
        
        // Set existing signature URL if available
        if (proof.signature) {
          setSignatureUrl(proof.signature);
        }

        const to = invoice?.toAddress || {};
        setToAddressLine(to.locality?.name || "");
        setToCity(to.city?.name || "");
        setToState(to.state?.name || "");
        setToPincode(to.pincode?.code || "");

        // Find the most recent order photo from driver updates
        const driverUpdates = invoice?.driverUpdates || [];
        const lastUpdate = driverUpdates[driverUpdates.length - 1];
        let lastPhoto = lastUpdate?.orderPhotoUrl;
        
        // If no photo in last update, check all updates for any photo
        if (!lastPhoto && driverUpdates.length > 0) {
          for (let i = driverUpdates.length - 1; i >= 0; i--) {
            if (driverUpdates[i]?.orderPhotoUrl) {
              lastPhoto = driverUpdates[i].orderPhotoUrl;
              break;
            }
          }
        }
        
        console.log("Driver updates:", driverUpdates);
        console.log("Last update:", lastUpdate);
        console.log("Found existing photo:", lastPhoto);
        
        if (lastPhoto) {
          console.log("Setting existing photo URL:", lastPhoto);
          setExistingOrderPhotoUrl(lastPhoto);
          setPreviewUrl(lastPhoto);
        } else {
          console.log("No existing photo found");
          setExistingOrderPhotoUrl("");
          setPreviewUrl("");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load invoice details");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInvoice();
    return () => {
      isMounted = false;
      // Reset all fields when invoiceId changes
      setStatus("");
      setNote("");
      setLat("");
      setLng("");
      setDeliveredAt("");
      setReceiverName("");
      setReceiverMobile("");
      setFloor("");
      setSignature("");
      setRemarks("");
      setOrderPhoto(null);
      setPreviewUrl("");
    };
  }, [invoiceId, getInvoiceById]);

  useEffect(() => {
    const parts = [toAddressLine, toCity, toState, toPincode].filter(Boolean);
    setFullDestinationAddress(parts.join(", "));
  }, [toAddressLine, toCity, toState, toPincode]);

  // 🧭 Get GPS location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
      },
      (error) => {
        console.error("GPS Error:", error);
        toast.error("Unable to fetch GPS location");
      }
    );
  }, []);

  useEffect(() => {
    if (orderPhoto) {
      console.log("New photo selected, creating preview URL");
      const url = URL.createObjectURL(orderPhoto);
      setPreviewUrl(url);
      return () => {
        console.log("Cleaning up new photo URL");
        URL.revokeObjectURL(url);
      };
    }
  }, [orderPhoto]);

  // Separate useEffect for existing photo display
  useEffect(() => {
    if (!orderPhoto && existingOrderPhotoUrl && !previewUrl) {
      console.log("No new photo selected, showing existing photo:", existingOrderPhotoUrl);
      setPreviewUrl(existingOrderPhotoUrl);
    }
  }, [existingOrderPhotoUrl, orderPhoto, previewUrl]);

  const handleSubmit = async () => {

    // Debug: Check if required fields are present
    console.log("Driver ID:", driverId);
    console.log("Invoice ID:", invoiceId);
    
    if (!driverId || !invoiceId) {
      toast.error("Driver ID or Invoice ID is missing");
      return;
    }

    // Set current date and time if not already set
    let finalDeliveredAt = deliveredAt;
    if (!finalDeliveredAt) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      finalDeliveredAt = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    const formData = new FormData();
    formData.append("driverId", driverId);
    formData.append("invoiceId", invoiceId);

    if (status) formData.append("status", status);
    if (note || lat || lng) {
      formData.append(
        "location",
        JSON.stringify({
          lat: lat ? parseFloat(lat) : undefined,
          lng: lng ? parseFloat(lng) : undefined,
        })
      );
      if (note) formData.append("note", note);
    }
    if (orderPhoto) formData.append("orderPhoto", orderPhoto);
    formData.append("deliveredAt", finalDeliveredAt);
    if (signatureFile) formData.append("receiverSignature", signatureFile);

    const deliveryProof = {
      receiverName,
      receiverMobile,
      floor,
      signature,
      remarks,
    };
    if (receiverName || receiverMobile || signature || remarks) {
      formData.append("deliveryProof", JSON.stringify(deliveryProof));
    }

    // Debug: Log FormData contents
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      console.log(key, ":", value);
    }

    try {
      await updateDriverInvoice(formData).unwrap();
      toast.success("Invoice updated successfully");
      navigate(previousPage);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update invoice");
    }
  };

  const handleSaveSignature = () => {
    if (signaturePadRef.current.isEmpty()) {
      toast.error("Please provide a signature first.");
      return;
    }
    const dataUrl = signaturePadRef.current.toDataURL("image/png");
    setSignatureUrl(dataUrl);

    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "signature.png", { type: "image/png" });
        setSignatureFile(file);
        setIsSignatureModalOpen(false);
        toast.success("Signature saved.");
      });
  };

  const handleClearSignature = () => {
    setSignatureUrl("");
    setSignatureFile(null);
    if(signaturePadRef.current){
        signaturePadRef.current.clear();
    }
  };


  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="px-4 py-6 max-w-5xl">
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-[#FFD249] mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading invoice details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(previousPage)}
            className="mb-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFD249]/20 rounded-lg">
              <Package className="w-6 h-6 text-[#202020]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Update Delivery Status
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Update the delivery status and proof for this order
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Order Information */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-[#202020]" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Docket Number</Label>
                  <p className="font-bold text-gray-800 dark:text-gray-200 mt-1">{invoice?.docketNumber || "N/A"}</p>
                </div>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Delivery Address
                  </Label>
                  <p className="font-medium text-gray-800 dark:text-gray-200 mt-1 text-sm">
                    {fullDestinationAddress || "Address not available"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Status Update */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle className="w-5 h-5 text-[#202020]" />
                Update Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#FFD249]" />
                    Current Status
                  </Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Select current status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select the current status of this delivery
                  </p>
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-[#FFD249]" />
                    Add Note (Optional)
                  </Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add any notes about the delivery..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-[#FFD249]" />
                    Upload Photo (Optional)
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setOrderPhoto(e.target.files[0])}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Take a photo of the delivered package or location
                  </p>
                  {previewUrl && (
                    <div className="mt-4 relative w-full max-w-xs">
                      <img
                        src={previewUrl}
                        alt="Photo preview"
                        className="w-full h-auto max-h-64 object-contain border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm"
                      />
                      {orderPhoto && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setOrderPhoto(null);
                            setPreviewUrl(existingOrderPhotoUrl || "");
                          }}
                          className="absolute -top-2 -right-2 rounded-full h-8 w-8 p-0 bg-red-500 hover:bg-red-600"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Delivery Proof */}
          <Card className="shadow-sm">
            <CardHeader className="border-b bg-gray-50 dark:bg-gray-800/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="w-5 h-5 text-[#202020]" />
                Delivery Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#FFD249]" />
                    Delivery Date & Time
                  </Label>
                  <Input
                    type="datetime-local"
                    value={deliveredAt}
                    onChange={(e) => setDeliveredAt(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When was the package delivered?
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#FFD249]" />
                      Receiver Name
                    </Label>
                    <Input
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Enter receiver's name"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#FFD249]" />
                      Receiver Mobile
                    </Label>
                    <Input
                      type="tel"
                      maxLength="10"
                      value={receiverMobile}
                      onChange={(e) => setReceiverMobile(e.target.value)}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, "");
                      }}
                      placeholder="10-digit mobile number"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Floor / Location</Label>
                  <Select value={floor} onValueChange={setFloor}>
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue placeholder="Select floor type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBT">GBT</SelectItem>
                      <SelectItem value="RBT">RBT</SelectItem>
                      <SelectItem value="G+Floors">G+Floors</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select the floor type for delivery
                  </p>
                </div>
                <div>
                  <Label>Delivery Remarks (Optional)</Label>
                  <Textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any additional notes about the delivery..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
                <div>
                  <Label className="flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-[#FFD249]" />
                    Receiver Signature
                  </Label>
                  <div className="mt-2 p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    {signatureUrl ? (
                      <div className="space-y-3">
                        <div className="relative inline-block">
                          <img
                            src={signatureUrl}
                            alt="Signature preview"
                            className="h-24 w-auto object-contain border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleClearSignature}
                            className="absolute -top-2 -right-2 rounded-full h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-xs"
                          >
                            ×
                          </Button>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="w-full bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
                        >
                          Change Signature
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center space-y-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          No signature captured yet
                        </p>
                        <Button
                          type="button"
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
                        >
                          <PenTool className="w-4 h-4 mr-2" />
                          Capture Signature
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Get the receiver's signature as proof of delivery
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border">
            <Button
              variant="outline"
              onClick={() => navigate(previousPage)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              onClick={handleSubmit}
              className="min-w-[150px] bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] border border-[#FFD249]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Submit Update"
              )}
            </Button>
          </div>
        </div>

        <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
          <DialogContent className="max-w-3xl w-full h-[80vh] flex flex-col p-2 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenTool className="w-5 h-5 text-[#FFD249]" />
                Draw Signature
              </DialogTitle>
            </DialogHeader>
            <div className="flex-grow border-2 border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 my-4 relative">
              <SignatureCanvas
                ref={signaturePadRef}
                penColor="black"
                canvasProps={{ className: "w-full h-full" }}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => signaturePadRef.current.clear()}
                className="border-gray-300 hover:bg-gray-100"
              >
                Clear
              </Button>
              <Button
                type="button"
                onClick={handleSaveSignature}
                className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
              >
                Save Signature
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UpdateInvoice;
