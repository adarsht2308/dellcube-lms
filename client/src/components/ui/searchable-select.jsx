import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

/**
 * SearchableSelect - A searchable dropdown component
 * 
 * @param {Object} props
 * @param {string} props.value - Currently selected value
 * @param {Function} props.onValueChange - Callback when value changes
 * @param {Array} props.options - Array of {value: string, label: string} objects
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the select is disabled
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.emptyMessage - Message when no options found (default: "No results found")
 * @param {Function} props.filterFunction - Custom filter function (option, search) => boolean
 */
export function SearchableSelect({
  value,
  onValueChange,
  options = [],
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  emptyMessage = "No results found",
  filterFunction,
  portalled = true,
}) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Get selected option label
  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    
    const query = searchQuery.toLowerCase();
    
    if (filterFunction) {
      return options.filter(option => filterFunction(option, searchQuery));
    }
    
    return options.filter((option) =>
      option.label.toLowerCase().includes(query)
    );
  }, [options, searchQuery, filterFunction]);

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        portalled={portalled}
        className="w-[var(--radix-popover-trigger-width)] p-0 z-[60]"
        align="start"
      >
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            autoFocus
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onMouseDown={(e) => {
                  // Important: in Dialogs, clicks can be treated as "outside"
                  // because PopoverContent is often portalled. Selecting on mouse down
                  // ensures selection happens before any outside handlers run.
                  e.preventDefault();
                  onValueChange(option.value);
                  setOpen(false);
                }}
                onClick={(e) => {
                  // Fallback for non-mouse interactions
                  e.preventDefault();
                  onValueChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                  value === option.value && "bg-accent"
                )}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === option.value ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 truncate">{option.label}</span>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
