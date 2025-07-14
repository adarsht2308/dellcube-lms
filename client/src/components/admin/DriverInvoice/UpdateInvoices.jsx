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
  const previousPage = location.state?.previousPage || "/driver-dashboard";

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
        setDeliveredAt(invoice?.deliveredAt?.slice(0, 16) || "");

        const proof = invoice.deliveryProof || {};
        setReceiverName(proof.receiverName || "");
        setReceiverMobile(proof.receiverMobile || "");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Debug: Check if required fields are present
    console.log("Driver ID:", driverId);
    console.log("Invoice ID:", invoiceId);
    
    if (!driverId || !invoiceId) {
      toast.error("Driver ID or Invoice ID is missing");
      return;
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
    if (deliveredAt) formData.append("deliveredAt", deliveredAt);
    if (signatureFile) formData.append("receiverSignature", signatureFile);

    const deliveryProof = {
      receiverName,
      receiverMobile,
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

  // Render loading state
  if (loading) {
    return (
      <section className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
        <h2 className="text-xl font-semibold mb-6 text-gray-800 dark:text-white">
          Update Invoice Details
        </h2>
        <div className="text-center py-10">Loading invoice details...</div>
      </section>
    );
  }

  return (
    <section className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-900 rounded shadow">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
          Update Invoice Details
        </h2>
        <Button
          variant="outline"
          onClick={() => navigate(previousPage)}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Status */}
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Latitude</Label>
            <Input
              type="number"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input
              type="number"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
            />
          </div>
        </div> */}
        <div>
          <Label>Destination Address</Label>
          <Input
            value={fullDestinationAddress}
            readOnly
            className="cursor-not-allowed bg-gray-100 dark:bg-gray-800"
          />
        </div>

        {/* Order Photo */}
        <div>
          <Label>Order Photo</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                console.log("File selected:", file);
                setOrderPhoto(file);
              }}
            />
            {orderPhoto && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setOrderPhoto(null);
                  setPreviewUrl(existingOrderPhotoUrl || "");
                }}
                className="text-red-600 hover:text-red-700"
              >
                Clear New
              </Button>
            )}
          </div>
          {previewUrl && (
            <div className="mt-2">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-48 h-48 object-contain border border-gray-300 rounded-lg shadow-sm"
                onLoad={() => console.log("Image loaded successfully")}
                onError={(e) => console.error("Image failed to load:", e)}
              />
              <p className="text-xs text-gray-500 mt-1">
                {orderPhoto ? "New photo selected" : "Existing photo"}
              </p>
            </div>
          )}
        </div>

        {/* Delivered At */}
        <div>
          <Label>Delivered At</Label>
          <Input
            type="datetime-local"
            value={deliveredAt}
            onChange={(e) => setDeliveredAt(e.target.value)}
          />
        </div>

        {/* Delivery Proof */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Receiver Name</Label>
            <Input
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Receiver Name"
            />
          </div>
          <div>
            <Label>Receiver Mobile</Label>
            <Input
              value={receiverMobile}
              onChange={(e) => setReceiverMobile(e.target.value)}
              placeholder="Mobile No."
            />
          </div>

          {/* Note */}
          <div>
            <Label>Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any update notes..."
            />
          </div>
          <div>
            <Label>Receiver Signature</Label>

            {/* Show saved signature if present and no new one drawn yet */}
            {!signatureUrl && invoice?.deliveryProof?.signature && (
              <img
                src={invoice.deliveryProof.signature}
                alt="Saved Signature"
                className="mt-2 h-24 w-60 object-contain border"
              />
            )}

            {/* Signature pad to draw new one */}
            <SignatureCanvas
              ref={signaturePadRef}
              penColor="black"
              canvasProps={{
                width: 300,
                height: 100,
                className: "border rounded bg-white mt-4",
              }}
            />

            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                onClick={() => {
                  const canvas = signaturePadRef.current.getCanvas();
                  const dataUrl = canvas.toDataURL("image/png");

                  setSignatureUrl(dataUrl);

                  // Convert base64 to file for backend upload
                  fetch(dataUrl)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const file = new File([blob], "signature.png", {
                        type: "image/png",
                      });
                      setSignatureFile(file);
                      signaturePadRef.current.clear();
                    });
                }}
              >
                Save Signature
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  signaturePadRef.current.clear();
                  setSignatureUrl("");
                  setSignatureFile(null);
                }}
              >
                Clear
              </Button>
            </div>

            {/* New drawn signature preview */}
            {signatureUrl && (
              <img
                src={signatureUrl}
                alt="Preview Signature"
                className="mt-2 h-24 w-60 object-contain border"
              />
            )}
          </div>

          <div>
            <Label>Remarks</Label>
            <Input
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Remarks"
            />
          </div>
          <div className="flex justify-center my-6"></div>
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Invoice"}
        </Button>
      </form>
    </section>
  );
};

export default UpdateInvoice;
