import * as React from "react";
import { useDialog } from "./context";
import { Button, type ButtonProps } from '@/components/common/button';

export interface DialogTriggerProps extends ButtonProps {
  children: React.ReactNode;
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({
  children,
  ...props
}) => {
  const { setOpen } = useDialog();

  return (
    <Button onClick={() => setOpen(true)} {...props}>
      {children}
    </Button>
  );
};
