import * as React from "react";
import { cn } from "./utils";
import { Check } from "lucide-react";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(e.target.checked);
      }
    };

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          ref={ref}
          className="sr-only peer"
          {...props}
        />
        <div
          className={cn(
            "h-5 w-5 shrink-0 rounded border-2 border-gray-300 transition-colors",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
            checked && "bg-primary-bg border-primary-bg",
            !disabled && "cursor-pointer",
            className
          )}
        >
          {checked && (
            <Check className="h-4 w-4 text-white" strokeWidth={3} />
          )}
        </div>
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";
