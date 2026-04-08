import React, { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAddBillingPaymentMutation,
  useGetBillingInvoiceByIdQuery,
  useUpdateBillingInvoiceStatusMutation,
} from "@/features/api/Billing/billingApi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const BillingInvoiceDetail = () => {
  const user = useSelector((state) => state.auth.user);
  const canMutatePayments = user?.role === "superAdmin" || user?.role === "branchAdmin";
  const location = useLocation();
  const id = location.state?.id;
  const { data, isLoading } = useGetBillingInvoiceByIdQuery(id, { skip: !id });
  const [updateStatus] = useUpdateBillingInvoiceStatusMutation();
  const [addPayment] = useAddBillingPaymentMutation();
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("");
  const [reference, setReference] = useState("");

  const invoice = data?.invoice;
  const gst = useMemo(() => Number(invoice?.taxAmount || 0), [invoice]);

  if (!id) return <div className="p-4">Invoice ID missing.</div>;
  if (isLoading) return <div className="p-4">Loading...</div>;
  if (!invoice) return <div className="p-4">Invoice not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
      <Card className="p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{invoice.invoiceNumber}</h2>
            <p className="text-sm text-gray-600">{invoice.customer?.name}</p>
            <p className="text-sm text-gray-500">
              Billing Date: {new Date(invoice.createdAt).toLocaleDateString("en-IN")}
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm">
            {invoice.status}
          </span>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-sm text-gray-500">Total Amount</p><p className="text-xl font-semibold">₹{invoice.totalAmount}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Paid Amount</p><p className="text-xl font-semibold">₹{invoice.paidAmount}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">Pending Amount</p><p className="text-xl font-semibold">₹{invoice.pendingAmount}</p></Card>
        <Card className="p-4"><p className="text-sm text-gray-500">GST</p><p className="text-xl font-semibold">₹{gst}</p></Card>
      </div>

      <Card className="p-4 border border-gray-200">
        <h3 className="font-semibold mb-2">Docket List</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left">Docket</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Weight</th>
                <th className="p-2 text-left">Freight</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.docketIds || []).map((d) => (
                <tr key={d._id} className="border-b">
                  <td className="p-2">{d.docketNumber}</td>
                  <td className="p-2">{d.status}</td>
                  <td className="p-2">{d.totalWeight || 0}</td>
                  <td className="p-2">{d.freightCharges || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-4 border border-gray-200">
        <h3 className="font-semibold mb-2">Charges Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div>Freight: <b>₹{invoice.totalFreight}</b></div>
          <div>Extra Charges: <b>₹{invoice.extraCharges}</b></div>
          <div>Taxes: <b>₹{invoice.taxAmount}</b></div>
        </div>
      </Card>

      <Card className="p-4 border border-gray-200">
        <h3 className="font-semibold mb-3">Payment Section</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div><Label>Amount</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><Label>Mode</Label><Input value={mode} onChange={(e) => setMode(e.target.value)} /></div>
          <div><Label>Reference</Label><Input value={reference} onChange={(e) => setReference(e.target.value)} /></div>
          <div className="flex items-end">
            <Button
              className="bg-[#FFCA00] text-[#202020] hover:bg-[#FFCA00]/80 w-full"
              onClick={async () => {
                await addPayment({ id: invoice._id, amount, mode, reference }).unwrap();
                toast.success("Payment added");
                setAmount("");
                setMode("");
                setReference("");
              }}
              disabled={!canMutatePayments}
            >
              Add Payment
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {(invoice.payments || []).map((p) => (
            <div key={p._id} className="p-2 rounded border text-sm">
              ₹{p.amount} - {p.mode || "N/A"} - {new Date(p.paidAt).toLocaleString("en-IN")}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => window.print()}>Download PDF</Button>
        <Button onClick={async () => {
          await updateStatus({ id: invoice._id, status: "Sent" }).unwrap();
          toast.success("Status updated to Sent");
        }} disabled={!canMutatePayments}>Mark Sent</Button>
      </div>
    </div>
  );
};

export default BillingInvoiceDetail;
