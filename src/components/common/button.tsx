import * as React from "react";
import { cn } from "./utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "icon";
};

const variantClassNames: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary-bg text-primary-fg",
  secondary: "bg-secondary-bg text-secondary-fg",
  icon: "bg-secondary-bg text-secondary-fg px-3 py-1"
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = '', disabled, ...props }, ref) => {
    return (
      <button
        className={
          cn(
            "rounded-lg px-4 py-2 shadow-md cursor-pointer",
            className,
            variantClassNames[variant],
            {
              "bg-gray-400 text-gray-600": disabled
            }
          )
        }
        disabled={disabled}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
