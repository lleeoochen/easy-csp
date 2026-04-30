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
    full: 'w-full lg:w-3/4',
    half: 'w-full lg:w-1/2',
    cozy: 'w-full lg:w-1/3'
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className={`p-4 pb-24 pt-[env(safe-area-inset-top)] w-full`}>
      <h1 className={`text-2xl my-5 text-primary-fg text-center py-5`}>{ title }</h1>
      <div className={`${widthClasses[maxWidth]} m-auto`}>
        { children }
      </div>
    </PullToRefresh>
  );
};
