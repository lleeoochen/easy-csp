import * as React from "react";
import { useDropdownMenu } from "./context";
import { cn } from "../utils";

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  children,
  onClick,
  disabled = false,
  className
}) => {
  const { setOpen } = useDropdownMenu();

  const handleClick = () => {
    if (disabled) return;

    onClick?.();
    setOpen(false);
  };

  return (
    <button
      type="button"
      className={cn(
        "flex w-full cursor-default select-none items-center rounded-sm p-4 text-sm outline-none",
        "transition-colors hover:bg-gray-100 focus:bg-gray-100",
        disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
        className
      )}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};