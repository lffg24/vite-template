import {
  BarChart3, BookOpen, Building2, CircleHelp, ClipboardCheck, ClipboardList,
  CreditCard, FileBadge, FileText, Gauge, KeyRound, Layers3, Link2,
  Send, ShieldCheck, Users, UsersRound, type LucideIcon,
} from "lucide-react";

export type NavigationItem = { label: string; icon: LucideIcon; to: string };
export type NavigationGroup = { label: string; icon: LucideIcon; children: NavigationItem[] };
export type NavigationEntry = NavigationItem | NavigationGroup;

const groups: NavigationGroup[] = [
  { label: "Administración", icon: ShieldCheck, children: [
    { label: "Inicio", to: "/superadmin/dashboard", icon: Gauge },
    { label: "Empresas", to: "/superadmin/empresas", icon: Building2 },
    { label: "Psicólogos", to: "/superadmin/psicologos", icon: UsersRound },
    { label: "Créditos", to: "/superadmin/creditos", icon: CreditCard },
    { label: "Usuarios", to: "/superadmin/usuarios", icon: Users },
    { label: "Roles y permisos", to: "/superadmin/roles-permisos", icon: KeyRound },
    { label: "Auditoría", to: "/superadmin/auditoria", icon: ClipboardList },
  ] },
  { label: "Riesgo psicosocial", icon: Layers3, children: [
    { label: "Inicio", to: "/psicosocial/dashboard", icon: Gauge },
    { label: "Empresas", to: "/psicosocial/empresas", icon: Building2 },
    { label: "Aplicaciones BT", to: "/psicosocial/aplicaciones-bt", icon: Layers3 },
    { label: "Resultados", to: "/psicosocial/resultados", icon: BarChart3 },
    { label: "Informes", to: "/psicosocial/reportes-oficiales", icon: FileText },
    { label: "Centro de ayuda", to: "/psicosocial/centro-ayuda", icon: CircleHelp },
    { label: "Mi perfil", to: "/psicosocial/perfil", icon: Users },
  ] },
  { label: "Capacitación", icon: BookOpen, children: [
    { label: "Inicio", to: "/capacitaciones/inicio", icon: Gauge },
    { label: "Catálogo", to: "/capacitaciones/cursos", icon: BookOpen },
    { label: "Asignaciones", to: "/capacitaciones/asignaciones", icon: Users },
    { label: "Participantes", to: "/capacitaciones/participantes", icon: UsersRound },
    { label: "Invitaciones", to: "/capacitaciones/invitaciones", icon: Send },
    { label: "Enlaces de grupo", to: "/capacitaciones/enlaces", icon: Link2 },
    { label: "Constancias", to: "/capacitaciones/constancias", icon: FileBadge },
    { label: "Estado del módulo", to: "/capacitaciones/estado", icon: ShieldCheck },
  ] },
  { label: "Evaluaciones", icon: ClipboardCheck, children: [
    { label: "Banco de evaluaciones", to: "/evaluaciones", icon: ClipboardCheck },
  ] },
];

export function projectNavigation(destinations: string[]): NavigationEntry[] {
  const allowed = new Set(destinations);
  return groups.flatMap((group): NavigationEntry[] => {
    const children = group.children.filter((child) => allowed.has(child.to));
    if (children.length === 0) return [];
    if (children.length === 1) return [children[0]];
    return [{ ...group, children }];
  });
}
