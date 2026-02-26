import { useState, useEffect } from "react";
import { useGetAllActivitiesQuery, useGetActivityStatsQuery } from "@/features/api/activityApi";
import { useGetAllCompaniesQuery } from "@/features/api/Company/companyApi";
import { useGetAllBranchesQuery } from "@/features/api/Branch/branchApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Download,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Activity as ActivityIcon,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";
import { getTokenData } from "@/utils/getTokenData";

const ActivityLog = () => {
  const { user } = useSelector((store) => store.auth);
  const tokenData = getTokenData();
  const userRole = tokenData?.role || user?.role;
  const userBranchId = tokenData?.branchId || user?.branch?._id;

  // State for filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    company: "",
    branch: userRole === "branchAdmin" ? userBranchId : "",
    action: "",
    entity: "",
    startDate: "",
    endDate: "",
    search: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const [showFilters, setShowFilters] = useState(false);

  // Fetch activities
  const {
    data: activitiesData,
    isLoading,
    isFetching,
    refetch,
  } = useGetAllActivitiesQuery(filters);

  // Fetch stats
  const { data: statsData } = useGetActivityStatsQuery({
    company: filters.company,
    branch: filters.branch,
    startDate: filters.startDate,
    endDate: filters.endDate,
  });

  // Fetch companies and branches for filters
  const { data: companiesData } = useGetAllCompaniesQuery();
  const { data: branchesData } = useGetAllBranchesQuery({ page: 1, limit: 500, search: "", status: "", company: "" });

  const activities = activitiesData?.data || [];
  const pagination = activitiesData?.pagination || {};
  const stats = statsData?.data || {};

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      company: "",
      branch: userRole === "branchAdmin" ? userBranchId : "",
      action: "",
      entity: "",
      startDate: "",
      endDate: "",
      search: "",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  };

  // Export to CSV
  const exportToCSV = () => {
    if (activities.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Date & Time",
      "User",
      "Role",
      "Action",
      "Entity",
      "Description",
      "Company",
      "Branch",
      "Status",
      "IP Address",
    ];

    const rows = activities.map((activity) => [
      new Date(activity.createdAt).toLocaleString("en-IN"),
      activity.userName || "Unknown",
      activity.userRole || "N/A",
      activity.action || "N/A",
      activity.entity || "N/A",
      activity.description || "N/A",
      activity.companyName || "N/A",
      activity.branchName || "N/A",
      activity.success ? "Success" : "Failed",
      activity.ipAddress || "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `activity-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Activity log exported successfully");
  };

  // Get action badge color
  const getActionBadgeColor = (action) => {
    const colors = {
      login: "bg-blue-500",
      logout: "bg-gray-500",
      create: "bg-green-500",
      update: "bg-yellow-500",
      delete: "bg-red-500",
      approve: "bg-purple-500",
      reject: "bg-orange-500",
      upload: "bg-indigo-500",
      download: "bg-teal-500",
      export: "bg-cyan-500",
      import: "bg-pink-500",
    };
    return colors[action] || "bg-gray-500";
  };

  const formatEntityLabel = (entity) => {
    if (!entity) return "N/A";
    if (entity.toLowerCase() === "invoice") return "Docket";
    return entity.charAt(0).toUpperCase() + entity.slice(1);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActivities || 0}</div>
              <p className="text-xs text-muted-foreground">All recorded activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.successRate?.percentage || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.successRate?.successful || 0} of {stats.successRate?.total || 0} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Common Action</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {stats.actionStats?.[0]?._id || "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.actionStats?.[0]?.count || 0} occurrences
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Most Active Entity</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {formatEntityLabel(stats.entityStats?.[0]?._id)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.entityStats?.[0]?.count || 0} operations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Activity Log Card */}
      <Card className="mt-4 md:mt-6">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>View and filter all system activities</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 justify-start md:justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? "Hide" : "Show"} Filters
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={refetch} disabled={isFetching}>
                <RefreshCcw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters Section */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search activities..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange("search", e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                {/* Company Filter (SuperAdmin only) */}
                {userRole === "superAdmin" && (
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Select
                      value={filters.company || "__all_companies"}
                      onValueChange={(value) =>
                        handleFilterChange("company", value === "__all_companies" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Companies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all_companies">All Companies</SelectItem>
                        {companiesData?.companies?.map((company) => (
                          <SelectItem key={company._id} value={company._id}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Branch Filter (SuperAdmin only) */}
                {userRole === "superAdmin" && (
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Select
                      value={filters.branch || "__all_branches"}
                      onValueChange={(value) =>
                        handleFilterChange("branch", value === "__all_branches" ? "" : value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Branches" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all_branches">All Branches</SelectItem>
                        {branchesData?.branches
                          ?.filter((branch) =>
                            filters.company ? branch.company?._id === filters.company : true
                          )
                          .map((branch) => (
                            <SelectItem key={branch._id} value={branch._id}>
                              {branch.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Action Filter */}
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Select
                    value={filters.action || "__all_actions"}
                    onValueChange={(value) =>
                      handleFilterChange("action", value === "__all_actions" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Actions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all_actions">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="approve">Approve</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                      <SelectItem value="upload">Upload</SelectItem>
                      <SelectItem value="download">Download</SelectItem>
                      <SelectItem value="export">Export</SelectItem>
                      <SelectItem value="import">Import</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Entity Filter */}
                <div className="space-y-2">
                  <Label>Entity</Label>
                    <Select
                    value={filters.entity || "__all_entities"}
                    onValueChange={(value) =>
                      handleFilterChange("entity", value === "__all_entities" ? "" : value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Entities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all_entities">All Entities</SelectItem>
                      <SelectItem value="invoice">Docket</SelectItem>
                      <SelectItem value="vehicle">Vehicle</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="company">Company</SelectItem>
                      <SelectItem value="branch">Branch</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="auth">Authentication</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange("endDate", e.target.value)}
                  />
                </div>

                {/* Results Per Page */}
                <div className="space-y-2">
                  <Label>Results Per Page</Label>
                  <Select
                    value={filters.limit.toString()}
                    onValueChange={(value) => handleFilterChange("limit", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Reset Filters
                </Button>
              </div>
            </div>
          )}

          {/* Activities Table */}
          <div className="border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCcw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ActivityIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No activities found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Description</TableHead>
                      {userRole === "superAdmin" && <TableHead>Company</TableHead>}
                      {userRole === "superAdmin" && <TableHead>Branch</TableHead>}
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity._id}>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{new Date(activity.createdAt).toLocaleString("en-IN")}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.createdAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{activity.userName}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                              {activity.userRole}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getActionBadgeColor(activity.action)} text-white capitalize`}
                          >
                            {activity.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {formatEntityLabel(activity.entity)}
                        </TableCell>
                        <TableCell className="max-w-md truncate">
                          {activity.description}
                        </TableCell>
                        {userRole === "superAdmin" && (
                          <TableCell>{activity.companyName || "N/A"}</TableCell>
                        )}
                        {userRole === "superAdmin" && (
                          <TableCell>{activity.branchName || "N/A"}</TableCell>
                        )}
                        <TableCell>
                          {activity.success ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{" "}
                    {pagination.totalCount} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrevPage || isFetching}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">Page {pagination.currentPage}</span>
                      <span className="text-sm text-muted-foreground">
                        of {pagination.totalPages}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNextPage || isFetching}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLog;
