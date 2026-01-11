import * as React from "react";
import { cn } from "../utils";

export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
}

export const DialogDescription = React.forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-md text-muted-foreground", className)}
      {...props}
    />
  )
);

DialogDescription.displayName = "DialogDescription";
