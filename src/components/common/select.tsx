import * as React from "react";
import ReactSelect, { type StylesConfig } from "react-select";
import { cn } from "./utils";

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

// Hook to detect if device is mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const Select = React.forwardRef<HTMLSelectElement | HTMLDivElement, SelectProps>(
  ({ options, value, defaultValue, onValueChange, placeholder, isDisabled, className }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue || "");
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;
    const isMobile = useIsMobile();

    // Native select handler
    const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    // React-select handler
    const handleReactSelectChange = (option: OptionType | null) => {
      const newValue = option?.value || "";
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      if (onValueChange) {
        onValueChange(newValue);
      }
    };

    // Style configuration for react-select
    const customStyles: StylesConfig<OptionType, false> = {
      control: (base) => ({
        ...base,
        minHeight: '40px',
        borderRadius: '1rem',
        borderColor: 'var(--border-color, #e2e8f0)',
        boxShadow: 'none',
        '&:hover': {
          borderColor: 'var(--border-hover-color, #cbd5e1)'
        }
      }),
      menu: (base) => ({
        ...base,
        zIndex: 50,
        borderRadius: '0.5rem',
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

    // Render native select on mobile
    if (isMobile) {
      return (
        <select
          ref={ref as React.Ref<HTMLSelectElement>}
          value={currentValue}
          onChange={handleNativeChange}
          disabled={isDisabled}
          className={cn(
            "w-full min-h-[40px] border border-(--border-color,#e2e8f0) px-3 py-2 text-sm focus:outline-none focus:ring-none bg-gray-200 rounded-lg focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed",
            className
          )}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      );
    }

    // Render react-select on desktop
    const selectedOption = options.find(option => option.value === currentValue);

    return (
      <div ref={ref as React.Ref<HTMLDivElement>} className={cn("w-full", className)}>
        <ReactSelect
          value={selectedOption}
          onChange={handleReactSelectChange}
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