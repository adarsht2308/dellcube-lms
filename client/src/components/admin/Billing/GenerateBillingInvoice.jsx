import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi";
import {
  useGenerateBillingInvoiceMutation,
} from "@/features/api/Billing/billingApi";
import { useGetAllInvoicesQuery } from "@/features/api/Invoice/invoiceApi";
import { getTokenData } from "@/utils/getTokenData";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const GenerateBillingInvoice = () => {
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "superAdmin";
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    companyId: tokenCompanyId || "",
    branchId: tokenBranchId || "",
    customerId: "",
    status: "",
    search: "",
  });
  const [selected, setSelected] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [billingData, setBillingData] = useState({});
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
  const { data: docketResp, isFetching } = useGetAllInvoicesQuery({
    page: 1,
    limit: 500,
    search: filters.search,
    companyId: filters.companyId,
    branchId: filters.branchId,
    customerId: filters.customerId,
    status: filters.status,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const [generateInvoice, { isLoading: generating }] = useGenerateBillingInvoiceMutation();

  const rows = docketResp?.invoices || [];
  const selectedRows = rows.filter((r) => selected[r._id]);
  const summary = useMemo(
    () => ({
      totalWeight: selectedRows.reduce((s, r) => s + Number(r.totalWeight || 0), 0),
      totalFreight: selectedRows.reduce((s, r) => s + Number(r.freightCharges || 0), 0),
      count: selectedRows.length,
    }),
    [selectedRows]
  );

  const customer = (customersData?.customers || []).find((c) => c._id === filters.customerId);
  const billingFields = [...(customer?.billingFields || [])].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  const onGenerate = async () => {
    try {
      await generateInvoice({
        docketIds: selectedRows.map((r) => r._id),
        customerId: filters.customerId,
        companyId: filters.companyId,
        branchId: filters.branchId,
        dateFrom: filters.fromDate,
        dateTo: filters.toDate,
        billingData,
      }).unwrap();
      toast.success("Billing invoice generated");
      setShowConfirm(false);
      setSelected({});
      setBillingData({});
    } catch (e) {
      toast.error(e?.data?.message || "Failed to generate billing invoice");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-4 pb-24">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Generate Invoice</h2>
          <Button className="bg-[#FFCA00] text-[#202020] hover:bg-[#FFCA00]/80">
            <Plus className="w-4 h-4 mr-1" /> Create
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
              placeholder="Select Company"
            />
          </div>
          <div>
            <Label>Branch</Label>
            <SearchableSelect
              value={filters.branchId}
              onValueChange={(v) => setFilters((p) => ({ ...p, branchId: v }))}
              disabled={!isSuperAdmin}
              options={branches.map((b) => ({ value: b._id, label: b.name }))}
              placeholder="Select Branch"
            />
          </div>
          <div>
            <Label>Customer</Label>
            <SearchableSelect
              value={filters.customerId}
              onValueChange={(v) => setFilters((p) => ({ ...p, customerId: v }))}
              options={(customersData?.customers || []).map((c) => ({ value: c._id, label: c.name }))}
              placeholder="Select Customer"
            />
          </div>
          <div><Label>Status</Label><Input value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} placeholder="e.g. Delivered" /></div>
          <div><Label>Search</Label><Input value={filters.search} onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Docket number" /></div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Total Dockets</p>
          <p className="text-2xl font-semibold text-blue-600">{rows.length}</p>
        </Card>
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Selected Dockets</p>
          <p className="text-2xl font-semibold text-green-600">{summary.count}</p>
        </Card>
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Selected Freight</p>
          <p className="text-2xl font-semibold text-purple-600">₹{summary.totalFreight}</p>
        </Card>
      </div>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#FFCA00]/80">
                <th className="p-2 text-left">
                  <input
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((r) => selected[r._id])}
                    onChange={(e) =>
                      setSelected(
                        e.target.checked
                          ? Object.fromEntries(rows.map((r) => [r._id, true]))
                          : {}
                      )
                    }
                  />
                </th>
                <th className="p-2 text-left">Docket</th>
                <th className="p-2 text-left">Customer</th>
                <th className="p-2 text-left">Branch</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Weight</th>
                <th className="p-2 text-left">Freight</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className={`border-b ${selected[r._id] ? "bg-yellow-50" : ""}`}>
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={!!selected[r._id]}
                      onChange={(e) => setSelected((p) => ({ ...p, [r._id]: e.target.checked }))}
                    />
                  </td>
                  <td className="p-2">{r.docketNumber}</td>
                  <td className="p-2">{r.customer?.name}</td>
                  <td className="p-2">{r.branch?.name}</td>
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.totalWeight || 0}</td>
                  <td className="p-2">{r.freightCharges || 0}</td>
                </tr>
              ))}
              {!isFetching && rows.length === 0 && (
                <tr><td colSpan={7} className="p-3 text-center text-gray-500">No dockets found for selected filters</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedRows.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 flex items-center justify-between z-40">
          <div className="text-sm">
            Selected: <b>{summary.count}</b> dockets | Weight: <b>{summary.totalWeight}</b> | Freight: <b>{summary.totalFreight}</b>
          </div>
          <Button className="bg-[#FFCA00] text-[#202020] hover:bg-[#FFCA00]/80" onClick={() => setShowConfirm(true)}>
            Generate Invoice
          </Button>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-4">
            <h3 className="font-semibold mb-2">Confirm Invoice Generation</h3>
            <p className="text-sm text-gray-600 mb-3">Dockets: {summary.count} | Weight: {summary.totalWeight} | Freight: {summary.totalFreight}</p>
            {billingFields.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {billingFields.map((f) => (
                  <div key={f._id}>
                    <Label>{f.fieldLabel}{f.isRequired ? " *" : ""}</Label>
                    <Input
                      value={billingData[f.fieldName] || ""}
                      onChange={(e) =>
                        setBillingData((p) => ({ ...p, [f.fieldName]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button className="bg-[#FFCA00] text-[#202020] hover:bg-[#FFCA00]/80" onClick={onGenerate} disabled={generating}>
                Confirm
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default GenerateBillingInvoice;
