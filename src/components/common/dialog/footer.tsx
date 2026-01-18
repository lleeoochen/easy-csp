import * as React from "react";
import { cn } from "../utils";

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      className
    )}
    {...props}
  />
);

DialogFooter.displayName = "DialogFooter";
