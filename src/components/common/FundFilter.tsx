import { Select } from "./select";
import { Label } from "./label";
import { useAccountsWithInfo } from "../../hooks/api/useAccounts";

interface FundFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
  includeNoneOption?: boolean;
}

export const FundFilter = ({
  value,
  onValueChange,
  label,
  placeholder = "Filter by fund",
  disabled = false,
  className,
  includeAllOption = true,
  includeNoneOption = false
}: FundFilterProps) => {
  const { data: accounts = [], isLoading } = useAccountsWithInfo();

  // Filter to only fund accounts
  const fundAccounts = accounts.filter(account => account.isFundAccount);

  // Build options with optional "All" and "None" at the top
  const options = [
    ...(includeAllOption ? [{ value: '', label: 'All funds' }] : []),
    ...(includeNoneOption ? [{ value: 'none', label: 'No fund assigned' }] : []),
    ...fundAccounts.map((account) => ({
      value: account.id,
      label: account.displayName,
    })),
  ];

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="fund-filter" className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      )}
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
