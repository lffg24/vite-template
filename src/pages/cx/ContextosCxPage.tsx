import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building2, Link2, Pencil, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel, TablaBody, TablaHead, TablaPanel } from "@/shared/ui/Panel";
import { useToast } from "@/hooks/use-toast";
import {
  cambiarEstadoContexto, crearSede, crearServicio, desvincularServicio,
  editarSede, editarServicio, listarContextos, listarServiciosDeSede, vincularServicio,
} from "@/services/cxContextosService";
import type { SedeCx, ServicioCx, ServicioDeSede, TipoContexto } from "@/types/cxContextos";

type Fila = SedeCx | ServicioCx;
type Formulario = { codigo: string; nombre: string; detalle: string };
const VACIO: Formulario = { codigo: "", nombre: "", detalle: "" };

export default function ContextosCxPage() {
  const { toast } = useToast();
  const [tipo, setTipo] = useState<TipoContexto>("sedes");
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState("");
  const [estado, setEstado] = useState<"activos" | "inactivos" | "todos">("activos");
  const [filas, setFilas] = useState<Fila[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [historial, setHistorial] = useState<(string | null)[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [edicion, setEdicion] = useState<Fila | "nuevo" | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(VACIO);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aCambiar, setACambiar] = useState<Fila | null>(null);
  const [sedeVinculos, setSedeVinculos] = useState<SedeCx | null>(null);

  const recargar = useCallback(() => setRevision((n) => n + 1), []);
  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    listarContextos<Fila>(tipo, {
      buscar: consulta, activo: estado === "todos" ? null : estado === "activos", cursor, limite: 20,
    }).then((pagina) => {
      if (!vigente) return;
      setFilas(pagina.items);
      setSiguiente(pagina.siguiente_cursor);
    }).catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [tipo, consulta, estado, cursor, revision]);

  function reiniciarPagina() { setCursor(null); setHistorial([]); }
  function abrirFormulario(fila: Fila | "nuevo") {
    setEdicion(fila);
    setErrorFormulario("");
    setFormulario(fila === "nuevo" ? VACIO : {
      codigo: fila.codigo, nombre: fila.nombre,
      detalle: tipo === "sedes" ? (fila as SedeCx).zona_horaria : (fila as ServicioCx).sector || "",
    });
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    if (!formulario.codigo.trim() || !formulario.nombre.trim() || (tipo === "sedes" && !formulario.detalle.trim())) {
      setErrorFormulario("Completa los campos obligatorios.");
      return;
    }
    setGuardando(true);
    setErrorFormulario("");
    try {
      const nombre = formulario.nombre.trim();
      if (tipo === "sedes") {
        const datos = { nombre, zona_horaria: formulario.detalle.trim() };
        if (edicion === "nuevo") await crearSede({ ...datos, codigo: formulario.codigo.trim() });
        else if (edicion) await editarSede(edicion.id, datos);
      } else {
        const datos = { nombre, sector: formulario.detalle.trim() || null };
        if (edicion === "nuevo") await crearServicio({ ...datos, codigo: formulario.codigo.trim() });
        else if (edicion) await editarServicio(edicion.id, datos);
      }
      setEdicion(null);
      recargar();
      toast({ title: edicion === "nuevo" ? "Registro creado" : "Cambios guardados" });
    } catch (e) { setErrorFormulario((e as Error).message); }
    finally { setGuardando(false); }
  }

  async function cambiarEstado() {
    if (!aCambiar) return;
    setGuardando(true);
    try {
      await cambiarEstadoContexto(tipo, aCambiar.id, !aCambiar.activo);
      setACambiar(null);
      recargar();
      toast({ title: "Estado actualizado" });
    } catch (e) { setError((e as Error).message); setACambiar(null); }
    finally { setGuardando(false); }
  }

  const etiqueta = tipo === "sedes" ? "sede" : "servicio";
  return <div className="space-y-6">
    <PageHeader antetitulo="Experiencia del cliente" titulo="Sedes y servicios" icono={Building2}
      descripcion="Organiza dónde se presta el servicio y qué experiencias se pueden calificar."
      accion={<Button variant="rel" className="w-full sm:w-auto" onClick={() => abrirFormulario("nuevo")}><Plus aria-hidden="true" /> Nuevo {etiqueta}</Button>} />

    <Panel>
      <div className="flex flex-wrap gap-2 border-b border-rel-border pb-4" role="group" aria-label="Tipo de catálogo">
        {(["sedes", "servicios"] as const).map((opcion) => <Button key={opcion} type="button"
          variant={tipo === opcion ? "rel" : "relOutline"} aria-pressed={tipo === opcion}
          onClick={() => { setTipo(opcion); reiniciarPagina(); }}>
          {opcion === "sedes" ? "Sedes" : "Servicios"}</Button>)}
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <form onSubmit={(e) => { e.preventDefault(); setConsulta(busqueda.trim()); reiniciarPagina(); }} className="flex min-w-0 flex-1 gap-2">
          <div className="min-w-0 flex-1"><Label htmlFor="buscar-contexto">Buscar por código o nombre</Label>
            <Input id="buscar-contexto" type="search" value={busqueda} maxLength={80} onChange={(e) => setBusqueda(e.target.value)} /></div>
          <Button type="submit" variant="relOutline" className="self-end" aria-label="Buscar"><Search aria-hidden="true" /></Button>
        </form>
        <div><Label htmlFor="estado-contexto">Estado</Label>
          <select id="estado-contexto" value={estado} onChange={(e) => { setEstado(e.target.value as typeof estado); reiniciarPagina(); }}
            className="flex h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary sm:w-40">
            <option value="activos">Activos</option><option value="inactivos">Inactivos</option><option value="todos">Todos</option>
          </select></div>
      </div>

      {cargando ? <p role="status" className="py-8 text-rel-muted">Cargando {tipo}…</p> : null}
      {error ? <div role="alert" className="mt-5 rounded-rel-card border border-rel-danger/30 p-4 text-rel-danger">
        <p>{error}</p><Button type="button" variant="relOutline" className="mt-3" onClick={recargar}>Reintentar</Button></div> : null}
      {!cargando && !error && filas.length === 0 ? <p className="py-8 text-rel-muted">No hay {tipo} para este filtro.</p> : null}
      {!cargando && !error && filas.length > 0 ? <>
        <div className="mt-5 space-y-3 md:hidden">{filas.map((fila) => <article key={fila.id} className="rounded-rel-card border border-rel-border p-4">
          <div className="flex items-start justify-between gap-2"><div className="min-w-0"><strong className="block break-words text-rel-dark">{fila.nombre}</strong><span className="text-sm text-rel-muted">{fila.codigo}</span></div>
            <Badge variant={fila.activo ? "relSuccess" : "relNeutral"}>{fila.activo ? "Activa" : "Inactiva"}</Badge></div>
          <p className="mt-2 text-sm text-rel-muted">{tipo === "sedes" ? (fila as SedeCx).zona_horaria : (fila as ServicioCx).sector || "Sin sector"}</p>
          <Acciones fila={fila} esSede={tipo === "sedes"} editar={abrirFormulario} estado={setACambiar} vinculos={setSedeVinculos} />
        </article>)}</div>
        <div className="mt-5 hidden md:block"><TablaPanel><table className="w-full min-w-[680px] text-left text-sm"><caption className="sr-only">Catálogo de {tipo}</caption>
          <TablaHead><tr><th scope="col" className="p-4">Código</th><th scope="col" className="p-4">Nombre</th><th scope="col" className="p-4">{tipo === "sedes" ? "Zona horaria" : "Sector"}</th><th scope="col" className="p-4">Estado</th><th scope="col" className="p-4">Acciones</th></tr></TablaHead>
          <TablaBody>{filas.map((fila) => <tr key={fila.id}><td className="p-4 font-medium">{fila.codigo}</td><td className="p-4">{fila.nombre}</td><td className="p-4">{tipo === "sedes" ? (fila as SedeCx).zona_horaria : (fila as ServicioCx).sector || "—"}</td>
            <td className="p-4"><Badge variant={fila.activo ? "relSuccess" : "relNeutral"}>{fila.activo ? "Activo" : "Inactivo"}</Badge></td>
            <td className="p-4"><Acciones fila={fila} esSede={tipo === "sedes"} editar={abrirFormulario} estado={setACambiar} vinculos={setSedeVinculos} /></td></tr>)}</TablaBody>
        </table></TablaPanel></div>
      </> : null}
      {!cargando && !error ? <div className="mt-4 flex items-center justify-between gap-3">
        <Button type="button" variant="relOutline" disabled={historial.length === 0} onClick={() => { setCursor(historial[historial.length - 1]); setHistorial((h) => h.slice(0, -1)); }}>Anterior</Button>
        <span className="text-sm text-rel-muted">Página {historial.length + 1}</span>
        <Button type="button" variant="relOutline" disabled={!siguiente} onClick={() => { setHistorial((h) => [...h, cursor]); setCursor(siguiente); }}>Siguiente</Button>
      </div> : null}
    </Panel>

    <Sheet open={edicion !== null} onOpenChange={(v) => { if (!v && !guardando) setEdicion(null); }}>
      <SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg"><SheetHeader>
        <SheetTitle className="font-rel-heading text-rel-dark">{edicion === "nuevo" ? "Nuevo" : "Editar"} {etiqueta}</SheetTitle>
        <SheetDescription>El código identifica el registro y no cambia después de crearlo.</SheetDescription>
      </SheetHeader><form onSubmit={guardar} className="mt-6 space-y-5" noValidate>
        <div><Label htmlFor="cx-codigo">Código *</Label><Input id="cx-codigo" value={formulario.codigo} disabled={edicion !== "nuevo" || guardando} maxLength={32} onChange={(e) => setFormulario({ ...formulario, codigo: e.target.value })} /></div>
        <div><Label htmlFor="cx-nombre">Nombre *</Label><Input id="cx-nombre" value={formulario.nombre} disabled={guardando} maxLength={160} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} /></div>
        <div><Label htmlFor="cx-detalle">{tipo === "sedes" ? "Zona horaria *" : "Sector"}</Label><Input id="cx-detalle" value={formulario.detalle} disabled={guardando} maxLength={tipo === "sedes" ? 64 : 100} placeholder={tipo === "sedes" ? "America/Bogota" : "Opcional"} onChange={(e) => setFormulario({ ...formulario, detalle: e.target.value })} /></div>
        {errorFormulario ? <p role="alert" className="text-sm text-rel-danger">{errorFormulario}</p> : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="relOutline" disabled={guardando} onClick={() => setEdicion(null)}>Cancelar</Button><Button type="submit" variant="rel" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button></div>
      </form></SheetContent>
    </Sheet>

    <AlertDialog open={aCambiar !== null} onOpenChange={(v) => { if (!v && !guardando) setACambiar(null); }}><AlertDialogContent className="rel-scope font-rel-body">
      <AlertDialogHeader><AlertDialogTitle>{aCambiar?.activo ? "Desactivar" : "Activar"} {etiqueta}</AlertDialogTitle>
        <AlertDialogDescription>{aCambiar?.activo ? "Dejará de estar disponible para nuevas calificaciones. Sus registros históricos se conservan." : "Volverá a estar disponible para nuevas calificaciones."}</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter><AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel><Button type="button" variant={aCambiar?.activo ? "relDanger" : "rel"} disabled={guardando} onClick={cambiarEstado}>{guardando ? "Actualizando…" : "Confirmar"}</Button></AlertDialogFooter>
    </AlertDialogContent></AlertDialog>

    <VinculosSheet sede={sedeVinculos} cerrar={() => setSedeVinculos(null)} />
  </div>;
}

function Acciones({ fila, esSede, editar, estado, vinculos }: { fila: Fila; esSede: boolean; editar: (fila: Fila) => void; estado: (fila: Fila) => void; vinculos: (sede: SedeCx) => void }) {
  return <div className="mt-3 flex flex-wrap gap-2 md:mt-0">
    <Button type="button" size="sm" variant="relOutline" onClick={() => editar(fila)}><Pencil aria-hidden="true" /> Editar</Button>
    {esSede && fila.activo ? <Button type="button" size="sm" variant="relOutline" onClick={() => vinculos(fila as SedeCx)}><Link2 aria-hidden="true" /> Servicios</Button> : null}
    <Button type="button" size="sm" variant="relGhost" onClick={() => estado(fila)}>{fila.activo ? "Desactivar" : "Activar"}</Button>
  </div>;
}

function VinculosSheet({ sede, cerrar }: { sede: SedeCx | null; cerrar: () => void }) {
  const [vinculados, setVinculados] = useState<ServicioDeSede[]>([]);
  const [disponibles, setDisponibles] = useState<ServicioCx[]>([]);
  const [buscar, setBuscar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!sede) return;
    let vigente = true;
    setCargando(true);
    Promise.all([listarServiciosDeSede(sede.id), listarContextos<ServicioCx>("servicios", { buscar, activo: true, limite: 50 })])
      .then(([relaciones, pagina]) => { if (vigente) { setVinculados(relaciones); setDisponibles(pagina.items); setError(""); } })
      .catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [sede, buscar, revision]);
  async function alternar(servicioId: string, vinculado: boolean) {
    if (!sede) return;
    setOcupado(servicioId);
    try {
      if (vinculado) await desvincularServicio(sede.id, servicioId);
      else await vincularServicio(sede.id, servicioId);
      setRevision((n) => n + 1);
    } catch (e) { setError((e as Error).message); }
    finally { setOcupado(null); }
  }
  return <Sheet open={sede !== null} onOpenChange={(v) => { if (!v && !ocupado) cerrar(); }}><SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg">
    <SheetHeader><SheetTitle>Servicios de {sede?.nombre}</SheetTitle><SheetDescription>Vincula los servicios que se ofrecen en esta sede. Las relaciones anteriores quedan en el historial.</SheetDescription></SheetHeader>
    <div className="mt-6 space-y-4">
      <section aria-labelledby="servicios-vinculados"><h3 id="servicios-vinculados" className="font-semibold text-rel-dark">Vinculados ({vinculados.length})</h3>
        {!cargando && vinculados.length === 0 ? <p className="mt-2 text-sm text-rel-muted">Esta sede aún no tiene servicios vinculados.</p> : null}
        <ul className="mt-2 space-y-2">{vinculados.map((v) => <li key={v.id} className="flex items-center justify-between gap-2 rounded-rel-card border border-rel-border p-3">
          <span className="min-w-0"><strong className="block break-words">{v.nombre}</strong><span className="text-sm text-rel-muted">{v.codigo}</span></span>
          <Button type="button" variant="relOutline" size="sm" disabled={ocupado !== null} onClick={() => alternar(v.servicio_id, true)}>{ocupado === v.servicio_id ? "Guardando…" : "Desvincular"}</Button>
        </li>)}</ul>
      </section>
      <div><Label htmlFor="cx-buscar-servicio">Buscar servicio activo para vincular</Label><Input id="cx-buscar-servicio" type="search" value={buscar} maxLength={80} onChange={(e) => setBuscar(e.target.value)} /></div>
      {error ? <p role="alert" className="text-sm text-rel-danger">{error}</p> : null}
      {cargando ? <p role="status" className="text-rel-muted">Cargando servicios…</p> : null}
      {!cargando && disponibles.length === 0 ? <p className="text-rel-muted">No hay servicios activos para esta búsqueda.</p> : null}
      {!cargando ? <ul className="space-y-2">{disponibles.filter((s) => !vinculados.some((v) => v.servicio_id === s.id)).map((servicio) => <li key={servicio.id} className="flex items-center justify-between gap-2 rounded-rel-card border border-rel-border p-3">
        <span className="min-w-0"><strong className="block break-words">{servicio.nombre}</strong><span className="text-sm text-rel-muted">{servicio.codigo}</span></span>
        <Button type="button" variant="rel" size="sm" disabled={ocupado !== null} onClick={() => alternar(servicio.id, false)}>{ocupado === servicio.id ? "Guardando…" : "Vincular"}</Button>
      </li>)}</ul> : null}
    </div>
  </SheetContent></Sheet>;
}
