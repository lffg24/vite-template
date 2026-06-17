import {
  BarChart3,
  Building2,
  FileText,
  Home,
  Layers3,
  Settings,
} from "lucide-react";
import RoleSidebar from "@/features/navigation/components/RoleSidebar";
import { useAuth } from "@/context/AuthContext";

const items = [
  { label: "Dashboard", to: "/psicosocial/dashboard", icon: Home },
  { label: "Empresas", to: "/psicosocial/empresas", icon: Building2 },
  { label: "Aplicaciones BT", to: "/psicosocial/aplicaciones-bt", icon: Layers3 },
  { label: "Resultados", to: "/psicosocial/resultados", icon: BarChart3 },
  { label: "Informes", to: "/psicosocial/reportes-oficiales", icon: FileText },
  { label: "Configuración", to: "/psicosocial/perfil", icon: Settings },
];

export default function PsicologoSidebar() {
  const { user } = useAuth();
  const displayName = user?.nombre?.trim() || "Usuario Abril360";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "PS";

  return (
    <RoleSidebar
      items={items}
      storageKey="abril360.psico.sidebar.collapsed"
      brandTitle="ABRIL-360"
      brandSubtitle="Riesgo psicosocial"
      avatarText={initials}
      userTitle={displayName}
      userSubtitle="Gestión psicosocial"
      navLabel="Navegación psicosocial"
    />
  );
}
