import { apiGet, apiPost, apiPut } from './psicoApi';
import type { PsicoAplicacionEmpleado, PsicoEmpleadoPerfil, PsicoEmpleadoResultados, PsicoPreguntaRespuesta, SaveRespuestasPayload } from '../types/psicoEmpleado.types';

export const psicoEmpleadoService = {
  perfil: (empleadoId: string | number) =>
    apiGet<PsicoEmpleadoPerfil>(`/psicosocial/empleados/${empleadoId}/perfil`),

  aplicaciones: (empleadoId: string | number) =>
    apiGet<{ empleado_id: number; aplicaciones: PsicoAplicacionEmpleado[] }>(`/psicosocial/empleados/${empleadoId}/aplicaciones`),

  aplicacionesDisponibles: (empleadoId: string | number) =>
    apiGet<{ empleado_id: number; aplicaciones: PsicoAplicacionEmpleado[] }>(`/psicosocial/empleados/${empleadoId}/aplicaciones-disponibles`),

  vincular: (empleadoId: string | number, aplicacionId: string | number) =>
    apiPost<{ ok: boolean }>(`/psicosocial/aplicaciones/${aplicacionId}/empleados/${empleadoId}/vincular`),

  respuestas: (empleadoId: string | number, evaluacionId: string | number) =>
    apiGet<{ empleado_id: number; evaluacion_id: number; preguntas: PsicoPreguntaRespuesta[] }>(`/psicosocial/evaluaciones/${evaluacionId}/empleados/${empleadoId}/respuestas`),

  guardarRespuestas: (empleadoId: string | number, evaluacionId: string | number, payload: SaveRespuestasPayload) =>
    apiPut<{ ok: boolean; respondidas: number; total: number }>(`/psicosocial/evaluaciones/${evaluacionId}/empleados/${empleadoId}/respuestas`, payload),

  finalizar: (empleadoId: string | number, evaluacionId: string | number) =>
    apiPost<{ ok: boolean }>(`/psicosocial/evaluaciones/${evaluacionId}/empleados/${empleadoId}/finalizar`),

  recalcular: (empleadoId: string | number, aplicacionId: string | number) =>
    apiPost<{ ok: boolean; processed?: unknown; scored?: unknown }>(`/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/recalcular`),

  resultados: (empleadoId: string | number, aplicacionId: string | number) =>
    apiGet<PsicoEmpleadoResultados>(`/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/resultados`),
};
