// src/shared/ui/ilustraciones/catalogo.tsx
//
// Los dibujos. Todos comparten la misma gramática visual para que puestos uno
// al lado de otro parezcan de la misma mano:
//
//   - Lienzo 200×150, sin excepciones. Lo que cambia de tamaño es el `width`
//     que pone `Ilustracion`, nunca el `viewBox`.
//   - Un blob suave detrás (`suave`), una masa principal (`primario`/`acento`),
//     papel (`superficie`) y trazo fino (`borde`). El detalle apagado
//     (`neutro`) simula texto: NUNCA se escribe texto real dentro de un SVG
//     decorativo, porque no se traduce y los lectores de pantalla lo leen.
//   - Color semántico solo cuando el dibujo AFIRMA algo: verde si algo se
//     completó, ámbar si algo está bloqueado, rojo si algo se rompió. Una
//     ilustración neutra que usa verde miente.
//   - Esquinas redondeadas y trazos de 2 px: es el mismo lenguaje de los
//     `rounded-rel-*` y de los iconos de lucide que ya usan las pantallas.
//
// Son planas a propósito. Las referencias de producto muestran ilustraciones
// con volumen y personajes, que es material de ilustrador; esto es la capa que
// SÍ puede vivir en el repositorio: vectorial, sin binarios, sin peso, y que
// cambia de color sola cuando cambia el tema o la paleta.

import { PALETA as C } from "./paleta";

/** Sombra de apoyo. Lo que hace que el dibujo se pose en vez de flotar. */
function Suelo() {
  return <ellipse cx="100" cy="134" rx="70" ry="8" fill={C.suave} />;
}

/** Renglones de texto simulado, para papeles y tarjetas. */
function Renglones({
  x,
  y,
  anchos,
  color = C.neutro,
  opacidad = 0.45,
}: {
  x: number;
  y: number;
  anchos: number[];
  color?: string;
  opacidad?: number;
}) {
  return (
    <g fill={color} opacity={opacidad}>
      {anchos.map((ancho, i) => (
        <rect key={i} x={x} y={y + i * 9} width={ancho} height="4" rx="2" />
      ))}
    </g>
  );
}

// --- catálogo -----------------------------------------------------------------

/** Curso / inducción: el libro abierto con su marca de reproducción. */
function Capacitacion() {
  return (
    <>
      <circle cx="100" cy="66" r="52" fill={C.suave} />
      <Suelo />
      <path d="M100 52 L34 40 v62 l66 12z" fill={C.superficie} stroke={C.borde} strokeWidth="2" strokeLinejoin="round" />
      <path d="M100 52 L166 40 v62 l-66 12z" fill={C.superficieSuave} stroke={C.borde} strokeWidth="2" strokeLinejoin="round" />
      <path d="M100 52 v62" stroke={C.borde} strokeWidth="2" />
      <Renglones x={44} y={58} anchos={[42, 36, 44]} />
      <Renglones x={112} y={58} anchos={[42, 30, 38]} />
      <circle cx="146" cy="36" r="18" fill={C.primario} />
      <path d="M141 29 l12 7 -12 7z" fill={C.superficie} />
    </>
  );
}

/** Lección de video. */
function Video() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.suave} />
      <Suelo />
      <rect x="34" y="34" width="132" height="80" rx="10" fill={C.tinta} />
      <rect x="42" y="42" width="116" height="52" rx="6" fill={C.acento} opacity="0.25" />
      <circle cx="100" cy="68" r="17" fill={C.superficie} />
      <path d="M95 60 l14 8 -14 8z" fill={C.primario} />
      <rect x="42" y="102" width="116" height="4" rx="2" fill={C.superficie} opacity="0.3" />
      <rect x="42" y="102" width="48" height="4" rx="2" fill={C.primario} />
      <rect x="82" y="114" width="36" height="10" rx="3" fill={C.tinta} />
    </>
  );
}

/** Lección de documento: PDF, presentación, guía. */
function Documento() {
  return (
    <>
      <circle cx="100" cy="66" r="50" fill={C.suave} />
      <Suelo />
      <rect x="46" y="26" width="88" height="96" rx="8" fill={C.superficieSuave} stroke={C.borde} strokeWidth="2" transform="rotate(-7 90 74)" />
      <path d="M62 22 h56 l24 24 v76 a6 6 0 0 1-6 6 H62 a6 6 0 0 1-6-6 V28 a6 6 0 0 1 6-6z" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <path d="M118 22 v18 a6 6 0 0 0 6 6 h18" fill="none" stroke={C.borde} strokeWidth="2" />
      <Renglones x={68} y={58} anchos={[56, 44, 60, 38]} />
      <rect x="68" y="98" width="30" height="14" rx="4" fill={C.primario} />
    </>
  );
}

/** Constancia emitida. */
function Constancia() {
  return (
    <>
      <circle cx="100" cy="66" r="50" fill={C.suave} />
      <Suelo />
      <rect x="30" y="28" width="140" height="86" rx="10" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <Renglones x={44} y={46} anchos={[54, 78, 44]} />
      <rect x="44" y="84" width="62" height="4" rx="2" fill={C.primario} opacity="0.5" />
      <rect x="124" y="44" width="32" height="32" rx="4" fill={C.tinta} opacity="0.12" />
      <g fill={C.tinta}>
        <rect x="129" y="49" width="8" height="8" rx="1" />
        <rect x="143" y="49" width="8" height="8" rx="1" />
        <rect x="129" y="63" width="8" height="8" rx="1" />
        <rect x="143" y="63" width="5" height="5" rx="1" />
      </g>
      <path d="M126 100 l0 24 10-7 10 7 0-24z" fill={C.primario} />
      <circle cx="136" cy="98" r="14" fill={C.acento} />
      <path d="M130 98 l4 4 8-8" fill="none" stroke={C.superficie} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

/** Invitación individual: el sobre con la ficha de una persona dentro. */
function Invitacion() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.suave} />
      <Suelo />
      <rect x="60" y="26" width="80" height="54" rx="6" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <circle cx="100" cy="44" r="9" fill={C.primario} opacity="0.35" />
      <path d="M88 62 a12 12 0 0 1 24 0z" fill={C.primario} opacity="0.35" />
      <path d="M34 60 h132 a6 6 0 0 1 6 6 v46 a6 6 0 0 1-6 6 H34 a6 6 0 0 1-6-6 V66 a6 6 0 0 1 6-6z" fill={C.acento} />
      <path d="M28 66 l72 40 72-40" fill="none" stroke={C.superficie} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M28 118 l52-34 M172 118 l-52-34" stroke={C.superficie} strokeWidth="2" opacity="0.6" />
    </>
  );
}

/** Enlace de grupo: circula, no identifica. */
function Enlace() {
  return (
    <>
      <circle cx="100" cy="70" r="50" fill={C.suave} />
      <Suelo />
      <g stroke={C.primario} strokeWidth="9" strokeLinecap="round" fill="none">
        <path d="M86 84 L114 56" />
        <path d="M76 62 l-8 8 a17 17 0 0 0 24 24 l8-8" />
        <path d="M124 78 l8-8 a17 17 0 0 0-24-24 l-8 8" />
      </g>
      <g stroke={C.acento} strokeWidth="2.5" fill="none" opacity="0.5" strokeLinecap="round">
        <path d="M42 40 a34 34 0 0 0-8 22" />
        <path d="M158 40 a34 34 0 0 1 8 22" />
      </g>
    </>
  );
}

/** Nómina de participantes. */
function Participantes() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.suave} />
      <Suelo />
      <rect x="26" y="46" width="148" height="66" rx="10" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <g>
        <circle cx="58" cy="70" r="13" fill={C.primario} />
        <path d="M43 100 a15 15 0 0 1 30 0z" fill={C.primario} />
      </g>
      <g opacity="0.75">
        <circle cx="100" cy="70" r="13" fill={C.acento} />
        <path d="M85 100 a15 15 0 0 1 30 0z" fill={C.acento} />
      </g>
      <g opacity="0.45">
        <circle cx="142" cy="70" r="13" fill={C.neutro} />
        <path d="M127 100 a15 15 0 0 1 30 0z" fill={C.neutro} />
      </g>
      <rect x="26" y="30" width="66" height="12" rx="6" fill={C.acento} opacity="0.35" />
    </>
  );
}

/** Progreso de una asignación. */
function Progreso() {
  return (
    <>
      <circle cx="100" cy="70" r="50" fill={C.suave} />
      <Suelo />
      <rect x="34" y="30" width="132" height="88" rx="10" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <rect x="50" y="82" width="20" height="22" rx="4" fill={C.acento} opacity="0.45" />
      <rect x="80" y="66" width="20" height="38" rx="4" fill={C.acento} opacity="0.7" />
      <rect x="110" y="48" width="20" height="56" rx="4" fill={C.primario} />
      <path d="M52 74 L90 58 L120 40" fill="none" stroke={C.exito} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="120" cy="40" r="5" fill={C.exito} />
    </>
  );
}

/** Vacío legítimo: todavía no hay nada, y está bien. */
function Vacio() {
  return (
    <>
      <circle cx="100" cy="70" r="50" fill={C.suave} />
      <Suelo />
      <path d="M40 66 h120 v40 a8 8 0 0 1-8 8 H48 a8 8 0 0 1-8-8z" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <path d="M40 66 L58 38 h84 l18 28" fill={C.superficieSuave} stroke={C.borde} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 66 h30 a6 6 0 0 1 6 6 a6 6 0 0 0 6 6 h36 a6 6 0 0 0 6-6 a6 6 0 0 1 6-6 h30" fill="none" stroke={C.borde} strokeWidth="2" strokeLinejoin="round" />
      <path d="M82 28 v-10 M100 24 v-12 M118 28 v-10" stroke={C.acento} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
    </>
  );
}

/** Filtro sin resultados. NO es lo mismo que no tener datos. */
function Busqueda() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.suave} />
      <Suelo />
      <rect x="34" y="34" width="96" height="80" rx="8" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <Renglones x={46} y={50} anchos={[54, 40, 60]} />
      <Renglones x={46} y={86} anchos={[34, 48]} />
      <circle cx="128" cy="62" r="26" fill={C.superficie} fillOpacity="0.85" stroke={C.primario} strokeWidth="6" />
      <path d="M147 81 l18 18" stroke={C.primario} strokeWidth="8" strokeLinecap="round" />
    </>
  );
}

/** Algo se rompió y se puede reintentar. */
function Roto() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.peligroSuave} />
      <Suelo />
      <path d="M100 30 l52 82 H48z" fill={C.superficie} stroke={C.peligro} strokeWidth="3" strokeLinejoin="round" />
      <rect x="96" y="56" width="8" height="26" rx="4" fill={C.peligro} />
      <circle cx="100" cy="94" r="5" fill={C.peligro} />
    </>
  );
}

/** Sin permiso, o módulo no habilitado. */
function Bloqueado() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.alertaSuave} />
      <Suelo />
      <path d="M100 24 l44 16 v34 c0 26-18 44-44 52-26-8-44-26-44-52V40z" fill={C.superficie} stroke={C.alerta} strokeWidth="3" strokeLinejoin="round" />
      <path d="M88 70 v-10 a12 12 0 0 1 24 0 v10" fill="none" stroke={C.alerta} strokeWidth="4" strokeLinecap="round" />
      <rect x="80" y="70" width="40" height="30" rx="6" fill={C.alerta} />
      <circle cx="100" cy="84" r="4" fill={C.superficie} />
    </>
  );
}

/** Se completó. Es el remate del recorrido del participante. */
function Completado() {
  return (
    <>
      <circle cx="100" cy="66" r="44" fill={C.exitoSuave} />
      <Suelo />
      <circle cx="100" cy="66" r="30" fill={C.exito} />
      <path d="M87 66 l9 10 18-20" fill="none" stroke={C.superficie} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <g fill={C.primario}>
        <rect x="38" y="34" width="9" height="9" rx="2" transform="rotate(24 42 38)" />
        <rect x="152" y="30" width="8" height="8" rx="2" transform="rotate(-18 156 34)" opacity="0.7" />
        <rect x="44" y="96" width="7" height="7" rx="2" transform="rotate(-30 47 99)" opacity="0.55" />
        <rect x="158" y="88" width="9" height="9" rx="2" transform="rotate(35 162 92)" opacity="0.8" />
        <circle cx="66" cy="18" r="4" opacity="0.5" />
        <circle cx="134" cy="112" r="4" opacity="0.45" />
      </g>
    </>
  );
}

/** Firma de asistencia. */
function Firma() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.suave} />
      <Suelo />
      <rect x="30" y="34" width="140" height="76" rx="10" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <path d="M48 84 c10-22 18-24 22-12 s6 26 14 22 s10-30 18-28 s6 22 16 18" fill="none" stroke={C.tinta} strokeWidth="3" strokeLinecap="round" />
      <path d="M46 96 h80" stroke={C.borde} strokeWidth="2" strokeDasharray="5 5" />
      <path d="M132 92 l24-24 8 8 -24 24 -10 2z" fill={C.primario} />
      <path d="M152 72 l8 8" stroke={C.superficie} strokeWidth="2" />
    </>
  );
}

/** Empresa cliente. */
function Empresa() {
  return (
    <>
      <circle cx="100" cy="70" r="50" fill={C.suave} />
      <Suelo />
      <rect x="98" y="46" width="62" height="68" rx="6" fill={C.superficieSuave} stroke={C.borde} strokeWidth="2" />
      <rect x="42" y="28" width="62" height="86" rx="6" fill={C.superficie} stroke={C.borde} strokeWidth="2" />
      <g fill={C.primario} opacity="0.55">
        <rect x="54" y="42" width="14" height="12" rx="2" />
        <rect x="78" y="42" width="14" height="12" rx="2" />
        <rect x="54" y="62" width="14" height="12" rx="2" />
        <rect x="78" y="62" width="14" height="12" rx="2" />
        <rect x="112" y="60" width="14" height="12" rx="2" />
        <rect x="134" y="60" width="14" height="12" rx="2" />
        <rect x="112" y="80" width="14" height="12" rx="2" />
        <rect x="134" y="80" width="14" height="12" rx="2" />
      </g>
      <rect x="64" y="90" width="20" height="24" rx="3" fill={C.primario} />
    </>
  );
}

/** Subir material: es el hueco de la vertical de contenido. */
function Subir() {
  return (
    <>
      <circle cx="100" cy="68" r="50" fill={C.suave} />
      <Suelo />
      <rect x="34" y="58" width="132" height="56" rx="10" fill={C.superficie} stroke={C.borde} strokeWidth="2" strokeDasharray="7 6" />
      <path d="M100 96 V44" stroke={C.primario} strokeWidth="6" strokeLinecap="round" />
      <path d="M80 62 l20-20 20 20" fill="none" stroke={C.primario} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="62" y="104" width="76" height="5" rx="2.5" fill={C.acento} opacity="0.4" />
    </>
  );
}

/**
 * El catálogo.
 *
 * Las claves son sustantivos del dominio, no descripciones del dibujo: quien
 * escribe una pantalla pide «constancia», no «hoja con sello». Así el dibujo se
 * puede rehacer sin tocar ni una pantalla.
 */
export const CATALOGO = {
  capacitacion: Capacitacion,
  video: Video,
  documento: Documento,
  constancia: Constancia,
  invitacion: Invitacion,
  enlace: Enlace,
  participantes: Participantes,
  progreso: Progreso,
  vacio: Vacio,
  busqueda: Busqueda,
  error: Roto,
  bloqueado: Bloqueado,
  completado: Completado,
  firma: Firma,
  empresa: Empresa,
  subir: Subir,
} as const;

export type NombreIlustracion = keyof typeof CATALOGO;
