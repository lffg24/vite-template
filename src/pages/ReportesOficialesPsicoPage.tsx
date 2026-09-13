import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileSpreadsheet, FileText, FileType2, Info, Loader2, Printer, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
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

type ReportOption = { value: TipoReportePsicoOficial; label: string; description: string };

export const reportGroups: Array<{ label: string; options: ReportOption[] }> = [
  {
    label: "Informes base",
    options: [
      {
        value: "base_forma_a",
        label: "Informe base · Forma A",
        description: "Presenta únicamente los cálculos, tablas, distribuciones y gráficas de la Forma A, extralaboral A y estrés A. No incluye interpretación NeuroMapa ni plan de intervención.",
      },
      {
        value: "base_forma_b",
        label: "Informe base · Forma B",
        description: "Presenta únicamente los cálculos, tablas, distribuciones y gráficas de la Forma B, extralaboral B y estrés B. No incluye interpretación NeuroMapa ni plan de intervención.",
      },
      {
        value: "base_general",
        label: "Informe base · General A/B",
        description: "Reúne en un documento los resultados base de las Formas A y B, manteniendo cada formulario y su P(T) por separado. No unifica categorías A+B ni incluye análisis o plan de intervención.",
      },
      {
        value: "consolidado_base",
        label: "Informe base · Transversal A+B",
        description: "Unifica las frecuencias y porcentajes ya clasificados de las Formas A y B. Conserva los P(T) separados y contiene solo tablas, distribuciones y gráficas, sin análisis NeuroMapa ni plan de intervención.",
      },
    ],
  },
  {
    label: "Informes BTR con análisis",
    options: [
      {
        value: "resultados",
        label: "Informe BTR · General A/B",
        description: "Informe técnico completo por formulario: contenido transversal, resultados A y B separados, análisis NeuroMapa por instrumento, recomendaciones y plan de intervención sugerido.",
      },
      {
        value: "consolidado_analisis",
        label: "Informe BTR · Transversal A+B",
        description: "Informe técnico completo con distribución categórica unificada A+B, P(T) por forma, análisis NeuroMapa por dominio y dimensión, gráficas esenciales y plan de intervención sugerido.",
      },
      {
        value: "resultados_areas",
        label: "Informe BTR · Por áreas",
        description: "Presenta resultados agregados por las áreas registradas en la aplicación. Permite comparar focos de gestión sin exponer respuestas ni resultados individuales.",
      },
    ],
  },
  {
    label: "Informes complementarios y datos",
    options: [
      {
        value: "sociodemografico",
        label: "Informe complementario · Sociodemográfico",
        description: "Describe el perfil poblacional y ocupacional mediante tablas y gráficas. Sirve como contexto y no clasifica por sí mismo el riesgo psicosocial.",
      },
      {
        value: "detallado_excel",
        label: "Reporte de datos · Excel detallado",
        description: "Matriz auditable con respuestas y resultados persistidos por participante, instrumento, dominio y dimensión. No contiene narrativa técnica ni plan de intervención.",
      },
    ],
  },
];

export const reportOptions = reportGroups.flatMap((group) => group.options);

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
    initialTipoParam === "consolidado_base" ||
    initialTipoParam === "consolidado_analisis" ||
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
      saveBlob(`${filename}.doc`, blob);
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
      saveBlob(`${filename}.pdf`, blob);
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
      saveBlob(`${filename}.xlsx`, blob);
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
    return `ABRIL360_${tipoReporte}_${safeApp}`;
  }, [selectedApp, aplicacionId, tipoReporte]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <section className="rounded-[28px] border border-border/70 bg-surface p-7 shadow-card">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-brand-primary">
            <ShieldCheck className="h-4 w-4" /> Reportes oficiales
          </div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">Generador de <span className="marker-highlight">informes BRP</span></h1>
          <p className="mt-2 max-w-4xl text-muted-foreground">
            Genera informes base, BTR con análisis y entregables complementarios. Incluye vista previa, DOC editable y descarga directa en PDF.
          </p>
        </div>
        </div>
      </section>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-5 w-5 text-brand-primary" /> Parámetros del informe</CardTitle>
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
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-accent text-brand-primary transition hover:bg-accent-hover"
                      aria-label="Ver información del informe seleccionado"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto rounded-[28px] border-slate-200">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl font-black text-slate-950">
                        <Sparkles className="h-5 w-5 text-brand-primary" /> Información del entregable
                      </DialogTitle>
                      <DialogDescription className="text-left leading-relaxed text-slate-600">
                        Consulta el contenido y alcance de cada tipo de informe. Seleccionaste: <strong>{currentOption?.label}</strong>.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5">
                      {reportGroups.map((group) => (
                        <section key={group.label} aria-labelledby={`report-group-${group.label.replace(/\s+/g, "-").toLowerCase()}`}>
                          <h3 id={`report-group-${group.label.replace(/\s+/g, "-").toLowerCase()}`} className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-brand-primary">
                            {group.label}
                          </h3>
                          <div className="space-y-2">
                            {group.options.map((option) => (
                              <article
                                key={option.value}
                                className={`rounded-2xl border p-3 ${option.value === tipoReporte ? "border-brand-primary bg-accent/70" : "border-slate-200 bg-white"}`}
                              >
                                <p className="font-black text-slate-950">{option.label}</p>
                                <p className="mt-1 text-sm leading-relaxed text-slate-600">{option.description}</p>
                              </article>
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-accent bg-accent/70 p-4 text-sm leading-relaxed text-slate-700">
                      <p className="font-black text-brand-primary">NeuroMapa Psicosocial ABRIL360</p>
                      <p className="mt-1">
                        Motor local de análisis explicable: prioriza dimensiones críticas, propone lecturas técnicas y arma acciones de intervención sin APIs pagas ni recalcular baremos.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <Select value={tipoReporte} onValueChange={(v) => setTipoReporte(v as TipoReportePsicoOficial)}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white shadow-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {reportGroups.map((group, index) => (
                    <div key={group.label}>
                      {index > 0 ? <SelectSeparator /> : null}
                      <SelectGroup>
                        <SelectLabel className="text-xs font-black uppercase tracking-[0.12em] text-brand-primary">{group.label}</SelectLabel>
                        {group.options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                      </SelectGroup>
                    </div>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-end lg:pt-7">
              {isExcelReport ? (
                <Button className="h-12 rounded-2xl bg-primary whitespace-nowrap hover:bg-primary-hover" onClick={downloadXlsx} disabled={!aplicacionId || downloadingXlsx}>
                  {downloadingXlsx ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}Descargar XLSX
                </Button>
              ) : (
                <>
                  <Button variant="outline" className="h-12 rounded-2xl whitespace-nowrap" onClick={downloadDoc} disabled={!aplicacionId || downloadingDoc}>{downloadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileType2 className="mr-2 h-4 w-4" />}DOC editable</Button>
                  <Button className="h-12 rounded-2xl bg-primary whitespace-nowrap hover:bg-primary-hover" onClick={downloadPdf} disabled={!aplicacionId || downloadingPdf}>{downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}PDF directo</Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : null}

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50/80">
          <CardTitle className="text-base">Vista <span className="marker-highlight">previa</span></CardTitle>
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
