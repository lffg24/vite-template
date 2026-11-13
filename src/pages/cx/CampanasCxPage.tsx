import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { CodigoQr } from "@/shared/ui/CodigoQr";
import { listarContextos, listarServiciosDeSede } from "@/services/cxContextosService";
import { listarCatalogoCx } from "@/services/cxPuntosFactoresService";
import { listarEncuestasCx, obtenerEncuestaCx } from "@/services/cxEncuestasService";
import {
  cambiarEstadoCampanaCx, cambiarVersionCampanaCx, crearCampanaCx,
  listarCampanasCx, revocarCampanaCx,
} from "@/services/cxCampanasService";
import type { SedeCx, ServicioDeSede } from "@/types/cxContextos";
import type { PuntoCx } from "@/types/cxPuntosFactores";
import type { EncuestaCx, ResumenEncuestaCx } from "@/types/cxEncuestas";
import type { CampanaCx, EstadoCampanaCx } from "@/types/cxCampanas";

const claseSelect = "flex h-11 w-full rounded-rel-control border border-rel-border bg-rel-surface px-3 text-rel-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary";

export default function CampanasCxPage() {
  const [campanas, setCampanas] = useState<CampanaCx[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [historial, setHistorial] = useState<(string | null)[]>([]);
  const [encuestas, setEncuestas] = useState<ResumenEncuestaCx[]>([]);
  const [encuesta, setEncuesta] = useState<EncuestaCx | null>(null);
  const [sedes, setSedes] = useState<SedeCx[]>([]);
  const [servicios, setServicios] = useState<ServicioDeSede[]>([]);
  const [puntos, setPuntos] = useState<PuntoCx[]>([]);
  const [idReintento, setIdReintento] = useState(() => crypto.randomUUID());
  const [nombre, setNombre] = useState("");
  const [encuestaId, setEncuestaId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [sedeId, setSedeId] = useState("");
  const [servicioId, setServicioId] = useState("");
  const [puntoId, setPuntoId] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [revision, setRevision] = useState(0);
  const [aRevocar, setARevocar] = useState<CampanaCx | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true); setError("");
    try {
      const pagina = await listarCampanasCx(cursor);
      setCampanas(pagina.items); setSiguiente(pagina.siguiente_cursor);
      const [instrumentos, lugares, contactos] = await Promise.allSettled([
        listarEncuestasCx(),
        listarContextos<SedeCx>("sedes", { activo: true, limite: 50 }),
        listarCatalogoCx<PuntoCx>("puntos", { activo: true, limite: 50 }),
      ]);
      setEncuestas(instrumentos.status === "fulfilled" ? instrumentos.value.items.filter((item) => item.ultima_version !== null) : []);
      setSedes(lugares.status === "fulfilled" ? lugares.value.items : []);
      setPuntos(contactos.status === "fulfilled" ? contactos.value.items : []);
      if (instrumentos.status === "rejected" || lugares.status === "rejected" || contactos.status === "rejected") {
        setErrorAccion("Las campañas se cargaron, pero faltan permisos o datos de catálogos para crear una nueva.");
      }
    } catch (e) { setError((e as Error).message); }
    finally { setCargando(false); }
  }, [cursor]);
  useEffect(() => { void cargar(); }, [cargar, revision]);
  useEffect(() => {
    if (!encuestaId) { setEncuesta(null); setVersionId(""); return; }
    let vigente = true;
    obtenerEncuestaCx(encuestaId).then((dato) => {
      if (vigente) { setEncuesta(dato); setVersionId(dato.versiones[0]?.id || ""); }
    }).catch((e: Error) => { if (vigente) setErrorAccion(e.message); });
    return () => { vigente = false; };
  }, [encuestaId]);
  useEffect(() => {
    if (!sedeId) { setServicios([]); return; }
    let vigente = true;
    listarServiciosDeSede(sedeId).then((datos) => { if (vigente) setServicios(datos); })
      .catch((e: Error) => { if (vigente) setErrorAccion(e.message); });
    return () => { vigente = false; };
  }, [sedeId]);

  async function crear(e: FormEvent) {
    e.preventDefault(); setErrorAccion(""); setMensaje("");
    if (!nombre.trim() || !encuestaId || !versionId || !sedeId) {
      setErrorAccion("Completa nombre, encuesta, versión y sede."); return;
    }
    setOcupado(true);
    try {
      await crearCampanaCx({ id: idReintento, nombre: nombre.trim(), encuesta_id: encuestaId,
        version_id: versionId, sede_id: sedeId, servicio_id: servicioId || null,
        punto_id: puntoId || null });
      setIdReintento(crypto.randomUUID()); setNombre(""); setMensaje("Campaña creada en pausa. El QR conservará este enlace cuando cambies la versión.");
      setRevision((n) => n + 1);
    } catch (e) { setErrorAccion((e as Error).message); }
    finally { setOcupado(false); }
  }

  async function operar(campana: CampanaCx, accion: "estado" | "revocar" | "version", valor?: string) {
    setOcupado(true); setErrorAccion(""); setMensaje("");
    try {
      if (accion === "revocar") await revocarCampanaCx(campana.id);
      if (accion === "estado") await cambiarEstadoCampanaCx(campana.id, valor as EstadoCampanaCx);
      if (accion === "version" && valor) await cambiarVersionCampanaCx(campana.id, valor);
      setMensaje(accion === "version" ? "Versión actualizada. El QR conserva la misma URL." : "Estado actualizado.");
      setRevision((n) => n + 1);
    } catch (e) { setErrorAccion((e as Error).message); }
    finally { setOcupado(false); }
  }

  const puntosDisponibles = puntos.filter((p) => p.sede_id === sedeId && (!p.servicio_id || p.servicio_id === servicioId));
  return <div className="space-y-5">
    <PageHeader antetitulo="Experiencia del cliente" titulo="Campañas y QR" descripcion="Distribuye una encuesta publicada en cada sede y conserva el mismo enlace al actualizar su versión." icono={Link2} />
    {mensaje ? <p role="status" className="rounded-rel-card border border-rel-border bg-rel-surface-subtle p-4">{mensaje}</p> : null}
    {errorAccion ? <p role="alert" className="rounded-rel-card border border-rel-danger p-4 text-rel-danger">{errorAccion}</p> : null}
    <Panel titulo="Nueva campaña"><form onSubmit={crear} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div><Label htmlFor="campana-nombre">Nombre *</Label><Input id="campana-nombre" value={nombre} maxLength={200} disabled={ocupado} onChange={(e) => setNombre(e.target.value)} placeholder="Atención en sede centro" /></div>
      <div><Label htmlFor="campana-encuesta">Encuesta publicada *</Label><select id="campana-encuesta" className={claseSelect} value={encuestaId} disabled={ocupado} onChange={(e) => setEncuestaId(e.target.value)}><option value="">Seleccionar encuesta</option>{encuestas.map((q) => <option key={q.id} value={q.id}>{q.titulo}</option>)}</select></div>
      <div><Label htmlFor="campana-version">Versión *</Label><select id="campana-version" className={claseSelect} value={versionId} disabled={ocupado || !encuesta} onChange={(e) => setVersionId(e.target.value)}><option value="">Seleccionar versión</option>{encuesta?.versiones.map((v) => <option key={v.id} value={v.id}>Versión {v.numero}</option>)}</select></div>
      <div><Label htmlFor="campana-sede">Sede *</Label><select id="campana-sede" className={claseSelect} value={sedeId} disabled={ocupado} onChange={(e) => { setSedeId(e.target.value); setServicioId(""); setPuntoId(""); }}><option value="">Seleccionar sede</option>{sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></div>
      <div><Label htmlFor="campana-servicio">Servicio</Label><select id="campana-servicio" className={claseSelect} value={servicioId} disabled={ocupado || !sedeId} onChange={(e) => { setServicioId(e.target.value); setPuntoId(""); }}><option value="">Toda la sede</option>{servicios.map((s) => <option key={s.servicio_id} value={s.servicio_id}>{s.nombre}</option>)}</select></div>
      <div><Label htmlFor="campana-punto">Punto de contacto</Label><select id="campana-punto" className={claseSelect} value={puntoId} disabled={ocupado || !sedeId} onChange={(e) => setPuntoId(e.target.value)}><option value="">Sin punto específico</option>{puntosDisponibles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
      <div className="sm:col-span-2 lg:col-span-3"><Button type="submit" variant="rel" className="w-full sm:w-auto" disabled={ocupado || !encuestas.length}>{ocupado ? "Guardando…" : "Crear campaña y QR"}</Button><p className="mt-2 text-sm text-rel-muted">Se crea en pausa. Actívala cuando el acceso público esté habilitado y probado.</p></div>
    </form></Panel>
    <Panel titulo="Campañas de tu empresa">
      {cargando ? <p role="status" className="py-6 text-rel-muted">Cargando campañas…</p> : null}
      {error ? <p role="alert" className="py-6 text-rel-danger">{error} <Button variant="relOutline" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button></p> : null}
      {!cargando && !error && campanas.length === 0 ? <p className="py-6 text-rel-muted">Aún no hay campañas. Crea una desde una encuesta publicada.</p> : null}
      {!cargando && !error ? <ul className="space-y-4">{campanas.map((campana) => {
        const url = new URL(`/cx/${campana.token}`, window.location.origin).toString();
        const inactiva = Boolean(campana.revocado_en || (campana.fin_en && new Date(campana.fin_en) <= new Date()));
        return <li key={campana.id} className="grid gap-4 rounded-rel-card border border-rel-border p-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0 space-y-3"><div className="flex flex-wrap items-center gap-2"><h2 className="break-words font-rel-heading text-lg font-bold">{campana.nombre}</h2><Badge variant={campana.estado === "ACTIVA" && !inactiva ? "relSuccess" : "relNeutral"}>{campana.revocado_en ? "Revocada" : campana.estado === "ACTIVA" ? "Activa" : campana.estado === "PAUSADA" ? "Pausada" : "Cerrada"}</Badge></div>
            <p className="break-all text-sm text-rel-muted">{url}</p>
            <div className="flex flex-wrap gap-2"><Button variant="relOutline" size="sm" disabled={ocupado} onClick={() => void navigator.clipboard.writeText(url).then(() => setMensaje("Enlace copiado."), () => setErrorAccion("No se pudo copiar el enlace."))}>Copiar enlace</Button>{campana.estado !== "CERRADA" && !campana.revocado_en ? <Button variant="relOutline" size="sm" disabled={ocupado} onClick={() => void operar(campana, "estado", campana.estado === "ACTIVA" ? "PAUSADA" : "ACTIVA")}>{campana.estado === "ACTIVA" ? "Pausar" : "Activar"}</Button> : null}{!campana.revocado_en ? <Button variant="relGhost" size="sm" disabled={ocupado} onClick={() => setARevocar(campana)}>Revocar QR</Button> : null}</div>
            <CambioVersion campana={campana} ocupado={ocupado} cambiar={(id) => void operar(campana, "version", id)} />
          </div><CodigoQr valor={url} etiqueta={`QR de ${campana.nombre}`} className="h-36 w-36 shrink-0" />
        </li>;
      })}</ul> : null}
      {!cargando && !error ? <div className="mt-5 flex items-center justify-between gap-2"><Button variant="relOutline" disabled={!historial.length} onClick={() => { setCursor(historial[historial.length - 1]); setHistorial((h) => h.slice(0, -1)); }}>Anterior</Button><span className="text-sm text-rel-muted">Página {historial.length + 1}</span><Button variant="relOutline" disabled={!siguiente} onClick={() => { setHistorial((h) => [...h, cursor]); setCursor(siguiente); }}>Siguiente</Button></div> : null}
    </Panel>
    <AlertDialog open={aRevocar !== null} onOpenChange={(abierto) => { if (!abierto && !ocupado) setARevocar(null); }}><AlertDialogContent className="rel-scope font-rel-body"><AlertDialogHeader><AlertDialogTitle>Revocar QR</AlertDialogTitle><AlertDialogDescription>El QR impreso dejará de permitir nuevos accesos. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={ocupado}>Cancelar</AlertDialogCancel><Button variant="rel" disabled={ocupado} onClick={() => { if (aRevocar) { void operar(aRevocar, "revocar"); setARevocar(null); } }}>Revocar enlace</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}

function CambioVersion({ campana, ocupado, cambiar }: { campana: CampanaCx; ocupado: boolean; cambiar: (id: string) => void }) {
  const [versiones, setVersiones] = useState<EncuestaCx["versiones"]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let vigente = true;
    obtenerEncuestaCx(campana.encuesta_id).then((q) => { if (vigente) setVersiones(q.versiones); })
      .catch((e: Error) => { if (vigente) setError(e.message); });
    return () => { vigente = false; };
  }, [campana.encuesta_id]);
  if (campana.revocado_en || campana.estado === "CERRADA") return null;
  return <div className="max-w-xs"><Label htmlFor={`version-${campana.id}`}>Versión vigente</Label><select id={`version-${campana.id}`} className={claseSelect} disabled={ocupado || !versiones.length} value={campana.version_actual_id} onChange={(e) => cambiar(e.target.value)}>{versiones.map((v) => <option key={v.id} value={v.id}>Versión {v.numero}</option>)}</select>{error ? <p role="alert" className="text-sm text-rel-danger">{error}</p> : null}</div>;
}
