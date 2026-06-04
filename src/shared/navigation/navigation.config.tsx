import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  ClipboardList,
  FileText,
  Settings,
  BarChart3,
} from "lucide-react";
import type { NavigationItem } from "./navigation.types";

export const APP_NAVIGATION: NavigationItem[] = [
  {
    id: "superadmin.dashboard",
    label: "Dashboard",
    path: "/superadmin",
    icon: LayoutDashboard,
    scope: "platform",
    requiredRoles: ["SUPER_ADMIN"],
  },
  {
    id: "superadmin.empresas",
    label: "Empresas",
    path: "/superadmin/empresas",
    icon: Building2,
    scope: "platform",
    requiredRoles: ["SUPER_ADMIN"],
  },
  {
    id: "superadmin.psicologos",
    label: "Psicólogos",
    path: "/superadmin/psicologos",
    icon: Users,
    scope: "platform",
    requiredRoles: ["SUPER_ADMIN"],
  },
  {
    id: "superadmin.creditos",
    label: "Créditos",
    path: "/superadmin/creditos",
    icon: CreditCard,
    scope: "platform",
    requiredRoles: ["SUPER_ADMIN"],
  },
  {
    id: "superadmin.rbac",
    label: "Roles y permisos",
    path: "/superadmin/roles-permisos",
    icon: ShieldCheck,
    scope: "platform",
    requiredRoles: ["SUPER_ADMIN"],
  },
  {
    id: "superadmin.auditoria",
    label: "Auditoría",
    path: "/superadmin/auditoria",
    icon: ClipboardList,
    scope: "platform",
    requiredRoles: ["SUPER_ADMIN"],
  },
  {
    id: "psico.aplicaciones",
    label: "Aplicaciones BT",
    path: "/psicosocial/aplicaciones-bt",
    icon: FileText,
    scope: "psicosocial",
    requiredPermissions: ["psico.aplicaciones.view"],
  },
  {
    id: "psico.resultados",
    label: "Resultados",
    path: "/psicosocial/resultados",
    icon: BarChart3,
    scope: "psicosocial",
    requiredPermissions: ["psico.resultados.global.view"],
  },
  {
    id: "settings",
    label: "Configuración",
    path: "/configuracion",
    icon: Settings,
    scope: "empresa",
  },
];

export function filterNavigation(
  items: NavigationItem[],
  roles: string[] = [],
  permissions: string[] = [],
  scopes?: string[],
): NavigationItem[] {
  const roleSet = new Set(roles.map((r) => r.toUpperCase()));
  const permSet = new Set(permissions);

  return items
    .filter((item) => {
      if (scopes?.length && !scopes.includes(item.scope)) return false;

      const roleOk =
        !item.requiredRoles?.length ||
        item.requiredRoles.some((role) => roleSet.has(role.toUpperCase()));

      const permOk =
        !item.requiredPermissions?.length ||
        item.requiredPermissions.some((permission) => permSet.has(permission));

      return roleOk && permOk;
    })
    .map((item) => ({
      ...item,
      children: item.children
        ? filterNavigation(item.children, roles, permissions, scopes)
        : undefined,
    }));
}
