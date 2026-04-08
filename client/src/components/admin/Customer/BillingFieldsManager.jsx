import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";
import { useManageBillingFieldsMutation } from "@/features/api/Customer/customerApi.js";

const BillingFieldsManager = ({ customerId, billingFields = [], onUpdate }) => {
  const [fields, setFields] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [manageBillingFields, { isLoading }] = useManageBillingFieldsMutation();

  useEffect(() => {
    if (billingFields && Array.isArray(billingFields)) {
      setFields([...billingFields].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  }, [billingFields]);

  const [fieldForm, setFieldForm] = useState({
    fieldName: "",
    fieldType: "text",
    fieldLabel: "",
    isRequired: false,
    options: [],
    newOption: "",
  });

  const resetForm = () => {
    setFieldForm({
      fieldName: "",
      fieldType: "text",
      fieldLabel: "",
      isRequired: false,
      options: [],
      newOption: "",
    });
    setEditingField(null);
  };

  const submit = async (action, field) => {
    const result = await manageBillingFields({
      customerId,
      action,
      field,
    }).unwrap();
    if (result.success) {
      if (onUpdate) onUpdate({ billingFields: result.billingFields });
      return true;
    }
    return false;
  };

  const handleAddField = async () => {
    if (!fieldForm.fieldName || !fieldForm.fieldLabel) {
      toast.error("Field Name and Field Label are required");
      return;
    }
    if (fieldForm.fieldType === "dropdown" && fieldForm.options.length === 0) {
      toast.error("Please add at least one option for dropdown field");
      return;
    }
    try {
      const ok = await submit("add", {
        fieldName: fieldForm.fieldName,
        fieldType: fieldForm.fieldType,
        fieldLabel: fieldForm.fieldLabel,
        isRequired: fieldForm.isRequired,
        options: fieldForm.fieldType === "dropdown" ? fieldForm.options : [],
      });
      if (ok) {
        toast.success("Billing field added successfully");
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add Billing field");
    }
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setFieldForm({
      fieldName: field.fieldName,
      fieldType: field.fieldType,
      fieldLabel: field.fieldLabel,
      isRequired: field.isRequired || false,
      options: field.options || [],
      newOption: "",
    });
    setShowAddModal(true);
  };

  const handleUpdateField = async () => {
    if (!fieldForm.fieldName || !fieldForm.fieldLabel) {
      toast.error("Field Name and Field Label are required");
      return;
    }
    if (fieldForm.fieldType === "dropdown" && fieldForm.options.length === 0) {
      toast.error("Please add at least one option for dropdown field");
      return;
    }
    try {
      const ok = await submit("update", {
        _id: editingField._id,
        fieldName: fieldForm.fieldName,
        fieldType: fieldForm.fieldType,
        fieldLabel: fieldForm.fieldLabel,
        isRequired: fieldForm.isRequired,
        options: fieldForm.fieldType === "dropdown" ? fieldForm.options : [],
      });
      if (ok) {
        toast.success("Billing field updated successfully");
        setShowAddModal(false);
        resetForm();
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update Billing field");
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this field?")) return;
    try {
      const ok = await submit("delete", { _id: fieldId });
      if (ok) toast.success("Billing field deleted successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete Billing field");
    }
  };

  const addOption = () => {
    if (fieldForm.newOption.trim()) {
      setFieldForm((prev) => ({
        ...prev,
        options: [...prev.options, prev.newOption.trim()],
        newOption: "",
      }));
    }
  };

  return (
    <>
      <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] flex items-center gap-2">
            <GripVertical className="w-5 h-5" />
            Billing Configuration Fields
          </h3>
          <Button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configure customer-wise fields required while generating billing invoices.
        </p>

        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No Billing fields added yet. Click "Add Field" to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field._id}
                className="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {field.fieldLabel}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                      {field.fieldType}
                    </span>
                    {field.isRequired && <span className="text-xs text-red-500">*</span>}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Field Name: {field.fieldName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEditField(field)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteField(field._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingField ? "Edit Billing Field" : "Add Billing Field"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Field Name *</Label>
              <Input
                value={fieldForm.fieldName}
                onChange={(e) => setFieldForm((prev) => ({ ...prev, fieldName: e.target.value }))}
                placeholder="e.g., po_number"
              />
            </div>
            <div>
              <Label>Field Label *</Label>
              <Input
                value={fieldForm.fieldLabel}
                onChange={(e) => setFieldForm((prev) => ({ ...prev, fieldLabel: e.target.value }))}
                placeholder="e.g., PO Number"
              />
            </div>
            <div>
              <Label>Field Type</Label>
              <Select
                value={fieldForm.fieldType}
                onValueChange={(value) => setFieldForm((prev) => ({ ...prev, fieldType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {fieldForm.fieldType === "dropdown" && (
              <div>
                <Label>Dropdown Options</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={fieldForm.newOption}
                    onChange={(e) => setFieldForm((prev) => ({ ...prev, newOption: e.target.value }))}
                    placeholder="Add option"
                  />
                  <Button type="button" variant="outline" onClick={addOption}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {fieldForm.options.map((option, idx) => (
                    <span
                      key={`${option}-${idx}`}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-xs"
                    >
                      {option}
                      <button
                        type="button"
                        onClick={() =>
                          setFieldForm((prev) => ({
                            ...prev,
                            options: prev.options.filter((_, i) => i !== idx),
                          }))
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch
                checked={fieldForm.isRequired}
                onCheckedChange={(checked) =>
                  setFieldForm((prev) => ({ ...prev, isRequired: checked }))
                }
              />
              <Label>Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              disabled={isLoading}
              onClick={editingField ? handleUpdateField : handleAddField}
              className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
            >
              {editingField ? "Update Field" : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BillingFieldsManager;
