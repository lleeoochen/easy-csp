import type { ReactNode } from "react";
import { PullToRefresh } from "./PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

type PageProps = {
  children?: ReactNode
  title?: string
};

export const Page = ({ children, title }: PageProps) => {
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    // Refetch all queries to show loading states
    await queryClient.resetQueries();
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="container w-full md:w-96 p-4 pb-32 m-auto pt-[env(safe-area-inset-top)]">
      <h1 className="text-xl text-primary-fg text-center py-5">{ title }</h1>
      { children }
    </PullToRefresh>
  );
};
