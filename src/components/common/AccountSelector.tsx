import { useFinancialInstitutions } from "../../hooks/api/useFinancialInstitutions";
import { generateAccountOptions } from "../../utils/accountUtils";
import { Select } from "./select";

interface AccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  includeManualOption?: boolean;
}

export const MANUAL_ACCOUNT_VALUE = "manual";

export function AccountSelector({ value, onChange, disabled, includeManualOption = false }: AccountSelectorProps) {
  const { data: institutions = [] } = useFinancialInstitutions();
  const accountOptions = generateAccountOptions(institutions);

  // Add manual option at the beginning if requested
  const options = includeManualOption
    ? [{ value: MANUAL_ACCOUNT_VALUE, label: "Manual Entry (No Account)" }, ...accountOptions]
    : accountOptions;

  return (
    <Select
      options={options}
      value={value}
      onValueChange={onChange}
      placeholder="Choose an account..."
      isDisabled={disabled}
    />
  );
}
