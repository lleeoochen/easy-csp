import { Select } from "./select";
import { Label } from "./label";
import { CSPCategory } from "@easy-csp/shared-types";
import { camelCaseToSentence } from "../../utils/stringUtils";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";

interface CategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const CategorySelector = ({
  value,
  onValueChange,
  label = "Category",
  placeholder = "Select a category",
  disabled = false,
  className
}: CategorySelectorProps) => {
  const { data: savingTargets = [] } = useSavingTargets();

  const savingTargetOptions = savingTargets.map(target => ({
    value: target.id,
    label: target.name
  }));

  const categoryOptions = Object.values(CSPCategory).map((category) => ({
    value: category,
    label: camelCaseToSentence(category)
  }));

  return (
    <div className={className}>
      <Label htmlFor="category" className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Select
        options={[...savingTargetOptions, ...categoryOptions]}
        value={value}
        onValueChange={onValueChange}
        isDisabled={disabled}
        placeholder={placeholder}
      />
    </div>
  );
};