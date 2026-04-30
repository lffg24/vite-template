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
import Logout from "@/pages/Logout";

import Login from "@/pages/Login";
import ProtectedRoute from "@/routes/ProtectedRoute";

import PsicoEmpleadoPerfilPage from "./pages/psicosocial/PsicoEmpleadoPerfilPage";
import PsicoEmpleadoRespuestasPage from "./pages/psicosocial/PsicoEmpleadoRespuestasPage";
import PsicoEmpleadoResultadosPage from "./pages/psicosocial/PsicoEmpleadoResultadosPage";

import ReportesPsico from "@/pages/ReportesPsico";

function App() {
  return (
    <Router>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} /> {/* ← nueva */}
        {/* Privadas con sidebar */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/usuarios" />} />
            <Route path="usuarios" element={<RegistroUsuarios />} />
            <Route path="cargos" element={<GestionCargos />} />
            <Route path="evaluaciones" element={<GestionEvaluaciones />} />
            <Route
              path="evaluaciones/:id/preguntas"
              element={<GestionPreguntas />}
            />
            <Route
              path="mis-evaluaciones"
              element={<EvaluacionesAsignadas />}
            />

            <Route path="reportes/psico" element={<ReportesPsico />} />
          </Route>
        </Route>
        {/* Ruta sin sidebar, pero protegida */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/evaluacion/:id/responder"
            element={<ResponderEvaluacion />}
          />
        </Route>
      </Routes>

      <Toaster />
    </Router>
  );
}

export default App;
