import { Outlet, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Home,
  ClipboardList,
  Users,
  Briefcase,
  Settings,
  ListTodo,
  Menu,
  X,
  PanelLeftOpen,
  PanelRightOpen,
  BarChart2, // 👈 nuevo icono para Reportes
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Layout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: Home, path: "/dashboard" },
    { name: "Evaluaciones", icon: ClipboardList, path: "/evaluaciones" },
    { name: "Usuarios", icon: Users, path: "/usuarios" },
    { name: "Cargos", icon: Briefcase, path: "/cargos" },
    { name: "Mis Evaluaciones", icon: ListTodo, path: "/mis-evaluaciones" },
    // 👇 nuevo ítem del menú
    { name: "Reportes", icon: BarChart2, path: "/reportes/psico" },
    { name: "Configuración", icon: Settings, path: "/configuracion" },
  ];

  return (
    <div className="h-screen flex flex-col">
      <div className="flex h-full">
        {/* Sidebar en desktop */}
        {isDesktop && (
          <aside
            className={cn(
              "flex flex-col bg-white border-r transition-all duration-300 h-full",
              collapsed ? "w-16" : "w-64"
            )}
          >
            <div className="flex items-center justify-center h-16 font-bold text-lg">
              {!collapsed && "EvalPro 360"}
            </div>
            <nav className="flex-1 overflow-y-auto">
              <ul className="flex flex-col space-y-1 p-2">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center p-2 rounded-md hover:bg-gray-100 transition",
                        location.pathname.startsWith(item.path) &&
                          "bg-gray-200 font-semibold"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span className="ml-3">{item.name}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 text-sm text-gray-500">
              {!collapsed && (
                <>
                  <div className="font-semibold">Maria Gonzalez</div>
                  <div className="text-xs">mconf@gmail.com</div>
                </>
              )}
            </div>
          </aside>
        )}

        {/* Drawer en mobile */}
        {!isDesktop && mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex">
            <div className="w-64 bg-white flex flex-col border-r">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-lg">EvalPro 360</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto">
                <ul className="flex flex-col space-y-1 p-2">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.path}
                        className="flex items-center p-2 rounded-md hover:bg-gray-100 transition"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="ml-3">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div
              className="flex-1 bg-black/40"
              onClick={() => setMobileMenuOpen(false)}
            />
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          <Outlet />
        </main>
      </div>

      {/* Botón flotante siempre visible */}
      <button
        onClick={() =>
          isDesktop ? setCollapsed(!collapsed) : setMobileMenuOpen(true)
        }
        className={cn(
          "fixed top-4 transition-all duration-300 z-50 rounded-full bg-muted p-2 shadow",
          isDesktop ? (collapsed ? "left-16" : "left-64") : "left-4"
        )}
      >
        {isDesktop ? (
          collapsed ? (
            <PanelRightOpen className="h-5 w-5" />
          ) : (
            <PanelLeftOpen className="h-5 w-5" />
          )
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
