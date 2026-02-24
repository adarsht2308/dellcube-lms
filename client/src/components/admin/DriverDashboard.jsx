import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  Weight,
  Edit,
  ArrowRight,
  Truck,
  MapPin,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// Import the correct driver invoice API hook
import { useGetDriverInvoicesQuery } from "@/features/api/DriverInvoice/driverInvoiceApi";

const DriverDashboard = () => {
  const { user } = useSelector((store) => store.auth);
  const driverId = user?._id;
  const navigate = useNavigate();

  // Fetch invoices for this driver
  const { data, isLoading } = useGetDriverInvoicesQuery({ driverId });
  const invoices = data?.invoices || [];

  const stats = [
    {
      title: "Assigned Orders",
      value: invoices.length,
      icon: ClipboardList,
      color: "border-[#FFD249]",
      bgColor: "bg-[#FFD249]/10",
      iconColor: "text-[#FFD249]",
    },
    {
      title: "Completed",
      value: invoices.filter(
        (i) => i.status === "Delivered" || i.status === "Inward Done"
      ).length,
      icon: CheckCircle,
      color: "border-green-500",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
    },
    {
      title: "Pending",
      value: invoices.filter(
        (i) => i.status !== "Delivered" && i.status !== "Inward Done"
      ).length,
      icon: Clock,
      color: "border-orange-500",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
    },
    {
      title: "Total Weight (kg)",
      value: invoices.reduce((sum, i) => sum + (parseFloat(i.totalWeight) || 0), 0).toFixed(2),
      icon: Weight,
      color: "border-purple-500",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Welcome Header */}
        <Card className="mb-8 border-2 border-[#FFD249]/30 shadow-xl bg-gradient-to-r from-[#FFD249]/10 via-white to-[#FFD249]/5 dark:from-gray-800 dark:to-gray-750">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  Welcome back, {user?.name || "Driver"}! 👋
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base mb-4">
                  Manage and track your assigned deliveries
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date().toLocaleDateString("en-IN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center md:items-end gap-2">
                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-[#FFD249] shadow-lg">
                  <AvatarImage src={user?.photoUrl} alt={user?.name} />
                  <AvatarFallback className="text-3xl bg-[#FFD249] text-[#202020] font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Badge className="bg-[#FFD249] text-[#202020] border-[#FFD249]">
                  {user?.role?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, idx) => (
              <Card key={idx} className="animate-pulse h-32" />
            ))
          ) : (
            stats.map((stat, idx) => {
              const IconComponent = stat.icon;
              return (
                <Card
                  key={idx}
                  className={`border-l-4 ${stat.color} hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                          {stat.title}
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                          {stat.value}
                        </h3>
                      </div>
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shadow-md ${stat.bgColor} border-2 ${stat.color.replace('border-', 'border-')}`}
                      >
                        <IconComponent className={`w-6 h-6 sm:w-7 sm:h-7 ${stat.iconColor}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
 
        {/* Recent Invoices Table */}
        <Card className="mb-8 shadow-xl border-2 border-[#FFD249]/20">
          <CardContent className="p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#FFD249]/20 rounded-lg">
                  <ClipboardList className="w-6 h-6 text-[#FFD249]" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Recent Invoices
                </h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-[#FFD249]/90 dark:bg-[#202020]">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-[#202020] dark:text-[#FFD249] uppercase tracking-wider">
                      Docket No
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-[#202020] dark:text-[#FFD249] uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-[#202020] dark:text-[#FFD249] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-[#202020] dark:text-[#FFD249] uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-[#202020] dark:text-[#FFD249] uppercase tracking-wider hidden lg:table-cell">
                      From Address
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-bold text-[#202020] dark:text-[#FFD249] uppercase tracking-wider hidden lg:table-cell">
                      To Address
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-center text-xs font-bold text-[#202020] dark:text-[#FFD249] uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD249]"></div>
                          <p className="text-gray-500 dark:text-gray-400">Loading invoices...</p>
                        </div>
                      </td>
                    </tr>
                  ) : invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-3">
                          <ClipboardList className="w-12 h-12 text-gray-400" />
                          <p className="text-gray-500 dark:text-gray-400 text-base font-medium">
                            No invoices found
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invoices
                      .slice()
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .slice(0, 5)
                      .map((inv, idx) => {
                        const statusColors = {
                          Delivered: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
                          'In Transit': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
                          Pending: 'bg-[#FFD249]/20 text-[#202020] border-[#FFD249] dark:bg-[#FFD249]/20 dark:text-[#202020]',
                          Created: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300',
                        };
                        
                        return (
                          <tr
                            key={inv._id}
                            className={`transition-all duration-150 hover:bg-[#FFD249]/5 dark:hover:bg-[#FFD249]/10 ${
                              idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'
                            }`}
                          >
                            <td className="px-3 sm:px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                              {inv.docketNumber}
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-400" />
                                <span>{inv.customer?.name || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap">
                              <Badge
                                className={`${statusColors[inv.status] || statusColors.Created} border font-semibold`}
                              >
                                {inv.status}
                              </Badge>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span>
                                  {inv.createdAt
                                    ? new Date(inv.createdAt).toLocaleDateString("en-IN")
                                    : 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                              <div className="flex items-start gap-2 max-w-xs">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="truncate">
                                  {inv.pickupAddress ||
                                    (inv.fromAddress?.locality?.name
                                      ? `${inv.fromAddress.locality.name}, ${inv.fromAddress.city?.name || ''}, ${inv.fromAddress.state?.name || ''}`
                                      : 'N/A')}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                              <div className="flex items-start gap-2 max-w-xs">
                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span className="truncate">
                                  {inv.deliveryAddress ||
                                    (inv.toAddress?.locality?.name
                                      ? `${inv.toAddress.locality.name}, ${inv.toAddress.city?.name || ''}, ${inv.toAddress.state?.name || ''}`
                                      : 'N/A')}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-4 py-3 text-sm whitespace-nowrap">
                              <Button
                                size="sm"
                                onClick={() =>
                                  navigate("/admin/update-invoices", {
                                    state: { invoiceId: inv._id },
                                  })
                                }
                                className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium border border-[#FFD249] dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                <span className="hidden sm:inline">Edit</span>
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* View All Button */}
            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => navigate("/admin/driver-invoices")}
                className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] font-medium border border-[#FFD249] shadow-lg hover:shadow-xl transition-all duration-200 dark:bg-[#FFD249] dark:text-[#202020] dark:hover:bg-[#FFD249]/80"
              >
                View All Invoices
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DriverDashboard;
