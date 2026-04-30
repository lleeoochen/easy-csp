import { Select } from "./select";
import { Label } from "./label";
import { useAccountsWithInfo } from '@/hooks/api/useAccounts';
import type { UI_FinancialAccount } from '@/types/uiTypes';

interface AccountSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  includeNoneOption?: boolean;
  accounts?: UI_FinancialAccount[]; // Optional: provide custom filtered accounts
}

export const AccountSelector = ({
  value,
  onValueChange,
  label = "Account",
  placeholder = "Select an account",
  disabled = false,
  className,
  includeNoneOption = false,
  accounts: customAccounts
}: AccountSelectorProps) => {
  const { data: fetchedAccounts = [], isLoading } = useAccountsWithInfo();

  // Use custom accounts if provided, otherwise use fetched accounts
  const accounts = customAccounts ?? fetchedAccounts;

  // Build options with optional "None" at the top
  const options = [
    ...(includeNoneOption ? [{ value: '', label: 'No account assigned' }] : []),
    ...accounts.map((account) => ({
      value: account.id,
      label: (account.institutionName ? account.institutionName + ' - ' : '') + account.displayName,
    })).sort((a, b) => a.label.localeCompare(b.label)),
  ];

  return (
    <div className={className}>
      <Label htmlFor="account">
        {label}
      </Label>
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
