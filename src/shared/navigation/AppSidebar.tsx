import { NavLink } from "react-router-dom";
import type { NavigationItem } from "./navigation.types";

type AppSidebarProps = {
  items: NavigationItem[];
  brand?: React.ReactNode;
  userBlock?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
};

export function AppSidebar({ items, brand, userBlock, footer, className = "" }: AppSidebarProps) {
  return (
    <aside className={`h-screen w-[280px] bg-slate-950 text-white flex flex-col ${className}`}>
      <div className="p-6">{brand}</div>

      {userBlock ? <div className="px-5 pb-5">{userBlock}</div> : null}

      <nav className="flex-1 px-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              {Icon ? <Icon className="h-5 w-5" /> : null}
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {footer ? <div className="p-5">{footer}</div> : null}
    </aside>
  );
}
