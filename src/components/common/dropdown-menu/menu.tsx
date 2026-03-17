import * as React from "react";
import { DropdownMenuContext } from "./context";

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  children,
  open: controlledOpen,
  onOpenChange
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(open) : value;

    if (!isControlled) setUncontrolledOpen(newValue);
    if (onOpenChange) onOpenChange(newValue);
  }, [isControlled, open, onOpenChange]);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
};

interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export const DropdownMenuTrigger: React.FC<DropdownMenuTriggerProps> = ({
  asChild,
  children,
  onClick
}) => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenuTrigger must be used within a DropdownMenu');
  }

  const { setOpen } = context;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(prev => !prev);
    onClick?.(e);
  };

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;
    return React.cloneElement(child, {
      onClick: handleClick
    });
  }

  return (
    <button onClick={handleClick}>
      {children}
    </button>
  );
};