import * as React from "react";
import { cn } from "./utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => (
    <div ref={ref} className={cn("w-full bg-white rounded-full h-2", className)} {...props}>
      <div className="bg-green-800 h-2 rounded-full" style={{"width": `${value}%`}}></div>
    </div>
  )
);

export { Progress };
