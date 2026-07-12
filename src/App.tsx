// src/App.tsx
import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { Toaster } from "@/components/ui/toaster";

import ProtectedRoute from "@/routes/ProtectedRoute";
import { LEGACY_APP_ROUTES, routeByAccess } from "@/lib/accessRoutes";
import { useAuth } from "@/context/AuthContext";

const Login = lazy(() => import("@/pages/Login"));
const Logout = lazy(() => import("@/pages/Logout"));
const SinAcceso = lazy(() => import("@/pages/SinAcceso"));
const ResponderEvaluacion = lazy(() => import("@/pages/ResponderEvaluacion"));

const PsicologoLayout = lazy(() => import("@/layout/PsicologoLayout"));
const PsicologoDashboardPage = lazy(() => import("@/pages/psicosocial/PsicologoDashboardPage"));
const PsicologoPerfilPage = lazy(() => import("@/pages/psicosocial/PsicologoPerfilPage"));
const AplicacionesBTPage = lazy(() => import("@/pages/psicosocial/AplicacionesBTPage"));
const PsicoEvaluacionesPage = lazy(() => import("@/pages/psicosocial/PsicoEvaluacionesPage"));
const EmpresasPsicoPage = lazy(() => import("@/pages/psicosocial/EmpresasPsicoPage"));
const EmpresaPerfilPage = lazy(() => import("@/pages/psicosocial/EmpresaPerfilPage"));
const EmpresaEmpleadosPage = lazy(() => import("@/pages/psicosocial/EmpresaEmpleadosPage"));
const EmpresaAreasCargosPage = lazy(() => import("@/pages/psicosocial/EmpresaAreasCargosPage"));
const EmpresaAplicacionesPage = lazy(() => import("@/pages/psicosocial/EmpresaAplicacionesPage"));
const AplicacionDetallePage = lazy(() => import("@/pages/psicosocial/AplicacionDetallePage"));
const AplicacionResultadosPage = lazy(() => import("@/pages/psicosocial/AplicacionResultadosPage"));
const PsicoEmpleadoPerfilPage = lazy(() => import("@/pages/psicosocial/PsicoEmpleadoPerfilPage"));
const PsicoEmpleadoRespuestasPage = lazy(() => import("@/pages/psicosocial/PsicoEmpleadoRespuestasPage"));
const PsicoEmpleadoResultadosPage = lazy(() => import("@/pages/psicosocial/PsicoEmpleadoResultadosPage"));
const PsicoEmpleadoInformesPage = lazy(() => import("@/pages/psicosocial/PsicoEmpleadoInformesPage"));
const ReportesPsico = lazy(() => import("@/pages/ReportesPsico"));
const ReportesOficialesPsicoPage = lazy(() => import("@/pages/ReportesOficialesPsicoPage"));

const SuperAdminLayout = lazy(() => import("@/layout/SuperAdminLayout"));
const SuperAdminDashboardPage = lazy(() => import("@/pages/superadmin/SuperAdminDashboardPage"));
const SuperAdminEmpresasPage = lazy(() => import("@/pages/superadmin/SuperAdminEmpresasPage"));
const SuperAdminPsicologosPage = lazy(() => import("@/pages/superadmin/SuperAdminPsicologosPage"));
const SuperAdminCreditosPage = lazy(() => import("@/pages/superadmin/SuperAdminCreditosPage"));
const SuperAdminRolesPermisosPage = lazy(() => import("@/pages/superadmin/SuperAdminRolesPermisosPage"));
const SuperAdminAuditoriaPage = lazy(() => import("@/pages/superadmin/SuperAdminAuditoriaPage"));
const SuperAdminPlaceholderPage = lazy(() => import("@/pages/superadmin/SuperAdminPlaceholderPage"));

function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-sm font-semibold text-slate-500">
      Cargando módulo...
    </div>
  );
}

function AccessRedirect() {
  const { roles, permissions } = useAuth();
  return <Navigate to={routeByAccess(roles, permissions)} replace />;
}

function App() {
  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/logout" element={<Logout />} />

          {/* Rutas piloto dadas de baja: se redirigen al módulo permitido del usuario. */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<AccessRedirect />} />
            <Route path="/sin-acceso" element={<SinAcceso />} />
            {LEGACY_APP_ROUTES.map((path) => (
              <Route key={path} path={`${path}/*`} element={<AccessRedirect />} />
            ))}
          </Route>


          {/* Privadas con layout SuperAdmin ABRIL360 */}
          <Route element={<ProtectedRoute requireRole={["SUPER_ADMIN", "SUPERADMIN"]} />}>
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboardPage />} />
              <Route path="empresas" element={<SuperAdminEmpresasPage />} />
              <Route path="psicologos" element={<SuperAdminPsicologosPage />} />
              <Route path="creditos" element={<SuperAdminCreditosPage />} />
              <Route path="roles-permisos" element={<SuperAdminRolesPermisosPage />} />
              <Route path="auditoria" element={<SuperAdminAuditoriaPage />} />
              <Route path="planes" element={<SuperAdminPlaceholderPage title="Planes y suscripciones" />} />
              <Route path="configuracion" element={<SuperAdminPlaceholderPage title="Configuración global" />} />
            </Route>
          </Route>

          {/* Privadas con layout nuevo de psicólogo */}
          <Route
            element={
              <ProtectedRoute
                requirePermission={[
                  "psico.dashboard.view",
                  "psico.aplicaciones.view",
                  "psico.resultados.global.view",
                ]}
              />
            }
          >
            <Route path="/psicosocial" element={<PsicologoLayout />}>
              <Route
                index
                element={<Navigate to="/psicosocial/dashboard" replace />}
              />

              <Route path="dashboard" element={<PsicologoDashboardPage />} />
              <Route path="perfil" element={<PsicologoPerfilPage />} />
              <Route path="aplicaciones-bt" element={<AplicacionesBTPage />} />
              <Route path="aplicaciones" element={<Navigate to="/psicosocial/aplicaciones-bt" replace />} />
              <Route path="baterias" element={<Navigate to="/psicosocial/aplicaciones-bt" replace />} />
              <Route path="evaluaciones" element={<PsicoEvaluacionesPage />} />

              <Route path="empresas" element={<EmpresasPsicoPage />} />
              <Route path="empresas/:empresaId" element={<EmpresaPerfilPage />} />
              <Route
                path="empresas/:empresaId/areas-cargos"
                element={<EmpresaAreasCargosPage />}
              />
              <Route
                path="empresas/:empresaId/empleados"
                element={<EmpresaEmpleadosPage />}
              />
              <Route
                path="empresas/:empresaId/aplicaciones"
                element={<EmpresaAplicacionesPage />}
              />
              <Route
                path="empresas/:empresaId/aplicaciones/:aplicacionId"
                element={<AplicacionDetallePage />}
              />
              <Route
                path="empresas/:empresaId/aplicaciones/:aplicacionId/resultados"
                element={<AplicacionResultadosPage />}
              />

              <Route
                path="empleados/:empleadoId"
                element={<PsicoEmpleadoPerfilPage />}
              />
              <Route
                path="empleados/:empleadoId/aplicaciones/:aplicacionId/respuestas"
                element={<PsicoEmpleadoRespuestasPage />}
              />
              <Route
                path="empleados/:empleadoId/aplicaciones/:aplicacionId/resultados"
                element={<PsicoEmpleadoResultadosPage />}
              />
              <Route
                path="empleados/:empleadoId/aplicaciones/:aplicacionId/informes"
                element={<PsicoEmpleadoInformesPage />}
              />

              <Route path="resultados" element={<ReportesPsico />} />
              <Route path="reportes" element={<ReportesPsico />} />
              <Route path="reportes-oficiales" element={<ReportesOficialesPsicoPage />} />
              <Route path="informes" element={<ReportesOficialesPsicoPage />} />
            </Route>
          </Route>

          {/* Ruta sin sidebar, pero protegida */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/evaluacion/:id/responder"
              element={<ResponderEvaluacion />}
            />
            <Route
              path="/responder-evaluacion/:evaluacionId"
              element={<ResponderEvaluacion />}
            />
            <Route
              path="/evaluaciones/:evaluacionId/responder"
              element={<ResponderEvaluacion />}
            />
            <Route
              path="/responder/:evaluacionId"
              element={<ResponderEvaluacion />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>

      <Toaster />
    </Router>
  );
}

export default App;
