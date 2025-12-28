import * as React from "react";
import ReactDOM from "react-dom";
import { cn } from "../utils";
import { useDialog } from "./context";

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = useDialog();
    const [isVisible, setIsVisible] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);

    React.useEffect(() => {
      if (open) {
        setIsVisible(true);
        setIsAnimating(true);
      } else {
        setIsAnimating(false);
        // Delay hiding to allow exit animation
        const timer = setTimeout(() => setIsVisible(false), 200);
        return () => clearTimeout(timer);
      }
    }, [open]);

    if (!isVisible) return null;

    const content = (
      <>
        {/* Backdrop with fade animation */}
        <div
          className={cn(
            "fixed inset-0 z-50 bg-black/80 transition-opacity duration-200",
            isAnimating ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />
        {/* Dialog content with scale and fade animation */}
        <div
          ref={ref}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg transition-all duration-200 sm:rounded-lg",
            isAnimating
              ? "scale-100 opacity-100"
              : "scale-95 opacity-0",
            className
          )}
          {...props}
        >
          {children}
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            onClick={() => setOpen(false)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            <span className="sr-only">Close</span>
          </button>
        </div>
      </>
    );

    return ReactDOM.createPortal(content, document.body);
  }
);

DialogContent.displayName = "DialogContent";
