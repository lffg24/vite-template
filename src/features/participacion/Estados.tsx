// src/features/participacion/Estados.tsx
//
// Los estados del recorrido público. Distintos de los administrativos y por eso
// en otro archivo: aquí quien lee no es un operador que sabe qué es un 403, sino
// alguien de pie con el teléfono que solo necesita saber si puede seguir y qué
// hacer si no.

import type { ReactNode } from "react";
import { AlertTriangle, Loader2, Mail, WifiOff } from "lucide-react";
import { Escena, type NombreEscena } from "@/shared/ui/Escena";

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
/**
 * La forma de una pantalla de estado del recorrido público.
 *
 * Las tres que había —enlace muerto, módulo no habilitado, hace falta
 * invitación— eran un panel blanco con un triángulo de aviso y dos frases. Se
 * veían como un error del sistema, y ninguna lo es: las tres describen una
 * situación normal que alguien puede resolver.
 *
 * Con la escena, el mismo mensaje se lee como algo escrito para quien lo está
 * leyendo. Y lo que pasa a primer plano es **qué hacer**, no el símbolo de
 * alarma.
 */
function PantallaDeEstado({
  escena,
  titulo,
  children,
  accion,
}: {
  escena: NombreEscena;
  titulo: string;
  children: ReactNode;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center py-6">
      <div className="mx-auto w-full max-w-md text-center">
        <Escena nombre={escena} tamano="xl" className="mx-auto" />
        <h1 className="mt-6 font-rel-heading text-2xl font-black leading-tight text-rel-dark">
          {titulo}
        </h1>
        <div className="mt-3 text-base leading-relaxed text-rel-muted">{children}</div>
        {accion ? <div className="mt-8">{accion}</div> : null}
      </div>
    </div>
  );
}


export function EnlaceNoDisponible() {
  return (
    <PantallaDeEstado escena="acceso-restringido" titulo="Este enlace ya no sirve">
      <p>
        Puede haber vencido, haberse llenado o haberse reemplazado por otro.
      </p>
      <p className="mt-2">
        Pídele uno nuevo a quien organiza la capacitación en tu empresa.
      </p>
    </PantallaDeEstado>
  );
}

/** El módulo no está habilitado para esa empresa. Se separa porque se arregla. */
export function ParticipacionCerrada() {
  return (
    <PantallaDeEstado
      escena="acceso-restringido"
      titulo="Falta un paso de tu empresa"
    >
      <p>
        El enlace está bien: lo que falta es que activen el acceso a las
        capacitaciones en línea.
      </p>
      <p className="mt-2">
        Avísale a quien te lo compartió — <strong className="text-rel-dark">se
        resuelve del lado de ellos</strong> y no tienes que hacer nada más.
      </p>
    </PantallaDeEstado>
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
