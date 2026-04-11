import * as React from "react";
import { cn } from "./utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full px-2 py-1 bg-gray-200 rounded-lg file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-gray-400 focus-visible:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
