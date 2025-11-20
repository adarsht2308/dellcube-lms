import React, { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import { useManageMisFieldsMutation } from "@/features/api/Customer/customerApi.js";

const MisFieldsManager = ({ customerId, misFields = [], onUpdate }) => {
  const [fields, setFields] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [manageMisFields, { isLoading }] = useManageMisFieldsMutation();

  useEffect(() => {
    if (misFields && Array.isArray(misFields)) {
      setFields([...misFields].sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  }, [misFields]);

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
      const payload = {
        customerId,
        action: "add",
        field: {
          fieldName: fieldForm.fieldName,
          fieldType: fieldForm.fieldType,
          fieldLabel: fieldForm.fieldLabel,
          isRequired: fieldForm.isRequired,
          options: fieldForm.fieldType === "dropdown" ? fieldForm.options : [],
        },
      };

      const result = await manageMisFields(payload).unwrap();
      if (result.success) {
        toast.success("MIS field added successfully");
        setShowAddModal(false);
        resetForm();
        if (onUpdate) {
          onUpdate({ misFields: result.misFields });
        }
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to add MIS field");
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
      const payload = {
        customerId,
        action: "update",
        field: {
          _id: editingField._id,
          fieldName: fieldForm.fieldName,
          fieldType: fieldForm.fieldType,
          fieldLabel: fieldForm.fieldLabel,
          isRequired: fieldForm.isRequired,
          options: fieldForm.fieldType === "dropdown" ? fieldForm.options : [],
        },
      };

      const result = await manageMisFields(payload).unwrap();
      if (result.success) {
        toast.success("MIS field updated successfully");
        setShowAddModal(false);
        resetForm();
        if (onUpdate) {
          onUpdate({ misFields: result.misFields });
        }
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update MIS field");
    }
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this field?")) {
      return;
    }

    try {
      const payload = {
        customerId,
        action: "delete",
        field: { _id: fieldId },
      };

      const result = await manageMisFields(payload).unwrap();
      if (result.success) {
        toast.success("MIS field deleted successfully");
        if (onUpdate) {
          onUpdate({ misFields: result.misFields });
        }
      }
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete MIS field");
    }
  };

  const addOption = () => {
    if (fieldForm.newOption.trim()) {
      setFieldForm({
        ...fieldForm,
        options: [...fieldForm.options, fieldForm.newOption.trim()],
        newOption: "",
      });
    }
  };

  const removeOption = (index) => {
    setFieldForm({
      ...fieldForm,
      options: fieldForm.options.filter((_, i) => i !== index),
    });
  };

  return (
    <>
      <Card className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#202020] dark:text-[#FFD249] flex items-center gap-2">
            <GripVertical className="w-5 h-5" />
            MIS Report Fields
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
          Add custom fields that will be used for MIS reports after order delivery.
        </p>

        {fields.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No MIS fields added yet. Click "Add Field" to get started.</p>
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
                    {field.isRequired && (
                      <span className="text-xs text-red-500">*</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Field Name: {field.fieldName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditField(field)}
                  >
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
            <DialogTitle>
              {editingField ? "Edit MIS Field" : "Add MIS Field"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>
                Field Name * <span className="text-xs text-gray-500">(Internal identifier, e.g., delivery_time)</span>
              </Label>
              <Input
                placeholder="e.g., delivery_time"
                value={fieldForm.fieldName}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, fieldName: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Field Label * <span className="text-xs text-gray-500">(Display name, e.g., Delivery Time)</span></Label>
              <Input
                placeholder="e.g., Delivery Time"
                value={fieldForm.fieldLabel}
                onChange={(e) =>
                  setFieldForm({ ...fieldForm, fieldLabel: e.target.value })
                }
                className="mt-1.5"
              />
            </div>

            <div>
              <Label>Field Type *</Label>
              <Select
                value={fieldForm.fieldType}
                onValueChange={(value) =>
                  setFieldForm({ ...fieldForm, fieldType: value, options: value !== "dropdown" ? [] : fieldForm.options })
                }
              >
                <SelectTrigger className="w-full mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="dropdown">Dropdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {fieldForm.fieldType === "dropdown" && (
              <div>
                <Label>Options *</Label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    placeholder="Enter option"
                    value={fieldForm.newOption}
                    onChange={(e) =>
                      setFieldForm({ ...fieldForm, newOption: e.target.value })
                    }
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addOption}
                    variant="outline"
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
                {fieldForm.options.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {fieldForm.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded"
                      >
                        <span className="text-sm">{opt}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(idx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                checked={fieldForm.isRequired}
                onCheckedChange={(checked) =>
                  setFieldForm({ ...fieldForm, isRequired: checked })
                }
              />
              <Label>Required Field</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={editingField ? handleUpdateField : handleAddField}
              disabled={isLoading}
              className="bg-[#FFD249] hover:bg-[#FFD249]/80 text-[#202020]"
            >
              {isLoading
                ? "Saving..."
                : editingField
                ? "Update Field"
                : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MisFieldsManager;

