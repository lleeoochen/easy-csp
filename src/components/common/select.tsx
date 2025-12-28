import * as React from "react";
import ReactSelect, { type StylesConfig } from "react-select";
import { cn } from "./utils";

// Simple option type for react-select
type OptionType = {
  value: string;
  label: string;
};

interface SelectProps {
  options: OptionType[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  className?: string;
}

// Single Select component that wraps react-select
const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ options, value, defaultValue, onValueChange, placeholder, isDisabled, className }, ref) => {
    // Create a controlled or uncontrolled component
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;

    // Find the selected option based on the value
    const selectedOption = options.find(option => option.value === currentValue);

    // Style configuration for react-select
    const customStyles: StylesConfig<OptionType, false> = {
      control: (base) => ({
        ...base,
        minHeight: '40px',
        borderRadius: '0.375rem',
        borderColor: 'var(--border-color, #e2e8f0)',
        boxShadow: 'none',
        '&:hover': {
          borderColor: 'var(--border-hover-color, #cbd5e1)'
        }
      }),
      menu: (base) => ({
        ...base,
        zIndex: 50,
        borderRadius: '0.375rem',
      }),
      option: (base, { isSelected, isFocused }) => ({
        ...base,
        backgroundColor: isSelected
          ? 'var(--bg-accent, #f1f5f9)'
          : isFocused
            ? 'var(--bg-accent-hover, #e2e8f0)'
            : 'transparent',
        color: isSelected ? 'var(--text-accent-foreground, #0f172a)' : 'inherit',
      })
    };

    const handleChange = (option: OptionType | null) => {
      const newValue = option?.value || "";
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    return (
      <div ref={ref} className={cn("w-full", className)}>
        <ReactSelect
          value={selectedOption}
          onChange={handleChange}
          options={options}
          isDisabled={isDisabled}
          placeholder={placeholder}
          styles={customStyles}
          classNamePrefix="react-select"
          className="react-select-container"
        />
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select };
