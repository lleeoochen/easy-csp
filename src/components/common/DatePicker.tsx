import { useState } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { cn } from "./utils";
import "react-day-picker/style.css";

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function DatePicker({ value, onChange, label, id, disabled = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(date);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-gray-700 block mb-1">
          {label}
        </label>
      )}
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between px-3 py-2 bg-gray-100 rounded-lg",
          "hover:bg-gray-200 focus-visible:outline-2 focus-visible:outline-gray-400",
          "text-left",
          disabled && "opacity-50 cursor-not-allowed hover:bg-gray-100"
        )}
      >
        <span>{format(value, "MM/dd/yyyy")}</span>
        <Calendar className="w-4 h-4 text-gray-500" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-3">
            <DayPicker
              mode="single"
              selected={value}
              onSelect={handleSelect}
              defaultMonth={value}
              className="rdp-custom"
            />
          </div>
        </>
      )}
    </div>
  );
}
