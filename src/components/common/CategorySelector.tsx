import { Select } from "./select";
import { Label } from "./label";
import { useRegularCategoryNameMap } from "../../hooks/api/useCSP";

interface CategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
}

export const CategorySelector = ({
  value,
  onValueChange,
  label,
  placeholder = "Select a category",
  disabled = false,
  className,
  includeAllOption = true
}: CategorySelectorProps) => {
  const categoryNameMap = useRegularCategoryNameMap();

  // Build options with optional "All" at the top
  const options = [
    ...(includeAllOption ? [{ value: '', label: 'All categories' }] : []),
    ...Array.from(categoryNameMap.entries()).map(([id, name]) => ({
      value: id,
      label: name,
    })),
  ];

  return (
    <div className={className}>
      <Label htmlFor="category" className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Select
        options={options}
        value={value}
        onValueChange={onValueChange}
        isDisabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
};