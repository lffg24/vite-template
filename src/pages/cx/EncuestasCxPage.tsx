import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { crearEncuestaCx, listarEncuestasCx } from "@/services/cxEncuestasService";
import type { ResumenEncuestaCx } from "@/types/cxEncuestas";

export default function EncuestasCxPage() {
  const navigate = useNavigate();
  const [filas, setFilas] = useState<ResumenEncuestaCx[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [historial, setHistorial] = useState<(string | null)[]>([]);
  const [siguiente, setSiguiente] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [errorCrear, setErrorCrear] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true); setError("");
    listarEncuestasCx(cursor).then((pagina) => {
      if (!vigente) return;
      setFilas(pagina.items); setSiguiente(pagina.siguiente_cursor);
    }).catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [cursor, revision]);

  async function crear(e: FormEvent) {
    e.preventDefault(); setErrorCrear("");
    if (!codigo.trim() || !titulo.trim()) { setErrorCrear("Completa código y título."); return; }
    setGuardando(true);
    try {
      const encuesta = await crearEncuestaCx({ codigo: codigo.trim(), titulo: titulo.trim(), items: [] });
      navigate(`/cx/encuestas/${encuesta.id}/editar`);
    } catch (error) { setErrorCrear((error as Error).message); }
    finally { setGuardando(false); }
  }

  return <div className="space-y-5">
    <PageHeader antetitulo="Experiencia del cliente" titulo="Encuestas" descripcion="Construye y publica instrumentos de calificación con versiones trazables." icono={ClipboardList} accion={<Button variant="rel" className="w-full sm:w-auto" onClick={() => setCreando((v) => !v)}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Nueva encuesta</Button>} />
    {creando ? <Panel titulo="Nueva encuesta"><form onSubmit={crear} className="grid gap-4 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_auto] sm:items-end"><div><Label htmlFor="cx-codigo">Código *</Label><Input id="cx-codigo" value={codigo} maxLength={80} onChange={(e) => setCodigo(e.target.value)} placeholder="SERVICIO-2026" disabled={guardando} /></div><div><Label htmlFor="cx-titulo">Título *</Label><Input id="cx-titulo" value={titulo} maxLength={200} onChange={(e) => setTitulo(e.target.value)} disabled={guardando} /></div><Button variant="rel" type="submit" disabled={guardando}>{guardando ? "Creando…" : "Crear"}</Button>{errorCrear ? <p role="alert" className="text-sm text-rel-danger sm:col-span-3">{errorCrear}</p> : null}</form></Panel> : null}
    <Panel titulo="Instrumentos de tu empresa">
      {cargando ? <p role="status" className="py-8 text-rel-muted">Cargando encuestas…</p> : null}
      {error ? <div role="alert" className="py-6 text-rel-danger">{error}<Button variant="relOutline" className="ml-3" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button></div> : null}
      {!cargando && !error && filas.length === 0 ? <p className="py-8 text-rel-muted">Aún no hay encuestas. Crea una para empezar.</p> : null}
      {!cargando && !error ? <ul className="space-y-3">{filas.map((fila) => <li key={fila.id} className="flex flex-col gap-3 rounded-rel-card border border-rel-border p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">{fila.codigo}</p><h2 className="break-words font-rel-heading text-lg font-bold">{fila.titulo}</h2><div className="mt-2 flex flex-wrap gap-2"><Badge variant={fila.tiene_borrador ? "relWarning" : "relNeutral"}>{fila.tiene_borrador ? "Borrador pendiente" : "Sin borrador"}</Badge>{fila.ultima_version ? <Badge variant="relSuccess">Versión {fila.ultima_version} publicada</Badge> : null}</div></div><Button variant="relOutline" asChild className="w-full sm:w-auto"><Link to={`/cx/encuestas/${fila.id}/editar`}>Abrir constructor</Link></Button></li>)}</ul> : null}
      {!cargando && !error ? <div className="mt-5 flex items-center justify-between gap-2"><Button variant="relOutline" disabled={historial.length === 0} onClick={() => { setCursor(historial[historial.length - 1]); setHistorial((h) => h.slice(0, -1)); }}>Anterior</Button><span className="text-sm text-rel-muted">Página {historial.length + 1}</span><Button variant="relOutline" disabled={!siguiente} onClick={() => { setHistorial((h) => [...h, cursor]); setCursor(siguiente); }}>Siguiente</Button></div> : null}
    </Panel>
  </div>;
}
