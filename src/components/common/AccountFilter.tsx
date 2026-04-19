import { Select } from "./select";
import { Label } from "./label";
import { useAccountsWithInfo } from "../../hooks/api/useAccounts";

interface AccountFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeAllOption?: boolean;
  includeNoneOption?: boolean;
}

export const AccountFilter = ({
  value,
  onValueChange,
  label,
  placeholder = "Filter by account",
  disabled = false,
  className,
  includeAllOption = true,
  includeNoneOption = false
}: AccountFilterProps) => {
  const { data: accounts = [], isLoading } = useAccountsWithInfo();

  // Build options with optional "All" and "None" at the top
  const options = [
    ...(includeAllOption ? [{ value: '', label: 'All accounts' }] : []),
    ...(includeNoneOption ? [{ value: 'none', label: 'No account assigned' }] : []),
    ...accounts.map((account) => ({
      value: account.id,
      label: account.displayName,
    })),
  ];

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="account-filter" className="text-sm font-medium text-gray-700">
          {label}
        </Label>
      )}
      <Select
        options={options}
        value={value}
        onValueChange={onValueChange}
        isDisabled={disabled || isLoading}
        placeholder={isLoading ? "Loading accounts..." : placeholder}
      />
    </div>
  );
};
