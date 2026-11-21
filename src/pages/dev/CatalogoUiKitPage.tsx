// src/pages/dev/CatalogoUiKitPage.tsx · /ui-kit
//
// El catálogo VIVO del UI kit de ABRIL-360. No es una captura ni una maqueta:
// cada muestra es la pieza real, importada de `shared/ui`, con sus estados. Si
// una pieza cambia, el catálogo cambia con ella, y si deja de compilar, el
// catálogo lo dice antes que cualquier pantalla.
//
// ## Para qué sirve
//
// 1. **Diseño** aprueba aquí una pieza una vez, no pantalla por pantalla.
// 2. **Quien desarrolla** (persona, Codex o Claude) busca aquí QUÉ pieza usar
//    antes de escribir una nueva. Si existe, se usa; si no, se crea y se suma
//    aquí. Ver `docs/design/GUIA_UI_KIT.md`.
// 3. **Las ilustraciones** se leen del registro, no de una lista a mano: una
//    escena nueva aparece sola.
//
// ## Dónde vive
//
// Detrás de `import.meta.env.DEV` o de `VITE_UI_KIT=1` (ver `App.tsx`). No
// lleva datos de nadie ni llama a ningún servicio; el gate es para que una
// herramienta interna no sea una ruta pública del producto.
//
// ## Regla del archivo
//
// Aquí se MUESTRA, no se inventa. Ninguna muestra define un estilo propio: si
// algo hace falta que no está en el kit, el hueco es el hallazgo.

import { useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Award,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Info,
  Lock,
  PlayCircle,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Seleccion } from "@/shared/ui/Seleccion";
import {
  EsqueletoAterrizaje,
  EsqueletoCurso,
  EsqueletoDetalle,
  EsqueletoFormulario,
  EsqueletoLeccion,
  EsqueletoPaginaLista,
  EsqueletoTablero,
} from "@/shared/ui/EsqueletoPantalla";
import { Ayuda } from "@/shared/ui/Ayuda";
import { AzulejoIcono, type TonoAzulejo } from "@/shared/ui/AzulejoIcono";
import { Aviso } from "@/shared/ui/Aviso";
import { BotonAccion } from "@/shared/ui/BotonAccion";
import { Caja } from "@/shared/ui/Caja";
import { Campo } from "@/shared/ui/Campo";
import { Casilla } from "@/shared/ui/Casilla";
import { DatePicker } from "@/shared/ui/DatePicker";
import { Desplegable } from "@/shared/ui/Desplegable";
import { DialogoCasa } from "@/shared/ui/DialogoCasa";
import { EntradaClave } from "@/shared/ui/EntradaClave";
import { EstadoVacio } from "@/shared/ui/EstadoVacio";
import { Esqueleto, EsqueletoTexto } from "@/shared/ui/Esqueleto";
import { FiltroChips } from "@/shared/ui/FiltroChips";
import { IndicadorKpi } from "@/shared/ui/IndicadorKpi";
import { NumeroQueCuenta } from "@/shared/ui/NumeroQueCuenta";
import { OpcionesExcluyentes } from "@/shared/ui/OpcionesExcluyentes";
import { OpcionesMultiples } from "@/shared/ui/OpcionesMultiples";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PanelLateral } from "@/shared/ui/PanelLateral";
import { PasosCurso } from "@/shared/ui/PasosCurso";
import { Pestanas } from "@/shared/ui/Pestanas";
import { Pill, type TonoPill } from "@/shared/ui/Pill";
import { AnilloProgreso, BarraProgreso } from "@/shared/ui/Progreso";
import { SeccionPlegable } from "@/shared/ui/SeccionPlegable";
import { TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import DemoTablero from "@/pages/dev/DemoTablero";
import { Illustration, IllustrationSurface } from "@/shared/ui/illustration";
import {
  illustrationRegistry,
  type IllustrationName,
} from "@/shared/ui/illustration/illustration.registry";

// ---------------------------------------------------------------------------
// Andamiaje del catálogo
// ---------------------------------------------------------------------------

const SECCIONES = [
  { id: "fundamentos", nombre: "Fundamentos" },
  { id: "acciones", nombre: "Acciones" },
  { id: "formularios", nombre: "Formularios" },
  { id: "estado", nombre: "Estado y avisos" },
  { id: "contenedores", nombre: "Contenedores" },
  { id: "navegacion", nombre: "Navegación" },
  { id: "datos", nombre: "Datos" },
  { id: "progreso", nombre: "Progreso" },
  { id: "tareas", nombre: "Tareas y tableros" },
  { id: "superposiciones", nombre: "Superposiciones" },
  { id: "ilustraciones", nombre: "Ilustraciones" },
  { id: "iconos", nombre: "Iconos" },
] as const;

/** El texto de apoyo admite `código` entre comillas invertidas. */
function ConCodigo({ texto }: { texto: string }) {
  return (
    <>
      {texto.split("`").map((trozo, i) =>
        i % 2 === 1 ? (
          <code key={i} className="rounded-rel-control bg-rel-neutral-subtle px-1 text-[0.85em]">
            {trozo}
          </code>
        ) : (
          trozo
        )
      )}
    </>
  );
}

function Seccion({
  id,
  titulo,
  descripcion,
  children,
}: {
  id: string;
  titulo: string;
  descripcion: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 border-t border-rel-border pt-10">
      <h2 id={`${id}-t`} className="font-rel-heading text-2xl font-black">
        {titulo}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-rel-muted">
        <ConCodigo texto={descripcion} />
      </p>
      <div className="mt-6 space-y-8">{children}</div>
    </section>
  );
}

/** Una pieza con su nombre, su archivo y lo que decide quien la elige. */
function Pieza({
  nombre,
  archivo,
  cuando,
  children,
}: {
  nombre: string;
  archivo: string;
  cuando: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-rel-heading text-base font-bold">{nombre}</h3>
        <code className="rounded-rel-control bg-rel-neutral-subtle px-2 py-0.5 text-xs text-rel-muted">
          {archivo}
        </code>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-rel-muted">
        <ConCodigo texto={cuando} />
      </p>
      <div className="mt-3 rounded-rel-card border border-rel-border bg-rel-surface p-5">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Datos de muestra (ejemplos, no datos de nadie)
// ---------------------------------------------------------------------------

const COLORES = [
  ["rel-primary", "bg-rel-primary", "Acción de marca, foco, selección"],
  ["rel-accent", "bg-rel-accent", "Botón principal"],
  ["rel-accent-subtle", "bg-rel-accent-subtle", "Fondo de marca suave"],
  ["rel-dark", "bg-rel-dark", "Texto principal"],
  ["rel-muted", "bg-rel-muted", "Texto secundario"],
  ["rel-border", "bg-rel-border", "Bordes"],
  ["rel-canvas", "bg-rel-canvas", "Fondo de página"],
  ["rel-surface", "bg-rel-surface", "Superficie de caja"],
  ["rel-success", "bg-rel-success", "Éxito (semántico)"],
  ["rel-warning", "bg-rel-warning", "Atención (semántico)"],
  ["rel-danger", "bg-rel-danger", "Error (semántico)"],
  ["rel-info", "bg-rel-info", "Información (semántico)"],
] as const;

const TONOS_PILL: TonoPill[] = ["exito", "atencion", "peligro", "neutro", "info", "marca"];
const TONOS_AZULEJO: TonoAzulejo[] = ["marca", "exito", "atencion", "peligro", "info", "neutro"];

type FilaMuestra = { id: string; curso: string; avance: number; estado: "Al día" | "Vence pronto" };
const FILAS: FilaMuestra[] = [
  { id: "1", curso: "Inducción en SST", avance: 100, estado: "Al día" },
  { id: "2", curso: "Trabajo en alturas", avance: 40, estado: "Vence pronto" },
  { id: "3", curso: "Manejo de extintores", avance: 75, estado: "Al día" },
];
const COLUMNAS: ColumnaTabla<FilaMuestra>[] = [
  { clave: "curso", titulo: "Curso", ordenable: true, celda: (f) => f.curso, valor: (f) => f.curso, movil: "titular" },
  { clave: "avance", titulo: "Avance", alineacion: "derecha", ordenable: true, celda: (f) => `${f.avance} %`, valor: (f) => f.avance },
  {
    clave: "estado",
    titulo: "Estado",
    celda: (f) => <Pill tono={f.estado === "Al día" ? "exito" : "atencion"}>{f.estado}</Pill>,
    valor: (f) => f.estado,
    movil: "pie",
  },
];

const ICONOS = [
  [Search, "Buscar"], [Plus, "Crear"], [Trash2, "Eliminar"], [Download, "Descargar"], [Upload, "Subir"],
  [Bell, "Avisos"], [Settings, "Ajustes"], [Users, "Personas"], [BookOpen, "Lecciones"], [FileText, "Documento"],
  [PlayCircle, "Video"], [Award, "Constancia"], [Clock, "Duración"], [Lock, "Bloqueado"], [ShieldCheck, "Evidencia"],
  [CheckCircle2, "Correcto"], [AlertTriangle, "Atención"], [XCircle, "Error"], [Info, "Información"],
] as const;

const SOMBRAS = [
  { clase: "rounded-rel-control shadow-rel-soft", nombre: "control · suave" },
  { clase: "rounded-rel-card shadow-rel-card", nombre: "tarjeta · tarjeta" },
  { clase: "rounded-rel-panel shadow-rel-floating", nombre: "panel · flotante" },
] as const;

const ENTIDADES = [
  "Alcaldía de Soacha", "Alcaldía de Bogotá", "Ecopetrol", "Gobernación de Cundinamarca", "Transmilenio S.A.",
  "Hospital San Rafael", "Universidad Nacional", "SENA", "ICBF", "Policía Nacional", "Ministerio de Trabajo",
  "Cámara de Comercio de Bogotá",
].map((n, i) => ({ valor: `e${i}`, etiqueta: n, descripcion: `NIT 90${i}.123.456` }));

const FORMAS = [
  ["curso", "Curso del participante", <EsqueletoCurso key="c" />],
  ["leccion", "Lección", <EsqueletoLeccion key="l" />],
  ["aterrizaje", "Portada de un enlace", <EsqueletoAterrizaje key="a" />],
  ["lista", "Pantalla con listado", <EsqueletoPaginaLista key="p" filas={4} />],
  ["detalle", "Detalle", <EsqueletoDetalle key="d" />],
  ["formulario", "Formulario", <EsqueletoFormulario key="f" campos={3} />],
  ["tablero", "Tablero", <EsqueletoTablero key="t" />],
] as const;

const DURACIONES = ["duration-press", "duration-exit", "duration-enter", "duration-context"] as const;

// ---------------------------------------------------------------------------
// La página
// ---------------------------------------------------------------------------

export default function CatalogoUiKitPage() {
  const [pestana, setPestana] = useState<string>("uno");
  const [filtro, setFiltro] = useState<string>("todos");
  const [unica, setUnica] = useState("b");
  const [multiple, setMultiple] = useState<string[]>(["a"]);
  const [marcada, setMarcada] = useState(true);
  const [fecha, setFecha] = useState("");
  const [dialogo, setDialogo] = useState(false);
  const [lateral, setLateral] = useState(false);
  const [repeticion, setRepeticion] = useState(0);
  const [consulta, setConsulta] = useState("");
  const [entidad, setEntidad] = useState<string>("");
  const [forma, setForma] = useState<string>("curso");
  const [avisoAbierto, setAvisoAbierto] = useState(true);

  const escenas = (Object.keys(illustrationRegistry) as IllustrationName[]).filter((n) =>
    n.toLowerCase().includes(consulta.trim().toLowerCase())
  );

  return (
    <div className="rel-scope min-h-dvh bg-rel-canvas font-rel-body text-rel-dark">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 grid-cols-[minmax(0,1fr)] sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:px-8">
        <nav aria-label="Secciones del catálogo" className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">UI kit</p>
          <ul className="mt-3 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            {SECCIONES.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="block rounded-rel-control px-3 py-2 text-sm font-semibold text-rel-dark hover:bg-rel-surface focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rel-primary"
                >
                  {s.nombre}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 space-y-12">
          <header>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-rel-accent-ink">
              ABRIL-360 · Gestión Inteligente
            </p>
            <h1 className="mt-2 font-rel-heading text-4xl font-black leading-tight">Catálogo del UI kit</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-rel-muted">
              Cada muestra es la pieza real. Antes de escribir una caja, un botón o un estado vacío, búscalo aquí: si
              existe, se usa. Si no existe, se crea en <code>shared/ui</code> y se suma a esta página.
            </p>
          </header>

          <Seccion
            id="fundamentos"
            titulo="Fundamentos"
            descripcion="Color, tipografía, esquinas, relieve y movimiento. Todo sale de tokens: ningún valor suelto."
          >
            <Pieza
              nombre="Color"
              archivo="src/index.css · --color-rel-*"
              cuando="Marca y semántica son familias distintas: el verde de éxito no es el turquesa de marca."
            >
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {COLORES.map(([token, clase, uso]) => (
                  <li key={token} className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className={cn("h-10 w-10 shrink-0 rounded-rel-control border border-rel-border", clase)}
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{token}</span>
                      <span className="block text-xs text-rel-muted">{uso}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Pieza>
            <Pieza
              nombre="Tipografía"
              archivo="font-rel-heading · font-rel-body"
              cuando="Títulos en la fuente de encabezado; cuerpo en la de lectura. Nunca un tamaño suelto."
            >
              <p className="font-rel-heading text-4xl font-black">Título de página</p>
              <p className="mt-2 font-rel-heading text-2xl font-bold">Título de sección</p>
              <p className="mt-2 text-base">Texto de lectura a 16 px con interlineado cómodo.</p>
              <p className="mt-2 text-sm text-rel-muted">Texto de apoyo.</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-rel-muted">Etiqueta de grupo</p>
            </Pieza>
            <Pieza
              nombre="Esquinas y relieve"
              archivo="esquinas rel · relieves rel"
              cuando="Tres esquinas (control, tarjeta, panel) y tres relieves (suave, tarjeta, flotante)."
            >
              <div className="flex flex-wrap gap-4">
                {SOMBRAS.map((s) => (
                  <div
                    key={s.clase}
                    className={cn("grid h-20 w-40 place-items-center bg-rel-surface text-center text-xs text-rel-muted", s.clase)}
                  >
                    {s.nombre}
                  </div>
                ))}
              </div>
            </Pieza>
            <Pieza
              nombre="Movimiento"
              archivo="--motion-* · duration-press|exit|enter|context"
              cuando="Pulsar 90 ms · salir 130 ms · entrar 220 ms · cambiar de contexto 280 ms. Curva de salida suave; rebote solo en la confirmación."
            >
              <div className="flex flex-wrap gap-3">
                {DURACIONES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={cn(
                      "min-h-11 rounded-rel-control border border-rel-border bg-rel-surface px-4 text-sm font-semibold",
                      "transition-[background-color,scale] ease-rel-out hover:bg-rel-accent-subtle active:scale-95 motion-reduce:transition-none",
                      d
                    )}
                  >
                    {d.replace("duration-", "")}
                  </button>
                ))}
              </div>
            </Pieza>
          </Seccion>

          <Seccion
            id="acciones"
            titulo="Acciones"
            descripcion="Un solo botón principal por pantalla. El control mide 44 px; la acción de móvil, 56."
          >
            <Pieza
              nombre="Button"
              archivo="components/ui/button.tsx"
              cuando="El botón base. Las variantes `rel` son las del producto; `default`, `outline`… son las heredadas de Psicosocial."
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="rel">Principal</Button>
                <Button variant="relOutline">Secundario</Button>
                <Button variant="link">Enlace</Button>
                <Button variant="rel" disabled>
                  Deshabilitado
                </Button>
                <Button variant="rel" size="icon" aria-label="Crear">
                  <Plus className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
            </Pieza>
            <Pieza
              nombre="BotonAccion"
              archivo="shared/ui/BotonAccion.tsx"
              cuando="La acción principal de una pantalla del participante: ancho completo, 56 px, para el pulgar."
            >
              <div className="max-w-sm space-y-3">
                <BotonAccion>Continuar</BotonAccion>
                <BotonAccion variante="secundaria">Volver al curso</BotonAccion>
              </div>
            </Pieza>
          </Seccion>

          <Seccion
            id="formularios"
            titulo="Formularios"
            descripcion="`Campo` pone etiqueta, ayuda y error; el control va dentro. Una pregunta por campo."
          >
            <Pieza
              nombre="Campo + Input"
              archivo="shared/ui/Campo.tsx"
              cuando="Cualquier dato de una línea. El error sale en texto, no solo en color."
            >
              <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
                <Campo id="k-nombre" etiqueta="Nombre completo" obligatorio ayuda="Como aparece en tu documento.">
                  <Input defaultValue="María Fernanda Ospina" />
                </Campo>
                <Campo id="k-correo" etiqueta="Correo" error="Escribe un correo válido, por ejemplo nombre@empresa.com">
                  <Input defaultValue="maria@" />
                </Campo>
              </div>
            </Pieza>
            <Pieza
              nombre="Desplegable · DatePicker · EntradaClave"
              archivo="shared/ui/Desplegable.tsx · DatePicker.tsx · EntradaClave.tsx"
              cuando="Lista corta, fecha y contraseña con ojo."
            >
              <div className="grid max-w-3xl gap-4 sm:grid-cols-3">
                <Campo id="k-sel" etiqueta="Tipo de documento">
                  <Desplegable defaultValue="CC">
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="CE">Cédula de extranjería</option>
                  </Desplegable>
                </Campo>
                <DatePicker label="Fecha" value={fecha} onChange={setFecha} />
                <Campo id="k-clave" etiqueta="Contraseña">
                  <EntradaClave defaultValue="clave-de-ejemplo" />
                </Campo>
              </div>
            </Pieza>
            <Pieza
              nombre="Seleccion (lista desplegable con búsqueda)"
              archivo="shared/ui/Seleccion.tsx"
              cuando="Muchas opciones: escribes y se acota (también por la descripción, p. ej. el NIT). Con más de 7 opciones la búsqueda se enciende sola. El Desplegable de arriba es para pocas opciones y toma el estilo de la casa en Chrome/Edge."
            >
              <div className="max-w-sm">
                <Campo id="k-entidad" etiqueta="Entidad contratante">
                  <Seleccion opciones={ENTIDADES} valor={entidad} alCambiar={setEntidad} placeholder="Busca una entidad" />
                </Campo>
              </div>
            </Pieza>
            <Pieza
              nombre="Casilla"
              archivo="shared/ui/Casilla.tsx"
              cuando="Una afirmación que la persona confirma. Etiqueta y descripción son parte del objetivo táctil."
            >
              <Casilla
                marcada={marcada}
                alCambiar={setMarcada}
                etiqueta="He visto el video completo"
                descripcion="Con esto queda registrada tu participación."
              />
            </Pieza>
            <Pieza
              nombre="OpcionesExcluyentes · OpcionesMultiples"
              archivo="shared/ui/Opciones*.tsx"
              cuando="Elegir una (radio) o varias (casillas) entre pocas. Más de 7 opciones: un Desplegable."
            >
              <div className="grid gap-6 lg:grid-cols-2">
                <OpcionesExcluyentes
                  nombre="k-unica"
                  leyenda="¿Qué haces primero?"
                  valor={unica}
                  alCambiar={setUnica}
                  opciones={[
                    { valor: "a", titulo: "Ignorarlo", descripcion: "" },
                    { valor: "b", titulo: "Reportarlo", descripcion: "" },
                  ]}
                />
                <OpcionesMultiples
                  nombre="k-multi"
                  leyenda="Elementos de protección"
                  ayuda="Marca todas las que apliquen."
                  valores={multiple}
                  alCambiar={setMultiple}
                  opciones={[
                    { valor: "a", titulo: "Casco" },
                    { valor: "b", titulo: "Guantes" },
                    { valor: "c", titulo: "Gafas" },
                  ]}
                />
              </div>
            </Pieza>
          </Seccion>

          <Seccion
            id="estado"
            titulo="Estado y avisos"
            descripcion="Lo que el sistema le dice a la persona: qué pasó, qué sigue, y cómo se arregla."
          >
            <Pieza
              nombre="Aviso flotante (toast)"
              archivo="components/ui/toaster.tsx · hooks/use-toast"
              cuando="Confirma lo que acaba de pasar sin cortar el trabajo («Guardado»). Arriba a la derecha, se va solo y se puede arrastrar para quitarlo. Pulsa para verlos."
            >
              <div className="flex flex-wrap gap-3">
                <Button variant="relOutline" onClick={() => toast({ variant: "success", title: "Cambios guardados", description: "El curso quedó publicado." })}>Éxito</Button>
                <Button variant="relOutline" onClick={() => toast({ title: "Enlace copiado", description: "Ya puedes compartirlo por WhatsApp." })}>Información</Button>
                <Button variant="relOutline" onClick={() => toast({ variant: "warning", title: "Vence en 5 días", description: "Renueva la formación." })}>Atención</Button>
                <Button variant="relOutline" onClick={() => toast({ variant: "destructive", title: "No pudimos guardar", description: "Revisa tu conexión e inténtalo otra vez." })}>Error</Button>
              </div>
            </Pieza>
            <Pieza
              nombre="Esqueletos con la forma de la pantalla"
              archivo="shared/ui/EsqueletoPantalla.tsx"
              cuando="Mientras carga, se dibuja la rejilla real de la pantalla (titular, tarjetas, filas) para que al llegar el contenido nada se mueva. Elige una forma."
            >
              <FiltroChips
                etiqueta="Forma"
                valor={forma}
                alCambiar={setForma}
                className="mb-5"
                opciones={FORMAS.map(([valor, etiqueta]) => ({ valor, etiqueta }))}
              />
              <div className="rounded-rel-card border border-dashed border-rel-border-strong bg-rel-canvas p-4 sm:p-6">
                {FORMAS.find(([v]) => v === forma)?.[2]}
              </div>
            </Pieza>
            <Pieza
              nombre="Pill"
              archivo="shared/ui/Pill.tsx"
              cuando="El estado de una fila o tarjeta. Seis tonos: cuatro semánticos, neutro y marca."
            >
              <div className="flex flex-wrap gap-2">
                {TONOS_PILL.map((t) => (
                  <Pill key={t} tono={t}>
                    {t}
                  </Pill>
                ))}
              </div>
            </Pieza>
            <Pieza
              nombre="Aviso"
              archivo="shared/ui/Aviso.tsx"
              cuando="Un mensaje que merece parar la lectura. Dice qué pasó y qué hacer, sin disculparse."
            >
              <div className="space-y-3">
                <Aviso tono="exito" titulo="Asistencia registrada">
                  Tu empresa verá el registro en su matriz.
                </Aviso>
                <Aviso tono="info" titulo="Tu avance se guarda solo">
                  Puedes seguir otro día.
                </Aviso>
                <Aviso tono="atencion" titulo="Vence en 5 días">
                  Renueva la formación antes del 30.
                </Aviso>
                <Aviso tono="peligro" titulo="No pudimos enviar tus respuestas">
                  Revisa tu conexión e inténtalo otra vez.
                </Aviso>
                {avisoAbierto ? (
                  <Aviso tono="info" titulo="Este aviso se puede descartar" alCerrar={() => setAvisoAbierto(false)}>
                    Útil para novedades; un error no debería poder cerrarse.
                  </Aviso>
                ) : (
                  <Button variant="relOutline" onClick={() => setAvisoAbierto(true)}>
                    Mostrar de nuevo
                  </Button>
                )}
              </div>
            </Pieza>
            <Pieza
              nombre="EstadoVacio"
              archivo="shared/ui/EstadoVacio.tsx"
              cuando="Una lista sin nada. Dice por qué está vacía y ofrece el siguiente paso. Con ilustración solo fuera de tablas densas."
            >
              <EstadoVacio
                titulo="Aún no hay capacitaciones"
                descripcion="Crea la primera para asignarla a tu equipo."
                escena="checklist"
                accion={<Button variant="rel">Crear capacitación</Button>}
              />
            </Pieza>
            <Pieza
              nombre="Esqueleto"
              archivo="shared/ui/Esqueleto.tsx"
              cuando="Carga de una lista o tarjeta con forma conocida. No se pinta antes de 300 ms."
            >
              <div className="max-w-md space-y-3">
                <Esqueleto className="h-6 w-2/3" />
                <EsqueletoTexto lineas={3} />
              </div>
            </Pieza>
            <Pieza
              nombre="FiltroChips"
              archivo="shared/ui/FiltroChips.tsx"
              cuando="Filtrar una lista por estado, con cuenta. Es un grupo de botones con `aria-pressed`."
            >
              <FiltroChips
                etiqueta="Estado"
                valor={filtro}
                alCambiar={setFiltro}
                opciones={[
                  { valor: "todos", etiqueta: "Todos", cuenta: 12 },
                  { valor: "activos", etiqueta: "Activos", cuenta: 9, tono: "exito" },
                  { valor: "vencidos", etiqueta: "Vencidos", cuenta: 3, tono: "peligro" },
                ]}
              />
            </Pieza>
            <Pieza
              nombre="Ayuda"
              archivo="shared/ui/Ayuda.tsx"
              cuando="Una explicación que no debe ocupar sitio hasta que se pide."
            >
              <p className="flex items-center gap-2 text-sm">
                Intensidad horaria <Ayuda>Horas de formación que certifica la constancia.</Ayuda>
              </p>
            </Pieza>
          </Seccion>

          <Seccion
            id="contenedores"
            titulo="Contenedores"
            descripcion="`Caja` es la pieza más repetida: tres papeles, cuatro tonos, y una versión que responde al puntero."
          >
            <Pieza
              nombre="Caja"
              archivo="shared/ui/Caja.tsx"
              cuando="El papel decide esquina, relieve y aire juntos: `panel` se levanta, `caja` vive dentro de un panel, `fila` es de lista."
            >
              <div className="grid gap-4 md:grid-cols-3">
                <Caja papel="panel">
                  <p className="font-semibold">panel</p>
                  <p className="text-sm text-rel-muted">Una sección de la página.</p>
                </Caja>
                <Caja papel="caja" tono="hundida">
                  <p className="font-semibold">caja · hundida</p>
                  <p className="text-sm text-rel-muted">Dentro de un panel.</p>
                </Caja>
                <Caja papel="fila" tono="discontinua">
                  <p className="font-semibold">fila · discontinua</p>
                  <p className="text-sm text-rel-muted">Un hueco por llenar.</p>
                </Caja>
              </div>
            </Pieza>
            <Pieza
              nombre="Caja viva"
              archivo="shared/ui/Caja.tsx · viva"
              cuando="Solo si la caja ES la acción. Sube 8 px y la sombra crece; nunca escala. Pásale el puntero."
            >
              <Caja viva papel="panel" className="max-w-xs">
                <p className="font-semibold">Inducción en SST</p>
                <p className="text-sm text-rel-muted">Se levanta al pasar el puntero.</p>
              </Caja>
            </Pieza>
            <Pieza
              nombre="PageHeader"
              archivo="shared/ui/PageHeader.tsx"
              cuando="El encabezado de toda pantalla de administración. Una acción principal como máximo."
            >
              <PageHeader
                antetitulo="Capacitaciones"
                titulo="Cursos"
                descripcion="Crea y publica los cursos de tu empresa."
                icono={BookOpen}
                accion={
                  <Button variant="rel">
                    <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                    Nuevo curso
                  </Button>
                }
              />
            </Pieza>
            <Pieza
              nombre="IndicadorKpi"
              archivo="shared/ui/IndicadorKpi.tsx"
              cuando="Una cifra que es el punto de la pantalla. No se usa para decorar."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <IndicadorKpi etiqueta="Cumplimiento" valor="86 %" contexto="+4 pts este mes" icono={ShieldCheck} tono="exito" />
                <IndicadorKpi etiqueta="Por vencer" valor="12" contexto="próximos 30 días" icono={Clock} tono="atencion" />
                <IndicadorKpi etiqueta="Personas" valor="248" icono={Users} />
              </div>
            </Pieza>
            <Pieza
              nombre="AzulejoIcono"
              archivo="shared/ui/AzulejoIcono.tsx"
              cuando="Un icono con su fondo de color. El tono dice lo mismo que el icono, no lo contradice."
            >
              <div className="flex flex-wrap gap-3">
                {TONOS_AZULEJO.map((t) => (
                  <AzulejoIcono key={t} icono={Award} tono={t} />
                ))}
              </div>
            </Pieza>
            <Pieza
              nombre="SeccionPlegable"
              archivo="shared/ui/SeccionPlegable.tsx"
              cuando="Un bloque largo que no todos abren. Plegado sigue montado: no se pierde lo escrito."
            >
              <SeccionPlegable titulo="Datos del curso" descripcion="Nombre, categoría y duración." abiertaPorDefecto={false}>
                <p className="text-sm text-rel-muted">El contenido anima su altura y, cerrado, no se puede enfocar.</p>
              </SeccionPlegable>
            </Pieza>
          </Seccion>

          <Seccion id="navegacion" titulo="Navegación" descripcion="Moverse entre vistas de una misma pantalla.">
            <Pieza
              nombre="Pestanas"
              archivo="shared/ui/Pestanas.tsx"
              cuando="Vistas hermanas de un mismo objeto. La raya se desliza entre pestañas (280 ms)."
            >
              <Pestanas
                etiqueta="Vistas de ejemplo"
                valor={pestana}
                alCambiar={setPestana}
                pestanas={[
                  { id: "uno", nombre: "Resumen" },
                  { id: "dos", nombre: "Personas", cuenta: 24 },
                  { id: "tres", nombre: "Evidencias" },
                ]}
              >
                <p className="pt-4 text-sm text-rel-muted">Contenido de «{pestana}».</p>
              </Pestanas>
            </Pieza>
          </Seccion>

          <Seccion id="datos" titulo="Datos" descripcion="Tablas: la única forma aprobada de listar registros.">
            <Pieza
              nombre="TablaDatos"
              archivo="shared/ui/TablaDatos.tsx"
              cuando="Ordenar, paginar y pasar a tarjetas en móvil. Sin ilustraciones dentro; el vacío sí puede llevarla."
            >
              <TablaDatos
                filas={FILAS}
                columnas={COLUMNAS}
                claveFila={(f) => f.id}
                etiquetaTabla="Cursos de ejemplo"
                etiquetaElemento="cursos"
                ordenInicial={{ clave: "curso" }}
              />
            </Pieza>
          </Seccion>

          <Seccion id="progreso" titulo="Progreso" descripcion="Dónde voy y cómo voy. Tres piezas, cada una con su pregunta.">
            <Pieza
              nombre="BarraProgreso · AnilloProgreso"
              archivo="shared/ui/Progreso.tsx"
              cuando="«Cuánto»: un porcentaje continuo."
            >
              <div className="flex flex-wrap items-center gap-8">
                <AnilloProgreso valor={0.6} etiqueta="Avance de ejemplo" tamano={96} />
                <BarraProgreso valor={0.6} etiqueta="Avance de ejemplo" mostrarPorcentaje className="w-64" />
              </div>
            </Pieza>
            <Pieza
              nombre="PasosCurso"
              archivo="shared/ui/PasosCurso.tsx"
              cuando="«Cuántos y cuál»: una raya por paso, con su estado también en texto."
            >
              <PasosCurso
                etiqueta="Partes de la lección"
                className="max-w-md"
                pasos={["hecho", "hecho", "actual", "pendiente", "pendiente"]}
              />
            </Pieza>
            <Pieza
              nombre="NumeroQueCuenta"
              archivo="shared/ui/NumeroQueCuenta.tsx"
              cuando="UNA cifra que es el resultado de lo que la persona acaba de hacer. Respeta movimiento reducido."
            >
              <div className="flex items-center gap-4">
                <p key={repeticion} className="font-rel-heading text-4xl font-black tabular-nums">
                  <NumeroQueCuenta valor={86} sufijo=" %" />
                </p>
                <Button variant="relOutline" onClick={() => setRepeticion((r) => r + 1)}>
                  Repetir
                </Button>
              </div>
            </Pieza>
          </Seccion>

          <Seccion
            id="tareas"
            titulo="Tareas y tableros"
            descripcion="Lista, tablero y detalle sobre un modelo común (`TareaVista`). Se adapta el dominio una vez y se recibe todo. Arrastra una tarjeta, ábrela, cambia de vista; mover a un estado que cierra una decisión pide motivo."
          >
            <Pieza
              nombre="VistaTareas · Tablero · ListaTareas · PanelTarea · DialogoTransicion"
              archivo="shared/ui/tablero/"
              cuando="Para Licitaciones y para cualquier gestor de tareas. Datos de ejemplo con la forma de Licitaciones; la receta de adaptación está en `pages/dev/DemoTablero.tsx`."
            >
              <DemoTablero />
            </Pieza>
          </Seccion>

          <Seccion
            id="superposiciones"
            titulo="Superposiciones"
            descripcion="Diálogo para decidir; panel lateral para llenar un formulario sin perder el contexto."
          >
            <Pieza
              nombre="DialogoCasa · PanelLateral"
              archivo="shared/ui/DialogoCasa.tsx · PanelLateral.tsx"
              cuando="Diálogo: una decisión corta. Panel: crear o editar algo con varios campos."
            >
              <div className="flex flex-wrap gap-3">
                <Button variant="relOutline" onClick={() => setDialogo(true)}>
                  Abrir diálogo
                </Button>
                <Button variant="relOutline" onClick={() => setLateral(true)}>
                  Abrir panel lateral
                </Button>
              </div>
              <DialogoCasa
                abierto={dialogo}
                alCerrar={() => setDialogo(false)}
                titulo="¿Archivar este curso?"
                descripcion="Dejará de aparecer en las asignaciones nuevas."
                tono="aviso"
                acciones={
                  <>
                    <Button variant="relOutline" onClick={() => setDialogo(false)}>
                      Cancelar
                    </Button>
                    <Button variant="rel" onClick={() => setDialogo(false)}>
                      Archivar
                    </Button>
                  </>
                }
              />
              <PanelLateral
                abierto={lateral}
                alCerrar={() => setLateral(false)}
                titulo="Nuevo curso"
                descripcion="Datos básicos."
                acciones={
                  <Button variant="rel" onClick={() => setLateral(false)}>
                    Guardar
                  </Button>
                }
              >
                <Campo id="k-curso" etiqueta="Nombre del curso">
                  <Input />
                </Campo>
              </PanelLateral>
            </Pieza>
          </Seccion>

          <Seccion
            id="ilustraciones"
            titulo="Ilustraciones"
            descripcion="Se piden por nombre al registro, nunca por ruta. Solo con intención: ayudan a entender un estado, no rellenan."
          >
            <div>
              <label htmlFor="k-buscar" className="text-sm font-semibold">
                Buscar por nombre
              </label>
              <Input
                id="k-buscar"
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                placeholder="Ej.: evaluation, certificate…"
                className="mt-1 max-w-sm"
              />
              <p className="mt-2 text-xs text-rel-muted" aria-live="polite">
                {escenas.length} de {Object.keys(illustrationRegistry).length} escenas
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {escenas.map((n) => (
                <li key={n}>
                  <Caja papel="caja" aire="ajustado" className="h-full">
                    <IllustrationSurface tone="lavender" className="aspect-square p-2">
                      <Illustration name={n} size="full" decorative className="h-full" />
                    </IllustrationSurface>
                    <p className="mt-2 break-all text-xs font-semibold">{n}</p>
                    <p className="text-[11px] text-rel-muted">{illustrationRegistry[n].variant}</p>
                  </Caja>
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion
            id="iconos"
            titulo="Iconos"
            descripcion="Una sola librería (Lucide). Decorativo: aria-hidden. Informativo: con nombre accesible. El color lo da el significado, no el gusto."
          >
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
              {ICONOS.map(([Icono, nombre]) => (
                <li
                  key={nombre}
                  className="flex flex-col items-center gap-2 rounded-rel-card border border-rel-border bg-rel-surface p-4 text-center"
                >
                  <Icono className="h-5 w-5 text-rel-primary" aria-hidden="true" />
                  <span className="text-xs text-rel-muted">{nombre}</span>
                </li>
              ))}
            </ul>
          </Seccion>
        </main>
      </div>
    </div>
  );
}
