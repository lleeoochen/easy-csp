import type { ReactNode } from "react";
import { PullToRefresh } from "./PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "./common/button";

type PageProps = {
  children?: ReactNode
  title?: string
  maxWidth?: 'half' | 'full' | 'cozy'
  showBack?: boolean
  actions?: ReactNode
};

export const Page = ({ children, title, maxWidth = 'half', showBack = false, actions }: PageProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleRefresh = async () => {
    // Refetch all queries to show loading states
    await queryClient.resetQueries();
  };

  const widthClasses = {
    full: 'w-full md:w-6/7',
    half: 'w-full md:w-2/3',
    cozy: 'w-full md:w-1/3'
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className={`p-4 pb-24 pt-[env(safe-area-inset-top)] w-full`}>
      <h1 className={`text-2xl my-5 text-primary-fg text-center py-5`}>{ title }</h1>
      <div className={`${widthClasses[maxWidth]} m-auto mb-14`}>
        {(showBack || actions) && (
          <div className="mb-6 flex items-start">
            {showBack && (
              <Button
                variant="secondary"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-primary-fg hover:text-primary-fg/80 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back</span>
              </Button>
            )}
            {actions && (
              <div className="flex gap-2 ml-auto">
                {actions}
              </div>
            )}
          </div>
        )}
        { children }
      </div>
    </PullToRefresh>
  );
};
