import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Download, FileText, FileType2, Loader2, Printer, RefreshCcw, ShieldCheck, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  descargarInformeIndividualDoc,
  descargarInformeIndividualPdf,
  obtenerHtmlInformeIndividual,
  obtenerInformesIndividuales,
  type PsicoInformeIndividualItem,
  type PsicoInformesIndividualesResponse,
} from "@/features/psicosocial/api/psicoInformesIndividualesService";

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Disponible",
  NOT_APPLICABLE: "No aplica",
  MISSING_SCORE: "Sin puntaje",
  MISSING_LEVEL: "Sin nivel",
  APP_NOT_CALCULATED: "Aplicación sin cierre",
  INCONSISTENT_FORM: "Inconsistencia A/B",
  FORBIDDEN: "Sin permiso",
};

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "_").replace(/^_+|_+$/g, "") || "informe_individual";
}

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

function statusLabel(item?: PsicoInformeIndividualItem | null) {
  if (!item) return "";
  return STATUS_LABELS[item.status] || item.status;
}

export default function PsicoEmpleadoInformesPage() {
  const { empleadoId = "", aplicacionId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<PsicoInformesIndividualesResponse | null>(null);
  const [instrumentCode, setInstrumentCode] = useState("");
  const [html, setHtml] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingHtml, setLoadingHtml] = useState(false);
  const [downloadingDoc, setDownloadingDoc] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!empleadoId || !aplicacionId) return;
      setLoadingSummary(true);
      setError(null);
      try {
        const response = await obtenerInformesIndividuales(empleadoId, aplicacionId);
        if (!alive) return;
        setData(response);
        const firstAvailable = response.informes.find((item) => item.available) || response.informes[0];
        setInstrumentCode((current) => current || firstAvailable?.instrument_code || "");
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : "No fue posible cargar informes individuales.");
      } finally {
        if (alive) setLoadingSummary(false);
      }
    }
    void load();
    return () => {
      alive = false;
    };
  }, [empleadoId, aplicacionId]);

  const selectedReport = useMemo(
    () => data?.informes.find((item) => item.instrument_code === instrumentCode) || null,
    [data?.informes, instrumentCode],
  );
  const empleadoNombre = data?.empleado?.nombre_completo || `Colaborador ${empleadoId}`;
  const disponibles = useMemo(() => (data?.informes || []).filter((item) => item.available).length, [data?.informes]);
  const baseFilename = useMemo(
    () => safeFilename(`EVA360_Informe_Individual_${instrumentCode || "instrumento"}_${empleadoNombre}_${aplicacionId}`),
    [instrumentCode, empleadoNombre, aplicacionId],
  );

  async function loadPreview() {
    if (!empleadoId || !aplicacionId || !selectedReport?.available) return;
    setLoadingHtml(true);
    setError(null);
    try {
      setHtml(await obtenerHtmlInformeIndividual(empleadoId, aplicacionId, selectedReport.instrument_code));
    } catch (err) {
      setHtml("");
      setError(err instanceof Error ? err.message : "No fue posible generar la vista previa.");
    } finally {
      setLoadingHtml(false);
    }
  }

  useEffect(() => {
    setHtml("");
    if (selectedReport?.available) void loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedReport?.instrument_code, selectedReport?.available]);

  async function downloadDoc() {
    if (!selectedReport?.available) return;
    setDownloadingDoc(true);
    setError(null);
    try {
      await descargarInformeIndividualDoc(empleadoId, aplicacionId, selectedReport.instrument_code, `${baseFilename}.doc`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el DOC editable.");
    } finally {
      setDownloadingDoc(false);
    }
  }

  async function downloadPdf() {
    if (!selectedReport?.available) return;
    setDownloadingPdf(true);
    setError(null);
    try {
      await descargarInformeIndividualPdf(empleadoId, aplicacionId, selectedReport.instrument_code, `${baseFilename}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar el PDF directo.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  if (loadingSummary) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-violet-700" />
          <span className="font-bold text-slate-700">Cargando informes individuales...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-violet-700">
              <ShieldCheck className="h-4 w-4" /> Informes individuales
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">{empleadoNombre}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              CC {data?.empleado?.cedula || "Sin dato"} · {data?.empleado?.cargo || "Sin cargo"} · {data?.empleado?.area || "Sin área"} · {data?.aplicacion?.nombre || `Aplicación #${aplicacionId}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate(-1)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={() => navigate(`/psicosocial/empleados/${empleadoId}/aplicaciones/${aplicacionId}/respuestas`)}>
              <UserRound className="mr-2 h-4 w-4" /> Respuestas
            </Button>
          </div>
        </div>

        <Card className="rounded-2xl border-violet-100 bg-gradient-to-r from-violet-50 to-cyan-50 shadow-sm">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-900">
                <FileText className="h-4 w-4" /> Formato individual BRP
              </div>
              <p className="mt-1 max-w-4xl text-sm text-slate-700">
                Vista previa y descargas por instrumento usando los puntajes oficiales persistidos para el colaborador.
              </p>
            </div>
            <Badge className="w-fit bg-violet-700">{disponibles}/{data?.informes.length || 0} disponibles</Badge>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="p-3">
            <div className="grid gap-2 xl:grid-cols-[auto_minmax(260px,1fr)_minmax(180px,0.45fr)_auto] xl:items-center">
              <CardTitle className="flex h-10 items-center gap-2 whitespace-nowrap px-1 text-sm">
                <FileText className="h-4 w-4 text-violet-700" /> Parámetros del informe
              </CardTitle>

              <div>
                <label className="sr-only">Instrumento</label>
                <Select value={instrumentCode} onValueChange={setInstrumentCode} disabled={!data?.informes.length}>
                  <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white shadow-sm"><SelectValue placeholder="Selecciona instrumento" /></SelectTrigger>
                  <SelectContent>
                    {(data?.informes || []).map((item) => (
                      <SelectItem key={item.instrument_code} value={item.instrument_code}>
                        {item.titulo} · {statusLabel(item)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="sr-only">Estado</label>
                <div className="flex h-10 items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-sm">
                  <span className={`font-black ${selectedReport?.available ? "text-emerald-700" : "text-amber-700"}`}>{statusLabel(selectedReport)}</span>
                  {selectedReport?.reason ? <span className="min-w-0 truncate text-xs text-slate-500">{selectedReport.reason}</span> : null}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:flex xl:flex-nowrap xl:justify-end">
                <Button variant="outline" className="h-10 rounded-xl whitespace-nowrap px-3" onClick={loadPreview} disabled={!selectedReport?.available || loadingHtml}>
                  {loadingHtml ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}Actualizar
                </Button>
                <Button variant="outline" className="h-10 rounded-xl whitespace-nowrap px-3" onClick={() => downloadHtml(`${baseFilename}.html`, html)} disabled={!html}>
                  <Download className="mr-2 h-4 w-4" />HTML
                </Button>
                <Button variant="outline" className="h-10 rounded-xl whitespace-nowrap px-3" onClick={downloadDoc} disabled={!selectedReport?.available || downloadingDoc}>
                  {downloadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileType2 className="mr-2 h-4 w-4" />}DOC editable
                </Button>
                <Button className="h-10 rounded-xl bg-violet-700 whitespace-nowrap px-3 hover:bg-violet-800" onClick={downloadPdf} disabled={!selectedReport?.available || downloadingPdf}>
                  {downloadingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}PDF directo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="flex items-center gap-2 font-black"><AlertTriangle className="h-4 w-4" /> Atención</div>
            <p className="mt-1">{error}</p>
          </div>
        ) : null}

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/80">
            <CardTitle className="text-base">Vista previa</CardTitle>
            <p className="text-sm text-slate-500">{selectedReport?.titulo || "Selecciona un instrumento"}</p>
          </CardHeader>
          <CardContent className="p-0">
            {loadingHtml ? (
              <div className="flex h-[calc(100vh-220px)] min-h-[820px] items-center justify-center text-slate-500"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generando informe...</div>
            ) : html ? (
              <iframe title="Vista previa de informe individual" srcDoc={html} className="h-[calc(100vh-220px)] min-h-[820px] w-full bg-white" />
            ) : (
              <div className="flex h-[calc(100vh-220px)] min-h-[720px] items-center justify-center p-8 text-center text-sm text-slate-500">
                {selectedReport?.available ? "Actualiza la vista previa para generar el informe." : selectedReport?.reason || "No hay informe disponible para este instrumento."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
