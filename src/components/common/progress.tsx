import * as React from "react";
import { cn } from "./utils";

const zeroOrMinimum = (value: number, minimum: number) => {
  if (value === 0) {
    return value;
  }
  return Math.max(value, minimum);
}

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  hintText?: string;
  activeColorClass?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, hintText, activeColorClass, ...props }, ref) => (
    <div ref={ref} className={cn("w-full bg-white rounded-full relative", className)} {...props}>
      <div className={cn("h-full rounded-full absolute", activeColorClass)} style={{"width": `${zeroOrMinimum(value, 10)}%`}}></div>
      <div className="right-1 pr-1 py-1 text-gray-400 text-sm absolute mix-blend-exclusion">{hintText}</div>
      <div className="text-right pr-1 py-1 text-gray-400 text-sm invisible">{hintText}</div>
    </div>
  )
);

export { Progress };
