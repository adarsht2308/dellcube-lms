import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const normalizeArray = (values) => {
  if (!values) return [];
  const list = Array.isArray(values)
    ? values
    : typeof values === "string"
    ? values.split(",")
    : [values];

  return list
    .map((value) =>
      typeof value === "string" ? value.trim() : String(value || "").trim()
    )
    .filter((value) => value.length > 0);
};

const MultiValueInput = ({
  label,
  placeholder,
  values = [],
  onChange,
  helperText,
  disabled = false,
  validateValue = null, // Optional validation function that returns error message or null
  maxLength = null, // Optional max length for input
  inputType = "text", // Input type (text, tel, etc.)
  inputMode = null, // Input mode for mobile keyboards
}) => {
  const [currentValue, setCurrentValue] = useState("");
  const [error, setError] = useState("");
  const normalizedValues = normalizeArray(values);

  const handleAdd = () => {
    const trimmedValue = currentValue.trim();
    if (!trimmedValue) return;

    // Validate if validation function is provided
    if (validateValue) {
      const validationError = validateValue(trimmedValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    setError("");
    const nextValues = Array.from(
      new Set([...normalizedValues, trimmedValue])
    );
    onChange(nextValues);
    setCurrentValue("");
  };

  const handleRemove = (index) => {
    const nextValues = normalizedValues.filter((_, idx) => idx !== index);
    onChange(nextValues);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAdd();
    }
  };

  const handleInputChange = (event) => {
    let value = event.target.value;
    
    // If inputType is tel and maxLength is set, only allow digits
    if (inputType === "tel" && maxLength) {
      value = value.replace(/\D/g, ''); // Remove non-digits
      if (value.length > maxLength) {
        value = value.slice(0, maxLength);
      }
    } else if (maxLength && value.length > maxLength) {
      // For other input types, just limit length
      value = value.slice(0, maxLength);
    }
    
    setCurrentValue(value);
    // Clear error when user starts typing
    if (error) setError("");
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium" htmlFor={label}>
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        <Input
          id={label}
          type={inputType}
          value={currentValue}
          disabled={disabled}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 ${error ? "border-red-500" : ""}`}
          maxLength={maxLength || undefined}
          inputMode={inputMode || undefined}
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !currentValue.trim()}
          className="whitespace-nowrap"
        >
          Add
        </Button>
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {normalizedValues.map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-[#FFD249]/20 text-[#202020] px-3 py-1 text-xs font-medium"
          >
            {value}
            <button
              type="button"
              className="text-[#202020]/70 hover:text-red-500 transition-colors"
              onClick={() => handleRemove(index)}
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {normalizedValues.length === 0 && (
          <span className="text-xs text-gray-400">No entries added yet.</span>
        )}
      </div>
    </div>
  );
};

export default MultiValueInput;

