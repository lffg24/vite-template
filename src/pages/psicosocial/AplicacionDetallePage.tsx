import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Coins,
  FilePenLine,
  FileText,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import {
  AplicacionDetalle,
  AreaEmpresa,
  CargoEmpresa,
  CrearEmpleadoPayload,
  EmpleadoImportResponse,
  psicoAdminService,
} from "@/features/psicosocial/api/psicoAdminService";
import { ToastCard, type ToastPayload } from "@/components/feedback/ToastCard";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import {
  BulkUploadModal,
  bulkErrorResult,
  validateBulkEmployeeFile,
} from "./EmpresaEmpleadosPage";
import {
  guardarFichaSociodemografica,
  buscarMunicipiosPsico,
  obtenerCatalogosSociodemograficos,
  type FichaSociodemografica,
} from "@/features/psicosocial/api/psicoEmpleadoService";
import {
  FALLBACK_SOCIO_CATALOGOS,
  SOCIO_CURRENT_YEAR,
  SOCIO_ESTRATO_OPTIONS,
  SOCIO_SEXO_OPTIONS,
  SocioMunicipioField,
  SocioNumberField,
  SocioReadOnlyField,
  SocioSelectField,
  SocioTextField,
  normalizeSocioOptions,
  type CatalogosSocio,
} from "@/features/psicosocial/components/sociodemografia/SociodemografiaFields";

function instrumentLabel(code: string) {
  return (
    (
      {
        PSICO_INTRA_A: "Forma A",
        PSICO_INTRA_B: "Forma B",
        PSICO_EXTRA: "Extralaboral",
        PSICO_ESTRES: "Estrés",
      } as Record<string, string>
    )[code] || code
  );
}
function fmtDate(value?: string) {
  if (!value) return "Sin fecha";
  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString("es-CO");
  }
  try {
    return new Date(value).toLocaleDateString("es-CO");
  } catch {
    return value;
  }
}
function isFinalizada(estado?: string | null) {
  return String(estado || "")
    .toLowerCase()
    .includes("final");
}
function estadoAplicacionLabel(estado?: string | null) {
  const key = String(estado || "BORRADOR")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  return (
    (
      {
        BORRADOR: "Borrador",
        EN_CAPTURA: "En captura",
        CALCULANDO: "Calculando",
        FINALIZADA: "Finalizada",
        REABIERTA: "Reabierta",
        ERROR_CALCULO: "Error de cálculo",
      } as Record<string, string>
    )[key] || String(estado || "Borrador")
  );
}
const CLOSURE_GUIDE_STORAGE_KEY = "abril360.detalleAplicacion.cierreGuide.v1";

type EmployeeFormState = {
  nombres: string;
  apellidos: string;
  cedula: string;
  identificador_externo: string;
  email: string;
  telefono: string;
  area_id: string;
  cargo_id: string;
};
const emptyEmployeeForm: EmployeeFormState = {
  nombres: "",
  apellidos: "",
  cedula: "",
  identificador_externo: "",
  email: "",
  telefono: "",
  area_id: "",
  cargo_id: "",
};

const emptyEmployeeSocioForm: FichaSociodemografica = {
  sexo: "",
  anio_nacimiento: null,
  estado_civil: "",
  nivel_estudios: "",
  ocupacion_profesion: "",
  ciudad_residencia: "",
  departamento_residencia: "",
  ciudad_trabajo: "",
  departamento_trabajo: "",
  estrato: "",
  tipo_vivienda: "",
  personas_dependen: null,
  tipo_cargo: "",
  tipo_contrato: "",
  horas_diarias_trabajo: null,
  tipo_salario: "",
  antiguedad_empresa: "",
  antiguedad_cargo: "",
};

function isFilledSocioValue(value: unknown) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

export function hasApplicationEmployeeSocioData(ficha: FichaSociodemografica) {
  const keys: Array<keyof FichaSociodemografica> = [
    "sexo",
    "anio_nacimiento",
    "estado_civil",
    "nivel_estudios",
    "ocupacion_profesion",
    "ciudad_residencia",
    "departamento_residencia",
    "ciudad_trabajo",
    "departamento_trabajo",
    "estrato",
    "tipo_vivienda",
    "personas_dependen",
    "tipo_cargo",
    "tipo_contrato",
    "horas_diarias_trabajo",
    "tipo_salario",
    "antiguedad_empresa",
    "antiguedad_cargo",
  ];
  return keys.some((key) => isFilledSocioValue(ficha[key]));
}

export function buildApplicationEmployeeSocioDraft(
  ficha: FichaSociodemografica,
  area?: string | null,
  cargo?: string | null,
) {
  const draft: FichaSociodemografica & { finalizar: false } = {
    ...ficha,
    area: String(area || ficha.area || "").trim(),
    cargo: String(cargo || ficha.cargo || "").trim(),
    finalizar: false,
  };
  return draft;
}
function validateEmail(value: string) {
  return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

type CierreAplicacionResponse = {
  ok: boolean;
  error?: string;
  estado?: string;
  participantes?: number;
  evaluacion_ids?: number[];
  message?: string;
  bloqueantes?: Array<{
    empleado_id?: number;
    documento?: string;
    nombre?: string;
    instrumentos_en_captura?: string[];
    respondidas?: number;
    total_preguntas?: number;
  }>;
  scoring_fallidos?: Record<
    string,
    {
      quality?: {
        sin_transformado?: number;
        sin_nivel?: number;
      };
    }
  >;
};

type ParticipantInstrumentChip = {
  code: string;
  label: string;
  state: "complete" | "capture" | "pending";
};

const INTRA_A_CODE = "PSICO_INTRA_A";
const INTRA_B_CODE = "PSICO_INTRA_B";
const GENERAL_DATA_CODE = "DATOS_GENERALES";
const PARTICIPANT_STATUS_ORDER: Record<string, number> = {
  "En captura": 0,
  Completo: 1,
  "Por tabular": 2,
};
const participantCollator = new Intl.Collator("es-CO", {
  numeric: true,
  sensitivity: "base",
});

export type ParticipantSortKey =
  | "colaborador"
  | "areaCargo"
  | "instrumentos"
  | "estado"
  | "accion";
export type ParticipantSort = {
  key: ParticipantSortKey;
  direction: "asc" | "desc";
};

function participantInstrumentState(emp: Partial<AplicacionDetalle["empleados"][number]>, code: string) {
  if ((emp.instrumentos_registrados || []).includes(code)) return "complete";
  if ((emp.instrumentos_en_captura || []).includes(code)) return "capture";
  return "pending";
}

function participantGeneralDataState(emp: Partial<AplicacionDetalle["empleados"][number]>) {
  const ficha = emp.ficha_sociodemografica;
  if (!ficha?.requerida) return null;
  if (ficha.completa) return "complete";
  const estado = String(ficha.estado || "").trim().toLowerCase();
  return estado && estado !== "sin_iniciar" ? "capture" : "pending";
}

export function participantStatusLabel(emp: Partial<AplicacionDetalle["empleados"][number]>) {
  if (emp.completo) return "Completo";
  if (emp.registrado) return "En captura";
  return "Por tabular";
}

export function participantActionLabel(
  emp: Partial<AplicacionDetalle["empleados"][number]>,
  finalizada = false,
) {
  const enabled = Boolean(
    !finalizada ||
      emp.registrado ||
      emp.completo ||
      (emp.instrumentos_registrados || []).length > 0,
  );
  if (finalizada) return enabled ? "Ver respuestas" : "Sin respuestas";
  if (emp.completo) return "Ver respuestas";
  if (emp.registrado) return "Actualizar respuesta";
  return "Registrar respuesta";
}

export function participantInstrumentChips(
  instrumentos: AplicacionDetalle["instrumentos"],
  emp: Partial<AplicacionDetalle["empleados"][number]>,
): ParticipantInstrumentChip[] {
  const chips: ParticipantInstrumentChip[] = [];
  const generalState = participantGeneralDataState(emp);
  if (generalState) {
    chips.push({ code: GENERAL_DATA_CODE, label: "Datos generales", state: generalState });
  }

  const aState = participantInstrumentState(emp, INTRA_A_CODE);
  const bState = participantInstrumentState(emp, INTRA_B_CODE);
  const selectedIntra =
    aState !== "pending" ? INTRA_A_CODE : bState !== "pending" ? INTRA_B_CODE : null;

  for (const instrument of instrumentos) {
    const code = instrument.instrument_code;
    if (selectedIntra === INTRA_A_CODE && code === INTRA_B_CODE) continue;
    if (selectedIntra === INTRA_B_CODE && code === INTRA_A_CODE) continue;
    chips.push({
      code,
      label: instrumentLabel(code),
      state: participantInstrumentState(emp, code),
    });
  }

  return chips;
}

function compareText(a?: string | null, b?: string | null) {
  return participantCollator.compare(String(a || "").trim(), String(b || "").trim());
}

function participantSortValue(
  emp: AplicacionDetalle["empleados"][number],
  instrumentos: AplicacionDetalle["instrumentos"],
  key: ParticipantSortKey,
  finalizada = false,
) {
  if (key === "estado") {
    return PARTICIPANT_STATUS_ORDER[participantStatusLabel(emp)] ?? 99;
  }
  if (key === "areaCargo") {
    return `${emp.area || ""} ${emp.cargo || ""}`;
  }
  if (key === "instrumentos") {
    return participantInstrumentChips(instrumentos, emp)
      .map((chip) => `${chip.state}-${chip.label}`)
      .join(" ");
  }
  if (key === "accion") {
    return participantActionLabel(emp, finalizada);
  }
  return `${emp.nombre || ""} ${emp.cedula || ""}`;
}

export function sortApplicationParticipants(
  rows: AplicacionDetalle["empleados"],
  instrumentos: AplicacionDetalle["instrumentos"],
  sort: ParticipantSort = { key: "estado", direction: "asc" },
  finalizada = false,
) {
  const direction = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const aValue = participantSortValue(a, instrumentos, sort.key, finalizada);
    const bValue = participantSortValue(b, instrumentos, sort.key, finalizada);
    const main =
      typeof aValue === "number" && typeof bValue === "number"
        ? aValue - bValue
        : compareText(String(aValue), String(bValue));
    if (main !== 0) return main * direction;
    return compareText(a.nombre, b.nombre) || compareText(a.cedula, b.cedula);
  });
}

function closureBlockersMessage(detail: unknown) {
  const body = detail as Partial<CierreAplicacionResponse> | undefined;
  const blockers = Array.isArray(body?.bloqueantes) ? body.bloqueantes : [];
  if (!blockers.length) return "";
  const sample = blockers
    .slice(0, 3)
    .map((item) => {
      const instrumentos = (item.instrumentos_en_captura || [])
        .map(instrumentLabel)
        .join(", ");
      const progress =
        item.respondidas != null && item.total_preguntas != null
          ? ` (${item.respondidas}/${item.total_preguntas})`
          : "";
      return `${item.nombre || item.documento || `Empleado ${item.empleado_id}`}: ${instrumentos || "instrumento incompleto"}${progress}`;
    })
    .join(" · ");
  const extra = blockers.length > 3 ? ` y ${blockers.length - 3} más` : "";
  return `Pendientes: ${sample}${extra}.`;
}

export default function AplicacionDetallePage() {
  const { empresaId = "", aplicacionId = "" } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<AplicacionDetalle | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const [calcStartedAt, setCalcStartedAt] = useState<number | null>(null);
  const [calcElapsed, setCalcElapsed] = useState(0);
  const [openEmployeeDrawer, setOpenEmployeeDrawer] = useState(false);
  const [areas, setAreas] = useState<AreaEmpresa[]>([]);
  const [cargos, setCargos] = useState<CargoEmpresa[]>([]);
  const [employeeForm, setEmployeeForm] =
    useState<EmployeeFormState>(emptyEmployeeForm);
  const [employeeSocioForm, setEmployeeSocioForm] =
    useState<FichaSociodemografica>({ ...emptyEmployeeSocioForm });
  const [employeeSocioCatalogs, setEmployeeSocioCatalogs] =
    useState<CatalogosSocio>(FALLBACK_SOCIO_CATALOGOS);
  const [employeeSocioLoading, setEmployeeSocioLoading] = useState(false);
  const [employeeResQuery, setEmployeeResQuery] = useState("");
  const [employeeTrabQuery, setEmployeeTrabQuery] = useState("");
  const [employeeResMunicipios, setEmployeeResMunicipios] = useState<Array<{ municipio: string; departamento?: string | null }>>([]);
  const [employeeTrabMunicipios, setEmployeeTrabMunicipios] = useState<Array<{ municipio: string; departamento?: string | null }>>([]);
  const [employeeFieldErrors, setEmployeeFieldErrors] = useState<
    Record<string, string>
  >({});
  const [savingEmployee, setSavingEmployee] = useState(false);
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkResult, setBulkResult] = useState<EmpleadoImportResponse | null>(
    null,
  );
  const [bulkSaving, setBulkSaving] = useState(false);
  const bulkRunId = useRef(0);
  const [catalogModal, setCatalogModal] = useState<null | "area" | "cargo">(
    null,
  );
  const [catalogName, setCatalogName] = useState("");
  const [catalogSaving, setCatalogSaving] = useState(false);
  const [participantPage, setParticipantPage] = useState(1);
  const [participantPageSize, setParticipantPageSize] = useState(10);
  const [participantSort, setParticipantSort] = useState<ParticipantSort>({
    key: "estado",
    direction: "asc",
  });
  const [cleanupTarget, setCleanupTarget] = useState<any | null>(null);
  const [cleanupPreview, setCleanupPreview] = useState<{
    ok: boolean;
    counts: Record<string, number>;
    total_registros: number;
    bloqueada: boolean;
    estado: string;
  } | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [showClosureGuide, setShowClosureGuide] = useState(() => {
    try {
      return (
        window.localStorage.getItem(CLOSURE_GUIDE_STORAGE_KEY) !== "dismissed"
      );
    } catch {
      return true;
    }
  });

  const notify = (payload: Omit<ToastPayload, "id">) => {
    const id = Date.now();
    setToast({ id, ...payload });
    window.setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 5200);
  };

  const dismissClosureGuide = () => {
    try {
      window.localStorage.setItem(CLOSURE_GUIDE_STORAGE_KEY, "dismissed");
    } catch {
      // localStorage puede no estar disponible en algunos contextos de prueba.
    }
    setShowClosureGuide(false);
  };

  const load = async () => {
    if (!empresaId || !aplicacionId) return;
    setLoading(true);
    setError(null);
    try {
      setData(
        await psicoAdminService.detalleAplicacion(
          empresaId,
          Number(aplicacionId),
        ),
      );
    } catch (e: any) {
      setError(
        e?.message || "No fue posible cargar el detalle de la aplicación.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId, aplicacionId]);

  useEffect(() => {
    const onExpired = () => {
      notify({
        type: "warning",
        title: "Sesión vencida",
        message: "Te redirigiremos al login para continuar con seguridad.",
      });
      window.setTimeout(
        () =>
          navigate(
            `/login?next=${encodeURIComponent(window.location.pathname)}`,
          ),
        1500,
      );
    };
    window.addEventListener("abril360:session-expired", onExpired);
    return () =>
      window.removeEventListener("abril360:session-expired", onExpired);
  }, [navigate]);

  useEffect(() => {
    if (!closing || !calcStartedAt) return;
    const timer = window.setInterval(() => {
      setCalcElapsed(
        Math.max(0, Math.floor((Date.now() - calcStartedAt) / 1000)),
      );
    }, 500);
    return () => window.clearInterval(timer);
  }, [closing, calcStartedAt]);

  const calcProgress = closing
    ? Math.min(96, Math.max(8, Math.round((calcElapsed / 90) * 100)))
    : 0;
  const calcStage = !closing
    ? ""
    : calcElapsed < 8
      ? "Preparando cierre y validando completitud..."
      : calcElapsed < 25
        ? "Sincronizando respuestas y hechos analíticos..."
        : calcElapsed < 60
          ? "Calculando puntajes transformados y niveles de riesgo..."
          : "Consolidando resultados, dominios, dimensiones e informes...";

  const visibleCargos = useMemo(
    () =>
      !employeeForm.area_id
        ? cargos
        : cargos.filter(
            (c) => !c.area_id || String(c.area_id) === employeeForm.area_id,
          ),
    [cargos, employeeForm.area_id],
  );
  const selectedArea = areas.find((a) => String(a.id) === employeeForm.area_id);
  const selectedCargo = cargos.find(
    (c) => String(c.id) === employeeForm.cargo_id,
  );

  const loadCatalogs = async () => {
    if (!empresaId) return;
    const [areasRes, cargosRes] = await Promise.all([
      psicoAdminService.listarAreas(empresaId),
      psicoAdminService.listarCargos(empresaId),
    ]);
    setAreas(areasRes.items || []);
    setCargos(cargosRes.items || []);
  };

  const openAddEmployee = async () => {
    setEmployeeFieldErrors({});
    setEmployeeSocioForm({ ...emptyEmployeeSocioForm });
    setEmployeeResQuery("");
    setEmployeeTrabQuery("");
    setEmployeeResMunicipios([]);
    setEmployeeTrabMunicipios([]);
    setOpenEmployeeDrawer(true);
    try {
      setEmployeeSocioLoading(true);
      const [catalogs] = await Promise.all([
        obtenerCatalogosSociodemograficos().catch(() => null),
        loadCatalogs(),
      ]);
      if (catalogs) {
        setEmployeeSocioCatalogs({
          estado_civil: normalizeSocioOptions(FALLBACK_SOCIO_CATALOGOS.estado_civil, catalogs.estado_civil),
          nivel_estudios: normalizeSocioOptions(FALLBACK_SOCIO_CATALOGOS.nivel_estudios, catalogs.nivel_estudios),
          tipo_vivienda: normalizeSocioOptions(FALLBACK_SOCIO_CATALOGOS.tipo_vivienda, catalogs.tipo_vivienda),
          tipo_cargo: normalizeSocioOptions(FALLBACK_SOCIO_CATALOGOS.tipo_cargo, catalogs.tipo_cargo),
          tipo_contrato: normalizeSocioOptions(FALLBACK_SOCIO_CATALOGOS.tipo_contrato, catalogs.tipo_contrato),
          tipo_salario: normalizeSocioOptions(FALLBACK_SOCIO_CATALOGOS.tipo_salario, catalogs.tipo_salario),
        });
      }
    } catch (e: any) {
      notify({
        type: "error",
        title: "No fue posible cargar catálogos",
        message: e?.message || "Revisa áreas y cargos e intenta nuevamente.",
      });
    } finally {
      setEmployeeSocioLoading(false);
    }
  };

  const resetBulkUpload = () => {
    bulkRunId.current += 1;
    setBulkFile(null);
    setBulkResult(null);
    setBulkSaving(false);
  };

  const closeBulkUpload = () => {
    setOpenBulkUpload(false);
    resetBulkUpload();
  };

  const runBulkImport = async (
    dryRun: boolean,
    fileOverride?: File | null,
    runIdOverride?: number,
  ) => {
    const selectedFile = fileOverride ?? bulkFile;
    if (!selectedFile) {
      notify({
        type: "warning",
        title: "Selecciona un archivo",
        message: "Carga la plantilla diligenciada en formato .xlsx o .csv.",
      });
      return;
    }
    const fileError = validateBulkEmployeeFile(selectedFile);
    if (fileError) {
      setBulkResult(bulkErrorResult(fileError));
      notify({
        type: "warning",
        title: "Archivo no permitido",
        message: fileError,
      });
      return;
    }
    const runId = runIdOverride ?? bulkRunId.current + 1;
    bulkRunId.current = runId;
    setBulkSaving(true);
    try {
      const result = await psicoAdminService.importarEmpleados(
        empresaId,
        selectedFile,
        dryRun,
      );
      if (runId !== bulkRunId.current) return;
      setBulkResult(result);
      if (!result.ok) {
        notify({
          type: "warning",
          title: "Archivo con observaciones",
          message: "Revisa los errores detectados antes de importar.",
        });
        return;
      }
      if (dryRun) {
        notify({
          type: "success",
          title: "Archivo validado",
          message: `${result.valid_rows} colaboradores listos para importar.`,
        });
      } else {
        notify({
          type: "success",
          title: "Carga completada",
          message: `${result.created} creados y ${result.updated} actualizados.`,
        });
        await load();
        if (runId !== bulkRunId.current) return;
        closeBulkUpload();
      }
    } catch (e: any) {
      if (runId !== bulkRunId.current) return;
      notify({
        type: "error",
        title: "No fue posible procesar",
        message: e?.message || "Intenta nuevamente.",
      });
    } finally {
      if (runId === bulkRunId.current) setBulkSaving(false);
    }
  };

  const handleBulkFileChange = (file: File | null) => {
    const runId = bulkRunId.current + 1;
    bulkRunId.current = runId;
    setBulkFile(file);
    setBulkResult(null);
    setBulkSaving(false);
    if (!file) return;
    const fileError = validateBulkEmployeeFile(file);
    if (fileError) {
      setBulkResult(bulkErrorResult(fileError));
      notify({
        type: "warning",
        title: "Archivo no permitido",
        message: fileError,
      });
      return;
    }
    window.setTimeout(() => void runBulkImport(true, file, runId), 0);
  };

  const updateEmployeeForm = (key: keyof EmployeeFormState, value: string) => {
    if (key === "cedula" || key === "telefono") value = digitsOnly(value);
    setEmployeeForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "area_id" ? { cargo_id: "" } : {}),
    }));
    setEmployeeFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const updateEmployeeSocioForm = (key: keyof FichaSociodemografica, value: string | number | null) => {
    setEmployeeSocioForm((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => { setEmployeeResQuery(String(employeeSocioForm.ciudad_residencia || "")); }, [employeeSocioForm.ciudad_residencia]);
  useEffect(() => { setEmployeeTrabQuery(String(employeeSocioForm.ciudad_trabajo || "")); }, [employeeSocioForm.ciudad_trabajo]);

  useEffect(() => {
    const query = employeeResQuery.trim();
    const timer = window.setTimeout(() => {
      if (query.length < 2) return setEmployeeResMunicipios([]);
      buscarMunicipiosPsico(query).then((res) => setEmployeeResMunicipios(res.items || [])).catch(() => setEmployeeResMunicipios([]));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [employeeResQuery]);

  useEffect(() => {
    const query = employeeTrabQuery.trim();
    const timer = window.setTimeout(() => {
      if (query.length < 2) return setEmployeeTrabMunicipios([]);
      buscarMunicipiosPsico(query).then((res) => setEmployeeTrabMunicipios(res.items || [])).catch(() => setEmployeeTrabMunicipios([]));
    }, 280);
    return () => window.clearTimeout(timer);
  }, [employeeTrabQuery]);

  const selectEmployeeMunicipio = (
    kind: "res" | "trab",
    item: { municipio: string; departamento?: string | null },
  ) => {
    if (kind === "res") {
      setEmployeeSocioForm((prev) => ({
        ...prev,
        ciudad_residencia: item.municipio,
        departamento_residencia: item.departamento || "",
      }));
      setEmployeeResMunicipios([]);
      setEmployeeResQuery(item.municipio);
      return;
    }
    setEmployeeSocioForm((prev) => ({
      ...prev,
      ciudad_trabajo: item.municipio,
      departamento_trabajo: item.departamento || "",
    }));
    setEmployeeTrabMunicipios([]);
    setEmployeeTrabQuery(item.municipio);
  };

  const validateEmployeeForm = () => {
    const next: Record<string, string> = {};
    if (!employeeForm.nombres.trim()) next.nombres = "Nombres es obligatorio.";
    if (!employeeForm.apellidos.trim())
      next.apellidos = "Apellidos es obligatorio.";
    if (!employeeForm.cedula.trim()) next.cedula = "Cédula es obligatoria.";
    if (employeeForm.cedula.trim() && employeeForm.cedula.trim().length < 5)
      next.cedula = "Cédula debe tener mínimo 5 dígitos.";
    if (employeeForm.email.trim() && !validateEmail(employeeForm.email))
      next.email = "Correo inválido.";
    if (employeeForm.telefono.trim() && employeeForm.telefono.trim().length < 7)
      next.telefono = "Teléfono debe tener mínimo 7 dígitos.";
    if (!employeeForm.area_id) next.area_id = "Área es obligatoria.";
    if (!employeeForm.cargo_id) next.cargo_id = "Cargo es obligatorio.";
    setEmployeeFieldErrors(next);
    if (Object.keys(next).length)
      notify({
        type: "warning",
        title: "Faltan datos obligatorios",
        message: "Revisa nombres, apellidos, cédula, área y cargo.",
      });
    return Object.keys(next).length === 0;
  };

  const submitEmployee = async (event: FormEvent) => {
    event.preventDefault();
    if (!validateEmployeeForm() || !empresaId) return;
    setSavingEmployee(true);
    try {
      const payload: CrearEmpleadoPayload = {
        nombres: employeeForm.nombres.trim(),
        apellidos: employeeForm.apellidos.trim(),
        cedula: employeeForm.cedula.trim(),
        area_id: Number(employeeForm.area_id),
        cargo_id: Number(employeeForm.cargo_id),
        identificador_externo:
          employeeForm.identificador_externo.trim() || undefined,
        email: employeeForm.email.trim().toLowerCase() || undefined,
        telefono: employeeForm.telefono.trim() || undefined,
      };
      const created = await psicoAdminService.crearEmpleado(empresaId, payload);
      const socioDraft = buildApplicationEmployeeSocioDraft(
        employeeSocioForm,
        selectedArea?.nombre,
        selectedCargo?.nombre,
      );
      const shouldSaveSocio = hasApplicationEmployeeSocioData(socioDraft);
      let socioWarning = "";
      if (shouldSaveSocio && created.empleado_id) {
        try {
          await guardarFichaSociodemografica(created.empleado_id, aplicacionId, socioDraft);
        } catch (e: any) {
          socioWarning = e?.message || "No fue posible guardar el perfil sociodemográfico.";
        }
      }
      setEmployeeForm(emptyEmployeeForm);
      setEmployeeSocioForm({ ...emptyEmployeeSocioForm });
      setOpenEmployeeDrawer(false);
      notify({
        type: socioWarning ? "warning" : "success",
        title: "Colaborador creado",
        message: socioWarning
          ? `Se agregó el colaborador, pero la ficha opcional quedó pendiente: ${socioWarning}`
          : shouldSaveSocio
            ? "Se agregó a la empresa y se guardó la ficha sociodemográfica en borrador."
            : "Se agregó a la empresa y se actualizará el listado de esta aplicación.",
      });
      await load();
    } catch (e: any) {
      notify({
        type: "error",
        title: "No fue posible guardar",
        message: e?.message || "Revisa los datos e intenta nuevamente.",
      });
    } finally {
      setSavingEmployee(false);
    }
  };

  const saveCatalog = async (event: FormEvent) => {
    event.preventDefault();
    const name = catalogName.trim();
    if (!name || !catalogModal || !empresaId) return;
    setCatalogSaving(true);
    try {
      if (catalogModal === "area") {
        const res = await psicoAdminService.crearArea(empresaId, {
          nombre: name,
        });
        setAreas((await psicoAdminService.listarAreas(empresaId)).items || []);
        if (res.item?.id) updateEmployeeForm("area_id", String(res.item.id));
        notify({
          type: "success",
          title: "Área creada",
          message: `${name} quedó disponible para esta empresa.`,
        });
      } else {
        const res = await psicoAdminService.crearCargo(empresaId, {
          nombre: name,
          area_id: employeeForm.area_id
            ? Number(employeeForm.area_id)
            : undefined,
        });
        setCargos(
          (await psicoAdminService.listarCargos(empresaId)).items || [],
        );
        if (res.item?.id) updateEmployeeForm("cargo_id", String(res.item.id));
        notify({
          type: "success",
          title: "Cargo creado",
          message: `${name} quedó asociado al área seleccionada.`,
        });
      }
      setCatalogModal(null);
      setCatalogName("");
    } catch (e: any) {
      notify({
        type: "error",
        title: "No fue posible crear catálogo",
        message: e?.message || "Intenta nuevamente.",
      });
    } finally {
      setCatalogSaving(false);
    }
  };

  const estadoAplicacion = String(data?.aplicacion?.estado || "BORRADOR")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  const finalizada = isFinalizada(data?.aplicacion?.estado);

  const empleados = useMemo(() => {
    const term = q.trim().toLowerCase();
    const rows = data?.empleados || [];
    const filtered = !term
      ? rows
      : rows.filter((e) =>
          `${e.cedula} ${e.nombre} ${e.area} ${e.cargo} ${e.email}`
            .toLowerCase()
            .includes(term),
        );
    return sortApplicationParticipants(
      filtered,
      data?.instrumentos || [],
      participantSort,
      finalizada,
    );
  }, [data, finalizada, participantSort, q]);

  useEffect(() => {
    setParticipantPage(1);
  }, [q, participantPageSize, data?.empleados?.length, participantSort]);

  const toggleParticipantSort = (key: ParticipantSortKey) => {
    setParticipantSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const totalParticipantPages = Math.max(
    1,
    Math.ceil(empleados.length / participantPageSize),
  );
  const currentParticipantPage = Math.min(
    participantPage,
    totalParticipantPages,
  );
  const participantStart =
    empleados.length === 0
      ? 0
      : (currentParticipantPage - 1) * participantPageSize + 1;
  const participantEnd = Math.min(
    empleados.length,
    currentParticipantPage * participantPageSize,
  );
  const paginatedEmpleados = empleados.slice(
    (currentParticipantPage - 1) * participantPageSize,
    currentParticipantPage * participantPageSize,
  );

  const cleanupBlocked =
    estadoAplicacion === "FINALIZADA" || estadoAplicacion === "CALCULANDO";
  const canOpenParticipant = (emp: any) =>
    !finalizada ||
    Boolean(
      emp.registrado ||
      emp.completo ||
      (emp.instrumentos_registrados || []).length > 0,
    );
  const participantSortAria = (key: ParticipantSortKey) =>
    participantSort.key === key
      ? participantSort.direction === "asc"
        ? "ascending"
        : "descending"
      : "none";
  const renderParticipantSortHeader = (
    key: ParticipantSortKey,
    label: string,
    align: "left" | "right" = "left",
  ) => {
    const active = participantSort.key === key;
    const Icon = active
      ? participantSort.direction === "asc"
        ? ChevronUp
        : ChevronDown
      : ArrowUpDown;
    return (
      <button
        type="button"
        onClick={() => toggleParticipantSort(key)}
        className={`inline-flex items-center gap-1 rounded-lg px-1 py-1 font-black uppercase tracking-normal transition hover:bg-slate-100 hover:text-slate-800 ${
          active ? "text-violet-700" : "text-slate-500"
        } ${align === "right" ? "ml-auto" : ""}`}
      >
        {label}
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    );
  };

  async function openCleanupResponses(emp: any) {
    if (!empresaId || !aplicacionId) return;

    setCleanupTarget(emp);
    setCleanupPreview(null);
    setCleanupLoading(true);

    try {
      const preview = await psicoAdminService.previewLimpiarRespuestasEmpleado(
        empresaId,
        Number(aplicacionId),
        Number(emp.id),
      );
      setCleanupPreview(preview);
    } catch (e: any) {
      setCleanupTarget(null);
      notify({
        type: "error",
        title: "No fue posible preparar la limpieza",
        message: e?.message || "Intenta nuevamente.",
      });
    } finally {
      setCleanupLoading(false);
    }
  }

  async function confirmCleanupResponses() {
    if (!empresaId || !aplicacionId || !cleanupTarget || cleanupBlocked) return;

    setCleanupLoading(true);

    try {
      const result = await psicoAdminService.limpiarRespuestasEmpleado(
        empresaId,
        Number(aplicacionId),
        Number(cleanupTarget.id),
      );

      notify({
        type: "success",
        title: "Respuestas eliminadas",
        message: `Se eliminaron ${result.total_eliminado || 0} registros de respuestas/resultados. Los créditos ya consumidos se conservan; si vuelves a cargar este registro se consumirá un crédito adicional.`,
      });

      setCleanupTarget(null);
      setCleanupPreview(null);
      await load();
    } catch (e: any) {
      notify({
        type: "error",
        title: "No fue posible eliminar las respuestas",
        message:
          e?.message ||
          "Verifica que la aplicación no esté finalizada o calculando.",
      });
    } finally {
      setCleanupLoading(false);
    }
  }

  async function cerrarAplicacion() {
    if (!data || !empresaId || !aplicacionId) return;
    const completos = Number(data.resumen.participantes_completos || 0);
    if (completos < 1) {
      notify({
        type: "warning",
        title: "No se puede cerrar todavía",
        message:
          "Debe existir al menos un participante con la batería completa para habilitar el cálculo.",
      });
      return;
    }
    setConfirmClose(true);
  }

  async function confirmReabrirAplicacion() {
    if (!empresaId || !aplicacionId) return;
    setConfirmReopen(false);
    setClosing(true);
    setCalcStartedAt(Date.now());
    setCalcElapsed(0);
    try {
      await psicoAdminService.reabrirAplicacion(
        empresaId,
        Number(aplicacionId),
        {
          motivo: "Corrección de respuestas y reprocesamiento",
          consumir_credito: true,
        },
      );
      notify({
        type: "success",
        title: "Aplicación reabierta",
        message:
          "Se registró el reproceso. Al cerrar nuevamente podrá consumirse un crédito adicional.",
      });
      await load();
    } catch (e: any) {
      notify({
        type: "error",
        title: "No fue posible reabrir",
        message: e?.message || "Intenta nuevamente.",
      });
    } finally {
      setClosing(false);
      setCalcStartedAt(null);
      setCalcElapsed(0);
    }
  }

  async function confirmCerrarAplicacion() {
    if (!empresaId || !aplicacionId) return;
    setConfirmClose(false);
    setClosing(true);
    setCalcStartedAt(Date.now());
    setCalcElapsed(0);
    try {
      const cierre = (await psicoAdminService.cerrarAplicacion(
        empresaId,
        Number(aplicacionId),
        3,
      )) as CierreAplicacionResponse;
      if (cierre && cierre.ok === false) {
        const calidad = cierre.scoring_fallidos
          ? Object.values(cierre.scoring_fallidos as Record<string, any>)[0]
              ?.quality
          : null;
        const detalle = calidad
          ? `Sin transformar: ${calidad.sin_transformado || 0}. Sin nivel: ${calidad.sin_nivel || 0}.`
          : cierre.message || "El motor detectó inconsistencias de cálculo.";
        notify({
          type: "error",
          title: "Cálculo incompleto",
          message: `No se cerró la aplicación para evitar resultados inválidos. ${detalle}`,
        });
        await load();
        return;
      }
      notify({
        type: "success",
        title: "Aplicación cerrada",
        message:
          "Se ejecutó el cálculo y se congelaron los resultados. Las correcciones posteriores requieren reabrir/reprocesar y pueden consumir créditos adicionales.",
      });
      await load();
    } catch (e: any) {
      const blockers = closureBlockersMessage(e?.detail);
      notify({
        type: "error",
        title: "No fue posible cerrar",
        message:
          blockers ||
          e?.message ||
          "Revisa la completitud de la aplicación antes de calcular.",
      });
    } finally {
      setClosing(false);
      setCalcStartedAt(null);
      setCalcElapsed(0);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto flex max-w-7xl items-center gap-3 rounded-3xl border bg-white p-8 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-violet-700" /> Cargando
          aplicación...
        </div>
      </main>
    );
  }
  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-red-50 p-8 text-red-800">
          <h1 className="text-2xl font-black">
            No se pudo cargar la aplicación
          </h1>
          <p className="mt-2 text-sm">{error || "Detalle no disponible."}</p>
          <div className="mt-5 flex gap-3">
            <button
              onClick={() =>
                navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)
              }
              className="rounded-xl border bg-white px-4 py-2 font-bold"
            >
              Volver
            </button>
            <button
              onClick={() => void load()}
              className="rounded-xl bg-violet-700 px-4 py-2 font-bold text-white"
            >
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  const resumen = data.resumen;
  const creditosAplicacion = data.creditos;
  const participantesCompletos = Number(resumen.participantes_completos || 0);
  const pendientesCompletar = Number(
    resumen.participantes_pendientes_completar ?? resumen.pendientes ?? 0,
  );
  const creditosReservadosCaptura = Number(
    resumen.creditos_reservados ??
      creditosAplicacion?.registros_consumidos ??
      resumen.participantes_registrados ??
      0,
  );
  const creditosConsumidosCaptura = Number(
    creditosAplicacion?.creditos_consumidos ??
      resumen.creditos_consumidos ??
      participantesCompletos,
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 lg:p-8">
      {closing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl border border-violet-100 bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                  Motor de cálculo psicosocial
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Calculando resultados oficiales
                </h2>
                <p className="mt-2 text-sm text-slate-600">{calcStage}</p>
                <div className="mt-4 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-violet-700 transition-all duration-500"
                    style={{ width: `${calcProgress}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-slate-500">
                  <span>Tiempo transcurrido: {calcElapsed}s</span>
                  <span>{calcProgress}% estimado</span>
                </div>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  No cierres esta ventana. En aplicaciones grandes el cálculo
                  puede tardar mientras se consolidan respuestas, puntajes,
                  niveles de riesgo y tablas del informe.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <ToastCard toast={toast} onClose={() => setToast(null)} />}
      <ConfirmDialog
        open={confirmClose}
        title="Cerrar y calcular la aplicación"
        description="Al cerrar la aplicación se congelará la captura y se ejecutará el cálculo oficial. Verifica que cada participante tenga instrumentos completos y datos coherentes: borrar o corregir después no reversa créditos ya consumidos, y una nueva carga/reproceso puede consumir créditos adicionales."
        confirmLabel="Cerrar aplicación"
        cancelLabel="Seguir revisando"
        onConfirm={() => void confirmCerrarAplicacion()}
        onCancel={() => setConfirmClose(false)}
      />
      <ConfirmDialog
        open={confirmReopen}
        title="Reabrir aplicación para reproceso"
        description="Reabrir esta aplicación habilitará correcciones, invalidará temporalmente la lectura de resultados y registrará un crédito adicional por reprocesamiento. No se borrarán datos: el cambio quedará auditado."
        confirmLabel="Reabrir y registrar reproceso"
        cancelLabel="Cancelar"
        tone="amber"
        onConfirm={() => void confirmReabrirAplicacion()}
        onCancel={() => setConfirmReopen(false)}
      />

      <div className="mx-auto max-w-7xl space-y-6">
        <button
          onClick={() =>
            navigate(`/psicosocial/empresas/${empresaId}/aplicaciones`)
          }
          className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold shadow-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a aplicaciones
        </button>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                Detalle de aplicación
              </p>
              <h1 className="mt-1 text-3xl font-black text-slate-950">
                {data.aplicacion.nombre}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {data.empresa.nombre} · Estado{" "}
                {estadoAplicacionLabel(data.aplicacion.estado)} · Fecha:{" "}
                {fmtDate(
                  data.aplicacion.fecha_aplicacion ||
                    data.aplicacion.created_at ||
                    data.aplicacion.creado_en,
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {data.instrumentos.map((i) => (
                  <span
                    key={`${i.evaluacion_id}-${i.instrument_code}`}
                    className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700"
                  >
                    {instrumentLabel(i.instrument_code)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {finalizada ? (
                <button
                  onClick={() => setConfirmReopen(true)}
                  disabled={closing}
                  className="inline-flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" /> Reabrir aplicación
                </button>
              ) : (
                <button
                  onClick={cerrarAplicacion}
                  disabled={closing}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />{" "}
                  {closing ? "Calculando..." : "Cerrar y calcular"}
                </button>
              )}
              <button
                onClick={() =>
                  finalizada
                    ? navigate(
                        `/psicosocial/resultados?aplicacionId=${aplicacionId}`,
                      )
                    : notify({
                        type: "warning",
                        title: "Resultados no disponibles",
                        message: "Primero cierra y calcula la aplicación.",
                      })
                }
                className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold ${finalizada ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
              >
                <BarChart3 className="h-4 w-4" /> Dashboard de resultados
              </button>
              {finalizada && (
                <button
                  onClick={() =>
                    navigate(
                      `/psicosocial/reportes-oficiales?aplicacionId=${aplicacionId}&tipo=resultados`,
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-sm font-bold text-white hover:bg-violet-800"
                >
                  <FileText className="h-4 w-4" /> Informes oficiales
                </button>
              )}
            </div>
          </div>
          {!finalizada && showClosureGuide && (
            <div className="mt-5 rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50 via-white to-slate-50 p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                    Guía rápida de cierre
                  </p>
                  <h3 className="mt-1 text-base font-black text-slate-950">
                    Dashboard e informes se habilitan al finalizar
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Primero registra o valida las respuestas de los
                    colaboradores. Cuando cierres y calcules la aplicación,
                    ABRIL-360 desbloqueará el dashboard de resultados y los
                    informes oficiales con esta aplicación precargada.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={dismissClosureGuide}
                  className="rounded-xl p-2 text-slate-400 transition hover:bg-white hover:text-slate-700"
                  aria-label="Ocultar guía rápida de cierre"
                  title="No volver a mostrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card
            icon={<Users />}
            label="Participantes asignados"
            value={resumen.empleados_total}
          />
          <Card
            icon={<ClipboardCheck />}
            label="Completados"
            value={participantesCompletos}
          />
          <Card
            icon={<XCircle />}
            label="Pendientes por completar"
            value={pendientesCompletar}
          />
          <article className="flex min-h-[132px] items-start gap-4 rounded-3xl border border-violet-200 bg-violet-50 p-5 shadow-sm">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
              <Coins className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-violet-700">
                Créditos consumidos
              </p>
              <strong className="text-3xl font-black text-violet-950">
                {creditosConsumidosCaptura}
              </strong>
              <p className="mt-1 text-xs leading-5 text-violet-700">
                Reservados/iniciados: {creditosReservadosCaptura}. Estimados:{" "}
                {resumen.creditos_estimados}
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Participantes de la aplicación
              </h2>
              <p className="text-sm text-slate-500">
                Registra respuestas por colaborador o valida quién ya tiene
                resultados asociados.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!finalizada && (
                <>
                  <button
                    onClick={() => setOpenBulkUpload(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700 hover:bg-violet-100"
                  >
                    <Upload className="h-4 w-4" /> Carga masiva
                  </button>
                  <button
                    onClick={() => void openAddEmployee()}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2 text-sm font-bold text-white hover:bg-violet-800"
                  >
                    <Plus className="h-4 w-4" /> Agregar colaborador
                  </button>
                </>
              )}
              <button
                onClick={() => void load()}
                className="rounded-xl border px-4 py-2 text-sm font-bold hover:bg-slate-50"
              >
                Actualizar
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full outline-none"
              placeholder="Buscar por cédula, nombre, área o cargo..."
            />
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[1180px] table-fixed text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="w-[21%] px-4 py-3" aria-sort={participantSortAria("colaborador")}>
                    {renderParticipantSortHeader("colaborador", "Colaborador")}
                  </th>
                  <th className="w-[17%] px-4 py-3" aria-sort={participantSortAria("areaCargo")}>
                    {renderParticipantSortHeader("areaCargo", "Área / cargo")}
                  </th>
                  <th className="w-[20%] px-4 py-3" aria-sort={participantSortAria("instrumentos")}>
                    {renderParticipantSortHeader("instrumentos", "Instrumentos")}
                  </th>
                  <th className="w-[10%] px-4 py-3" aria-sort={participantSortAria("estado")}>
                    {renderParticipantSortHeader("estado", "Estado")}
                  </th>
                  <th className="w-[32%] px-4 py-3 text-right" aria-sort={participantSortAria("accion")}>
                    {renderParticipantSortHeader("accion", "Acción", "right")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {empleados.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      No hay empleados para mostrar.
                    </td>
                  </tr>
                )}
                {paginatedEmpleados.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <strong className="block text-slate-950">
                        {emp.nombre}
                      </strong>
                      <span className="text-xs text-slate-500">
                        CC {emp.cedula}
                        {emp.email ? ` · ${emp.email}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="block font-bold">
                        {emp.area || "Sin área"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {emp.cargo || "Sin cargo"}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        {participantInstrumentChips(data.instrumentos, emp).map((chip) => {
                          const chipClass =
                            chip.state === "complete"
                              ? "bg-emerald-50 text-emerald-700"
                              : chip.state === "capture"
                                ? "bg-violet-50 text-violet-700"
                                : "bg-slate-100 text-slate-500";
                          return (
                            <span
                              key={`${emp.id}-${chip.code}`}
                              className={`rounded-full px-3 py-1 text-xs font-black ${chipClass}`}
                            >
                              {chip.label}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {participantStatusLabel(emp) === "Completo" ? (
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          <CheckCircle2 className="h-3 w-3" /> Completo
                        </span>
                      ) : participantStatusLabel(emp) === "En captura" ? (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
                          En captura
                        </span>
                      ) : (
                        <span className="inline-flex whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                          Por tabular
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {(() => {
                        const enabled = canOpenParticipant(emp);
                        const label = participantActionLabel(emp, finalizada);
                        const reportEnabled = finalizada && enabled;
                        return (
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              onClick={() => {
                                if (enabled)
                                  navigate(
                                    `/psicosocial/empleados/${emp.id}/aplicaciones/${aplicacionId}/respuestas`,
                                  );
                              }}
                              disabled={!enabled}
                              title={
                                enabled
                                  ? label
                                  : "La aplicación ya fue cerrada/calculada y este participante no tiene respuestas registradas."
                              }
                              className={`inline-flex min-w-[150px] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 font-bold ${enabled ? "bg-violet-700 text-white hover:bg-violet-800" : "cursor-not-allowed bg-slate-100 text-slate-400"}`}
                            >
                              {finalizada ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <FilePenLine className="h-4 w-4" />
                              )}
                              {label}
                            </button>
                            {finalizada && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (reportEnabled)
                                    navigate(
                                      `/psicosocial/empleados/${emp.id}/aplicaciones/${aplicacionId}/informes`,
                                    );
                                }}
                                disabled={!reportEnabled}
                                title={
                                  reportEnabled
                                    ? "Ver informes individuales del colaborador"
                                    : "Disponible para participantes con respuestas/resultados en aplicaciones finalizadas."
                                }
                                className={`inline-flex min-w-[122px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border px-3 py-2 font-bold ${
                                  reportEnabled
                                    ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                                    : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                                }`}
                              >
                                <FileText className="h-4 w-4" /> Informe
                              </button>
                            )}
                            {(emp.registrado ||
                              emp.completo ||
                              (emp.instrumentos_registrados || []).length >
                                0) && (
                              <button
                                type="button"
                                onClick={() => openCleanupResponses(emp)}
                                disabled={cleanupBlocked}
                                title={
                                  cleanupBlocked
                                    ? "No disponible en aplicaciones finalizadas o en cálculo."
                                    : "Eliminar respuestas y resultados de este colaborador en esta aplicación."
                                }
                                className="inline-flex min-w-[120px] items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-red-100 bg-red-50 px-3 py-2 font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 className="h-4 w-4" /> Limpiar
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500">
              Mostrando <b className="text-slate-800">{participantStart}</b> a{" "}
              <b className="text-slate-800">{participantEnd}</b> de{" "}
              <b className="text-slate-800">{empleados.length}</b> colaboradores
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Filas
              </label>
              <select
                value={participantPageSize}
                onChange={(e) => setParticipantPageSize(Number(e.target.value))}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                type="button"
                onClick={() => setParticipantPage(1)}
                disabled={currentParticipantPage <= 1}
                className="rounded-xl border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
              >
                Primera
              </button>
              <button
                type="button"
                onClick={() => setParticipantPage((p) => Math.max(1, p - 1))}
                disabled={currentParticipantPage <= 1}
                className="rounded-xl border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
              >
                Anterior
              </button>
              <span className="rounded-xl bg-violet-700 px-3 py-2 text-sm font-black text-white">
                {currentParticipantPage} / {totalParticipantPages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setParticipantPage((p) =>
                    Math.min(totalParticipantPages, p + 1),
                  )
                }
                disabled={currentParticipantPage >= totalParticipantPages}
                className="rounded-xl border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
              >
                Siguiente
              </button>
              <button
                type="button"
                onClick={() => setParticipantPage(totalParticipantPages)}
                disabled={currentParticipantPage >= totalParticipantPages}
                className="rounded-xl border px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
              >
                Última
              </button>
            </div>
          </div>
        </section>
      </div>

      {cleanupTarget && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-red-600">
                  Eliminar captura
                </p>
                <h3 className="text-2xl font-black text-slate-950">
                  Limpiar respuestas del colaborador
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Esta acción eliminará respuestas y resultados calculados solo
                  para esta aplicación. No elimina el colaborador ni su ficha
                  sociodemográfica. No reversa créditos ya consumidos; una nueva
                  carga del colaborador podrá consumir otro crédito.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCleanupTarget(null);
                  setCleanupPreview(null);
                }}
                className="rounded-2xl border p-2 hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="font-black text-slate-900">
                {cleanupTarget.nombre}
              </p>
              <p className="text-sm text-slate-500">
                CC {cleanupTarget.cedula} · Estado aplicación:{" "}
                {estadoAplicacionLabel(data?.aplicacion?.estado)}
              </p>
            </div>
            {cleanupLoading && (
              <div className="mt-4 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm font-semibold text-violet-700">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                Preparando operación...
              </div>
            )}
            {cleanupPreview && !cleanupLoading && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {Object.entries(cleanupPreview.counts || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-200 bg-white p-3"
                      >
                        <p className="text-xs font-bold uppercase text-slate-400">
                          {key.replace(/_/g, " ")}
                        </p>
                        <p className="text-xl font-black text-slate-950">
                          {String(value)}
                        </p>
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                  Esta limpieza no devuelve créditos ya consumidos. Si el
                  colaborador vuelve a registrar respuestas para esta aplicación,
                  el nuevo registro podrá consumir otro crédito.
                </div>
              </>
            )}
            {cleanupBlocked && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                La aplicación está cerrada o calculando. Debe reabrirse antes de
                limpiar respuestas.
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCleanupTarget(null);
                  setCleanupPreview(null);
                }}
                className="rounded-2xl border px-5 py-3 font-bold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmCleanupResponses}
                disabled={cleanupLoading || cleanupBlocked}
                className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cleanupLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Sí, eliminar respuestas
              </button>
            </div>
          </div>
        </div>
      )}

      {openEmployeeDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
          <aside className="h-full w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                  Nuevo colaborador
                </p>
                <h2 className="text-2xl font-black text-slate-950">
                  Agregar empleado manualmente
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Se creará en el maestro de colaboradores sin marcar la batería como diligenciada.
                </p>
              </div>
              <button
                onClick={() => setOpenEmployeeDrawer(false)}
                className="rounded-2xl border p-2 hover:bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitEmployee} className="space-y-4">
              <section className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="mb-4">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Información base del colaborador
                  </p>
                  <h3 className="text-lg font-black text-slate-950">
                    Datos maestros
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Estos datos identifican al colaborador en la empresa. No cuentan como ficha sociodemográfica de la aplicación.
                  </p>
                </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombres *" error={employeeFieldErrors.nombres}>
                  <Input
                    value={employeeForm.nombres}
                    onChange={(v: string) => updateEmployeeForm("nombres", v)}
                  />
                </Field>
                <Field
                  label="Apellidos *"
                  error={employeeFieldErrors.apellidos}
                >
                  <Input
                    value={employeeForm.apellidos}
                    onChange={(v: string) => updateEmployeeForm("apellidos", v)}
                  />
                </Field>
                <Field label="Cédula *" error={employeeFieldErrors.cedula}>
                  <Input
                    value={employeeForm.cedula}
                    onChange={(v: string) => updateEmployeeForm("cedula", v)}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Identificador externo">
                  <Input
                    value={employeeForm.identificador_externo}
                    onChange={(v: string) =>
                      updateEmployeeForm("identificador_externo", v)
                    }
                  />
                </Field>
                <Field label="Correo" error={employeeFieldErrors.email}>
                  <Input
                    value={employeeForm.email}
                    onChange={(v: string) => updateEmployeeForm("email", v)}
                    type="email"
                  />
                </Field>
                <Field label="Teléfono" error={employeeFieldErrors.telefono}>
                  <Input
                    value={employeeForm.telefono}
                    onChange={(v: string) => updateEmployeeForm("telefono", v)}
                    inputMode="numeric"
                  />
                </Field>
                <Field label="Área *" error={employeeFieldErrors.area_id}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <Combo
                      value={employeeForm.area_id}
                      label={selectedArea?.nombre || "Selecciona área"}
                      options={areas.map((a) => ({
                        value: String(a.id),
                        label: a.nombre,
                      }))}
                      onChange={(v) => updateEmployeeForm("area_id", v)}
                      placeholder="Selecciona área"
                      emptyMessage="No hay áreas registradas"
                    />
                    <button
                      type="button"
                      onClick={() => setCatalogModal("area")}
                      className="shrink-0 whitespace-nowrap rounded-2xl border px-4 font-bold text-violet-700 hover:bg-violet-50"
                    >
                      Nuevo
                    </button>
                  </div>
                </Field>
                <Field label="Cargo *" error={employeeFieldErrors.cargo_id}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <Combo
                      value={employeeForm.cargo_id}
                      label={selectedCargo?.nombre || "Selecciona cargo"}
                      options={visibleCargos.map((c) => ({
                        value: String(c.id),
                        label: c.nombre,
                      }))}
                      onChange={(v) => updateEmployeeForm("cargo_id", v)}
                      disabled={!employeeForm.area_id}
                      placeholder="Selecciona cargo"
                      emptyMessage="No hay cargos asociados a esta área"
                      helper={
                        employeeForm.area_id
                          ? "Selecciona el cargo correspondiente"
                          : "Selecciona primero un área"
                      }
                    />
                    <button
                      type="button"
                      disabled={!employeeForm.area_id}
                      onClick={() => setCatalogModal("cargo")}
                      title={
                        employeeForm.area_id
                          ? "Crear cargo para el área seleccionada"
                          : "Selecciona primero un área"
                      }
                      className="shrink-0 whitespace-nowrap rounded-2xl border px-4 font-bold text-violet-700 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Nuevo
                    </button>
                  </div>
                </Field>
              </div>
              </section>

              <section className="rounded-3xl border border-violet-100 bg-violet-50/50 p-4">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                      Perfil sociodemográfico opcional
                    </p>
                    <h3 className="text-lg font-black text-slate-950">
                      Datos generales de la aplicación
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Si los registras ahora, quedarán como borrador solo para esta aplicación.
                    </p>
                  </div>
                  {employeeSocioLoading && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-violet-700">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando catálogos
                    </span>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <SocioSelectField
                    label="Sexo"
                    value={employeeSocioForm.sexo || ""}
                    options={SOCIO_SEXO_OPTIONS}
                    onChange={(v) => updateEmployeeSocioForm("sexo", v)}
                  />
                  <SocioNumberField
                    label="Año de nacimiento"
                    value={employeeSocioForm.anio_nacimiento ?? ""}
                    min={1900}
                    max={SOCIO_CURRENT_YEAR}
                    onChange={(v) => updateEmployeeSocioForm("anio_nacimiento", v)}
                  />
                  <SocioSelectField
                    label="Estado civil"
                    value={employeeSocioForm.estado_civil || ""}
                    options={employeeSocioCatalogs.estado_civil}
                    onChange={(v) => updateEmployeeSocioForm("estado_civil", v)}
                  />
                  <SocioSelectField
                    label="Nivel de estudios"
                    value={employeeSocioForm.nivel_estudios || ""}
                    options={employeeSocioCatalogs.nivel_estudios}
                    onChange={(v) => updateEmployeeSocioForm("nivel_estudios", v)}
                  />
                  <SocioTextField
                    label="Ocupación / profesión"
                    value={employeeSocioForm.ocupacion_profesion || ""}
                    onChange={(v) => updateEmployeeSocioForm("ocupacion_profesion", v)}
                  />
                  <SocioSelectField
                    label="Estrato"
                    value={String(employeeSocioForm.estrato || "")}
                    options={SOCIO_ESTRATO_OPTIONS}
                    onChange={(v) => updateEmployeeSocioForm("estrato", v)}
                  />
                  <SocioMunicipioField
                    label="Ciudad / municipio de residencia"
                    query={employeeResQuery}
                    selectedValue={employeeSocioForm.ciudad_residencia || ""}
                    setQuery={(v) => {
                      setEmployeeResQuery(v);
                      if (v !== String(employeeSocioForm.ciudad_residencia || "")) {
                        updateEmployeeSocioForm("ciudad_residencia", "");
                        updateEmployeeSocioForm("departamento_residencia", "");
                      }
                    }}
                    options={employeeResMunicipios}
                    onSelect={(item) => selectEmployeeMunicipio("res", item)}
                  />
                  <SocioReadOnlyField
                    label="Departamento de residencia"
                    value={employeeSocioForm.departamento_residencia || ""}
                  />
                  <SocioSelectField
                    label="Tipo de vivienda"
                    value={employeeSocioForm.tipo_vivienda || ""}
                    options={employeeSocioCatalogs.tipo_vivienda}
                    onChange={(v) => updateEmployeeSocioForm("tipo_vivienda", v)}
                  />
                  <SocioNumberField
                    label="Personas dependientes"
                    value={employeeSocioForm.personas_dependen ?? ""}
                    min={0}
                    max={99}
                    onChange={(v) => updateEmployeeSocioForm("personas_dependen", v)}
                  />
                  <SocioMunicipioField
                    label="Ciudad / municipio donde trabaja"
                    query={employeeTrabQuery}
                    selectedValue={employeeSocioForm.ciudad_trabajo || ""}
                    setQuery={(v) => {
                      setEmployeeTrabQuery(v);
                      if (v !== String(employeeSocioForm.ciudad_trabajo || "")) {
                        updateEmployeeSocioForm("ciudad_trabajo", "");
                        updateEmployeeSocioForm("departamento_trabajo", "");
                      }
                    }}
                    options={employeeTrabMunicipios}
                    onSelect={(item) => selectEmployeeMunicipio("trab", item)}
                  />
                  <SocioReadOnlyField
                    label="Departamento donde trabaja"
                    value={employeeSocioForm.departamento_trabajo || ""}
                  />
                  <SocioSelectField
                    label="Tipo de cargo"
                    value={employeeSocioForm.tipo_cargo || ""}
                    options={employeeSocioCatalogs.tipo_cargo}
                    onChange={(v) => updateEmployeeSocioForm("tipo_cargo", v)}
                  />
                  <SocioSelectField
                    label="Tipo de contrato"
                    value={employeeSocioForm.tipo_contrato || ""}
                    options={employeeSocioCatalogs.tipo_contrato}
                    onChange={(v) => updateEmployeeSocioForm("tipo_contrato", v)}
                  />
                  <SocioNumberField
                    label="Antigüedad en la empresa (años)"
                    value={employeeSocioForm.antiguedad_empresa || ""}
                    min={0}
                    max={80}
                    onChange={(v) => updateEmployeeSocioForm("antiguedad_empresa", v === null ? "" : String(v))}
                  />
                  <SocioNumberField
                    label="Antigüedad en el cargo (años)"
                    value={employeeSocioForm.antiguedad_cargo || ""}
                    min={0}
                    max={80}
                    onChange={(v) => updateEmployeeSocioForm("antiguedad_cargo", v === null ? "" : String(v))}
                  />
                  <SocioNumberField
                    label="Horas diarias de trabajo"
                    value={employeeSocioForm.horas_diarias_trabajo ?? ""}
                    min={1}
                    max={24}
                    onChange={(v) => updateEmployeeSocioForm("horas_diarias_trabajo", v)}
                  />
                  <SocioSelectField
                    label="Tipo de salario"
                    value={employeeSocioForm.tipo_salario || ""}
                    options={employeeSocioCatalogs.tipo_salario}
                    onChange={(v) => updateEmployeeSocioForm("tipo_salario", v)}
                  />
                </div>
              </section>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setOpenEmployeeDrawer(false)}
                  className="rounded-2xl border px-5 py-3 font-bold"
                >
                  Cancelar
                </button>
                <button
                  disabled={savingEmployee}
                  className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-6 py-3 font-bold text-white disabled:opacity-60"
                >
                  {savingEmployee && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}{" "}
                  Guardar empleado
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}

      {openBulkUpload && (
        <BulkUploadModal
          file={bulkFile}
          result={bulkResult}
          saving={bulkSaving}
          onFileChange={handleBulkFileChange}
          onValidate={() => runBulkImport(true)}
          onImport={() => runBulkImport(false)}
          onClose={closeBulkUpload}
        />
      )}

      {catalogModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={saveCatalog}
            className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-violet-700">
                  Catálogo
                </p>
                <h3 className="text-xl font-black">
                  Agregar {catalogModal === "area" ? "área" : "cargo"}
                </h3>
                <p className="text-sm text-slate-500">
                  {catalogModal === "cargo"
                    ? `Se vinculará al área: ${selectedArea?.nombre || "seleccionada"}.`
                    : "Se vinculará únicamente a esta empresa."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCatalogModal(null)}
                className="rounded-2xl border p-2"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {catalogModal === "cargo" && !employeeForm.area_id && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Selecciona primero un área para vincular el cargo.
              </div>
            )}
            <Field label="Nombre">
              <Input
                value={catalogName}
                onChange={setCatalogName}
                placeholder={
                  catalogModal === "area"
                    ? "Ej. Operaciones"
                    : "Ej. Analista SST"
                }
                autoFocus
              />
            </Field>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCatalogModal(null)}
                className="rounded-2xl border px-5 py-3 font-bold"
              >
                Cancelar
              </button>
              <button
                disabled={
                  catalogSaving ||
                  !catalogName.trim() ||
                  (catalogModal === "cargo" && !employeeForm.area_id)
                }
                className="rounded-2xl bg-violet-700 px-5 py-3 font-bold text-white disabled:opacity-50"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function Card({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <article className="flex min-h-[132px] items-start gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-violet-50 text-violet-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold leading-5 text-slate-500">{label}</p>
        <strong className="text-3xl font-black">{value}</strong>
      </div>
    </article>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="space-y-1 text-sm font-bold text-slate-700">
      {label}
      {children}
      {error && (
        <span className="block text-xs font-semibold text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}

function Input({ value, onChange, className = "", ...props }: any) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${className}`}
    />
  );
}

function Combo({
  value,
  label,
  options,
  onChange,
  disabled,
  placeholder,
  emptyMessage,
  helper,
}: {
  value: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  helper?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node))
        setOpen(false);
    }
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, []);
  return (
    <div ref={rootRef} className="relative flex-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left font-normal outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100 ${disabled ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400" : open ? "border-violet-300 bg-violet-50/60" : "border-slate-200 bg-white hover:border-violet-300"}`}
      >
        <div className="min-w-0">
          <span
            className={`block truncate font-semibold ${value ? "text-slate-800" : "text-slate-400"}`}
          >
            {disabled ? helper || "Selecciona primero un área" : label}
          </span>
          {helper && !disabled && (
            <span className="mt-0.5 block text-xs text-slate-400">
              {helper}
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180 text-violet-600" : ""}`}
        />
      </button>
      {open && !disabled && (
        <div className="absolute z-[70] mt-2 w-full overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-700">
              Catálogo
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {placeholder || "Selecciona una opción"}
            </p>
          </div>
          <div className="max-h-64 overflow-auto p-2">
            {options.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="mb-1 flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
                >
                  Limpiar
                </button>
                {options.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left text-sm font-bold transition ${value === opt.value ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate">{opt.label}</span>
                      {value === opt.value && (
                        <span className="mt-0.5 block text-xs font-semibold text-violet-500">
                          Seleccionado
                        </span>
                      )}
                    </div>
                    {value === opt.value && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-5 text-center text-sm text-slate-500">
                {emptyMessage || "No hay opciones disponibles"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
