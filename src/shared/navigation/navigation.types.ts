import type { LucideIcon } from "lucide-react";

export type NavigationScope = "platform" | "psicosocial" | "empresa" | "empleado";

export type NavigationItem = {
  id: string;
  label: string;
  path: string;
  icon?: LucideIcon;
  scope: NavigationScope;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  children?: NavigationItem[];
};
