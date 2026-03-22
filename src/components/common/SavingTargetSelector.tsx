import { Select } from "./select";
import { Label } from "./label";
import { useSavingTargets } from "../../hooks/api/useSavingTargets";

interface SavingTargetSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
  includeNoneOption?: boolean;
}

export const SavingTargetSelector = ({
  value,
  onValueChange,
  label,
  placeholder = "Select a fund",
  disabled = false,
  className,
  includeAllOption = false,
  includeNoneOption = false,
}: SavingTargetSelectorProps) => {
  const { data: savingTargets = [] } = useSavingTargets();

  const options = [
    ...(includeAllOption ? [{ value: '', label: 'Including all funds' }] : []),
    ...(includeNoneOption ? [{ value: 'none', label: 'Excluded from all funds' }] : []),
    ...savingTargets.map(target => ({
      value: target.id,
      label: target.name,
    })),
  ];

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="savingTarget" className="text-sm font-medium text-gray-700">
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
