import { HashRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import type { ComponentType, ReactNode } from "react";
import { cn } from "./common/utils";
import type { LucideProps } from "lucide-react";
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { useMediaQuery } from '@/hooks/useMediaQuery';


type TabsProps = {
  paths: {
    path: string;
    name: string;
    element: ReactNode
    icon: ComponentType<LucideProps>
    showInNav: boolean
  }[]
};

type TabMenuItemProps = {
  path: string;
  name: string;
  icon: ComponentType<LucideProps>
};

export const TabMenuItem = ({ path, icon, name }: TabMenuItemProps) => {
  const IconElement = icon;
  const location = useLocation();
  const isActive = location.pathname === path;
  const strokeWidth = isActive ? 2 : 1.5;

  return (
    <Link
      to={path}
      className={
        cn(
          "flex flex-col items-center py-2 px-2 rounded-2xl text-tabs-bar-fg hover:bg-white/50 transition duration-200", {
            "bg-tabs-bar-active-bg text-tabs-bar-active-fg": isActive
          }
        )
      }
    >
      <IconElement className="size-7" strokeWidth={strokeWidth}/>
      <span className="text-xs mt-1">{name}</span>
    </Link>
  );
}

const TabsContent = ({ paths }: TabsProps) => {
  const location = useLocation();
  // Filter paths for navigation display
  const navPaths = paths.filter(p => p.showInNav);
  const isDesktop = useMediaQuery('(min-width: 768px)'); // md breakpoint
  const shouldShowNav = useHideOnScroll(50, location.pathname) || isDesktop;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <main className="flex-1 pb-0 w-full overflow-hidden">
        <Routes>
          {
            paths.map(({ path, element }) => {
              return <Route key={path} path={path} element={element} />;
            })
          }
        </Routes>
      </main>

      {/* Bottom Navigation */}
      <nav className={cn(
        "fixed grid grid-cols-5 bottom-5 left-5 right-5 bg-tabs-bar-bg z-10 backdrop-blur-lg rounded-2xl shadow-xl/30 mx-auto mb-[env(safe-area-inset-bottom)] transition-transform duration-300 w-4/5 md:w-fit",
        !shouldShowNav && "translate-y-[calc(100%+1.25rem+env(safe-area-inset-bottom))]"
      )}>
        {
          navPaths.map(path => (
            <TabMenuItem key={path.path} {...path} />
          ))
        }
      </nav>
    </div>
  );
}

export const Tabs = ({ paths }: TabsProps) => {
  return (
    <Router>
      <TabsContent paths={paths} />
    </Router>
  );
}