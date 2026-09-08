// src/features/participacion/Estados.tsx
//
// Los estados del recorrido público. Distintos de los administrativos y por eso
// en otro archivo: aquí quien lee no es un operador que sabe qué es un 403, sino
// alguien de pie con el teléfono que solo necesita saber si puede seguir y qué
// hacer si no.

import type { ReactNode } from "react";
import { AlertTriangle, Loader2, Mail, WifiOff } from "lucide-react";

import { BotonSecundario, Panel } from "./ParticipanteLayout";
import type { ErrorPublico, MotivoPublico } from "@/types/participacion";

export function Cargando({ etiqueta = "Un momento…" }: { etiqueta?: string }) {
  return (
    <div
      className="flex flex-1 flex-col items-center justify-center gap-3 py-16"
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="h-6 w-6 animate-spin text-rel-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
      <p className="text-sm text-rel-muted">{etiqueta}</p>
    </div>
  );
}

/**
 * D-99. **Un solo mensaje para cuatro causas.**
 *
 * Expirado, revocado, cupo lleno e inexistente comparten pantalla porque
 * distinguirlos enseña cosas: «expiró» confirma que existió, «cupo lleno» revela
 * cuánta gente hay en esa empresa. A la persona legítima no le quita nada — la
 * salida es la misma en los cuatro casos.
 *
 * Y no lleva botón de reintentar: reintentar no arregla ninguno de los cuatro.
 * Ofrecerlo sería dar una palanca que no hace nada.
 */
export function EnlaceNoDisponible() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Panel className="text-center">
        <AlertTriangle
          className="mx-auto h-8 w-8 text-rel-warning"
          aria-hidden="true"
        />
        <h1 className="mt-4 font-rel-heading text-xl font-bold">
          Este enlace no está disponible
        </h1>
        <p className="mt-3 text-base leading-relaxed text-rel-muted">
          Comunícate con tu empresa para que te compartan uno nuevo.
        </p>
      </Panel>
      <p className="mt-4 text-center text-sm text-rel-muted">
        No hay nada que hacer en esta página.
      </p>
    </div>
  );
}

/** El módulo no está habilitado para esa empresa. Se separa porque se arregla. */
export function ParticipacionCerrada() {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Panel className="text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-rel-warning" aria-hidden="true" />
        <h1 className="mt-4 font-rel-heading text-xl font-bold">
          Todavía no está habilitado
        </h1>
        <p className="mt-3 text-base leading-relaxed text-rel-muted">
          Tu empresa aún no tiene activado el acceso a las capacitaciones en
          línea. Avísales: es algo que ellos pueden resolver.
        </p>
      </Panel>
    </div>
  );
}

/**
 * Fallo que sí se puede reintentar.
 *
 * Se distingue del enlace muerto a propósito. Un túnel del metro y un enlace
 * revocado se ven igual si se muestran igual, y son cosas distintas: una se
 * arregla esperando y la otra no se arregla sola.
 */
export function FalloRecuperable({
  reintentar,
  mensaje,
}: {
  reintentar: () => void;
  mensaje?: string;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Panel className="text-center">
        <WifiOff className="mx-auto h-8 w-8 text-rel-neutral" aria-hidden="true" />
        <h1 className="mt-4 font-rel-heading text-xl font-bold">
          No pudimos conectarnos
        </h1>
        <p className="mt-3 text-base leading-relaxed text-rel-muted">
          {mensaje ?? "Revisa tu conexión e inténtalo otra vez. No perdiste nada de lo que llevas."}
        </p>
        <div className="mt-6">
          <BotonSecundario onClick={reintentar}>Reintentar</BotonSecundario>
        </div>
      </Panel>
    </div>
  );
}

/** Demasiadas peticiones. Se dice cuánto esperar, no solo que no se puede. */
export function DemasiadasPeticiones({ reintentar }: { reintentar: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center">
      <Panel className="text-center">
        <h1 className="font-rel-heading text-xl font-bold">Espera un minuto</h1>
        <p className="mt-3 text-base leading-relaxed text-rel-muted">
          Se hicieron muchos intentos desde esta red. Vuelve a intentarlo en un
          minuto; si estás en una capacitación con más gente, es normal.
        </p>
        <div className="mt-6">
          <BotonSecundario onClick={reintentar}>Reintentar</BotonSecundario>
        </div>
      </Panel>
    </div>
  );
}

/**
 * El enlace del grupo llegó, pero esta capacitación se hace con invitación
 * personal.
 *
 * **No dice si esta persona está en la lista de la empresa**, ni le ofrece
 * escribir su documento para comprobarlo: cualquiera de las dos cosas
 * convertiría la pantalla en una forma de averiguar quién trabaja allí. Solo
 * dice a quién pedirla.
 */
function RequiereInvitacion() {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <Mail className="mx-auto h-12 w-12 text-rel-info" aria-hidden="true" />
      <h1 className="mt-4 font-rel-heading text-xl font-bold">
        Necesitas tu invitación personal
      </h1>
      <p className="mt-3 text-base leading-relaxed text-rel-muted">
        Esta capacitación se hace con un enlace individual, para que la
        constancia quede a nombre de quien de verdad la hizo.
      </p>
      <p className="mt-3 text-base leading-relaxed text-rel-muted">
        Pídesela a quien organiza la capacitación en tu empresa.
      </p>
    </div>
  );
}

/**
 * La invitación no sirve. **Los cuatro casos dicen lo mismo**, a propósito:
 * «ya se usó» confirmaría que se acertó un código, y «caducó» confirmaría que
 * existió.
 */
function InvitacionNoDisponible() {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <AlertTriangle className="mx-auto h-12 w-12 text-rel-warning" aria-hidden="true" />
      <h1 className="mt-4 font-rel-heading text-xl font-bold">
        Esta invitación no está disponible
      </h1>
      <p className="mt-3 text-base leading-relaxed text-rel-muted">
        Puede que ya la hayas usado o que haya caducado. Pídele una nueva a quien
        organiza la capacitación en tu empresa.
      </p>
    </div>
  );
}

/**
 * Elige la pantalla a partir del `motivo` que decidió el servidor.
 *
 * Por el código y **nunca por el mensaje**: el texto se puede reescribir sin
 * avisar, y una comparación por cadena fallaría en silencio justo cuando alguien
 * mejore la redacción.
 */
export function PantallaDeError({
  error,
  reintentar,
}: {
  error: ErrorPublico;
  reintentar: () => void;
}): ReactNode {
  const motivo: MotivoPublico | "desconocido" = error.motivo;

  if (motivo === "enlace_no_disponible") return <EnlaceNoDisponible />;
  if (motivo === "participacion_cerrada") return <ParticipacionCerrada />;
  if (motivo === "demasiadas_peticiones")
    return <DemasiadasPeticiones reintentar={reintentar} />;
  if (motivo === "requiere_invitacion") return <RequiereInvitacion />;
  if (motivo === "invitacion_no_disponible") return <InvitacionNoDisponible />;

  // `sesion_invalida` no llega aquí: lo maneja la pantalla de reanudación, que
  // sabe ofrecer el código. Tratarlo como error genérico dejaría a la persona
  // mirando un «reintentar» que nunca funcionaría.
  return <FalloRecuperable reintentar={reintentar} mensaje={error.message} />;
}
