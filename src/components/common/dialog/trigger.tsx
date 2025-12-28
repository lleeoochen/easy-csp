import * as React from "react";
import { useDialog } from "./context";

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({
  children,
  ...props
}) => {
  const { setOpen } = useDialog();

  return (
    <button type="button" onClick={() => setOpen(true)} {...props}>
      {children}
    </button>
  );
};
