import { useFinancialInstitutions } from "../../hooks/api/useFinancialInstitutions";
import { generateAccountOptions } from "../../utils/accountUtils";
import { Select } from "./select";

interface AccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AccountSelector({ value, onChange, disabled }: AccountSelectorProps) {
  const { data: institutions = [] } = useFinancialInstitutions();
  const accountOptions = generateAccountOptions(institutions);

  return (
    <Select
      options={accountOptions}
      value={value}
      onValueChange={onChange}
      placeholder="Choose an account..."
      isDisabled={disabled}
    />
  );
}
