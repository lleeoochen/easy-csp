import { X } from "lucide-react";
import { cn } from "./utils";

interface FilterBadgeProps {
  label: string;
  onRemove: () => void;
  variant?: "default" | "category" | "month";
  className?: string;
}

export const FilterBadge = ({
  label,
  onRemove,
  variant = "default",
  className
}: FilterBadgeProps) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-700 border-gray-200",
    category: "bg-blue-50 text-blue-700 border-blue-200",
    month: "bg-green-50 text-green-700 border-green-200"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border",
      variantStyles[variant],
      className
    )}>
      <span>{label}</span>
      <button
        onClick={onRemove}
        className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};