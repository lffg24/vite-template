import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileSpreadsheet, FileText, FileType2, Info, Loader2, Printer, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  descargarDocReporteOficial,
  descargarPdfReporteOficial,
  descargarXlsxReporteOficial,
  listarAplicacionesReportesOficiales,
  obtenerHtmlReporteOficial,
} from "@/services/psicoReportesOficialesService";
import type { TipoReportePsicoOficial } from "@/types/psicoReportesOficiales";
import type { PsicoAplicacionItem } from "@/types/psicoDashboard";

export const reportOptions: Array<{ value: TipoReportePsicoOficial; label: string; description: string }> = [
  {
    value: "base_forma_a",
    label: "Informe base Forma A",
    description: "Reporte base independiente con tablas y gráficas del Formulario A, extralaboral A y estrés A.",
  },
  {
    value: "base_forma_b",
    label: "Informe base Forma B",
    description: "Reporte base independiente con tablas y gráficas del Formulario B, extralaboral B y estrés B.",
  },
  {
    value: "base_general",
    label: "Informe base general",
    description: "Reporte base consolidado con Forma A y B cuando existan, manteniendo tablas, contenido y figuras por instrumento.",
  },
  {
    value: "detallado_excel",
    label: "Reporte detallado Excel",
    description: "Matriz auditada con respuestas registradas y resultados persistidos por participante, instrumento, dominio y dimensión.",
  },
  {
    value: "resultados",
    label: "Informe general de resultados BRP",
    description: "Informe general consolidado: resultados A/B, gráficas, recomendaciones y plan de intervención.",
  },
  {
    value: "resultados_areas",
    label: "Informe de resultados por áreas",
    description: "Entregable independiente con resultados segmentados solo para áreas registradas en el sistema.",
  },
  {
    value: "sociodemografico",
    label: "Informe sociodemográfico",
    description: "Ficha de datos generales, gráficas descriptivas y lectura poblacional editable.",
  },
];

function saveBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function downloadHtml(filename: string, html: string) {
  saveBlob(filename, new Blob([html], { type: "text/html;charset=utf-8" }));
}

function printHtml(html: string) {
  // Se abre desde un Blob para conservar mejor el CSS completo del documento.
  // Para que el PDF no muestre fecha/URL/título del navegador, desactivar "Encabezados y pies de página" en el diálogo de impresión.
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank", "width=980,height=900");
  if (!win) {
    URL.revokeObjectURL(url);
    return;
  }
  const cleanup = () => setTimeout(() => URL.revokeObjectURL(url), 5000);
  win.onload = () => {
    win.focus();
    setTimeout(() => {
      win.print();
      cleanup();
    }, 600);
  };
}

export default function ReportesOficialesPsicoPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAplicacionId = searchParams.get("aplicacionId") || searchParams.get("aplicacion") || "";
  const initialTipoParam = searchParams.get("tipo");
  const initialTipo = (
    initialTipoParam === "sociodemografico" ||
    initialTipoParam === "resultados_areas" ||
    initialTipoParam === "base_forma_a" ||
    initialTipoParam === "base_forma_b" ||
    initialTipoParam === "base_general" ||
    initialTipoParam === "detallado_excel"
      ? initialTipoParam
      : "resultados"
  ) as TipoReportePsicoOficial;
  const [aplicaciones, setAplicaciones] = useState<PsicoAplicacionItem[]>([]);
  const [aplicacionId, setAplicacionId] = useState<string>(initialAplicacionId);
  const [tipoReporte, setTipoReporte] = useState<TipoReportePsicoOficial>(initialTipo);
  const [html, setHtml] = useState<string>("");
  const [loadingApps, setLoadingApps] = useState(false);
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingXlsx, setDownloadingXlsx] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedApp = useMemo(() => aplicaciones.find((a) => String(a.id) === aplicacionId), [aplicaciones, aplicacionId]);
  const currentOption = useMemo(() => reportOptions.find((o) => o.value === tipoReporte), [tipoReporte]);
  const isExcelReport = tipoReporte === "detallado_excel";

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoadingApps(true);
      setError(null);
      try {
        const rows = await listarAplicacionesReportesOficiales();
        if (!alive) return;
        setAplicaciones(rows);
        if (!aplicacionId && rows.length) setAplicacionId(String(rows[0].id));
      } catch (err: any) {
        if (!alive) return;
        setError(err?.response?.data?.detail || err?.message || "No se pudieron cargar las aplicaciones.");
      } finally {
        if (alive) setLoadingApps(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadPreview() {
    if (!aplicacionId) return;
    if (isExcelReport) {
      setHtml("");
      setError(null);
      return;
    }
    setLoadingHtml(true);
    setError(null);
    try {
      const content = await obtenerHtmlReporteOficial(Number(aplicacionId), tipoReporte);
      setHtml(content);
    } catch (err: any) {
      setHtml("");
      setError(err?.response?.data?.detail || err?.message || "No se pudo generar la vista previa del informe.");
    } finally {
      setLoadingHtml(false);
    }
  }

  async function downloadDoc() {
    if (!aplicacionId) return;
    setDownloadingDoc(true);
    setError(null);
    try {
      const blob = await descargarDocReporteOficial(Number(aplicacionId), tipoReporte);
      saveBlob(filename.replace(/\.html$/i, ".doc"), blob);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "No se pudo descargar el documento editable.");
    } finally {
      setDownloadingDoc(false);
    }
  }

  async function downloadPdf() {
    if (!aplicacionId) return;
    setDownloadingPdf(true);
    setError(null);
    try {
      const blob = await descargarPdfReporteOficial(Number(aplicacionId), tipoReporte);
      saveBlob(filename.replace(/\.html$/i, ".pdf"), blob);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "No se pudo descargar el PDF directo. Verifica el servicio de generación de informes.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function downloadXlsx() {
    if (!aplicacionId) return;
    setDownloadingXlsx(true);
    setError(null);
    try {
      const blob = await descargarXlsxReporteOficial(Number(aplicacionId), tipoReporte);
      saveBlob(filename.replace(/\.html$/i, ".xlsx"), blob);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "No se pudo descargar el reporte detallado Excel.");
    } finally {
      setDownloadingXlsx(false);
    }
  }

  useEffect(() => {
    if (!aplicacionId) return;
    setSearchParams({ aplicacionId, tipo: tipoReporte }, { replace: true });
  }, [aplicacionId, tipoReporte, setSearchParams]);

  useEffect(() => {
    if (aplicacionId) void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aplicacionId, tipoReporte]);

  const filename = useMemo(() => {
    const safeApp = (selectedApp?.nombre || `aplicacion-${aplicacionId || ""}`).replace(/[^a-zA-Z0-9_-]+/g, "_");
    return `ABRIL360_${tipoReporte}_${safeApp}.html`;
  }, [selectedApp, aplicacionId, tipoReporte]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-violet-700">
            <ShieldCheck className="h-4 w-4" /> Reportes oficiales
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Generador de informes BRP</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Genera entregables oficiales separados: informe general, informe por áreas e informe sociodemográfico. Incluye vista previa, DOC editable y descarga directa en PDF.
          </p>
        </div>

      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-violet-700" /> Parámetros del informe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.15fr)_minmax(260px,0.9fr)_auto] lg:items-start">
            <div className="space-y-2">
              <label className="text-sm font-black text-slate-700">Aplicación</label>
              <Select value={aplicacionId} onValueChange={setAplicacionId} disabled={loadingApps || !aplicaciones.length}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"><SelectValue placeholder={loadingApps ? "Cargando aplicaciones..." : "Selecciona aplicación"} /></SelectTrigger>
                <SelectContent>{aplicaciones.map((app) => <SelectItem key={app.id} value={String(app.id)}>{app.nombre || `Aplicación ${app.id}`} · #{app.id}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-black text-slate-700">Tipo de informe</label>
                <Dialog>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-700 transition hover:bg-sky-100"
                      aria-label="Ver información del informe seleccionado"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl rounded-[28px] border-slate-200">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                        <Sparkles className="h-5 w-5 text-violet-700" /> Información del entregable
                      </DialogTitle>
                      <DialogDescription className="text-left leading-relaxed text-slate-600">
                        {currentOption?.description}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-4 text-sm leading-relaxed text-slate-700">
                      <p className="font-black text-violet-900">NeuroMapa Psicosocial ABRIL-360</p>
                      <p className="mt-1">
                        Motor local de análisis explicable: prioriza dimensiones críticas, propone lecturas técnicas y arma acciones de intervención sin APIs pagas ni recalcular baremos.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={tipoReporte} onValueChange={(v) => setTipoReporte(v as TipoReportePsicoOficial)}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{reportOptions.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end lg:pt-7">
              {isExcelReport ? (
                <Button className="h-12 rounded-2xl bg-violet-700 whitespace-nowrap hover:bg-violet-800" onClick={downloadXlsx} disabled={!aplicacionId || downloadingXlsx}>
                  {downloadingXlsx ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}Descargar XLSX
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="h-12 rounded-2xl whitespace-nowrap" onClick={() => downloadHtml(filename, html)} disabled={!html}><Download className="mr-2 h-4 w-4" />HTML</Button>
                  <Button variant="outline" className="h-12 rounded-2xl whitespace-nowrap" onClick={downloadDoc} disabled={!aplicacionId || downloadingDoc}>{downloadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileType2 className="mr-2 h-4 w-4" />}DOC editable</Button>
                  <Button className="h-12 rounded-2xl bg-violet-700 whitespace-nowrap hover:bg-violet-800" onClick={downloadPdf} disabled={!aplicacionId || downloadingPdf}>{downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}PDF directo</Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/80">
          <CardTitle className="text-base">Vista previa</CardTitle>
          {selectedApp ? <p className="text-sm text-slate-500">{selectedApp.nombre}</p> : null}
        </CardHeader>
        <CardContent className="p-0">
          {isExcelReport ? (
            <div className="flex h-[420px] items-center justify-center px-6 text-center text-sm text-slate-500">
              El reporte detallado se descarga en Excel con hojas de resumen, totales, dominios, dimensiones y respuestas registradas.
            </div>
          ) : loadingHtml ? (
            <div className="flex h-[620px] items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generando informe...</div>
          ) : html ? (
            <iframe title="Vista previa de informe" srcDoc={html} className="h-[760px] w-full bg-white" />
          ) : (
            <div className="flex h-[620px] items-center justify-center text-sm text-slate-500">Selecciona una aplicación para generar la vista previa.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
