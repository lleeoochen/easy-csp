import { useFinancialInstitutions } from "../../hooks/api/useFinancialInstitutions";
import { generateAccountOptions } from "../../utils/accountUtils";

interface AccountSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function AccountSelector({ value, onChange, disabled, id }: AccountSelectorProps) {
  const { data: institutions = [] } = useFinancialInstitutions();
  const accountOptions = generateAccountOptions(institutions);

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
    >
      <option value="">Choose an account...</option>
      {accountOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
