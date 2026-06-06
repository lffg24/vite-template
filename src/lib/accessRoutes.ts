const SUPERADMIN_ROLES = ["SUPER_ADMIN", "SUPERADMIN"];
const PSICO_ROLES = ["PSICOLOGO_EVALUADOR"];

export const NO_ACCESS_ROUTE = "/sin-acceso";

export const LEGACY_APP_ROUTES = [
  "/usuarios",
  "/registro-usuarios",
  "/cargos",
  "/evaluaciones",
  "/preguntas",
  "/mis-evaluaciones",
  "/evaluaciones-asignadas",
  "/reportes/psico",
  "/reportes/psico/oficiales",
  "/dashboard",
  "/configuracion",
];

function normalizedRoles(roles: string[]) {
  return new Set(roles.map((role) => role.toUpperCase()));
}

function hasAnyRole(roles: string[], required: string[]) {
  const roleSet = normalizedRoles(roles);
  return required.some((role) => roleSet.has(role.toUpperCase()));
}

function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission);
}

export function routeByAccess(roles: string[] = [], permissions: string[] = []) {
  if (hasAnyRole(roles, SUPERADMIN_ROLES) || hasPermission(permissions, "superadmin.dashboard.view")) {
    return "/superadmin/dashboard";
  }

  if (hasAnyRole(roles, PSICO_ROLES) || hasPermission(permissions, "psico.dashboard.view")) {
    return "/psicosocial/dashboard";
  }

  if (hasPermission(permissions, "psico.aplicaciones.view")) {
    return "/psicosocial/aplicaciones-bt";
  }

  if (hasPermission(permissions, "psico.resultados.global.view")) {
    return "/psicosocial/resultados";
  }

  return NO_ACCESS_ROUTE;
}

export function isLegacyAppRoute(path: string) {
  return LEGACY_APP_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

export function safeRedirectPath(path: unknown, roles: string[] = [], permissions: string[] = []) {
  const fallback = routeByAccess(roles, permissions);
  if (typeof path !== "string" || !path.startsWith("/")) return fallback;
  if (path === "/login" || path === "/logout") return fallback;
  if (isLegacyAppRoute(path)) return fallback;

  if (
    path.startsWith("/superadmin") &&
    !hasAnyRole(roles, SUPERADMIN_ROLES) &&
    !hasPermission(permissions, "superadmin.dashboard.view")
  ) {
    return fallback;
  }

  if (
    path.startsWith("/psicosocial") &&
    !hasAnyRole(roles, PSICO_ROLES) &&
    !hasPermission(permissions, "psico.dashboard.view") &&
    !hasPermission(permissions, "psico.aplicaciones.view") &&
    !hasPermission(permissions, "psico.resultados.global.view")
  ) {
    return fallback;
  }

  return path;
}
