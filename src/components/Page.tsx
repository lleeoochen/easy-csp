import type { ReactNode } from "react";

type PageProps = {
  children?: ReactNode
  title?: string
};

export const Page = ({ children, title }: PageProps) => {
  return (
    <div className="container max-w-md p-4 pb-8">
      <h1 className="text-lg text-center font-bold pb-4">{ title }</h1>
      { children }
    </div>
  );
};
