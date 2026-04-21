import { cn } from "@/components/common/utils";
import * as React from "react";

export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-row justify-end gap-2",
      className
    )}
    {...props}
  />
);

DialogFooter.displayName = "DialogFooter";
