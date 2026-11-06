import RoleSidebar from "@/features/navigation/components/RoleSidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffectiveNavigation } from "@/features/navigation/useEffectiveNavigation";

export default function PsicologoSidebar() {
  const { user } = useAuth();
  const menu = useEffectiveNavigation();
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
      items={menu.items}
      loading={menu.loading}
      error={menu.error}
      onRetry={menu.retry}
      tone="rel"
      storageKey="abril360.psico.sidebar.collapsed"
      brandTitle="ABRIL360"
      brandSubtitle="Riesgo psicosocial"
      avatarText={initials}
      userTitle={displayName}
      userSubtitle="Gestión psicosocial"
      navLabel="Navegación psicosocial"
    />
  );
}
