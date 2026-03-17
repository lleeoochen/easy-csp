import type { ReactNode } from "react";

type PageProps = {
  children?: ReactNode
  title?: string
};

export const Page = ({ children, title }: PageProps) => {
  return (
    <div className="container w-full md:w-96 p-4 pb-8 m-auto">
      <h1 className="text-xl text-center py-5">{ title }</h1>
      { children }
    </div>
  );
};
