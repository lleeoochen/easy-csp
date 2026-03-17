import * as React from "react";

export interface DropdownMenuContextType {
  open: boolean;
  setOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export const DropdownMenuContext = React.createContext<DropdownMenuContextType | undefined>(undefined);

export const useDropdownMenu = () => {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error("useDropdownMenu must be used within a DropdownMenu provider");
  }
  return context;
};