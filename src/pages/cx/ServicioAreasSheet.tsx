import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { guardarAreasServicioCx, listarAreasCx, obtenerAreasServicioCx } from "@/services/cxAreasService";
import type { AreaCx, ServicioAreasCx } from "@/types/cxAreas";
import type { ServicioCx } from "@/types/cxContextos";

export default function ServicioAreasSheet({ servicio, cerrar }: { servicio: ServicioCx | null; cerrar: () => void }) {
  const { toast } = useToast();
  const [actual, setActual] = useState<ServicioAreasCx | null>(null);
  const [conocidas, setConocidas] = useState<AreaCx[]>([]);
  const [buscar, setBuscar] = useState("");
  const [principal, setPrincipal] = useState<number | null>(null);
  const [colaboradoras, setColaboradoras] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!servicio) { setActual(null); setConocidas([]); setBuscar(""); return; }
    let vigente = true;
    setConocidas([]);
    setCargando(true); setError("");
    obtenerAreasServicioCx(servicio.id).then((resultado) => {
      if (!vigente) return;
      setActual(resultado); setPrincipal(resultado.principal_area_id);
      setColaboradoras(resultado.colaboradora_area_ids);
      setConocidas((antes) => {
        const mapa = new Map(antes.map((a) => [a.id, a]));
        resultado.items.forEach((item) => mapa.set(item.area_id, { id: item.area_id, nombre: item.nombre, descripcion: null, activo: true }));
        return [...mapa.values()];
      });
    }).catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [servicio, revision]);

  useEffect(() => {
    if (!servicio) return;
    let vigente = true;
    setBuscando(true);
    listarAreasCx({ buscar, activo: true, limite: 50 }).then((pagina) => {
      if (!vigente) return;
      setConocidas((antes) => {
        const mapa = new Map(antes.map((a) => [a.id, a]));
        pagina.items.forEach((a) => mapa.set(a.id, a));
        return [...mapa.values()];
      });
    }).catch((e: Error) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setBuscando(false); });
    return () => { vigente = false; };
  }, [servicio, buscar]);

  const visibles = useMemo(() => conocidas.filter((a) => a.activo && a.nombre.toLocaleLowerCase().includes(buscar.trim().toLocaleLowerCase())), [conocidas, buscar]);
  const seleccionadas = useMemo(() => conocidas.filter((a) => colaboradoras.includes(a.id)), [conocidas, colaboradoras]);

  function alternar(areaId: number, marcado: boolean) {
    setColaboradoras((antes) => marcado ? [...antes, areaId] : antes.filter((id) => id !== areaId));
    if (marcado && principal === areaId) setPrincipal(null);
  }

  async function guardar() {
    if (!servicio || !actual) return;
    setGuardando(true); setError("");
    try {
      const resultado = await guardarAreasServicioCx(servicio.id, {
        principal_area_id: principal, colaboradora_area_ids: colaboradoras,
      });
      setActual(resultado); setPrincipal(resultado.principal_area_id);
      setColaboradoras(resultado.colaboradora_area_ids);
      toast({ title: "Responsabilidad guardada" });
      cerrar();
    } catch (e) { setError((e as Error).message); }
    finally { setGuardando(false); }
  }

  return <Sheet open={servicio !== null} onOpenChange={(v) => { if (!v && !guardando) cerrar(); }}><SheetContent className="rel-scope w-full overflow-y-auto bg-rel-surface font-rel-body sm:max-w-lg"><SheetHeader><SheetTitle>Áreas de {servicio?.nombre}</SheetTitle><SheetDescription>Asigna un área principal y hasta 49 colaboradoras. Los cambios conservan el historial.</SheetDescription></SheetHeader>
    <div className="mt-6 space-y-5">
      {cargando ? <p role="status" className="text-rel-muted">Cargando responsabilidad…</p> : null}
      {error ? <div role="alert" className="text-sm text-rel-danger">{error}<Button type="button" variant="relOutline" size="sm" className="ml-2" onClick={() => setRevision((n) => n + 1)}>Reintentar</Button></div> : null}
      {!cargando && actual ? <>
        <div><Label htmlFor="area-principal">Área principal</Label><select id="area-principal" value={principal ?? ""} disabled={guardando} onChange={(e) => { const id = Number(e.target.value) || null; setPrincipal(id); if (id) setColaboradoras((a) => a.filter((v) => v !== id)); }} className="mt-1 flex h-10 w-full rounded-md border border-rel-border bg-rel-surface px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"><option value="">Sin asignar</option>{conocidas.filter((a) => a.activo).map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select></div>
        <div><Label htmlFor="buscar-area-servicio">Buscar áreas colaboradoras</Label><Input id="buscar-area-servicio" type="search" maxLength={80} value={buscar} onChange={(e) => setBuscar(e.target.value)} /></div>
        {buscando ? <p role="status" className="text-sm text-rel-muted">Buscando áreas…</p> : null}
        {seleccionadas.length > 0 ? <div><p className="mb-2 text-sm font-semibold">Colaboradoras seleccionadas ({seleccionadas.length})</p><ul className="space-y-2">{seleccionadas.map((a) => <li key={a.id}><label className="flex items-center gap-3 rounded-rel-card border border-rel-border p-3"><input type="checkbox" checked disabled={guardando} onChange={() => alternar(a.id, false)} /><span>{a.nombre}</span></label></li>)}</ul></div> : null}
        <div><p className="mb-2 text-sm font-semibold">Áreas disponibles</p>{visibles.length === 0 ? <p className="text-sm text-rel-muted">No hay áreas activas para esta búsqueda.</p> : <ul className="space-y-2">{visibles.filter((a) => a.id !== principal && !colaboradoras.includes(a.id)).map((a) => <li key={a.id}><label className="flex items-center gap-3 rounded-rel-card border border-rel-border p-3"><input type="checkbox" checked={false} disabled={guardando || colaboradoras.length >= 50} onChange={() => alternar(a.id, true)} /><span>{a.nombre}</span></label></li>)}</ul>}</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="relOutline" disabled={guardando} onClick={cerrar}>Cancelar</Button><Button type="button" variant="rel" disabled={guardando || colaboradoras.length + Number(principal !== null) > 50} onClick={guardar}>{guardando ? "Guardando…" : "Guardar áreas"}</Button></div>
      </> : null}
    </div>
  </SheetContent></Sheet>;
}
