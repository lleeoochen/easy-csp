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
          "flex flex-col flex-1 items-center py-2 px-2 rounded-2xl hover:bg-white/50 transition duration-200", {
            "font-bold": isActive,
            "bg-gray-300/70 shadow-2xl": isActive
          }
        )
      }
    >
      <IconElement className="w-5 h-5" strokeWidth={strokeWidth}/>
      <span className="text-xs mt-1">{ name }</span>
    </Link>
  );
}

export const Tabs = ({ paths }: TabsProps) => {
  
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pb-16">
          <Routes>
            {
              paths.map(({ path, element }) => {
                return <Route path={path} element={element} />;
              })
            }
          </Routes>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed flex bottom-5 left-5 right-5 bg-white/20 z-10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30">
          {
            paths.map(path => (
              <TabMenuItem {...path} />
            ))
          }
        </nav>
      </div>
    </Router>
  );
}