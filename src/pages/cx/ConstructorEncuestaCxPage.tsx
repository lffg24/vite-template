import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ClipboardList, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import { Panel } from "@/shared/ui/Panel";
import { clonarVersionCx, editarEncuestaCx, obtenerEncuestaCx, publicarEncuestaCx } from "@/services/cxEncuestasService";
import type { EncuestaCx, ItemCx, TipoItemCx } from "@/types/cxEncuestas";

const inicio: ItemCx = { tipo: "CSAT", enunciado: "¿Qué tan satisfecho estás con la experiencia?", obligatorio: true };
const nombres: Record<TipoItemCx, string> = { NPS_RELACIONAL: "NPS relacional · 0 a 10", NPS_EXPERIENCIA: "NPS experiencia · 0 a 10", CSAT: "CSAT · 1 a 5", CES: "CES · 1 a 7", FACTOR: "Factor · 1 a 5" };

export default function ConstructorEncuestaCxPage() {
  const { id } = useParams<{ id: string }>();
  const [encuesta, setEncuesta] = useState<EncuestaCx | null>(null);
  const [titulo, setTitulo] = useState("");
  const [items, setItems] = useState<ItemCx[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorAccion, setErrorAccion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [sucio, setSucio] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [revision, setRevision] = useState(0);

  const aplicar = useCallback((dato: EncuestaCx) => {
    setEncuesta(dato); setTitulo(dato.titulo); setItems(dato.borrador);
    setSucio(false);
  }, []);
  useEffect(() => {
    if (!id) return;
    let vigente = true;
    setCargando(true); setError("");
    obtenerEncuestaCx(id).then((dato) => { if (vigente) aplicar(dato); })
      .catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [id, revision, aplicar]);

  function actualizar(indice: number, parcial: Partial<ItemCx>) {
    setItems((actuales) => actuales.map((item, n) => n === indice ? { ...item, ...parcial } : item));
    setSucio(true); setMensaje("");
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setErrorAccion(""); setMensaje("");
    if (!titulo.trim() || items.some((i) => !i.enunciado.trim())) {
      setErrorAccion("Completa el título y los enunciados antes de guardar."); return;
    }
    setOcupado(true);
    try { aplicar(await editarEncuestaCx(id, { titulo: titulo.trim(), items })); setMensaje("Borrador guardado."); }
    catch (error) { setErrorAccion((error as Error).message); }
    finally { setOcupado(false); }
  }

  async function clonar() {
    if (!id) return;
    setOcupado(true); setErrorAccion(""); setMensaje("");
    try { aplicar(await clonarVersionCx(id)); setMensaje("Borrador creado desde la última versión. Puedes editarlo sin alterar la versión publicada."); }
    catch (error) { setErrorAccion((error as Error).message); }
    finally { setOcupado(false); }
  }

  async function publicar() {
    if (!id) return;
    setOcupado(true); setErrorAccion(""); setMensaje("");
    try { aplicar(await publicarEncuestaCx(id)); setMensaje("Nueva versión publicada. Las versiones anteriores conservan sus preguntas y respuestas."); setConfirmar(false); }
    catch (error) { setErrorAccion((error as Error).message); setConfirmar(false); }
    finally { setOcupado(false); }
  }

  if (cargando) return <p role="status" className="p-6 text-rel-muted">Cargando constructor…</p>;
  if (error || !encuesta) return <div role="alert" className="p-6 text-rel-danger">{error || "Encuesta no disponible."}<Button variant="relOutline" className="ml-3" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button></div>;

  const principalValido = items.length > 0 && items[0].tipo !== "FACTOR" && items[0].obligatorio;
  const publicable = !sucio && principalValido && items.every((i) => i.enunciado.trim()) && !ocupado;
  const ultima = encuesta.versiones[0];

  return <div className="space-y-5">
    <Link to="/cx/encuestas" className="inline-flex items-center gap-2 text-sm font-medium text-rel-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"><ArrowLeft className="h-4 w-4" aria-hidden="true" />Volver a encuestas</Link>
    <PageHeader antetitulo={`Encuesta · ${encuesta.codigo}`} titulo="Constructor de encuesta" descripcion="Define una medición corta, guarda el borrador y publica una versión verificable." icono={ClipboardList} />
    {mensaje ? <p role="status" className="rounded-rel-card border border-rel-border bg-rel-surface-subtle p-4 text-rel-dark">{mensaje}</p> : null}
    {errorAccion ? <p role="alert" className="rounded-rel-card border border-rel-danger p-4 text-rel-danger">{errorAccion}</p> : null}
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
      <form onSubmit={guardar} className="min-w-0 space-y-5">
        <Panel titulo="Borrador editable">
          <div><Label htmlFor="cx-titulo-editor">Título *</Label><Input id="cx-titulo-editor" value={titulo} maxLength={200} disabled={ocupado} onChange={(e) => { setTitulo(e.target.value); setSucio(true); }} /></div>
          {items.length === 0 ? <p className="mt-5 text-sm text-rel-muted">El borrador está vacío. Agrega el indicador principal para empezar.</p> : null}
          <ol className="mt-5 space-y-4">{items.map((item, indice) => <li key={indice} className="rounded-rel-card border border-rel-border p-4"><div className="mb-3 flex items-center justify-between gap-2"><strong>{indice === 0 ? "Indicador principal" : `Factor ${indice}`}</strong>{indice > 0 ? <Button type="button" variant="relOutline" size="sm" disabled={ocupado} aria-label={`Quitar factor ${indice}`} onClick={() => { setItems((actuales) => actuales.filter((_, n) => n !== indice)); setSucio(true); }}><Trash2 className="h-4 w-4" aria-hidden="true" /></Button> : null}</div><div className="grid gap-3"><div><Label htmlFor={`tipo-${indice}`}>Escala</Label><select id={`tipo-${indice}`} value={item.tipo} disabled={ocupado || indice > 0} onChange={(e) => actualizar(indice, { tipo: e.target.value as TipoItemCx })} className="flex h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary">{indice === 0 ? Object.entries(nombres).filter(([tipo]) => tipo !== "FACTOR").map(([tipo, nombre]) => <option key={tipo} value={tipo}>{nombre}</option>) : <option value="FACTOR">{nombres.FACTOR}</option>}</select></div><div><Label htmlFor={`enunciado-${indice}`}>Pregunta *</Label><Input id={`enunciado-${indice}`} value={item.enunciado} maxLength={500} disabled={ocupado} onChange={(e) => actualizar(indice, { enunciado: e.target.value })} /></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.obligatorio} disabled={ocupado || indice === 0} onChange={(e) => actualizar(indice, { obligatorio: e.target.checked })} className="h-4 w-4 accent-rel-primary" />Respuesta obligatoria{indice === 0 ? " para el indicador" : ""}</label></div></li>)}</ol>
          <div className="mt-5 flex flex-wrap gap-2">{items.length === 0 ? <Button type="button" variant="relOutline" disabled={ocupado} onClick={() => { setItems([inicio]); setSucio(true); }}>Agregar indicador principal</Button> : null}{items.length > 0 && items.length < 12 ? <Button type="button" variant="relOutline" disabled={ocupado} onClick={() => { setItems((actuales) => [...actuales, { tipo: "FACTOR", enunciado: "", obligatorio: false }]); setSucio(true); }}><Plus className="mr-2 h-4 w-4" aria-hidden="true" />Agregar factor</Button> : null}</div>
        </Panel>
        <Panel><div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" variant="rel" disabled={ocupado || !sucio} className="w-full sm:w-auto">{ocupado ? "Guardando…" : "Guardar borrador"}</Button><Button type="button" variant="relOutline" disabled={!publicable} onClick={() => setConfirmar(true)} className="w-full sm:w-auto">Publicar versión</Button>{items.length === 0 && ultima ? <Button type="button" variant="relOutline" disabled={ocupado} onClick={clonar} className="w-full sm:w-auto">Crear v{ultima.numero + 1} desde la última</Button> : null}</div><p className="mt-3 text-sm text-rel-muted">{sucio ? "Guarda los cambios antes de publicar." : !principalValido ? "Añade un indicador principal obligatorio para publicar." : "La publicación fija las preguntas y su escala. Una edición posterior crea otra versión."}</p></Panel>
      </form>
      <div className="min-w-0 space-y-5"><Panel titulo="Vista previa móvil"><div className="mx-auto max-w-sm rounded-rel-card border border-rel-border bg-rel-canvas p-4"><p className="text-xs font-semibold uppercase tracking-wide text-rel-muted">ABRIL360 · Calificación</p><h2 className="mt-2 break-words font-rel-heading text-xl font-bold">{titulo || "Título de la encuesta"}</h2>{items[0] ? <div className="mt-5"><p className="font-semibold">{items[0].enunciado || "Escribe la pregunta principal"}</p><p className="mt-2 text-sm text-rel-muted">{nombres[items[0].tipo]}</p><div className="mt-3 flex flex-wrap gap-2">{Array.from({ length: items[0].tipo.startsWith("NPS") ? 11 : items[0].tipo === "CES" ? 7 : 5 }, (_, n) => <span key={n} className="grid h-9 w-9 place-items-center rounded-rel-control border border-rel-border bg-rel-surface text-sm">{n + (items[0].tipo.startsWith("NPS") ? 0 : 1)}</span>)}</div></div> : <p className="mt-5 text-sm text-rel-muted">Aquí verás la primera pregunta.</p>}</div><p className="mt-3 text-xs text-rel-muted">La vista previa muestra el borrador local; el enlace público solo presenta versiones publicadas.</p></Panel><Panel titulo="Historial publicado">{encuesta.versiones.length ? <ul className="space-y-3">{encuesta.versiones.map((v) => <li key={v.id} className="flex items-center justify-between gap-2 border-b border-rel-border pb-3"><span>Versión {v.numero}<small className="block text-rel-muted">{v.items.length} preguntas · {nombres[v.items[0].tipo]}</small></span><Badge variant="relSuccess">Publicada</Badge></li>)}</ul> : <p className="text-sm text-rel-muted">Todavía no hay versiones publicadas.</p>}</Panel></div>
    </div>
    <AlertDialog open={confirmar} onOpenChange={(v) => { if (!ocupado) setConfirmar(v); }}><AlertDialogContent className="rel-scope font-rel-body"><AlertDialogHeader><AlertDialogTitle>Publicar versión</AlertDialogTitle><AlertDialogDescription>Las preguntas y escalas quedarán inmutables. Para cambiarlas después crearás una versión nueva; los QR impresos seguirán ligados al enlace de campaña.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={ocupado}>Cancelar</AlertDialogCancel><Button variant="rel" disabled={ocupado} onClick={publicar}>{ocupado ? "Publicando…" : "Publicar"}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
