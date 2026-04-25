import { Select } from "./select";
import { Label } from "./label";
import { useFunds } from "@/hooks/api/useFunds";
import type { UI_Fund } from "@/types/uiTypes";

interface FundSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeNoneOption?: boolean;
  funds?: UI_Fund[]; // Optional: provide custom filtered funds
}

export const FundSelector = ({
  value,
  onValueChange,
  label = "Allocated Fund",
  placeholder = "Select a fund",
  disabled = false,
  className,
  includeNoneOption = true,
  funds: customFunds
}: FundSelectorProps) => {
  const { data: funds = [], isLoading } = useFunds();
  const fundsToUse = customFunds ?? funds;

  // Build options with optional "None" at the top
  const options = [
    ...(includeNoneOption ? [{ value: '', label: 'No fund assigned' }] : []),
    ...fundsToUse.map((fund) => ({
      value: fund.id,
      label: fund.name,
    })),
  ];

  return (
    <div className={className}>
      <Label htmlFor="fund-selector" className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Select
        options={options}
        value={value}
        onValueChange={onValueChange}
        isDisabled={disabled || isLoading}
        placeholder={isLoading ? "Loading funds..." : placeholder}
      />
    </div>
  );
};
