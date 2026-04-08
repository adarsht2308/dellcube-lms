import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useGetAllCustomersQuery } from "@/features/api/Customer/customerApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetBranchesByCompanyMutation } from "@/features/api/Branch/branchApi";
import {
  useCreateRateMutation,
  useDeleteRateMutation,
  useGetRatesQuery,
} from "@/features/api/Billing/billingApi";
import { useSelector } from "react-redux";
import { getTokenData } from "@/utils/getTokenData";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";

const RateCard = () => {
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === "superAdmin";
  const { companyId: tokenCompanyId, branchId: tokenBranchId } = getTokenData();
  const [companyId, setCompanyId] = useState(tokenCompanyId || "");
  const [branchId, setBranchId] = useState(tokenBranchId || "");
  const [customerId, setCustomerId] = useState("");
  const [getBranchesByCompany, { data: branchResp }] = useGetBranchesByCompanyMutation();
  const branches = branchResp?.branches || [];

  const [form, setForm] = useState({
    customer: "",
    fromLocation: "",
    toLocation: "",
    vehicleType: "",
    rateType: "Fixed",
    rateValue: "",
  });
  const [dynamicRateData, setDynamicRateData] = useState({});

  const { data: customersData } = useGetAllCustomersQuery({
    page: 1,
    limit: 1000,
    companyId: isSuperAdmin ? companyId : "",
    branchId: isSuperAdmin ? branchId : "",
    status: "true",
  });
  const { data: companiesData } = useGetAllCompaniesQuery({ status: "true" });
  const { data: ratesData, isFetching } = useGetRatesQuery({
    companyId,
    branchId,
    customerId,
  });
  const [createRate, { isLoading: creating }] = useCreateRateMutation();
  const [deleteRate] = useDeleteRateMutation();

  const customerOptions = useMemo(
    () =>
      (customersData?.customers || []).map((c) => ({
        value: c._id,
        label: c.name,
      })),
    [customersData]
  );
  const selectedCustomer = useMemo(
    () => (customersData?.customers || []).find((c) => c._id === form.customer),
    [customersData, form.customer]
  );
  const dynamicFields = useMemo(
    () =>
      [...(selectedCustomer?.billingFields || [])]
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .filter((f) => !["fromLocation", "toLocation", "vehicleType", "rateType", "rateValue"].includes(f.fieldName)),
    [selectedCustomer]
  );

  const onAdd = async () => {
    if (!form.customer || !form.rateValue) {
      toast.error("Customer and rate value are required");
      return;
    }
    try {
      await createRate({
        ...form,
        rateData: dynamicRateData,
        company: companyId,
        branch: branchId,
      }).unwrap();
      toast.success("Rate added");
      setForm({
        customer: "",
        fromLocation: "",
        toLocation: "",
        vehicleType: "",
        rateType: "Fixed",
        rateValue: "",
      });
      setDynamicRateData({});
    } catch (e) {
      toast.error(e?.data?.message || "Failed to add rate");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
      <Card className="p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Rate Card / Rate Plotting</h2>
          <Button className="bg-[#FFCA00] text-[#202020] hover:bg-[#FFCA00]/80">
            <Plus className="w-4 h-4 mr-1" /> Add Rate
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div>
            <Label>Company</Label>
            <SearchableSelect
              value={companyId}
              onValueChange={async (v) => {
                setCompanyId(v);
                setBranchId("");
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
              value={branchId}
              onValueChange={setBranchId}
              disabled={!isSuperAdmin}
              options={branches.map((b) => ({ value: b._id, label: b.name }))}
              placeholder="Select Branch"
            />
          </div>
          <div>
            <Label>Customer Filter</Label>
            <SearchableSelect
              value={customerId}
              onValueChange={setCustomerId}
              options={customerOptions}
              placeholder="All Customers"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Total Rates</p>
          <p className="text-2xl font-semibold text-blue-600">{(ratesData?.rates || []).length}</p>
        </Card>
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Unique Customers</p>
          <p className="text-2xl font-semibold text-green-600">
            {new Set((ratesData?.rates || []).map((r) => r.customer?._id || r.customer)).size}
          </p>
        </Card>
        <Card className="p-4 border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500">Active Scope</p>
          <p className="text-sm font-medium">{isSuperAdmin ? "Company / Branch Filtered" : "Branch Scoped"}</p>
        </Card>
      </div>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="font-semibold mb-3">Add Rate Entry</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Customer</Label>
            <SearchableSelect
              value={form.customer}
              onValueChange={(v) => setForm((p) => ({ ...p, customer: v }))}
              options={customerOptions}
              placeholder="Select Customer"
            />
          </div>
          <div>
            <Label>From Location</Label>
            <Input value={form.fromLocation} onChange={(e) => setForm((p) => ({ ...p, fromLocation: e.target.value }))} />
          </div>
          <div>
            <Label>To Location</Label>
            <Input value={form.toLocation} onChange={(e) => setForm((p) => ({ ...p, toLocation: e.target.value }))} />
          </div>
          <div>
            <Label>Vehicle Type</Label>
            <Input value={form.vehicleType} onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))} />
          </div>
          <div>
            <Label>Rate Type</Label>
            <Select value={form.rateType} onValueChange={(v) => setForm((p) => ({ ...p, rateType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Per KG">Per KG</SelectItem>
                <SelectItem value="Per KM">Per KM</SelectItem>
                <SelectItem value="Slab-based">Slab-based</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rate Value</Label>
            <Input type="number" value={form.rateValue} onChange={(e) => setForm((p) => ({ ...p, rateValue: e.target.value }))} />
          </div>
        </div>
        {dynamicFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {dynamicFields.map((f) => (
              <div key={f._id}>
                <Label>{f.fieldLabel}{f.isRequired ? " *" : ""}</Label>
                <Input
                  value={dynamicRateData[f.fieldName] || ""}
                  onChange={(e) =>
                    setDynamicRateData((p) => ({ ...p, [f.fieldName]: e.target.value }))
                  }
                />
              </div>
            ))}
          </div>
        )}
        <Button
          className="mt-4 bg-[#FFCA00] text-[#202020] hover:bg-[#FFCA00]/80"
          onClick={onAdd}
          disabled={creating || user?.role === "operation"}
        >
          Add Rate
        </Button>
      </Card>

      <Card className="p-4 border border-gray-200 shadow-sm">
        <h3 className="font-semibold mb-3">Rate Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-[#FFCA00]/80">
                <th className="text-left p-2">Customer</th>
                <th className="text-left p-2">From</th>
                <th className="text-left p-2">To</th>
                <th className="text-left p-2">Vehicle</th>
                <th className="text-left p-2">Rate Type</th>
                <th className="text-left p-2">Rate</th>
                <th className="text-left p-2">Custom Fields</th>
                <th className="text-left p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {(ratesData?.rates || []).map((r) => (
                <tr key={r._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{r.customer?.name}</td>
                  <td className="p-2">{r.fromLocation}</td>
                  <td className="p-2">{r.toLocation}</td>
                  <td className="p-2">{r.vehicleType}</td>
                  <td className="p-2">{r.rateType}</td>
                  <td className="p-2">{r.rateValue}</td>
                  <td className="p-2">
                    {Object.keys(r.rateData || {}).length > 0
                      ? Object.entries(r.rateData || {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" | ")
                      : "-"}
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRate(r._id)}
                      disabled={user?.role === "operation"}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
              {!isFetching && (ratesData?.rates || []).length === 0 && (
                <tr>
                  <td colSpan={8} className="p-3 text-center text-gray-500">No rates found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default RateCard;
