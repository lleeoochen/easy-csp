import { cn } from "@/components/common/utils";
import * as React from "react";

export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
}

export const DialogTitle = React.forwardRef<HTMLHeadingElement, DialogTitleProps>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("text-lg leading-none tracking-tight", className)}
      {...props}
    />
  )
);

DialogTitle.displayName = "DialogTitle";
