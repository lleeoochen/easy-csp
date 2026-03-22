import * as React from "react";
import { cn } from "./utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative w-full after:absolute after:bottom-0 after:left-[1.5%] after:w-[97%] after:h-0.5 after:bg-gray-400 after:rounded-full focus-within:after:bg-primary-bg">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full px-2 py-1 bg-gray-200 rounded-lg file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
