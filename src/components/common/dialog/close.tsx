import * as React from "react";
import { useDialog } from "./context";

export interface DialogCloseProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const DialogClose: React.FC<DialogCloseProps> = ({
  children,
  ...props
}) => {
  const { setOpen } = useDialog();

  return (
    <button type="button" onClick={() => setOpen(false)} {...props}>
      {children}
    </button>
  );
};
