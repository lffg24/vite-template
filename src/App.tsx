// src/App.tsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import ResponderEvaluacion from "./pages/ResponderEvaluacion";

import { Toaster } from "@/components/ui/toaster";
import PsicologoLayout from "@/layout/PsicologoLayout";

import Logout from "@/pages/Logout";
import Login from "@/pages/Login";
import SinAcceso from "@/pages/SinAcceso";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ReportesPsico from "@/pages/ReportesPsico";
import ReportesOficialesPsicoPage from "@/pages/ReportesOficialesPsicoPage";
import { LEGACY_APP_ROUTES, routeByAccess } from "@/lib/accessRoutes";
import { useAuth } from "@/context/AuthContext";

import PsicoEmpleadoPerfilPage from "@/pages/psicosocial/PsicoEmpleadoPerfilPage";
import PsicoEmpleadoRespuestasPage from "@/pages/psicosocial/PsicoEmpleadoRespuestasPage";
import PsicoEmpleadoResultadosPage from "@/pages/psicosocial/PsicoEmpleadoResultadosPage";

import PsicologoPerfilPage from "@/pages/psicosocial/PsicologoPerfilPage";
import PsicologoDashboardPage from "@/pages/psicosocial/PsicologoDashboardPage";

import EmpresasPsicoPage from "@/pages/psicosocial/EmpresasPsicoPage";
import EmpresaPerfilPage from "@/pages/psicosocial/EmpresaPerfilPage";
import EmpresaEmpleadosPage from "@/pages/psicosocial/EmpresaEmpleadosPage";
import EmpresaAplicacionesPage from "@/pages/psicosocial/EmpresaAplicacionesPage";
import AplicacionDetallePage from "@/pages/psicosocial/AplicacionDetallePage";
import AplicacionResultadosPage from "@/pages/psicosocial/AplicacionResultadosPage";
import PsicoEvaluacionesPage from "@/pages/psicosocial/PsicoEvaluacionesPage";
import AplicacionesBTPage from "@/pages/psicosocial/AplicacionesBTPage";

import SuperAdminLayout from "@/layout/SuperAdminLayout";
import SuperAdminDashboardPage from "@/pages/superadmin/SuperAdminDashboardPage";
import SuperAdminEmpresasPage from "@/pages/superadmin/SuperAdminEmpresasPage";
import SuperAdminPsicologosPage from "@/pages/superadmin/SuperAdminPsicologosPage";
import SuperAdminCreditosPage from "@/pages/superadmin/SuperAdminCreditosPage";
import SuperAdminRolesPermisosPage from "@/pages/superadmin/SuperAdminRolesPermisosPage";
import SuperAdminAuditoriaPage from "@/pages/superadmin/SuperAdminAuditoriaPage";
import SuperAdminPlaceholderPage from "@/pages/superadmin/SuperAdminPlaceholderPage";

function AccessRedirect() {
  const { roles, permissions } = useAuth();
  return <Navigate to={routeByAccess(roles, permissions)} replace />;
}

function App() {
  return (
    <Router>
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

      <Toaster />
    </Router>
  );
}

export default App;
