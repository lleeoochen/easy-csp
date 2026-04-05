import { Select } from "./select";
import { Label } from "./label";
import { useFunds } from "../../hooks/api/useFunds";
import { FundType } from "@easy-csp/shared-types";

interface FundSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeNoneOption?: boolean;
  filterByType?: FundType;
}

export const FundSelector = ({
  value,
  onValueChange,
  label,
  placeholder = "Select a fund",
  disabled = false,
  className,
  includeNoneOption = false,
  filterByType,
}: FundSelectorProps) => {
  const { data: funds = [] } = useFunds();

  // Filter funds by type if specified
  const filteredFunds = filterByType
    ? funds.filter(fund => fund.type === filterByType)
    : funds;

  const options = [
    ...(includeNoneOption ? [{ value: '', label: 'No fund associated' }] : []),
    ...filteredFunds.map(fund => ({
      value: fund.id,
      label: fund.name,
    })),
  ];

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="fund" className="text-sm font-medium text-gray-700">
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
