import { Select } from "./common/select";
import { Label } from "./common/label";
import { useFundAccounts } from "../hooks/api/useFundAccounts";
import { X } from "lucide-react";

interface FundAccountDropdownProps {
  value?: string;
  onValueChange: (value: string | null) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export const FundAccountDropdown = ({
  value,
  onValueChange,
  label = "Fund Account",
  disabled = false,
  className,
}: FundAccountDropdownProps) => {
  const { data: fundAccounts = [], isLoading } = useFundAccounts();

  // Build options from fund accounts
  const options = fundAccounts.map((account) => ({
    value: account.id,
    label: account.nickname || account.accountName,
  }));

  const hasSelection = !!value;
  const isEmpty = fundAccounts.length === 0;

  const handleChange = (newValue: string) => {
    onValueChange(newValue || null);
  };

  const handleClear = () => {
    onValueChange(null);
  };

  if (isLoading) {
    return (
      <div className={className}>
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <div className="text-sm text-gray-500">Loading fund accounts...</div>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={className}>
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        <div className="text-sm text-gray-500">
          No fund accounts available. Enable fund status on an account in settings.
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-sm font-medium text-gray-700">{label}</Label>
        {hasSelection && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="flex items-center h-6 px-2 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </button>
        )}
      </div>
      <Select
        options={options}
        value={value || ""}
        onValueChange={handleChange}
        isDisabled={disabled}
        placeholder="Select a fund account..."
      />
    </div>
  );
};
