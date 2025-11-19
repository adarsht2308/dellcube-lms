import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import {
  Upload,
  Download,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Users,
  Building,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useBulkUploadConsigneesMutation,
  useBulkUploadConsignorsMutation,
  useLazyExportConsigneesQuery,
  useLazyExportConsignorsQuery,
  useUpdateCustomerMutation,
} from "@/features/api/Customer/customerApi";

const ConsigneeConsignorManager = ({ customerId, consignees = [], consignors = [], onUpdate, customerData }) => {
  const [activeTab, setActiveTab] = useState("consignees");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const fileInputRef = useRef(null);

  const [bulkUploadConsignees, { isLoading: isUploadingConsignees }] =
    useBulkUploadConsigneesMutation();
  const [bulkUploadConsignors, { isLoading: isUploadingConsignors }] =
    useBulkUploadConsignorsMutation();
  const [exportConsignees] = useLazyExportConsigneesQuery();
  const [exportConsignors] = useLazyExportConsignorsQuery();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const [formData, setFormData] = useState({
    siteId: "",
    name: "",
    address: "",
  });

  const [csvData, setCsvData] = useState([]);

  const handleAddNew = () => {
    setFormData({ siteId: "", name: "", address: "" });
    setIsAddModalOpen(true);
  };

  const handleEdit = (item, index) => {
    if (activeTab === "consignees") {
      setFormData({
        siteId: item.siteId || "",
        name: item.consignee || "",
        address: item.address || "",
      });
    } else {
      setFormData({
        siteId: item.siteId || "",
        name: item.consignor || "",
        address: item.address || "",
      });
    }
    setEditingItem(item);
    setEditingIndex(index);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (index) => {
    try {
      if (activeTab === "consignees") {
        const updated = consignees.filter((_, i) => i !== index);
        await updateCustomer({
          customerId,
          consignees: updated,
        }).unwrap();
        onUpdate({ refetch: true });
        toast.success("Consignee removed successfully");
      } else {
        const updated = consignors.filter((_, i) => i !== index);
        await updateCustomer({
          customerId,
          consignors: updated,
        }).unwrap();
        onUpdate({ refetch: true });
        toast.success("Consignor removed successfully");
      }
    } catch (error) {
      toast.error("Failed to remove entry");
      console.error(error);
    }
  };

  const handleSaveAdd = async () => {
    try {
      if (activeTab === "consignees") {
        if (!formData.siteId || !formData.name) {
          toast.error("Site ID and Consignee name are required");
          return;
        }
        const updated = [
          ...consignees,
          {
            siteId: formData.siteId,
            consignee: formData.name,
            address: formData.address,
          },
        ];
        await updateCustomer({
          customerId,
          consignees: updated,
        }).unwrap();
        onUpdate({ refetch: true });
        toast.success("Consignee added successfully");
      } else {
        if (!formData.name) {
          toast.error("Consignor name is required");
          return;
        }
        const updated = [
          ...consignors,
          {
            siteId: formData.siteId,
            consignor: formData.name,
            address: formData.address,
          },
        ];
        await updateCustomer({
          customerId,
          consignors: updated,
        }).unwrap();
        onUpdate({ refetch: true });
        toast.success("Consignor added successfully");
      }
      setIsAddModalOpen(false);
      setFormData({ siteId: "", name: "", address: "" });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add entry");
      console.error(error);
    }
  };

  const handleSaveEdit = async () => {
    try {
      if (activeTab === "consignees") {
        if (!formData.siteId || !formData.name) {
          toast.error("Site ID and Consignee name are required");
          return;
        }
        const updated = [...consignees];
        updated[editingIndex] = {
          siteId: formData.siteId,
          consignee: formData.name,
          address: formData.address,
        };
        await updateCustomer({
          customerId,
          consignees: updated,
        }).unwrap();
        onUpdate({ refetch: true });
        toast.success("Consignee updated successfully");
      } else {
        if (!formData.name) {
          toast.error("Consignor name is required");
          return;
        }
        const updated = [...consignors];
        updated[editingIndex] = {
          siteId: formData.siteId,
          consignor: formData.name,
          address: formData.address,
        };
        await updateCustomer({
          customerId,
          consignors: updated,
        }).unwrap();
        onUpdate({ refetch: true });
        toast.success("Consignor updated successfully");
      }
      setIsEditModalOpen(false);
      setEditingItem(null);
      setEditingIndex(null);
      setFormData({ siteId: "", name: "", address: "" });
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update entry");
      console.error(error);
    }
  };

  const handleExport = async () => {
    try {
      let data;
      if (activeTab === "consignees") {
        const response = await exportConsignees(customerId);
        data = response.data?.consignees || [];
      } else {
        const response = await exportConsignors(customerId);
        data = response.data?.consignors || [];
      }

      if (!data || data.length === 0) {
        toast.error("No data to export");
        return;
      }

      // Create CSV content
      const headers = ["Site ID", "Name", "Address"];
      const csvContent = [
        headers.join(","),
        ...data.map((item) => {
          const name = activeTab === "consignees" ? item.consignee : item.consignor;
          return `"${item.siteId || ""}","${name || ""}","${item.address || ""}"`;
        }),
      ].join("\n");

      // Download CSV
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `${activeTab}_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
      console.error(error);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split("\n").filter((row) => row.trim());
        const headers = rows[0].split(",").map((h) => h.trim().replace(/"/g, ""));
        
        const parsedData = rows.slice(1).map((row) => {
          const values = [];
          let currentValue = "";
          let insideQuotes = false;

          for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === "," && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = "";
            } else {
              currentValue += char;
            }
          }
          values.push(currentValue.trim());

          return {
            siteId: values[0] || "",
            name: values[1] || "",
            address: values[2] || "",
          };
        }).filter((item) => item.name); // Filter out empty rows

        setCsvData(parsedData);
        setIsBulkUploadModalOpen(true);
      } catch (error) {
        toast.error("Failed to parse CSV file");
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (csvData.length === 0) {
      toast.error("No data to upload");
      return;
    }

    try {
      if (activeTab === "consignees") {
        const payload = csvData.map((item) => ({
          siteId: item.siteId,
          consignee: item.name,
          address: item.address,
        }));
        const response = await bulkUploadConsignees({
          customerId,
          consignees: payload,
        }).unwrap();
        toast.success(response.message || "Bulk upload successful");
        onUpdate({ refetch: true });
      } else {
        const payload = csvData.map((item) => ({
          siteId: item.siteId,
          consignor: item.name,
          address: item.address,
        }));
        const response = await bulkUploadConsignors({
          customerId,
          consignors: payload,
        }).unwrap();
        toast.success(response.message || "Bulk upload successful");
        onUpdate({ refetch: true });
      }
      setIsBulkUploadModalOpen(false);
      setCsvData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to upload data");
      console.error(error);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = [
      "Site ID,Name,Address",
      '"MB5979","WNS CENTAURUS","123 Main Street, City"',
      '"3628","Sadhana Towers","456 Park Avenue, Town"',
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sample_${activeTab}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample CSV downloaded");
  };

  return (
    <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 sm:p-6 border border-gray-200 dark:border-gray-700">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <TabsList className="grid w-full sm:w-[300px] grid-cols-2">
            <TabsTrigger value="consignees" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Consignees</span>
              <span className="sm:hidden">To</span>
            </TabsTrigger>
            <TabsTrigger value="consignors" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Building className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Consignors</span>
              <span className="sm:hidden">From</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={downloadSampleCSV}
              className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <FileSpreadsheet className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Sample CSV</span>
              <span className="md:hidden">Sample</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1 sm:gap-2 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Bulk Upload</span>
              <span className="md:hidden">Upload</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              size="sm"
              onClick={handleAddNew}
              className="gap-1 sm:gap-2 bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Add New</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </div>
        </div>

        <TabsContent value="consignees" className="mt-4">
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-3">
            {consignees.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg">
                No consignees added yet. Click "Add" to add one.
              </div>
            ) : (
              consignees.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</div>
                      <div className="font-mono text-sm font-medium mt-1">{item.siteId}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item, index)}
                        className="h-8 w-8 p-0"
                        disabled={isUpdating}
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="h-8 w-8 p-0"
                        disabled={isUpdating}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{item.consignee}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {item.address || "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Site ID</TableHead>
                  <TableHead className="font-semibold">Consignee Name</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consignees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No consignees added yet. Click "Add New" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  consignees.map((item, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.siteId}</TableCell>
                      <TableCell>{item.consignee}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.address || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item, index)}
                            className="h-8 w-8 p-0"
                            disabled={isUpdating}
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(index)}
                            className="h-8 w-8 p-0"
                            disabled={isUpdating}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="consignors" className="mt-4">
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-3">
            {consignors.length === 0 ? (
              <div className="text-center py-8 text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg">
                No consignors added yet. Click "Add" to add one.
              </div>
            ) : (
              consignors.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400">#{index + 1}</div>
                      <div className="font-mono text-sm font-medium mt-1">
                        {item.siteId || <span className="text-gray-400">—</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item, index)}
                        className="h-8 w-8 p-0"
                        disabled={isUpdating}
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(index)}
                        className="h-8 w-8 p-0"
                        disabled={isUpdating}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{item.consignor}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {item.address || "—"}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800">
                  <TableHead className="font-semibold">#</TableHead>
                  <TableHead className="font-semibold">Site ID</TableHead>
                  <TableHead className="font-semibold">Consignor Name</TableHead>
                  <TableHead className="font-semibold">Address</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consignors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No consignors added yet. Click "Add New" to add one.
                    </TableCell>
                  </TableRow>
                ) : (
                  consignors.map((item, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.siteId || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell>{item.consignor}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {item.address || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(item, index)}
                            className="h-8 w-8 p-0"
                            disabled={isUpdating}
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(index)}
                            className="h-8 w-8 p-0"
                            disabled={isUpdating}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#FFD249]" />
              Add New {activeTab === "consignees" ? "Consignee" : "Consignor"}
            </DialogTitle>
            <DialogDescription>
              Enter the details below to add a new{" "}
              {activeTab === "consignees" ? "consignee" : "consignor"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="siteId">
                Site ID {activeTab === "consignees" && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="siteId"
                placeholder="e.g., MB5979"
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="name">
                {activeTab === "consignees" ? "Consignee" : "Consignor"} Name{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., WNS CENTAURUS"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="e.g., 123 Main Street, City"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAdd}
              disabled={isUpdating}
              className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
            >
              {isUpdating ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Edit {activeTab === "consignees" ? "Consignee" : "Consignor"}
            </DialogTitle>
            <DialogDescription>
              Update the details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-siteId">
                Site ID {activeTab === "consignees" && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="edit-siteId"
                placeholder="e.g., MB5979"
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">
                {activeTab === "consignees" ? "Consignee" : "Consignor"} Name{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="e.g., WNS CENTAURUS"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                placeholder="e.g., 123 Main Street, City"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Preview Modal */}
      <Dialog open={isBulkUploadModalOpen} onOpenChange={setIsBulkUploadModalOpen}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[85vh] sm:max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-[#FFD249]" />
              Bulk Upload Preview
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Review the data before uploading. {csvData.length} record(s) found.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] sm:max-h-[400px] overflow-auto">
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-2">
              {csvData.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-xs"
                >
                  <div className="font-medium mb-1">#{index + 1} - {item.siteId}</div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-gray-600 dark:text-gray-400 line-clamp-1">{item.address}</div>
                </div>
              ))}
            </div>
            
            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Site ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{item.siteId}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{item.address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsBulkUploadModalOpen(false);
                setCsvData([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={isUploadingConsignees || isUploadingConsignors}
              className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020] w-full sm:w-auto"
            >
              {isUploadingConsignees || isUploadingConsignors
                ? "Uploading..."
                : `Upload ${csvData.length} Record(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ConsigneeConsignorManager;

