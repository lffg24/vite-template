import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import RegistroUsuarios from "./pages/RegistroUsuarios";
import GestionCargos from "./pages/GestionCargos";
import GestionEvaluaciones from "./pages/GestionEvaluaciones";
import GestionPreguntas from "./pages/GestionPreguntas";
import EvaluacionesAsignadas from "./pages/EvaluacionesAsignadas";
import ResponderEvaluacion from "./pages/ResponderEvaluacion";

import { Toaster } from "@/components/ui/toaster";
import Layout from "@/layout/Layout";
import PsicologoLayout from "@/layout/PsicologoLayout";

import Logout from "@/pages/Logout";
import Login from "@/pages/Login";
import ProtectedRoute from "@/routes/ProtectedRoute";
import ReportesPsico from "@/pages/ReportesPsico";

import PsicoEmpleadoPerfilPage from "@/pages/psicosocial/PsicoEmpleadoPerfilPage";
import PsicoEmpleadoRespuestasPage from "@/pages/psicosocial/PsicoEmpleadoRespuestasPage";
import PsicoEmpleadoResultadosPage from "@/pages/psicosocial/PsicoEmpleadoResultadosPage";

import PsicologoPerfilPage from "@/pages/psicosocial/PsicologoPerfilPage";
import PsicologoDashboardPage from "@/pages/psicosocial/PsicologoDashboardPage";

import EmpresasPsicoPage from "@/pages/psicosocial/EmpresasPsicoPage";
import EmpresaPerfilPage from "@/pages/psicosocial/EmpresaPerfilPage";
import EmpresaEmpleadosPage from "@/pages/psicosocial/EmpresaEmpleadosPage";
import EmpresaAplicacionesPage from "@/pages/psicosocial/EmpresaAplicacionesPage";
import AplicacionResultadosPage from "@/pages/psicosocial/AplicacionResultadosPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />

        {/* Privadas con layout histórico/base */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/usuarios" replace />} />

            <Route path="usuarios" element={<RegistroUsuarios />} />
            <Route path="registro-usuarios" element={<RegistroUsuarios />} />
            <Route path="cargos" element={<GestionCargos />} />
            <Route path="evaluaciones" element={<GestionEvaluaciones />} />
            <Route path="preguntas" element={<GestionPreguntas />} />
            <Route
              path="evaluaciones/:id/preguntas"
              element={<GestionPreguntas />}
            />
            <Route
              path="mis-evaluaciones"
              element={<EvaluacionesAsignadas />}
            />
            <Route
              path="evaluaciones-asignadas"
              element={<EvaluacionesAsignadas />}
            />

            {/* Compatibilidad con dashboard anterior */}
            <Route path="reportes/psico" element={<ReportesPsico />} />
          </Route>
        </Route>

        {/* Privadas con layout nuevo de psicólogo */}
        <Route element={<ProtectedRoute />}>
          <Route path="/psicosocial" element={<PsicologoLayout />}>
            <Route
              index
              element={<Navigate to="/psicosocial/dashboard" replace />}
            />

            <Route path="dashboard" element={<PsicologoDashboardPage />} />
            <Route path="perfil" element={<PsicologoPerfilPage />} />

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

            {/* Reutilizamos dashboard actual dentro del layout de psicólogo */}
            <Route path="resultados" element={<ReportesPsico />} />
            <Route path="reportes" element={<ReportesPsico />} />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <Toaster />
    </Router>
  );
}

export default App;
