// Integra este patrón dentro de la tabla actual de participantes.
// Reemplaza el texto plano del participante por el botón/link de abajo.

import { useNavigate } from 'react-router-dom';

export function ParticipantNameCell({ row }: { row: { empleado_id: number; nombre_completo?: string; cedula: string } }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/psicosocial/empleados/${row.empleado_id}`)}
      className="text-left"
      title="Ver perfil del empleado"
    >
      <span className="block font-bold text-slate-950 underline-offset-4 hover:text-violet-700 hover:underline">
        {row.nombre_completo || `Colaborador ${row.cedula.slice(-4)} Demo`}
      </span>
      <span className="block text-xs text-slate-500">CC {row.cedula}</span>
    </button>
  );
}
