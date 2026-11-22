import { useEffect, useState, type FormEvent } from "react";
import { DialogoConfirmacion } from "@/shared/ui/DialogoConfirmacion";
import { Link } from "react-router-dom";
import { Layers3, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Casilla } from "@/shared/ui/Casilla";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Aviso } from "@/shared/ui/Aviso";
import { Pill } from "@/shared/ui/Pill";
import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "@/shared/ui/TablaDatos";
import { useToast } from "@/hooks/use-toast";
import { listarContextos } from "@/services/cxContextosService";
import { cambiarEstadoCatalogoCx, crearCatalogoCx, editarCatalogoCx, guardarAplicabilidad, listarCatalogoCx, obtenerAplicabilidad } from "@/services/cxPuntosFactoresService";
import type { SedeCx, ServicioCx } from "@/types/cxContextos";
import type { AplicabilidadCx, FactorCx, SubfactorCx } from "@/types/cxPuntosFactores";
import { Desplegable } from "@/shared/ui/Desplegable";

/** Columnas de factores: una declaracion para la tabla y la tarjeta. */
function columnasFactor(
  editar: (f: FactorCx) => void,
  verDetalle: (f: FactorCx) => void,
  cambiarEstado: (f: FactorCx) => void,
): ColumnaTabla<FactorCx>[] {
  return [
    { clave: "codigo", titulo: "C\u00f3digo", celda: (f) => f.codigo, valor: (f) => f.codigo },
    {
      clave: "nombre",
      titulo: "Factor",
      movil: "titular",
      celda: (f) => <CeldaPrincipal titulo={f.nombre} alAbrir={() => editar(f)} />,
      valor: (f) => f.nombre,
    },
    {
      clave: "estado",
      titulo: "Estado",
      celda: (f) => <Pill tono={f.activo ? "exito" : "neutro"}>{f.activo ? "Activo" : "Inactivo"}</Pill>,
      valor: (f) => (f.activo ? "Activo" : "Inactivo"),
    },
    {
      clave: "acciones",
      titulo: "Acciones",
      soloAcciones: true,
      alineacion: "derecha",
      celda: (f) => <Acciones factor={f} editar={editar} detalle={verDetalle} estado={cambiarEstado} />,
    },
  ];
}

export default function FactoresCxPage() {
  const { toast } = useToast();
  const [filas, setFilas] = useState<FactorCx[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [historial, setHistorial] = useState<(string | null)[]>([]);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");
  const [estado, setEstado] = useState<"activos" | "todos">("activos");
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [edicion, setEdicion] = useState<FactorCx | "nuevo" | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aCambiar, setACambiar] = useState<FactorCx | null>(null);
  const [detalle, setDetalle] = useState<FactorCx | null>(null);

  useEffect(() => {
    let vigente = true; setCargando(true); setError("");
    listarCatalogoCx<FactorCx>("factores", { buscar: consulta, activo: estado === "activos" ? true : null, cursor, limite: 20 })
      .then((pagina) => { if (vigente) { setFilas(pagina.items); setSiguiente(pagina.siguiente_cursor); } })
      .catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [consulta, estado, cursor, revision]);

  function abrir(fila: FactorCx | "nuevo") {
    setEdicion(fila); setErrorFormulario("");
    setCodigo(fila === "nuevo" ? "" : fila.codigo); setNombre(fila === "nuevo" ? "" : fila.nombre);
  }
  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) { setErrorFormulario("Completa código y nombre."); return; }
    setGuardando(true); setErrorFormulario("");
    try {
      if (edicion === "nuevo") await crearCatalogoCx<FactorCx>("factores", { codigo: codigo.trim(), nombre: nombre.trim() });
      else if (edicion) await editarCatalogoCx<FactorCx>("factores", edicion.id, { nombre: nombre.trim() });
      setEdicion(null); setRevision((n) => n + 1); toast({ title: "Factor guardado" });
    } catch (e) { setErrorFormulario((e as Error).message); }
    finally { setGuardando(false); }
  }
  async function cambiar() {
    if (!aCambiar) return;
    setGuardando(true);
    try { await cambiarEstadoCatalogoCx<FactorCx>("factores", aCambiar.id, !aCambiar.activo); setACambiar(null); setRevision((n) => n + 1); toast({ title: "Estado actualizado" }); }
    catch (e) { setError((e as Error).message); setACambiar(null); }
    finally { setGuardando(false); }
  }
  return <div className="space-y-6"><PageHeader antetitulo="Configuración CX" titulo="Factores de experiencia" icono={Layers3}
    descripcion="Define qué aspectos del servicio se califican y en qué sedes o servicios aplican."
    accion={<Button variant="rel" className="w-full sm:w-auto" onClick={() => abrir("nuevo")}><Plus aria-hidden="true" /> Nuevo factor</Button>} />
    <Link to="/cx/configuracion/contextos" className="inline-block text-sm font-semibold text-primary underline-offset-2 hover:underline">← Sedes y servicios</Link>
    {error ? <Aviso titulo="No pudimos cargar los factores" acciones={<Button type="button" variant="relOutline" size="sm" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button>}>{error}</Aviso> : null}
    <TablaDatos
      filas={error ? [] : filas}
      columnas={columnasFactor(abrir, setDetalle, setACambiar)}
      claveFila={(f) => String(f.id)}
      etiquetaTabla="Factores de experiencia"
      etiquetaElemento="factores"
      cargando={cargando}
      vacio="No hay factores para este filtro."
      cabecera={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <form className="flex min-w-0 flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setConsulta(buscar.trim()); setCursor(null); setHistorial([]); }}>
            <div className="min-w-0 flex-1"><Label htmlFor="buscar-factor">Buscar factor</Label><Input id="buscar-factor" type="search" maxLength={80} value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div>
            <Button type="submit" variant="relOutline" className="self-end" aria-label="Buscar"><Search aria-hidden="true" /></Button>
          </form>
          <div>
            <Label htmlFor="estado-factor">Estado</Label>
            <Desplegable id="estado-factor" value={estado} onChange={(e) => { setEstado(e.target.value as typeof estado); setCursor(null); setHistorial([]); }} className="sm:w-40"><option value="activos">Activos</option><option value="todos">Todos</option></Desplegable>
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
    <Sheet open={edicion !== null} onOpenChange={(v) => { if (!v && !guardando) setEdicion(null); }}><SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg"><SheetHeader><SheetTitle>{edicion === "nuevo" ? "Nuevo" : "Editar"} factor</SheetTitle><SheetDescription>El código es estable. Los subfactores y su aplicabilidad se configuran después.</SheetDescription></SheetHeader><form onSubmit={guardar} className="mt-6 space-y-5" noValidate><div><Label htmlFor="factor-codigo">Código *</Label><Input id="factor-codigo" value={codigo} disabled={edicion !== "nuevo" || guardando} maxLength={32} onChange={(e) => setCodigo(e.target.value)} /></div><div><Label htmlFor="factor-nombre">Nombre *</Label><Input id="factor-nombre" value={nombre} disabled={guardando} maxLength={160} onChange={(e) => setNombre(e.target.value)} /></div>{errorFormulario ? <p role="alert" className="text-sm text-rel-danger">{errorFormulario}</p> : null}<div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="relOutline" disabled={guardando} onClick={() => setEdicion(null)}>Cancelar</Button><Button type="submit" variant="rel" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button></div></form></SheetContent></Sheet>
    <DialogoConfirmacion
      abierto={aCambiar !== null}
      alCerrar={() => setACambiar(null)}
      tono={aCambiar?.activo ? "peligro" : "neutro"}
      titulo={`${aCambiar?.activo ? "Desactivar" : "Activar"} factor`}
      descripcion={aCambiar?.activo ? "Sus vínculos vigentes se cerrarán. El historial y las calificaciones existentes permanecen." : "Podrás volver a configurar dónde aplica."}
      etiquetaOcupado="Actualizando…"
      ocupado={guardando}
      alConfirmar={() => void cambiar()}
    />
    <FactorDetalleSheet factor={detalle} cerrar={() => setDetalle(null)} />
  </div>;
}

function Acciones({ factor, editar, detalle, estado }: { factor: FactorCx; editar: (f: FactorCx) => void; detalle: (f: FactorCx) => void; estado: (f: FactorCx) => void }) {
  return <div className="mt-3 flex flex-wrap gap-2 md:mt-0"><Button size="sm" variant="relOutline" onClick={() => detalle(factor)}>Configurar</Button><Button size="sm" variant="relOutline" onClick={() => editar(factor)}>Editar</Button><Button size="sm" variant="relGhost" onClick={() => estado(factor)}>{factor.activo ? "Desactivar" : "Activar"}</Button></div>;
}

function FactorDetalleSheet({ factor, cerrar }: { factor: FactorCx | null; cerrar: () => void }) {
  const [seccion, setSeccion] = useState<"subfactores" | "aplicabilidad">("subfactores");
  const [subfactores, setSubfactores] = useState<SubfactorCx[]>([]);
  const [subCursor, setSubCursor] = useState<string | null>(null);
  const [subSiguiente, setSubSiguiente] = useState<string | null>(null);
  const [subHistorial, setSubHistorial] = useState<(string | null)[]>([]);
  const [editarSub, setEditarSub] = useState<SubfactorCx | "nuevo" | null>(null);
  const [subCodigo, setSubCodigo] = useState("");
  const [subNombre, setSubNombre] = useState("");
  const [aplica, setAplica] = useState<AplicabilidadCx | null>(null);
  const [sedeIds, setSedeIds] = useState<string[]>([]);
  const [servicioIds, setServicioIds] = useState<string[]>([]);
  const [sedes, setSedes] = useState<SedeCx[]>([]);
  const [servicios, setServicios] = useState<ServicioCx[]>([]);
  const [buscarSede, setBuscarSede] = useState("");
  const [buscarServicio, setBuscarServicio] = useState("");
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!factor) return;
    let vigente = true; setCargando(true); setError("");
    listarCatalogoCx<SubfactorCx>("subfactores", { activo: null, cursor: subCursor, limite: 20 }, factor.id)
      .then((pagina) => { if (vigente) { setSubfactores(pagina.items); setSubSiguiente(pagina.siguiente_cursor); } })
      .catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [factor, subCursor, revision]);
  useEffect(() => {
    if (!factor) return;
    let vigente = true;
    obtenerAplicabilidad(factor.id).then((a) => { if (vigente) { setAplica(a); setSedeIds(a.sede_ids); setServicioIds(a.servicio_ids); } })
      .catch((e: Error) => { if (vigente) setError(e.message); });
    return () => { vigente = false; };
  }, [factor, revision]);
  useEffect(() => {
    if (!factor || seccion !== "aplicabilidad") return;
    let vigente = true;
    Promise.all([
      listarContextos<SedeCx>("sedes", { buscar: buscarSede, activo: true, limite: 50 }),
      listarContextos<ServicioCx>("servicios", { buscar: buscarServicio, activo: true, limite: 50 }),
    ]).then(([s, v]) => { if (vigente) { setSedes(s.items); setServicios(v.items); } })
      .catch((e: Error) => { if (vigente) setError(e.message); });
    return () => { vigente = false; };
  }, [factor, seccion, buscarSede, buscarServicio]);

  function abrirSub(sub: SubfactorCx | "nuevo") { setEditarSub(sub); setSubCodigo(sub === "nuevo" ? "" : sub.codigo); setSubNombre(sub === "nuevo" ? "" : sub.nombre); setError(""); }
  async function guardarSub(e: FormEvent) {
    e.preventDefault(); if (!factor) return;
    if (!subCodigo.trim() || !subNombre.trim()) { setError("Completa código y nombre del subfactor."); return; }
    setGuardando(true); setError("");
    try {
      if (editarSub === "nuevo") await crearCatalogoCx<SubfactorCx>("subfactores", { codigo: subCodigo.trim(), nombre: subNombre.trim(), factor_id: factor.id });
      else if (editarSub) await editarCatalogoCx<SubfactorCx>("subfactores", editarSub.id, { nombre: subNombre.trim() });
      setEditarSub(null); setRevision((n) => n + 1); toast({ title: "Subfactor guardado" });
    } catch (e) { setError((e as Error).message); } finally { setGuardando(false); }
  }
  async function estadoSub(sub: SubfactorCx) {
    setGuardando(true); setError("");
    try { await cambiarEstadoCatalogoCx<SubfactorCx>("subfactores", sub.id, !sub.activo); setRevision((n) => n + 1); }
    catch (e) { setError((e as Error).message); } finally { setGuardando(false); }
  }
  async function guardarAmbitos() {
    if (!factor) return;
    setGuardando(true); setError("");
    try { await guardarAplicabilidad(factor.id, { sede_ids: sedeIds, servicio_ids: servicioIds }); setRevision((n) => n + 1); toast({ title: "Aplicabilidad guardada" }); }
    catch (e) { setError((e as Error).message); } finally { setGuardando(false); }
  }
  function alternar(id: string, lista: string[], guardar: (items: string[]) => void) { guardar(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]); }
  return <Sheet open={factor !== null} onOpenChange={(v) => { if (!v && !guardando) cerrar(); }}><SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-xl"><SheetHeader><SheetTitle>{factor?.nombre}</SheetTitle><SheetDescription>Subfactores y lugares donde aplica este factor.</SheetDescription></SheetHeader>
    <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Configuración del factor"><Button variant={seccion === "subfactores" ? "rel" : "relOutline"} aria-pressed={seccion === "subfactores"} onClick={() => setSeccion("subfactores")}>Subfactores</Button><Button variant={seccion === "aplicabilidad" ? "rel" : "relOutline"} aria-pressed={seccion === "aplicabilidad"} onClick={() => setSeccion("aplicabilidad")}>Aplicabilidad</Button></div>
    {error ? <p role="alert" className="mt-4 text-sm text-rel-danger">{error}</p> : null}
    {seccion === "subfactores" ? <div className="mt-5 space-y-4"><Button variant="relOutline" disabled={!factor?.activo} onClick={() => abrirSub("nuevo")}><Plus aria-hidden="true" /> Nuevo subfactor</Button>
      {editarSub ? <form onSubmit={guardarSub} className="space-y-3 rounded-rel-card border border-rel-border p-4" noValidate><div><Label htmlFor="sub-codigo">Código *</Label><Input id="sub-codigo" value={subCodigo} disabled={editarSub !== "nuevo" || guardando} maxLength={32} onChange={(e) => setSubCodigo(e.target.value)} /></div><div><Label htmlFor="sub-nombre">Nombre *</Label><Input id="sub-nombre" value={subNombre} disabled={guardando} maxLength={160} onChange={(e) => setSubNombre(e.target.value)} /></div><div className="flex flex-wrap gap-2"><Button type="submit" variant="rel" disabled={guardando}>Guardar</Button><Button type="button" variant="relOutline" disabled={guardando} onClick={() => setEditarSub(null)}>Cancelar</Button></div></form> : null}
      {cargando ? <p role="status" className="text-rel-muted">Cargando subfactores…</p> : null}
      {!cargando && subfactores.length === 0 ? <p className="text-rel-muted">Este factor aún no tiene subfactores.</p> : null}
      <ul className="space-y-2">{subfactores.map((sub) => <li key={sub.id} className="rounded-rel-card border border-rel-border p-3"><div className="flex justify-between gap-2"><div><strong className="block wrap-break-word">{sub.nombre}</strong><span className="text-sm text-rel-muted">{sub.codigo}</span></div><Pill tono={sub.activo ? "exito" : "neutro"}>{sub.activo ? "Activo" : "Inactivo"}</Pill></div><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="relOutline" onClick={() => abrirSub(sub)}>Editar</Button><Button size="sm" variant="relGhost" disabled={guardando || (!factor?.activo && !sub.activo)} onClick={() => estadoSub(sub)}>{sub.activo ? "Desactivar" : "Activar"}</Button></div></li>)}</ul>
      <div className="flex justify-between gap-2"><Button variant="relOutline" disabled={subHistorial.length === 0} onClick={() => { setSubCursor(subHistorial[subHistorial.length - 1]); setSubHistorial((h) => h.slice(0, -1)); }}>Anterior</Button><Button variant="relOutline" disabled={!subSiguiente} onClick={() => { setSubHistorial((h) => [...h, subCursor]); setSubCursor(subSiguiente); }}>Siguiente</Button></div>
    </div> : <div className="mt-5 space-y-5"><p className="text-sm text-rel-muted">Elige los contextos donde este factor puede usarse. Los cambios conservan la vigencia anterior.</p>
      <ReferenciaLista titulo="Sedes" id="buscar-sede-factor" buscar={buscarSede} setBuscar={setBuscarSede} seleccion={sedeIds} cambiar={(id) => alternar(id, sedeIds, setSedeIds)} seleccionadas={aplica?.sedes || []} candidatas={sedes} />
      <ReferenciaLista titulo="Servicios" id="buscar-servicio-factor" buscar={buscarServicio} setBuscar={setBuscarServicio} seleccion={servicioIds} cambiar={(id) => alternar(id, servicioIds, setServicioIds)} seleccionadas={aplica?.servicios || []} candidatas={servicios} />
      <Button variant="rel" className="w-full sm:w-auto" disabled={guardando || !factor?.activo} onClick={guardarAmbitos}>{guardando ? "Guardando…" : "Guardar aplicabilidad"}</Button>
    </div>}
  </SheetContent></Sheet>;
}

function ReferenciaLista({ titulo, id, buscar, setBuscar, seleccion, cambiar, seleccionadas, candidatas }: { titulo: string; id: string; buscar: string; setBuscar: (v: string) => void; seleccion: string[]; cambiar: (id: string) => void; seleccionadas: { id: string; nombre: string }[]; candidatas: { id: string; nombre: string }[] }) {
  const opciones = [...seleccionadas.filter((x) => seleccion.includes(x.id)), ...candidatas.filter((x) => !seleccionadas.some((s) => s.id === x.id))];
  return <section aria-label={titulo} className="rounded-rel-card border border-rel-border p-4"><h3 className="font-semibold text-rel-dark">{titulo} ({seleccion.length})</h3><div className="mt-3"><Label htmlFor={id}>Buscar {titulo.toLowerCase()}</Label><Input id={id} type="search" value={buscar} maxLength={80} onChange={(e) => setBuscar(e.target.value)} /></div><ul className="mt-3 max-h-52 space-y-1 overflow-y-auto">{opciones.map((opcion) => <li key={opcion.id}><Casilla claseEtiqueta="rounded-rel-control p-2 hover:bg-rel-surface-subtle" marcada={seleccion.includes(opcion.id)} alCambiar={() => cambiar(opcion.id)} etiqueta={<span className="wrap-break-word">{opcion.nombre}</span>} /></li>)}</ul>{opciones.length === 0 ? <p className="mt-3 text-sm text-rel-muted">No hay opciones para esta búsqueda.</p> : null}</section>;
}
