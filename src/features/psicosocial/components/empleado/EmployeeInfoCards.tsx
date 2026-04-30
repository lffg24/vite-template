import type { PsicoEmpleadoPerfil } from '../../types/psicoEmpleado.types';
import { InfoField } from './InfoField';

export function EmployeeInfoCards({ perfil }: { perfil: PsicoEmpleadoPerfil }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <CardTitle number="1" title="Información personal" />
        <InfoField label="Nombre completo" value={perfil.nombre_completo} />
        <InfoField label="Tipo documento" value="Cédula de ciudadanía" />
        <InfoField label="Número documento" value={perfil.cedula} />
        <InfoField label="Edad" value={perfil.edad ? `${perfil.edad} años` : undefined} />
        <InfoField label="Sexo / género" value={perfil.sexo || perfil.genero} />
        <InfoField label="Estado civil" value={perfil.estado_civil} />
        <InfoField label="Correo" value={perfil.correo} />
        <InfoField label="Teléfono" value={perfil.telefono} />
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <CardTitle number="2" title="Información sociodemográfica" />
        <InfoField label="Nivel de estudios" value={perfil.nivel_estudios} />
        <InfoField label="Ocupación / profesión" value={perfil.ocupacion} />
        <InfoField label="Ciudad residencia" value={perfil.ciudad_residencia} />
        <InfoField label="Departamento residencia" value={perfil.departamento_residencia} />
        <InfoField label="Estrato" value={perfil.estrato} />
        <InfoField label="Tipo de vivienda" value={perfil.tipo_vivienda} />
        <InfoField label="Personas dependientes" value={perfil.personas_dependen} />
      </section>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <CardTitle number="3" title="Información laboral" />
        <InfoField label="Ciudad de trabajo" value={perfil.ciudad_trabajo} />
        <InfoField label="Departamento trabajo" value={perfil.departamento_trabajo} />
        <InfoField label="Área / sección" value={perfil.area} />
        <InfoField label="Cargo" value={perfil.cargo} />
        <InfoField label="Tipo de cargo" value={perfil.tipo_cargo} />
        <InfoField label="Tipo de contrato" value={perfil.tipo_contrato} />
        <InfoField label="Horas diarias" value={perfil.horas_diarias ? `${perfil.horas_diarias} horas` : undefined} />
        <InfoField label="Tipo salario" value={perfil.tipo_salario} />
        <InfoField label="Antigüedad empresa" value={perfil.antiguedad_empresa_anios != null ? `${perfil.antiguedad_empresa_anios} años` : undefined} />
        <InfoField label="Antigüedad cargo" value={perfil.antiguedad_cargo_anios != null ? `${perfil.antiguedad_cargo_anios} años` : undefined} />
      </section>
    </div>
  );
}

function CardTitle({ number, title }: { number: string; title: string }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">{number}</span>
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
    </div>
  );
}
