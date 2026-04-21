import { cn } from "@/components/common/utils";
import * as React from "react";

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
);

DialogDescription.displayName = "DialogDescription";
