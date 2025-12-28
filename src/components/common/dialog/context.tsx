import * as React from "react";

export interface DialogContextType {
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export const DialogContext = React.createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = React.useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a Dialog provider");
  }
  return context;
};
