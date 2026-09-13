// src/layout/CapacitacionesLayout.tsx
//
// Shell del módulo, sobre `RoleSidebar` — el mismo componente que usa
// Psicosocial.
//
// Aquí había antes una barra horizontal propia, con este razonamiento escrito:
// «`RoleSidebar` es compartido y meterle un caso más lo volvería el sitio donde
// se acumulan las excepciones de todos los módulos». El razonamiento se
// sostiene; el resultado no. Capacitaciones acabó pareciendo otro producto
// abierto en la misma pestaña: barra arriba en vez de al lado, sin plegar y sin
// recordar si estaba plegada.
//
// Y resulta que no hacía falta ninguna excepción: `RoleSidebar` recibe la lista
// de entradas ya filtrada, así que el módulo decide qué se ve y el componente
// solo lo pinta. No se le añadió ni un parámetro.

import { Outlet } from "react-router-dom";
import {
  BookOpen,
  ClipboardCheck,
  FileBadge,
  Link2,
  Send,
  ShieldCheck,
  Users,
  Users2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import RoleSidebar, {
  type RoleSidebarItem,
} from "@/features/navigation/components/RoleSidebar";
import {
  ProveedorCapacitaciones,
  useCapacitaciones,
} from "@/features/capacitaciones/ContextoCapacitaciones";
import type { ContextoCapacidades } from "@/types/capacitaciones";

type EntradaDelMenu = RoleSidebarItem & {
  visible: (c: ContextoCapacidades | null) => boolean;
};

// Cada entrada decide su propia visibilidad con las capacidades EFECTIVAS.
//
// Mostrar una sección que responderá 403 es peor que no mostrarla: convierte un
// límite de permisos en algo que parece una avería. Y al revés —que es el
// defecto que este cambio corrige— esconder una sección que el usuario SÍ puede
// operar la vuelve inencontrable.
const NAVEGACION: EntradaDelMenu[] = [
  {
    to: "/capacitaciones/cursos",
    label: "Catálogo",
    icon: BookOpen,
    visible: (c) => Boolean(c?.puede_editar_catalogo || c?.puede_publicar),
  },
  {
    to: "/evaluaciones",
    label: "Evaluaciones",
    icon: ClipboardCheck,
    // APROXIMACIÓN DECLARADA, y conviene que se note. El banco es de OTRO
    // módulo (`hseq/evaluaciones`) con sus propios permisos, y
    // `GET /capacitaciones/contexto` solo resuelve los de Capacitaciones. Se
    // usa aquí la capacidad editorial más cercana: quien redacta el catálogo
    // global suele ser quien redacta los cuestionarios.
    //
    // Si la aproximación falla, la pantalla responde con la explicación de
    // permisos en vez de romperse — que es peor que esconderla, pero mucho
    // mejor que inventarse una respuesta. Lo que cierra esto de verdad es que
    // el contexto devuelva capacidades de varios módulos, y eso es trabajo del
    // endpoint, no de este menú.
    visible: (c) => Boolean(c?.puede_editar_catalogo || c?.puede_publicar),
  },
  {
    to: "/capacitaciones/asignaciones",
    label: "Asignaciones",
    icon: Users,
    visible: (c) => Boolean(c?.puede_asignar),
  },
  {
    to: "/capacitaciones/participantes",
    label: "Participantes",
    icon: Users2,
    // Permiso PROPIO: mantener la nómina suele ser gestión humana y asignar
    // cursos es del responsable de SST. La navegación refleja esa separación,
    // pero quien autoriza es el backend — mostrar u ocultar no es un control.
    visible: (c) => Boolean(c?.puede_gestionar_participantes),
  },
  {
    to: "/capacitaciones/invitaciones",
    label: "Invitaciones",
    icon: Send,
    // ESTABA ENRUTADA Y NO ESTABA EN EL MENÚ. Solo se llegaba por un botón
    // dentro de una fila de Asignaciones, así que había que saber de antemano
    // que existía. Con la invitación individual como modo por defecto, esta es
    // **la** pantalla que produce lo que se reparte: sin ella, quien organiza
    // acaba mandando el enlace de grupo, que ya no sirve para inscribirse.
    visible: (c) => Boolean(c?.puede_asignar),
  },
  {
    to: "/capacitaciones/enlaces",
    label: "Enlaces de grupo",
    icon: Link2,
    // Misma historia que Invitaciones. El nombre dice «de grupo» a propósito:
    // el menú es el sitio más barato para que no se confunda con la invitación
    // personal.
    visible: (c) => Boolean(c?.puede_asignar),
  },
  {
    to: "/capacitaciones/constancias",
    label: "Constancias",
    icon: FileBadge,
    // Misma capacidad que asignar: la constancia es del inquilino, no del
    // catálogo global. Quien solo redacta contenido editorial no tiene por qué
    // ver la evidencia de las empresas.
    visible: (c) => Boolean(c?.puede_asignar),
  },
  {
    to: "/capacitaciones/estado",
    label: "Estado del módulo",
    icon: ShieldCheck,
    // Siempre visible para quien tiene alguna capacidad: es la pantalla que
    // explica por qué algo no se puede, y esconderla dejaría el diagnóstico sin
    // sitio. A quien no tiene ninguna, el backend le responde 403 y la pantalla
    // lo dice sin revelar el estado comercial.
    visible: () => true,
  },
];

function iniciales(nombre: string): string {
  const letras = nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  return letras || "CA";
}

export default function CapacitacionesLayout() {
  return (
    <ProveedorCapacitaciones>
      <Shell />
    </ProveedorCapacitaciones>
  );
}

function Shell() {
  const { user } = useAuth();
  const { capacidades, fase } = useCapacitaciones();

  // Mientras se resuelve el contexto no se pinta navegación a medias: aparecer
  // y desaparecer enlaces es peor que esperar un instante.
  const entradas = fase === "listo" ? NAVEGACION.filter((n) => n.visible(capacidades)) : [];
  const nombre = user?.nombre?.trim() || user?.email || "Usuario ABRIL360";

  return (
    <div className="rel-scope flex min-h-screen bg-rel-canvas font-rel-body text-rel-dark">
      {/* PRIMER elemento enfocable del documento, antes de la barra lateral.
          Tiene que ir aquí y no dentro del `main`: el enlace existe para saltar
          POR ENCIMA de la navegación, y colocarlo después la deja entera por
          delante — con lo que no salta nada. Con la barra horizontal anterior
          eran tres enlaces; ahora son siete botones más la marca y el avatar. */}
      <a
        href="#contenido-capacitaciones"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-rel-control focus:bg-rel-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-rel-primary-foreground"
      >
        Saltar al contenido
      </a>

      <RoleSidebar
        items={entradas}
        storageKey="abril360.capacitaciones.sidebar.collapsed"
        brandTitle="ABRIL360"
        brandSubtitle="Capacitaciones"
        avatarText={iniciales(nombre)}
        userTitle={nombre}
        userSubtitle="Gestión de capacitaciones"
        navLabel="Navegación de Capacitaciones"
      />

      <main className="flex min-w-0 flex-1 flex-col p-3 sm:p-6">
        <div id="contenido-capacitaciones" className="min-w-0 flex-1">
          {fase === "listo" && capacidades && !capacidades.tiene_acceso ? (
            <SinAccesoAlModulo />
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}

/**
 * Sesión válida, cero capacidades en el módulo.
 *
 * Reemplaza al guardia de ruta por permisos del JWT. Aquel comparaba contra una
 * lista que no conoce las asignaciones con alcance, así que expulsaba a usuarios
 * que el backend sí autoriza.
 *
 * No dice **por qué** no hay acceso, y es a propósito: la causa puede ser que la
 * empresa no contrató el módulo, y el estado comercial no lo lee cualquiera que
 * se haya autenticado. El endpoint de contexto tampoco lo revela.
 */
function SinAccesoAlModulo() {
  return (
    <div
      role="alert"
      className="mx-auto max-w-prose rounded-rel-panel border border-rel-border bg-rel-surface p-8 text-center shadow-sm"
    >
      <h1 className="font-rel-heading text-xl font-black text-rel-dark">
        No tienes acceso a Capacitaciones
      </h1>
      <p className="mt-2 font-rel-body text-sm text-rel-muted">
        Tu cuenta está activa, pero tu rol no incluye ninguna operación de este
        módulo en esta empresa. Si deberías tenerla, pídesela a quien administra
        los roles.
      </p>
      <a
        href="/"
        className="mt-6 inline-flex items-center rounded-rel-control bg-rel-primary px-4 py-2 text-sm font-bold text-rel-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary focus-visible:ring-offset-2"
      >
        Volver al inicio
      </a>
    </div>
  );
}
