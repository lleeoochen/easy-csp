import { Select } from "./select";
import { Label } from "./label";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";

interface SavingTargetFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
  includeNoneOption?: boolean;
}

export const SavingTargetFilter = ({
  value,
  onValueChange,
  label,
  placeholder = "Filter by fund",
  disabled = false,
  className,
  includeAllOption = false,
  includeNoneOption = false,
}: SavingTargetFilterProps) => {
  const { data: savingTargets = [] } = useSavingTargets();

  const options = [
    ...(includeAllOption ? [{ value: '', label: 'All transactions' }] : []),
    ...(includeNoneOption ? [{ value: 'none', label: 'No fund assigned' }] : []),
    ...savingTargets.map(target => ({
      value: target.id,
      label: target.name,
    })),
  ];

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="savingTargetFilter" className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      )}
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
