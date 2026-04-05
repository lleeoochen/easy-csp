import { Select } from "./select";
import { Label } from "./label";
import { useFunds } from "../../hooks/api/useFunds";
import { FundType } from "@easy-csp/shared-types";

interface FundFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
  includeNoneOption?: boolean;
  filterByType?: FundType;
}

export const FundFilter = ({
  value,
  onValueChange,
  label,
  placeholder = "Filter by fund",
  disabled = false,
  className,
  includeAllOption = false,
  includeNoneOption = false,
  filterByType,
}: FundFilterProps) => {
  const { data: funds = [] } = useFunds();

  // Filter funds by type if specified
  const filteredFunds = filterByType
    ? funds.filter(fund => fund.type === filterByType)
    : funds;

  const options = [
    ...(includeAllOption ? [{ value: '', label: 'All transactions' }] : []),
    ...(includeNoneOption ? [{ value: 'none', label: 'No fund assigned' }] : []),
    ...filteredFunds.map(fund => ({
      value: fund.id,
      label: fund.name,
    })),
  ];

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="fundFilter" className="text-sm font-medium text-gray-700">
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
