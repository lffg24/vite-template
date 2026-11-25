// src/pages/superadmin/SuperAdminPageHeader.tsx
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/shared/ui/PageHeader";
import type { IllustrationName } from "@/shared/ui/illustration";

export default function SuperAdminPageHeader({
  title,
  subtitle,
  action,
  icon,
  illustration,
  variant = "standard",
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
  illustration?: IllustrationName;
  variant?: "standard" | "dark-illustrated";
}) {
  return (
    <PageHeader
      antetitulo="Administración global"
      titulo={title}
      descripcion={subtitle}
      icono={icon}
      accion={action}
      variant={variant}
      illustration={illustration}
      className="mb-7"
    />
  );
}
