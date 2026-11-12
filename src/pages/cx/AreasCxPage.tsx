import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Building2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel, TablaBody, TablaHead, TablaPanel } from "@/shared/ui/Panel";
import { useToast } from "@/hooks/use-toast";
import { cambiarEstadoAreaCx, crearAreaCx, editarAreaCx, listarAreasCx } from "@/services/cxAreasService";
import type { AreaCx } from "@/types/cxAreas";

export default function AreasCxPage() {
  const { toast } = useToast();
  const [filas, setFilas] = useState<AreaCx[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [historial, setHistorial] = useState<(number | null)[]>([]);
  const [siguiente, setSiguiente] = useState<number | null>(null);
  const [buscar, setBuscar] = useState("");
  const [consulta, setConsulta] = useState("");
  const [estado, setEstado] = useState<"activos" | "todos">("activos");
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [edicion, setEdicion] = useState<AreaCx | "nuevo" | null>(null);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [errorFormulario, setErrorFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [aCambiar, setACambiar] = useState<AreaCx | null>(null);

  useEffect(() => {
    let vigente = true;
    setCargando(true); setError("");
    listarAreasCx({ buscar: consulta, activo: estado === "activos" ? true : null, cursor, limite: 20 })
      .then((pagina) => { if (vigente) { setFilas(pagina.items); setSiguiente(pagina.siguiente_cursor); } })
      .catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [consulta, estado, cursor, revision]);

  function abrir(fila: AreaCx | "nuevo") {
    setEdicion(fila); setErrorFormulario("");
    setNombre(fila === "nuevo" ? "" : fila.nombre);
    setDescripcion(fila === "nuevo" ? "" : fila.descripcion || "");
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) { setErrorFormulario("Escribe el nombre del área."); return; }
    setGuardando(true); setErrorFormulario("");
    try {
      const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() || null };
      if (edicion === "nuevo") await crearAreaCx(datos);
      else if (edicion) await editarAreaCx(edicion.id, datos);
      setEdicion(null); setRevision((n) => n + 1); toast({ title: "Área guardada" });
    } catch (e) { setErrorFormulario((e as Error).message); }
    finally { setGuardando(false); }
  }

  async function cambiar() {
    if (!aCambiar) return;
    setGuardando(true); setError("");
    try {
      await cambiarEstadoAreaCx(aCambiar.id, !aCambiar.activo);
      setACambiar(null); setRevision((n) => n + 1); toast({ title: "Estado actualizado" });
    } catch (e) { setError((e as Error).message); setACambiar(null); }
    finally { setGuardando(false); }
  }

  return <div className="space-y-6">
    <PageHeader antetitulo="Configuración CX" titulo="Áreas responsables" icono={Building2}
      descripcion="Usa las áreas de tu empresa para asignar responsables a cada servicio."
      accion={<Button variant="rel" className="w-full sm:w-auto" onClick={() => abrir("nuevo")}><Plus aria-hidden="true" /> Nueva área</Button>} />
    <Panel>
      <Link className="text-sm font-semibold text-rel-primary underline-offset-2 hover:underline" to="/cx/configuracion/contextos">← Sedes y servicios</Link>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end">
        <form className="flex min-w-0 flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); setConsulta(buscar.trim()); setCursor(null); setHistorial([]); }}>
          <div className="min-w-0 flex-1"><Label htmlFor="buscar-area">Buscar área</Label><Input id="buscar-area" type="search" value={buscar} maxLength={80} onChange={(e) => setBuscar(e.target.value)} /></div>
          <Button type="submit" variant="relOutline" className="self-end" aria-label="Buscar"><Search aria-hidden="true" /></Button>
        </form>
        <div><Label htmlFor="estado-area">Estado</Label><select id="estado-area" value={estado} onChange={(e) => { setEstado(e.target.value as typeof estado); setCursor(null); setHistorial([]); }} className="flex h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary sm:w-40"><option value="activos">Activas</option><option value="todos">Todas</option></select></div>
      </div>
      {cargando ? <p role="status" className="py-8 text-rel-muted">Cargando áreas…</p> : null}
      {error ? <div role="alert" className="mt-5 text-rel-danger">{error}<Button type="button" variant="relOutline" className="ml-2" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button></div> : null}
      {!cargando && !error && filas.length === 0 ? <p className="py-8 text-rel-muted">No hay áreas para este filtro.</p> : null}
      {!cargando && !error && filas.length > 0 ? <>
        <div className="mt-5 space-y-3 md:hidden">{filas.map((a) => <article key={a.id} className="rounded-rel-card border border-rel-border p-4"><div className="flex justify-between gap-2"><strong className="break-words">{a.nombre}</strong><Badge variant={a.activo ? "relSuccess" : "relNeutral"}>{a.activo ? "Activa" : "Inactiva"}</Badge></div><p className="mt-1 text-sm text-rel-muted">{a.descripcion || "Sin descripción"}</p><Acciones area={a} editar={abrir} estado={setACambiar} /></article>)}</div>
        <div className="mt-5 hidden md:block"><TablaPanel><table className="w-full min-w-[580px] text-left text-sm"><caption className="sr-only">Áreas de la empresa</caption><TablaHead><tr><th scope="col" className="p-4">Área</th><th scope="col" className="p-4">Descripción</th><th scope="col" className="p-4">Estado</th><th scope="col" className="p-4">Acciones</th></tr></TablaHead><TablaBody>{filas.map((a) => <tr key={a.id}><td className="p-4 font-semibold">{a.nombre}</td><td className="p-4">{a.descripcion || "—"}</td><td className="p-4"><Badge variant={a.activo ? "relSuccess" : "relNeutral"}>{a.activo ? "Activa" : "Inactiva"}</Badge></td><td className="p-4"><Acciones area={a} editar={abrir} estado={setACambiar} /></td></tr>)}</TablaBody></table></TablaPanel></div>
      </> : null}
      {!cargando && !error ? <div className="mt-4 flex items-center justify-between gap-2"><Button variant="relOutline" disabled={historial.length === 0} onClick={() => { setCursor(historial[historial.length - 1]); setHistorial((h) => h.slice(0, -1)); }}>Anterior</Button><span className="text-sm text-rel-muted">Página {historial.length + 1}</span><Button variant="relOutline" disabled={!siguiente} onClick={() => { setHistorial((h) => [...h, cursor]); setCursor(siguiente); }}>Siguiente</Button></div> : null}
    </Panel>
    <Sheet open={edicion !== null} onOpenChange={(v) => { if (!v && !guardando) setEdicion(null); }}><SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg"><SheetHeader><SheetTitle>{edicion === "nuevo" ? "Nueva" : "Editar"} área</SheetTitle><SheetDescription>Esta área también forma parte del catálogo compartido de tu empresa.</SheetDescription></SheetHeader><form onSubmit={guardar} className="mt-6 space-y-5" noValidate><div><Label htmlFor="area-nombre">Nombre *</Label><Input id="area-nombre" value={nombre} disabled={guardando} maxLength={160} onChange={(e) => setNombre(e.target.value)} /></div><div><Label htmlFor="area-descripcion">Descripción</Label><Input id="area-descripcion" value={descripcion} disabled={guardando} maxLength={500} onChange={(e) => setDescripcion(e.target.value)} /></div>{errorFormulario ? <p role="alert" className="text-sm text-rel-danger">{errorFormulario}</p> : null}<div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="relOutline" disabled={guardando} onClick={() => setEdicion(null)}>Cancelar</Button><Button type="submit" variant="rel" disabled={guardando}>{guardando ? "Guardando…" : "Guardar"}</Button></div></form></SheetContent></Sheet>
    <AlertDialog open={aCambiar !== null} onOpenChange={(v) => { if (!v && !guardando) setACambiar(null); }}><AlertDialogContent className="rel-scope font-rel-body"><AlertDialogHeader><AlertDialogTitle>{aCambiar?.activo ? "Desactivar" : "Activar"} área</AlertDialogTitle><AlertDialogDescription>{aCambiar?.activo ? "Dejará de estar asignada a servicios CX. El historial permanece; otras partes de Abril360 seguirán mostrando el área inactiva según sus reglas." : "Podrás volver a asignarla a servicios CX."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel><Button type="button" variant={aCambiar?.activo ? "relDanger" : "rel"} disabled={guardando} onClick={cambiar}>{guardando ? "Actualizando…" : "Confirmar"}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function Acciones({ area, editar, estado }: { area: AreaCx; editar: (a: AreaCx) => void; estado: (a: AreaCx) => void }) {
  return <div className="mt-3 flex flex-wrap gap-2 md:mt-0"><Button size="sm" variant="relOutline" onClick={() => editar(area)}>Editar</Button><Button size="sm" variant="relGhost" onClick={() => estado(area)}>{area.activo ? "Desactivar" : "Activar"}</Button></div>;
}
