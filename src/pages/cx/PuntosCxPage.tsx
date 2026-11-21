import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MapPin, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Aviso } from "@/shared/ui/Aviso";
import { Pill } from "@/shared/ui/Pill";
import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import { useToast } from "@/hooks/use-toast";
import { listarContextos, listarServiciosDeSede, obtenerSede } from "@/services/cxContextosService";
import { cambiarEstadoCatalogoCx, crearCatalogoCx, editarCatalogoCx, listarCatalogoCx } from "@/services/cxPuntosFactoresService";
import type { SedeCx, ServicioDeSede } from "@/types/cxContextos";
import type { PuntoCx } from "@/types/cxPuntosFactores";
import { Desplegable } from "@/shared/ui/Desplegable";
import { Seleccion } from "@/shared/ui/Seleccion";

const VACIO = { codigo: "", nombre: "", sede_id: "", servicio_id: "" };

/**
 * Columnas de puntos de contacto: una declaracion para la tabla y la tarjeta.
 *
 * `movil: "titular"` en el nombre porque en una tarjeta el nombre es lo que se
 * lee primero; el codigo pasa a ser un par etiqueta/valor, que es mas claro
 * que la linea gris suelta que habia antes.
 */
function columnasPunto(
  editar: (p: PuntoCx) => void,
  cambiarEstado: (p: PuntoCx) => void,
): ColumnaTabla<PuntoCx>[] {
  return [
    { clave: "codigo", titulo: "C\u00f3digo", celda: (p) => p.codigo, valor: (p) => p.codigo },
    {
      clave: "nombre",
      titulo: "Nombre",
      movil: "titular",
      celda: (p) => <CeldaPrincipal titulo={p.nombre} alAbrir={() => editar(p)} />,
      valor: (p) => p.nombre,
    },
    {
      clave: "sede",
      titulo: "Sede",
      celda: (p) => p.sede_nombre || "Sede no disponible",
      valor: (p) => p.sede_nombre || "",
    },
    {
      clave: "servicio",
      titulo: "Servicio",
      celda: (p) => p.servicio_nombre || "\u2014",
      valor: (p) => p.servicio_nombre || "",
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (p) => <Pill tono={p.activo ? "exito" : "neutro"}>{p.activo ? "Activo" : "Inactivo"}</Pill>,
      valor: (p) => (p.activo ? "Activo" : "Inactivo"),
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      soloAcciones: true,
      alineacion: "derecha",
      celda: (p) => <Acciones punto={p} editar={editar} estado={cambiarEstado} />,
    },
  ];
}

export default function PuntosCxPage() {
  const { toast } = useToast();
  const [filas, setFilas] = useState<PuntoCx[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [historial, setHistorial] = useState<(string | null)[]>([]);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");
  const [estado, setEstado] = useState<"activos" | "todos">("activos");
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [edicion, setEdicion] = useState<PuntoCx | "nuevo" | null>(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [sedes, setSedes] = useState<SedeCx[]>([]);
  const [buscarSede, setBuscarSede] = useState("");
  const [servicios, setServicios] = useState<ServicioDeSede[]>([]);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aCambiar, setACambiar] = useState<PuntoCx | null>(null);
  const recargar = useCallback(() => setRevision((n) => n + 1), []);

  useEffect(() => {
    let vigente = true; setCargando(true); setError("");
    listarCatalogoCx<PuntoCx>("puntos", { buscar: consulta, activo: estado === "activos" ? true : null, cursor, limite: 20 })
      .then((pagina) => { if (vigente) { setFilas(pagina.items); setSiguiente(pagina.siguiente_cursor); } })
      .catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [consulta, estado, cursor, revision]);

  useEffect(() => {
    if (!edicion) return;
    let vigente = true;
    listarContextos<SedeCx>("sedes", { buscar: buscarSede, activo: true, limite: 50 })
      .then(async (pagina) => {
        if (!vigente) return;
        const actuales = pagina.items;
        if (formulario.sede_id && !actuales.some((s) => s.id === formulario.sede_id)) {
          try { actuales.unshift(await obtenerSede(formulario.sede_id)); } catch { /* el guardado explicará si dejó de estar disponible */ }
        }
        if (vigente) setSedes(actuales);
      }).catch((e: Error) => { if (vigente) setErrorFormulario(e.message); });
    return () => { vigente = false; };
  }, [edicion, buscarSede, formulario.sede_id]);

  useEffect(() => {
    if (!edicion || !formulario.sede_id) { setServicios([]); return; }
    let vigente = true;
    listarServiciosDeSede(formulario.sede_id)
      .then((items) => { if (vigente) setServicios(items); })
      .catch((e: Error) => { if (vigente) setErrorFormulario(e.message); });
    return () => { vigente = false; };
  }, [edicion, formulario.sede_id]);

  function abrir(fila: PuntoCx | "nuevo") {
    setEdicion(fila); setErrorFormulario(""); setBuscarSede("");
    setFormulario(fila === "nuevo" ? VACIO : { codigo: fila.codigo, nombre: fila.nombre, sede_id: fila.sede_id, servicio_id: fila.servicio_id || "" });
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!formulario.codigo.trim() || !formulario.nombre.trim() || !formulario.sede_id) { setErrorFormulario("Completa código, nombre y sede."); return; }
    setGuardando(true); setErrorFormulario("");
    try {
      const datos = { nombre: formulario.nombre.trim(), sede_id: formulario.sede_id, servicio_id: formulario.servicio_id || null };
      if (edicion === "nuevo") await crearCatalogoCx<PuntoCx>("puntos", { ...datos, codigo: formulario.codigo.trim() });
      else if (edicion) await editarCatalogoCx<PuntoCx>("puntos", edicion.id, datos);
      setEdicion(null); recargar(); toast({ title: "Punto de contacto guardado" });
    } catch (e) { setErrorFormulario((e as Error).message); }
    finally { setGuardando(false); }
  }

  async function cambiar() {
    if (!aCambiar) return;
    setGuardando(true);
    try { await cambiarEstadoCatalogoCx<PuntoCx>("puntos", aCambiar.id, !aCambiar.activo); setACambiar(null); recargar(); toast({ title: "Estado actualizado" }); }
    catch (e) { setError((e as Error).message); setACambiar(null); }
    finally { setGuardando(false); }
  }

  return <div className="space-y-6">
    <PageHeader antetitulo="Configuración CX" titulo="Puntos de contacto" icono={MapPin}
      descripcion="Ubica la experiencia que el cliente calificará dentro de una sede y, si corresponde, un servicio."
      accion={<Button variant="rel" className="w-full sm:w-auto" onClick={() => abrir("nuevo")}><Plus aria-hidden="true" /> Nuevo punto</Button>} />
    <Link className="inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline" to="/cx/configuracion/contextos">← Sedes y servicios</Link>
    {error ? <Aviso titulo="No pudimos cargar los puntos de contacto" acciones={<Button type="button" variant="relOutline" size="sm" onClick={recargar}>Reintentar</Button>}>{error}</Aviso> : null}
    <TablaDatos
      filas={error ? [] : filas}
      columnas={columnasPunto(abrir, setACambiar)}
      claveFila={(p) => String(p.id)}
      etiquetaTabla="Puntos de contacto"
      etiquetaElemento="puntos"
      cargando={cargando}
      vacio="No hay puntos de contacto para este filtro."
      escenaVacio="feedbackRating"
      cabecera={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form className="flex min-w-0 flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setConsulta(buscar.trim()); setCursor(null); setHistorial([]); }}>
            <div className="min-w-0 flex-1"><Label htmlFor="buscar-punto">Buscar punto</Label><Input id="buscar-punto" type="search" value={buscar} maxLength={80} onChange={(e) => setBuscar(e.target.value)} /></div>
            <Button variant="relOutline" type="submit" className="self-end" aria-label="Buscar"><Search aria-hidden="true" /></Button>
          </form>
          <div>
            <Label htmlFor="estado-puntos">Estado</Label>
            <Desplegable id="estado-puntos" value={estado} onChange={(e) => { setEstado(e.target.value as typeof estado); setCursor(null); setHistorial([]); }} className="sm:w-40"><option value="activos">Activos</option><option value="todos">Todos</option></Desplegable>
          </div>
        </div>
      }
      control={{
        modo: "cursor",
        pagina: historial.length + 1,
        hayAnterior: historial.length > 0,
        haySiguiente: Boolean(siguiente),
        onAnterior: () => { setCursor(historial[historial.length - 1]); setHistorial((h) => h.slice(0, -1)); },
        onSiguiente: () => { setHistorial((h) => [...h, cursor]); setCursor(siguiente); },
      }}
    />
    <Sheet open={edicion !== null} onOpenChange={(v) => { if (!v && !guardando) setEdicion(null); }}><SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg"><SheetHeader><SheetTitle>{edicion === "nuevo" ? "Nuevo" : "Editar"} punto de contacto</SheetTitle><SheetDescription>La sede es obligatoria. El servicio debe estar vinculado a ella.</SheetDescription></SheetHeader><form onSubmit={guardar} className="mt-6 space-y-5" noValidate>
      <div><Label htmlFor="punto-codigo">Código *</Label><Input id="punto-codigo" value={formulario.codigo} disabled={edicion !== "nuevo" || guardando} maxLength={32} onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })} /></div>
      <div><Label htmlFor="punto-nombre">Nombre *</Label><Input id="punto-nombre" value={formulario.nombre} disabled={guardando} maxLength={160} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} /></div>
      <div><Label htmlFor="buscar-sede">Buscar sede</Label><Input id="buscar-sede" type="search" value={buscarSede} maxLength={80} onChange={(e) => setBuscarSede(e.target.value)} /></div>
      <div><Label htmlFor="punto-sede">Sede *</Label><Seleccion id="punto-sede" valor={formulario.sede_id} deshabilitada={guardando} alCambiar={(v) => setFormulario({ ...formulario, sede_id: v, servicio_id: "" })} placeholder="Selecciona una sede" textoBusqueda="Buscar sede…" opciones={sedes.map((s) => ({ valor: String(s.id), etiqueta: s.nombre, descripcion: s.codigo }))} /></div>
      <div><Label htmlFor="punto-servicio">Servicio (opcional)</Label><Desplegable id="punto-servicio" value={formulario.servicio_id} disabled={!formulario.sede_id || guardando} onChange={(e) => setFormulario({ ...formulario, servicio_id: e.target.value })}><option value="">Sin servicio específico</option>{servicios.map((s) => <option key={s.servicio_id} value={s.servicio_id}>{s.codigo} · {s.nombre}</option>)}</Desplegable></div>
      {errorFormulario ? <p role="alert" className="text-sm text-rel-danger">{errorFormulario}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="relOutline" disabled={guardando} onClick={() => setEdicion(null)}>Cancelar</Button><Button type="submit" variant="rel" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button></div>
    </form></SheetContent></Sheet>
    <AlertDialog open={aCambiar !== null} onOpenChange={(v) => { if (!v && !guardando) setACambiar(null); }}><AlertDialogContent className="rel-scope font-rel-body"><AlertDialogHeader><AlertDialogTitle>{aCambiar?.activo ? "Desactivar" : "Activar"} punto</AlertDialogTitle><AlertDialogDescription>{aCambiar?.activo ? "Dejará de estar disponible para nuevas calificaciones; su historial permanece." : "Volverá a estar disponible si su sede y servicio siguen activos."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel><Button type="button" variant={aCambiar?.activo ? "relDanger" : "rel"} disabled={guardando} onClick={cambiar}>Confirmar</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Acciones({ punto, editar, estado }: { punto: PuntoCx; editar: (p: PuntoCx) => void; estado: (p: PuntoCx) => void }) {
  return <div className="mt-3 flex flex-wrap gap-2 md:mt-0"><Button size="sm" variant="relOutline" onClick={() => editar(punto)}>Editar</Button><Button size="sm" variant="relGhost" onClick={() => estado(punto)}>{punto.activo ? "Desactivar" : "Activar"}</Button></div>;
}
