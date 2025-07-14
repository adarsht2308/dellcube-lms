import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Truck,
  Hash,
  DollarSign,
  BarChart2,
  ChevronLeft,
  Download,
} from "lucide-react";
import { useGetVehicleByIdMutation } from "@/features/api/Vehicle/vehicleApi";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FaRupeeSign } from "react-icons/fa";
import { MdMoney } from "react-icons/md";

const DELLCUBE_COLORS = {
  gold: "#FFD249",
  dark: "#202020",
  gray: "#828083",
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PAGE_SIZE = 10;

// Helper for date formatting
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const VehicleDetail = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [getVehicleById] = useGetVehicleByIdMutation();
  const [vehicleData, setVehicleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      setError("");
      try {
        const { data } = await getVehicleById(vehicleId);
        if (data?.success) {
          setVehicleData(data.vehicle);
        } else {
          setError("Vehicle not found");
        }
      } catch (err) {
        setError("Failed to fetch vehicle data");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, [vehicleId, getVehicleById]);

  // Filter maintenance by month
  const filteredMaintenance = useMemo(() => {
    if (!vehicleData?.maintenanceHistory) return [];
    if (!selectedMonth) return vehicleData.maintenanceHistory;
    return vehicleData.maintenanceHistory.filter((m) => {
      const d = new Date(m.date || m.serviceDate);
      return d.getMonth() === parseInt(selectedMonth);
    });
  }, [selectedMonth, vehicleData]);

  // Pagination
  const totalPages = Math.ceil(filteredMaintenance.length / PAGE_SIZE);
  const paginatedMaintenance = filteredMaintenance.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  // Stats
  const totalCost = filteredMaintenance.reduce(
    (sum, m) => sum + (m.cost || 0),
    0
  );
  const numMaintenances = filteredMaintenance.length;
  const avgCost = numMaintenances ? Math.round(totalCost / numMaintenances) : 0;
  const mostFrequentType = useMemo(() => {
    const freq = {};
    filteredMaintenance.forEach((m) => {
      freq[m.type || m.serviceType] = (freq[m.type || m.serviceType] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  }, [filteredMaintenance]);
  const lastMaintenance =
    filteredMaintenance[0]?.date || filteredMaintenance[0]?.serviceDate;

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredMaintenance.length) return;
    const headers = ["Date", "Type", "Description", "Cost", "Status"];
    const rows = filteredMaintenance.map((m) => [
      m.date || m.serviceDate,
      m.type || m.serviceType,
      m.description,
      m.cost,
      m.status,
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vehicle_${vehicleId}_maintenance.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="p-8 text-center text-[#828083]">
        Loading vehicle details...
      </div>
    );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!vehicleData) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white p-6">
      <div className="container mx-auto">
        <Button
          variant="ghost"
          className="mb-4 flex items-center gap-2 text-[#202020] hover:text-[#FFD249]"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft /> Back
        </Button>

        {/* Vehicle Info Header */}
        <Card className="mb-6 p-6 rounded-2xl shadow-lg border-0 bg-white/90 flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="p-4 bg-[#FFD249]/20 rounded-full">
              <Truck className="w-10 h-10 text-[#FFD249]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#202020] mb-1">
                {vehicleData.vehicleNumber}
              </h2>
              <div className="text-[#828083] text-sm mb-1">
                {vehicleData.type} - {vehicleData.model} (
                {vehicleData.yearOfManufacture || vehicleData.year})
              </div>
              {/* Status removed */}
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="text-xs text-[#828083]">
              Owner:{" "}
              <span className="font-medium text-[#202020]">
                {vehicleData.owner || "Dellcube Logistics PVT LTD"}
              </span>
            </div>
            <div className="text-xs text-[#828083]">
              Total Maintenances:{" "}
              <span className="font-medium text-[#202020]">
                {vehicleData.maintenanceHistory?.length || 0}
              </span>
            </div>
          </div>
        </Card>

        {/* Vehicle Documents (moved to top) */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-4">
            {[
              {
                label: "Fitness Certificate",
                field: "fitnessCertificateImage",
              },
              {
                label: "Pollution Certificate",
                field: "pollutionCertificateImage",
              },
              {
                label: "Registration Certificate",
                field: "registrationCertificateImage",
              },
              { label: "Insurance", field: "insuranceImage" },
            ].map(({ label, field }) => {
              const img = vehicleData[field];
              if (!img?.url) return null;
              return (
                <Dialog key={field}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-semibold px-4 py-2 rounded-lg border border-[#FFD249]">
                      View {label}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{label}</DialogTitle>
                    </DialogHeader>
                    <img
                      src={img.url}
                      alt={label}
                      className="max-w-full max-h-[60vh] mx-auto rounded-lg border"
                    />
                  </DialogContent>
                </Dialog>
              );
            })}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 rounded-xl bg-[#FFD249]/10 border-0 flex flex-col items-center">
            <FaRupeeSign className="w-6 h-6 text-[#FFD249] mb-1" />
            <div className="text-lg font-bold text-[#202020]">
              ₹{totalCost.toLocaleString()}
            </div>
            <div className="text-xs text-[#828083]">Total Maintenance Cost</div>
          </Card>
          <Card className="p-4 rounded-xl bg-[#FFD249]/10 border-0 flex flex-col items-center">
            <BarChart2 className="w-6 h-6 text-[#FFD249] mb-1" />
            <div className="text-lg font-bold text-[#202020]">
              {numMaintenances}
            </div>
            <div className="text-xs text-[#828083]">No. of Maintenances</div>
          </Card>
          <Card className="p-4 rounded-xl bg-[#FFD249]/10 border-0 flex flex-col items-center">
            <MdMoney className="w-6 h-6 text-[#FFD249] mb-1" />
            <div className="text-lg font-bold text-[#202020]">₹{avgCost}</div>
            <div className="text-xs text-[#828083]">Avg. Cost/Maintenance</div>
          </Card>
          <Card className="p-4 rounded-xl bg-[#FFD249]/10 border-0 flex flex-col items-center">
            <Calendar className="w-6 h-6 text-[#FFD249] mb-1" />
            <div className="text-lg font-bold text-[#202020]">
              {formatDate(lastMaintenance) || "-"}
            </div>
            <div className="text-xs text-[#828083]">Last Maintenance</div>
          </Card>
        </div>

        {/* Month Filter and Export */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="text-sm font-medium text-[#202020]">
            Filter by Month:
          </label>
          <select
            className="border border-[#FFD249] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FFD249] bg-white"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {months.map((m, idx) => (
              <option key={m} value={idx}>
                {m}
              </option>
            ))}
          </select>
          <Button
            className="ml-auto flex items-center gap-2 bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-semibold px-4 py-2 rounded-lg border border-[#FFD249]"
            onClick={handleExportCSV}
          >
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>

        {/* Maintenance Table/List */}
        <Card className="rounded-2xl shadow border-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FFD249]/40">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Cost (₹)</th>
                {/* <th className="px-4 py-3 text-left">Status</th> */}
              </tr>
            </thead>
            <tbody>
              {paginatedMaintenance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-[#828083]">
                    No maintenance records found for this month.
                  </td>
                </tr>
              ) : (
                paginatedMaintenance?.map((m, idx) => (
                  <tr
                    key={idx}
                    className="border-b last:border-b-0 hover:bg-[#FFD249]/10 transition"
                  >
                    <td className="px-4 py-3">
                      {formatDate(m.date || m.serviceDate)}
                    </td>
                    <td className="px-4 py-3">{m.type || m.serviceType}</td>
                    <td className="px-4 py-3">{m.description}</td>
                    <td className="px-4 py-3">₹{m.cost?.toLocaleString()}</td>
                    {/* <td className="px-4 py-3">{m.status}</td> */}
                  </tr>
                ))
              )}
            </tbody>
            <thead className="bg-[#FFD249]/40">
              <tr>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Cost (₹)</th>
                {/* <th className="px-4 py-3 text-left">Status</th> */}
              </tr>
            </thead>
          </table>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              variant="outline"
              className="rounded-full border border-[#FFD249] text-[#202020] px-4 py-2"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Prev
            </Button>
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={page === i + 1 ? "solid" : "outline"}
                className={`rounded-full border border-[#FFD249] px-4 py-2 ${
                  page === i + 1
                    ? "bg-[#FFD249] text-[#202020]"
                    : "text-[#202020]"
                }`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              className="rounded-full border border-[#FFD249] text-[#202020] px-4 py-2"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Vehicle Documents */}
        {/* The old Vehicle Documents section is now moved to the top */}
      </div>
    </div>
  );
};

export default VehicleDetail;
