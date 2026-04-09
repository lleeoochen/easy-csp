import type { ReactNode } from "react";
import { PullToRefresh } from "./PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

type PageProps = {
  children?: ReactNode
  title?: string
  maxWidth?: 'mobile' | 'half' | 'full' | 'half-xl'
};

export const Page = ({ children, title, maxWidth = 'half' }: PageProps) => {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    // Refetch all queries to show loading states
    await queryClient.resetQueries();
  };

  const widthClasses = {
    mobile: 'w-full md:w-96',
    half: 'w-full md:w-96 lg:w-1/2',
    full: 'w-full',
    'half-xl': 'w-full md:w-96 lg:w-full xl:w-1/2'
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className={`container ${widthClasses[maxWidth]} p-4 pb-24 m-auto pt-[env(safe-area-inset-top)]`}>
      <h1 className="text-xl text-primary-fg text-center py-5">{ title }</h1>
      { children }
    </PullToRefresh>
  );
};
