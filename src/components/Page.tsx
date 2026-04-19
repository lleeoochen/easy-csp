import type { ReactNode } from "react";
import { PullToRefresh } from "./PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

type PageProps = {
  children?: ReactNode
  title?: string
  maxWidth?: 'half' | 'full' | 'cozy'
};

export const Page = ({ children, title, maxWidth = 'half' }: PageProps) => {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    // Refetch all queries to show loading states
    await queryClient.resetQueries();
  };

  const widthClasses = {
    full: 'w-full',
    half: 'w-full lg:w-2/3',
    cozy: 'w-full lg:w-1/3'
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className={`container ${widthClasses[maxWidth]} p-4 pb-24 m-auto pt-[env(safe-area-inset-top)]`}>
      <h1 className="text-xl text-primary-fg text-center py-5">{ title }</h1>
      { children }
    </PullToRefresh>
  );
};
