import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi";
import {
  useGetBillingInvoicesQuery,
  useUpdateBillingInvoiceStatusMutation,
} from "@/features/api/Billing/billingApi";
import { getTokenData } from "@/utils/getTokenData";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const BillingInvoices = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "superAdmin";
  const canMutatePayments = user?.role === "superAdmin" || user?.role === "branchAdmin";
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    companyId: tokenCompanyId || "",
    branchId: tokenBranchId || "",
    customerId: "",
    status: "",
    paymentStatus: "",
    search: "",
  });
  const [getBranchesByCompany, { data: branchResp }] = useGetBranchesByCompanyMutation();
  const branches = branchResp?.branches || [];

  const { data: companiesData } = useGetAllCompaniesQuery({ status: "true" });
  const { data: customersData } = useGetAllCustomersQuery({
    page: 1,
    limit: 1000,
    companyId: isSuperAdmin ? filters.companyId : "",
    branchId: isSuperAdmin ? filters.branchId : "",
    status: "true",
  });
  const { data: invoicesResp } = useGetBillingInvoicesQuery(filters);
  const [updateStatus] = useUpdateBillingInvoiceStatusMutation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Invoice Management</h2>
          <Button className="bg-[#FFCA00] text-[#202020] hover:bg-[#FFCA00]/80" onClick={() => navigate("/admin/billing-generate-invoice")}>
            <Plus className="w-4 h-4 mr-1" /> Generate
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <div><Label>From</Label><Input type="date" value={filters.fromDate} onChange={(e) => setFilters((p) => ({ ...p, fromDate: e.target.value }))} /></div>
          <div><Label>To</Label><Input type="date" value={filters.toDate} onChange={(e) => setFilters((p) => ({ ...p, toDate: e.target.value }))} /></div>
          <div>
            <Label>Company</Label>
            <SearchableSelect
              value={filters.companyId}
              onValueChange={async (v) => {
                setFilters((p) => ({ ...p, companyId: v, branchId: "" }));
                await getBranchesByCompany(v);
              }}
              disabled={!isSuperAdmin}
              options={(companiesData?.companies || []).map((c) => ({ value: c._id, label: c.name }))}
              placeholder="Company"
            />
          </div>
          <div>
            <Label>Branch</Label>
            <SearchableSelect
              value={filters.branchId}
              onValueChange={(v) => setFilters((p) => ({ ...p, branchId: v }))}
              disabled={!isSuperAdmin}
              options={branches.map((b) => ({ value: b._id, label: b.name }))}
              placeholder="Branch"
            />
          </div>
          <div>
            <Label>Customer</Label>
            <SearchableSelect
              value={filters.customerId}
              onValueChange={(v) => setFilters((p) => ({ ...p, customerId: v }))}
              options={(customersData?.customers || []).map((c) => ({ value: c._id, label: c.name }))}
              placeholder="Customer"
            />
          </div>
          <div><Label>Status</Label><Input value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} /></div>
          <div><Label>Payment Status</Label><Input value={filters.paymentStatus} onChange={(e) => setFilters((p) => ({ ...p, paymentStatus: e.target.value }))} /></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Total Billing Invoices</p>
          <p className="text-2xl font-semibold text-blue-600">{(invoicesResp?.invoices || []).length}</p>
        </Card>
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="text-2xl font-semibold text-green-600">
            ₹{(invoicesResp?.invoices || []).reduce((s, i) => s + Number(i.totalAmount || 0), 0)}
          </p>
        </Card>
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Pending Amount</p>
          <p className="text-2xl font-semibold text-purple-600">
            ₹{(invoicesResp?.invoices || []).reduce((s, i) => s + Number(i.pendingAmount || 0), 0)}
          </p>
        </Card>
      </div>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#FFCA00]/80">
                <th className="p-2 text-left">Invoice Number</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Total</th>
                <th className="p-2 text-left">Paid</th>
                <th className="p-2 text-left">Pending</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Date</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(invoicesResp?.invoices || []).map((inv) => (
                <tr key={inv._id} className="border-b">
                  <td className="p-2">{inv.invoiceNumber}</td>
                  <td className="p-2">{inv.customer?.name}</td>
                  <td className="p-2">{inv.totalAmount}</td>
                  <td className="p-2">{inv.paidAmount}</td>
                  <td className="p-2">{inv.pendingAmount}</td>
                  <td className="p-2">{inv.status}</td>
                  <td className="p-2">{new Date(inv.createdAt).toLocaleDateString("en-IN")}</td>
                  <td className="p-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/admin/billing-invoice-detail", { state: { id: inv._id } })}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await updateStatus({ id: inv._id, status: "Paid" }).unwrap();
                        toast.success("Marked as paid");
                      }}
                      disabled={!canMutatePayments}
                    >
                      Mark Paid
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BillingInvoices;
