import { Select } from "./select";
import { Label } from "./label";
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';

interface FundSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeNoneOption?: boolean;
}

export const FundSelector = ({
  value,
  onValueChange,
  label = "Allocated Fund",
  placeholder = "Select a fund",
  disabled = false,
  className,
  includeNoneOption = true
}: FundSelectorProps) => {
  const { data: accounts = [], isLoading } = useAccountsWithInfo();

  // Filter to only fund accounts
  const fundAccounts = accounts.filter(account => account.isFundAccount);

  // Build options with optional "None" at the top
  const options = [
    ...(includeNoneOption ? [{ value: '', label: 'No fund assigned' }] : []),
    ...fundAccounts.map((account) => ({
      value: account.id,
      label: account.displayName,
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
