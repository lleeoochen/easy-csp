import { HashRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import type { ComponentType, ReactNode } from "react";
import { cn } from "./common/utils";
import type { LucideProps } from "lucide-react";


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
      <span className="text-[10px] mt-1">{name}</span>
    </Link>
  );
}

export const Tabs = ({ paths }: TabsProps) => {
  // Filter paths for navigation display
  const navPaths = paths.filter(p => p.showInNav);

  return (
    <Router>
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
        <nav className="fixed grid grid-cols-5 bottom-5 left-0 right-0 bg-tabs-bar-bg z-10 backdrop-blur-lg rounded-2xl shadow-xl/30 w-fit mx-5 mb-[env(safe-area-inset-bottom)]">
          {
            navPaths.map(path => (
              <TabMenuItem key={path.path} {...path} />
            ))
          }
        </nav>
      </div>
    </Router>
  );
}