import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FileText,
  Fingerprint,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  Network,
  Scale,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import AbrilBrandLockup from "@/components/brand/AbrilBrandLockup";

type ResourcePageKey = "manual-uso" | "ficha-tecnica" | "seguridad-cumplimiento" | "certificacion";

type ResourceReference = {
  label: string;
  href: string;
  note?: string;
};

type ResourcePage = {
  key: ResourcePageKey;
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof BookOpen;
  audience: string;
  promise: string;
  highlights: string[];
  stats: Array<{ value: string; label: string; hint: string }>;
  quickLinks: ResourceReference[];
  references: ResourceReference[];
};

const officialReferences = {
  riesgoPsicosocial:
    "https://www.fondoriesgoslaborales.gov.co/riesgo-psicosocial-2/",
  intraManual:
    "https://www.fondoriesgoslaborales.gov.co/wp-content/uploads/2025/06/2.-Manual-evaluacion-de-factores-de-riesgo-psicosociales-intralaboral-forma-AyB.pdf",
  ley1581: "https://www.suin-juriscol.gov.co/viewDocument.asp?id=1684507",
  resolucion2646: "https://www.suin-juriscol.gov.co/viewDocument.asp?id=30044506",
  resolucion2404:
    "https://www.mintrabajo.gov.co/atencion-al-ciudadano/transparencia/procedimientos/-/document_library/vCdwrROuxLbS/view_file/60494059",
  resolucion2764: "https://www.mintrabajo.gov.co/marco-legal",
  iso27001: "https://www.iso.org/standard/27001",
  nistPrivacy: "https://www.nist.gov/privacy-framework",
  owaspAsvs: "https://owasp.org/www-project-application-security-verification-standard/",
  owaspTop10: "https://owasp.org/www-project-top-ten/",
};

export const resourcePages: ResourcePage[] = [
  {
    key: "manual-uso",
    title: 'Manual de uso ABRIL360',
    eyebrow: "Guía operativa profesional",
    description:
      "Recorrido completo para psicólogos, coordinadores SST y compradores que necesitan entender cómo se prepara, captura, calcula, revisa y documenta una aplicación de batería psicosocial dentro de ABRIL360.",
    icon: BookOpen,
    audience: "Psicólogo evaluador, coordinador SST y líder de proyecto",
    promise: "Describe el flujo real del producto, sin pantallas inventadas y con foco en una operación ordenada y auditable.",
    highlights: [
      "Flujo completo desde acceso seguro hasta informes oficiales.",
      "Mapa de navegación basado en rutas reales del módulo psicosocial.",
      "Buenas prácticas para empresas, psicólogos y revisión final antes del cierre.",
    ],
    stats: [
      { value: "8", label: "etapas del flujo", hint: "de acceso a informe" },
      { value: "7", label: "módulos reales", hint: "dashboard, empresas y más" },
      { value: "3", label: "roles clave", hint: "plataforma, empresa y profesional" },
    ],
    quickLinks: [
      { label: "Ingresar a ABRIL360", href: "/login", note: "Acceso seguro a la plataforma" },
      { label: "Ficha técnica del cálculo", href: "/recursos/ficha-tecnica", note: "Motor normativo y resultados" },
    ],
    references: [
      { label: "Ficha técnica y motor de cálculo", href: "/recursos/ficha-tecnica" },
      { label: "Seguridad y cumplimiento", href: "/recursos/seguridad-cumplimiento" },
      { label: "Manual oficial de factores intralaborales", href: officialReferences.intraManual },
      { label: "Biblioteca oficial de riesgo psicosocial", href: officialReferences.riesgoPsicosocial },
    ],
  },
  {
    key: "ficha-tecnica",
    title: "Ficha técnica y motor de cálculo",
    eyebrow: "Base metodológica y normativa",
    description:
      "Síntesis técnica del funcionamiento de ABRIL360 para captura, transformación, clasificación y reporte de la batería de riesgo psicosocial, con lenguaje entendible para compradores, psicólogos y áreas de cumplimiento.",
    icon: ClipboardCheck,
    audience: "Psicólogo, auditor, comprador técnico y SG-SST",
    promise: "Explica con claridad qué se calcula, con qué reglas, qué trazabilidad queda y qué límites de interpretación deben respetarse.",
    highlights: [
      "Cobertura de Intralaboral A/B, Extralaboral, Estrés y ficha sociodemográfica.",
      "Transformación 0 a 100, baremos y segmentación por grupo ocupacional.",
      "Trazabilidad desde respuestas hasta reportes persistidos.",
    ],
    stats: [
      { value: "4", label: "instrumentos", hint: "A, B, Extra y Estrés" },
      { value: "0-100", label: "escala oficial", hint: "puntaje transformado" },
      { value: "31", label: "ítems de estrés", hint: "fórmula ponderada" },
    ],
    quickLinks: [
      { label: "Manual de uso", href: "/recursos/manual-uso", note: "Operación completa del módulo" },
      { label: "Ver marco normativo", href: "/recursos/certificacion", note: "Alcance y límites de uso" },
    ],
    references: [
      { label: "Fondo de Riesgos Laborales", href: officialReferences.riesgoPsicosocial },
      { label: "Manual oficial intralaboral Forma A y B", href: officialReferences.intraManual },
      { label: "Resolución 2404 de 2019", href: officialReferences.resolucion2404 },
      { label: "Resolución 2764 de 2022", href: officialReferences.resolucion2764 },
    ],
  },
  {
    key: "seguridad-cumplimiento",
    title: "Seguridad y cumplimiento",
    eyebrow: "Protección de información y privacidad",
    description:
      "Marco de confianza para el manejo responsable de datos personales y sensibles en ABRIL360, con énfasis en acceso, segregación por empresa, trazabilidad operativa, nube, gobierno del dato y referencias internacionales prudentes.",
    icon: LockKeyhole,
    audience: "Compradores, compliance, jurídico, SST y dirección",
    promise: "Presenta controles y buenas prácticas reales, diferenciando con honestidad entre alineación técnica y certificación formal.",
    highlights: [
      "Datos sensibles tratados con enfoque de finalidad, confidencialidad y mínimo privilegio.",
      "Separación por rol, cambio obligatorio de contraseña y recuperación controlada.",
      "Alineación con marcos reconocidos sin declarar certificaciones no obtenidas.",
    ],
    stats: [
      { value: "3", label: "capas de control", hint: "acceso, operación y gobierno" },
      { value: "1", label: "tenant por empresa", hint: "aislamiento funcional" },
      { value: "4", label: "marcos de referencia", hint: "ley, ISO, NIST y OWASP" },
    ],
    quickLinks: [
      { label: "Alcance y referencias normativas", href: "/recursos/certificacion", note: "Qué cubre y qué no cubre" },
      { label: "Ingresar a ABRIL360", href: "/login", note: "Portal de acceso" },
    ],
    references: [
      { label: "Ley 1581 de 2012", href: officialReferences.ley1581 },
      { label: "ISO/IEC 27001:2022", href: officialReferences.iso27001 },
      { label: "NIST Privacy Framework", href: officialReferences.nistPrivacy },
      { label: "OWASP ASVS", href: officialReferences.owaspAsvs },
      { label: "OWASP Top 10", href: officialReferences.owaspTop10 },
    ],
  },
  {
    key: "certificacion",
    title: "Alcance, certificación y marco normativo",
    eyebrow: "Carta de presentación profesional",
    description:
      "Declaración clara del alcance real de ABRIL360 como plataforma tecnológica de apoyo para captura, tabulación, cálculo y reporte, junto con los límites de uso, el rol del profesional competente y las referencias normativas colombianas relevantes.",
    icon: ShieldCheck,
    audience: "Compradores, psicólogos, empresas y comités de evaluación",
    promise: "Convierte el alcance de la plataforma en una propuesta de confianza: útil, honesta, defendible y comercialmente sólida.",
    highlights: [
      "Aclara qué aporta la plataforma y qué sigue dependiendo del criterio profesional.",
      "Integra normativa laboral y de protección de datos sin sobreprometer.",
      "Usa lenguaje de confianza basado en evidencia, trazabilidad y límites honestos.",
    ],
    stats: [
      { value: "4", label: "hitos normativos", hint: "2008, 2012, 2019 y 2022" },
      { value: "2", label: "límites clave", hint: "no diagnóstico, no reemplazo profesional" },
      { value: "100%", label: "enfoque prudente", hint: "sin sellos no obtenidos" },
    ],
    quickLinks: [
      { label: "Seguridad y cumplimiento", href: "/recursos/seguridad-cumplimiento", note: "Buenas prácticas y privacidad" },
      { label: "Biblioteca oficial de riesgo psicosocial", href: officialReferences.riesgoPsicosocial, note: "Fuente primaria normativa" },
    ],
    references: [
      { label: "Resolución 2646 de 2008", href: officialReferences.resolucion2646 },
      { label: "Resolución 2404 de 2019", href: officialReferences.resolucion2404 },
      { label: "Resolución 2764 de 2022", href: officialReferences.resolucion2764 },
      { label: "Ley 1581 de 2012", href: officialReferences.ley1581 },
    ],
  },
];

const workflowSteps = [
  {
    title: "Ingreso seguro",
    body: "El profesional accede con correo registrado y credencial controlada. Si la cuenta es nueva, la plataforma exige cambio de contraseña antes de continuar.",
    icon: LockKeyhole,
  },
  {
    title: "Selección de empresa",
    body: "El trabajo psicosocial se organiza por empresa. Esta separación evita cruces operativos entre clientes y ayuda a conservar trazabilidad por tenant.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Preparación de colaboradores",
    body: "Se registra o importa la base de colaboradores, sus datos generales y la información necesaria para asignar forma, cargo y alcance de aplicación.",
    icon: Users,
  },
  {
    title: "Creación de Aplicaciones BT",
    body: "Cada batería queda asociada a una empresa y a un periodo de trabajo. La aplicación agrupa evaluaciones, participantes, avance y estado de cierre.",
    icon: LayoutDashboard,
  },
  {
    title: "Captura de respuestas",
    body: "Se diligencian datos sociodemográficos y respuestas por instrumento. Extralaboral y estrés se capturan una sola vez por aplicación; la separación por forma ocurre en resultados.",
    icon: BookOpen,
  },
  {
    title: "Cierre y cálculo",
    body: "El cierre habilita scoring cuando la captura cumple reglas mínimas de completitud, forma aplicable y consistencia del instrumento.",
    icon: ClipboardCheck,
  },
  {
    title: "Dashboard y análisis",
    body: "El sistema presenta resultados globales, por dominio, dimensión, instrumento, área y concentración Alto/Muy alto, apoyándose en resultados ya persistidos.",
    icon: LineChart,
  },
  {
    title: "Informes e intervención",
    body: "El profesional revisa informes individuales, informes oficiales, reportes agregados y prioriza acciones antes de firma y entrega formal.",
    icon: FileCheck2,
  },
];

const navigationMap = [
  {
    title: "Dashboard",
    route: "/psicosocial/dashboard",
    body: "Vista ejecutiva del estado general: empresas activas, aplicaciones, participantes, resultados e informes listos.",
  },
  {
    title: "Empresas",
    route: "/psicosocial/empresas",
    body: "Punto de entrada para perfiles de empresa, estructura, participantes y aplicaciones asociadas.",
  },
  {
    title: "Aplicaciones BT",
    route: "/psicosocial/aplicaciones-bt",
    body: "Consolida baterías creadas, progreso, filtros y accesos directos a captura, resultados e informes.",
  },
  {
    title: "Resultados",
    route: "/psicosocial/resultados",
    body: "Dashboard psicosocial para lectura agregada por instrumento, dominio, dimensión y criticidad.",
  },
  {
    title: "Informes",
    route: "/psicosocial/reportes-oficiales",
    body: "Generación y revisión de informes oficiales, salidas profesionales y material de soporte.",
  },
  {
    title: "Centro de ayuda",
    route: "/psicosocial/centro-ayuda",
    body: "Entrada rápida a manual, ficha técnica, seguridad y alcance regulatorio.",
  },
  {
    title: "Configuración",
    route: "/psicosocial/perfil",
    body: "Perfil del profesional, cambio de contraseña y ajustes iniciales de seguridad.",
  },
];

function resolvePage(page?: ResourcePageKey): ResourcePage {
  return resourcePages.find((item) => item.key === page) || resourcePages[0];
}

function isExternal(href: string): boolean {
  return href.startsWith("http");
}

function ResourceLink({
  href,
  label,
  note,
  className,
}: ResourceReference & { className?: string }) {
  const styles =
    className ||
    "inline-flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-200 hover:bg-cyan-50 hover:text-slate-950";

  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={styles}>
        <span>
          <span className="block">{label}</span>
          {note ? <span className="mt-1 block text-xs font-medium text-slate-500">{note}</span> : null}
        </span>
        <ExternalLink className="h-4 w-4 shrink-0" />
      </a>
    );
  }

  return (
    <Link to={href} className={styles}>
      <span>
        <span className="block">{label}</span>
        {note ? <span className="mt-1 block text-xs font-medium text-slate-500">{note}</span> : null}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0" />
    </Link>
  );
}

function Surface({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">{icon}</span>
        ) : null}
        <div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
          {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}

function SectionList({ items }: { items: string[] }) {
  return (
    <ul className="grid gap-3 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item} className="flex gap-3 rounded-2xl bg-slate-50 px-4 py-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ManualPage() {
  return (
    <div className="space-y-6">
      <Surface
        title="Ruta operativa recomendada"
        subtitle="ABRIL360 está diseñado para trabajar por empresa y por aplicación. La mejor práctica es cerrar cada ciclo con revisión profesional, no solo con captura terminada."
        icon={<Network className="h-5 w-5" />}
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-cyan-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-black text-slate-950">{step.title}</h3>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">{step.body}</p>
              </article>
            );
          })}
        </div>
      </Surface>

      <Surface
        title="Mapa de navegación real del módulo"
        subtitle="Estas rutas existen hoy en el producto y sirven para orientar inducción, soporte y acompañamiento comercial sin prometer pantallas ficticias."
        icon={<LayoutDashboard className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {navigationMap.map((item) => (
            <article key={item.route} className="rounded-3xl border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">{item.title}</p>
              <p className="mt-3 rounded-2xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">{item.route}</p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Surface
          title="Ciclo recomendado para psicólogo y empresa"
          subtitle="La confianza comercial no viene solo del cálculo: también depende de una operación ordenada, con cierres claros, evidencias de captura y revisión final responsable."
          icon={<Stethoscope className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Preparar empresa, cargos, áreas y participantes antes de abrir la captura evita correcciones tardías y recálculos innecesarios.",
              "Definir quién diligencia, quién supervisa y quién valida resultados reduce incertidumbre y mejora el gobierno del proceso.",
              "Revisar completitud, forma A/B, casos sin forma y consistencia de datos antes del cierre disminuye hallazgos de calidad.",
              "Usar dashboard para priorización y luego informes para cierre profesional conserva un relato técnico más sólido frente a auditoría y cliente.",
            ]}
          />
        </Surface>

        <Surface
          title="Entregables que suele esperar el comprador"
          subtitle="ABRIL360 acompaña el ciclo documental de captura y reporte, pero la firma, interpretación final y plan de intervención siguen bajo responsabilidad profesional."
          icon={<FileText className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Resultados individuales para revisión clínica y ocupacional del profesional competente.",
              "Informes oficiales y reportes empresariales por dominios, dimensiones, áreas y total general.",
              "Consolidado sociodemográfico y apoyo a lectura de concentración Alto/Muy alto.",
              "Base trazable para priorización de intervención, seguimiento y sustentación técnica frente al SG-SST.",
            ]}
          />
        </Surface>
      </div>

      <Surface
        title="Controles previos al cierre"
        subtitle="Antes de usar resultados con fines profesionales o comerciales, conviene completar esta verificación mínima de calidad."
        icon={<Scale className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <SectionList
            items={[
              "Confirmar que el colaborador quedó asociado a la empresa correcta y con perfil operativo suficiente.",
              "Revisar si existen respuestas faltantes, instrumentos incompletos o casos sin forma asignable.",
              "Verificar que la aplicación esté finalizada y con resultados calculados antes de abrir informes.",
            ]}
          />
          <SectionList
            items={[
              "Evitar compartir resultados individuales por fuera del circuito autorizado de tratamiento de datos sensibles.",
              "Usar el material descargado solo en equipos y repositorios aprobados por la organización.",
              "Dejar constancia del profesional responsable de la interpretación y entrega final.",
            ]}
          />
        </div>
      </Surface>
    </div>
  );
}

function TechnicalPage() {
  return (
    <div className="space-y-6">
      <Surface
        title="Cobertura instrumental de ABRIL360"
        subtitle="La plataforma soporta la batería de riesgo psicosocial con diferencias reales entre formularios, reglas de segmentación y persistencia de resultados."
        icon={<ClipboardCheck className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Intralaboral Forma A",
              body: "4 dominios y 19 dimensiones. Incluye liderazgo, control, demandas y recompensas con condicionales normativos específicos.",
            },
            {
              title: "Intralaboral Forma B",
              body: "4 dominios y 16 dimensiones. Excluye dimensiones no aplicables a la forma B y mantiene baremos propios.",
            },
            {
              title: "Extralaboral",
              body: "Se captura una sola vez por aplicación y se clasifica con baremos diferenciados por grupo ocupacional.",
            },
            {
              title: "Estrés",
              body: "Usa 31 ítems y una fórmula ponderada por bloques antes de clasificar el total con baremo oficial.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </Surface>

      <Surface
        title="Cadena de cálculo y trazabilidad"
        subtitle="ABRIL360 no presenta niveles improvisados. La lectura oficial depende de una secuencia de transformación y clasificación que puede auditarse."
        icon={<Network className="h-5 w-5" />}
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            "Respuesta capturada por ítem con dimensión e instrumento correspondiente.",
            "Conversión a puntaje bruto por dimensión, dominio e instrumento según reglas del cuestionario.",
            "Transformación a escala 0-100 mediante factores normativos por nivel y código.",
            "Clasificación por baremo oficial según instrumento, nivel, código y segmento aplicable.",
            "Persistencia de resultados en tablas de score para dimensión, dominio y total.",
            "Consumo de esos resultados por dashboards, informes oficiales y reportes agregados.",
            "Revisión final por profesional competente antes de emitir lectura e intervención.",
            "Trazabilidad conservada para recálculo, auditoría y soporte técnico.",
          ].map((item, index) => (
            <article key={item} className="rounded-3xl border border-slate-200 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">Paso {index + 1}</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item}</p>
            </article>
          ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Surface
          title="Reglas de negocio que impactan el resultado"
          subtitle="Estas reglas son críticas para entender por qué un resultado puede variar entre forma A, forma B, extralaboral y estrés."
          icon={<Scale className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Las formas A y B no comparten exactamente las mismas dimensiones; por eso la plataforma conserva dominios y baremos diferenciados.",
              "En Intralaboral A pueden no aplicar de forma condicional las dimensiones de demandas emocionales y relación con colaboradores; en B, demandas emocionales.",
              "Algunas dimensiones admiten una omisión controlada según el manual, lo cual evita invalidar todo el cuestionario por un único faltante permitido.",
              "El extralaboral clasifica por segmento ocupacional: JEFE_PROF_TEC frente a AUX_OPER, con fallback prudente solo cuando el catálogo lo permite.",
            ]}
          />
        </Surface>

        <Surface
          title="Totales, forma y segmentación"
          subtitle="La plataforma separa captura, scoring y presentación para mantener fidelidad normativa sin duplicar preguntas."
          icon={<LineChart className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Extralaboral y estrés se capturan una sola vez por aplicación, pero los informes agregados los separan por Forma A/B para no mezclar poblaciones.",
              "El Total Intralaboral y el Total Extralaboral se transforman por instrumento; luego el Total General suma ambos y se clasifica con baremo de la forma intralaboral real.",
              "Estrés usa una fórmula ponderada por bloques y genera un total sintético para dashboard e informes sin inventar dimensiones adicionales.",
              "Cuando faltan baremos, factores o consistencia de captura, ABRIL360 debe marcar el caso para revisión en lugar de fingir un nivel de riesgo.",
            ]}
          />
        </Surface>
      </div>

      <Surface
        title="Trazabilidad persistida y límites de interpretación"
        subtitle="La plataforma conserva resultados calculados para poder consultar, auditar y reportar sin recalcular cada vez; aun así, el significado profesional no se automatiza por completo."
        icon={<Fingerprint className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-slate-950">`psico_score_dimension`</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Conserva puntaje transformado, nivel y validez por dimensión. Es la base de lectura detallada y reportes analíticos.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-slate-950">`psico_score_dominio`</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Resume resultados normativos por dominio intralaboral, útil para informes ejecutivos y priorización de intervención.
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 p-5">
            <p className="text-sm font-black text-slate-950">`psico_score_total`</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Guarda totales instrumentales y Total General. Sirve como base de dashboards, reportes oficiales y verificaciones de completitud.
            </p>
          </article>
        </div>
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
          ABRIL360 automatiza captura, tabulación, transformación, clasificación y reporte. No reemplaza la validación clínica, ocupacional o legal del profesional competente, ni convierte por sí mismo un resultado en diagnóstico.
        </div>
      </Surface>
    </div>
  );
}

function SecurityPage() {
  return (
    <div className="space-y-6">
      <Surface
        title="Capas de protección de la información"
        subtitle="La confianza en ABRIL360 se apoya en controles técnicos, operativos y de gobierno del dato, especialmente por tratar información sensible de salud ocupacional."
        icon={<LockKeyhole className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Acceso autenticado",
              body: "Ingreso controlado, sesiones autenticadas y cambio obligatorio de contraseña temporal en el primer acceso.",
            },
            {
              title: "Separación por rol",
              body: "Diferenciación operativa entre SuperAdmin, psicólogo y otros flujos protegidos para reducir exposición innecesaria.",
            },
            {
              title: "Segregación por empresa",
              body: "El trabajo se organiza por tenant o empresa, con controles para evitar cruces de contexto entre clientes.",
            },
            {
              title: "Recuperación controlada",
              body: "Restablecimiento de contraseña con enlace temporal y notificaciones transaccionales para eventos críticos de acceso.",
            },
            {
              title: "Auditoría funcional",
              body: "Eventos administrativos y cambios sensibles pueden quedar soportados por registros de auditoría y contexto operativo.",
            },
            {
              title: "Gobierno de secretos",
              body: "Las credenciales e integraciones deben administrarse por variables de entorno y canales seguros, nunca embebidas en código o documentos.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <h3 className="text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Surface
          title="Tratamiento de datos sensibles"
          subtitle="Los resultados psicosociales, datos de salud ocupacional y variables personales requieren un uso restringido, finalidades claras y soporte documental de autorización."
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Definir finalidad, alcance y responsable del tratamiento antes de iniciar una aplicación.",
              "Asignar acceso solo a personas con necesidad operativa o profesional demostrable.",
              "Evitar descargas, envíos o reenvíos de resultados individuales fuera del canal autorizado por la organización.",
              "Conservar evidencia de autorizaciones, políticas internas y criterios de custodia del archivo descargado.",
            ]}
          />
        </Surface>

        <Surface
          title="Operación en nube y responsabilidades compartidas"
          subtitle="ABRIL360 opera sobre servicios administrados. La confianza depende tanto del software como de la disciplina operativa del equipo que lo administra."
          icon={<Network className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Frontend y backend se despliegan sobre infraestructura cloud administrada, lo que favorece continuidad y estandarización operativa.",
              "Las variables sensibles deben permanecer en gestores o paneles de entorno; nunca en repositorios, manuales comerciales o correos abiertos.",
              "Las rutinas de respaldo, restauración, retención y pruebas de contingencia deben verificarse según el plan vigente del ambiente contratado.",
              "El cliente y el operador deben acordar tiempos de respuesta, custodia documental, retención y procedimiento de incidentes.",
            ]}
          />
        </Surface>
      </div>

      <Surface
        title="Alineación con marcos reconocidos"
        subtitle="ABRIL360 puede comunicarse como alineado con buenas prácticas de seguridad y privacidad; eso no equivale a afirmar una certificación formal si esta no existe."
        icon={<Scale className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: "Ley 1581 de 2012",
              body: "Orienta el tratamiento de datos personales en Colombia y exige principios como finalidad, seguridad, confidencialidad y circulación restringida.",
            },
            {
              title: "ISO/IEC 27001",
              body: "Sirve como referencia para gestión sistemática de riesgos de seguridad de la información, controles y mejora continua.",
            },
            {
              title: "NIST Privacy Framework",
              body: "Aporta lenguaje de gestión de riesgo de privacidad para identificar, gobernar, controlar, comunicar y proteger el tratamiento de datos.",
            },
            {
              title: "OWASP",
              body: "Entrega referencias prácticas para verificación de seguridad web, autenticación, control de acceso, validación y reducción de exposición de aplicaciones.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 p-5">
              <h3 className="text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 rounded-3xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-7 text-slate-700">
          Mensaje prudente recomendado: “ABRIL360 se diseña y opera con referencia a buenas prácticas de seguridad de la información, privacidad y desarrollo seguro. Esta declaración no debe interpretarse como certificación ISO, SOC o sanitaria salvo que exista soporte formal y vigente”.
        </div>
      </Surface>
    </div>
  );
}

function CertificationPage() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Surface
          title="Lo que ABRIL360 sí es"
          subtitle="El alcance comercial gana fuerza cuando se explica de forma concreta, verificable y útil para el comprador."
          icon={<CheckCircle2 className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Una plataforma tecnológica para captura, tabulación, cálculo, visualización y reporte de la batería de riesgo psicosocial.",
              "Un apoyo operativo para psicólogos y equipos SST que necesitan trazabilidad, orden y consistencia documental.",
              "Un entorno que ayuda a consolidar resultados individuales, agregados, sociodemográficos y reportes oficiales.",
            ]}
          />
        </Surface>

        <Surface
          title="Lo que ABRIL360 no debe prometer"
          subtitle="La confianza profesional también depende de límites honestos y visibles."
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "No reemplaza la valoración, interpretación ni firma del psicólogo o profesional competente con licencia SST vigente.",
              "No constituye por sí sola diagnóstico clínico, concepto médico ocupacional ni decisión disciplinaria automática.",
              "No debe presentarse como dispositivo médico ni como software certificado si no existe soporte regulatorio específico.",
            ]}
          />
        </Surface>
      </div>

      <Surface
        title="Marco normativo colombiano de referencia"
        subtitle="ABRIL360 se comunica mejor cuando ubica con claridad el marco legal aplicable y evita ambigüedades sobre alcance técnico o sanitario."
        icon={<Scale className="h-5 w-5" />}
      >
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            {
              year: "2008",
              title: "Resolución 2646",
              body: "Establece responsabilidades para la identificación, evaluación, prevención, intervención y monitoreo de factores de riesgo psicosocial en el trabajo.",
            },
            {
              year: "2012",
              title: "Ley 1581",
              body: "Regula el tratamiento de datos personales, incluidos principios relevantes para información sensible y confidencial.",
            },
            {
              year: "2019",
              title: "Resolución 2404",
              body: "Adopta la batería, la guía técnica general y protocolos asociados para evaluación de riesgo psicosocial.",
            },
            {
              year: "2022",
              title: "Resolución 2764",
              body: "Actualiza la adopción de la batería y la guía técnica en el marco del Ministerio del Trabajo.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-700">{item.year}</p>
              <h3 className="mt-3 text-base font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.body}</p>
            </article>
          ))}
        </div>
      </Surface>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Surface
          title="Cadena de responsabilidad profesional"
          subtitle="La plataforma apoya el proceso, pero la validez final descansa en la actuación del profesional responsable y del marco organizacional del cliente."
          icon={<Stethoscope className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "La empresa define finalidad, alcance, autorizaciones y responsables del proceso.",
              "El profesional competente configura, revisa y valida la aplicación y sus resultados.",
              "ABRIL360 entrega soporte tecnológico para captura, scoring, trazabilidad y reportes.",
              "La interpretación, firma, recomendaciones y planes de intervención se formalizan fuera del automatismo del software.",
            ]}
          />
        </Surface>

        <Surface
          title="Psicología de confianza aplicada a la presentación"
          subtitle="Para compradores y psicólogos, la confianza aumenta cuando la información reduce incertidumbre sin maquillar límites."
          icon={<FileCheck2 className="h-5 w-5" />}
        >
          <SectionList
            items={[
              "Claridad: explicar el flujo, los instrumentos y el alcance en lenguaje profesional pero comprensible.",
              "Evidencia: respaldar afirmaciones con normas, manuales oficiales y trazabilidad de cálculo.",
              "Transparencia: declarar límites de uso, supuestos y responsabilidades compartidas.",
              "Jerarquía visual: separar operación, cálculo, seguridad y alcance para evitar ruido y ambigüedad comercial.",
            ]}
          />
        </Surface>
      </div>

      <Surface
        title="Usos apropiados y límites de uso"
        subtitle="Este marco ayuda a equipos comerciales y profesionales a sostener una conversación seria con compradores, sin sobreventa ni vacíos."
        icon={<BriefcaseBusiness className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-base font-black text-emerald-900">Uso apropiado</h3>
            <p className="mt-3 text-sm leading-7 text-emerald-900">
              Aplicaciones formales de batería psicosocial, consolidación de resultados, soporte de informes, control documental y priorización de intervención con revisión profesional.
            </p>
          </article>
          <article className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="text-base font-black text-amber-900">Límite de uso</h3>
            <p className="mt-3 text-sm leading-7 text-amber-900">
              No debe usarse como criterio único para diagnóstico, sanción, exclusión laboral o sustitución del juicio clínico y ocupacional del profesional habilitado.
            </p>
          </article>
        </div>
      </Surface>
    </div>
  );
}

function renderBody(page: ResourcePageKey): ReactNode {
  switch (page) {
    case "ficha-tecnica":
      return <TechnicalPage />;
    case "seguridad-cumplimiento":
      return <SecurityPage />;
    case "certificacion":
      return <CertificationPage />;
    case "manual-uso":
    default:
      return <ManualPage />;
  }
}

export default function RecursosAbril360Page({ page }: { page?: ResourcePageKey }) {
  const current = resolvePage(page);
  const Icon = current.icon;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(8,145,178,0.12),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#f8fafc_45%,#eef2f7_100%)] text-slate-950">
      <section className="border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <div>
            <Link to="/login" className="inline-flex hover:opacity-90">
              <AbrilBrandLockup
                className="items-center"
                iconWrapperClassName="grid h-11 w-11 place-items-center rounded-[20px] bg-[#0b1730] p-2 shadow-md"
                wordmarkClassName="text-2xl font-black tracking-tight text-slate-950"
                accentClassName="text-cyan-500"
                subtitleClassName="text-[11px] uppercase tracking-[0.3em] text-slate-500"
              />
            </Link>
            <div className="mt-3 rounded-[30px] border border-slate-200/80 bg-white/92 p-5 shadow-sm">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.12fr)_minmax(280px,0.88fr)]">
                <div className="min-w-0">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-cyan-50 text-cyan-700 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-800">
                          {current.eyebrow}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                          {current.audience}
                        </span>
                      </div>
                      <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-[3.15rem] md:leading-[0.95]">
                        {current.title}
                      </h1>
                    </div>
                  </div>

                  <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">{current.description}</p>

                  <div className="mt-4 rounded-3xl bg-slate-50 px-4 py-3 text-sm font-bold leading-7 text-slate-700 ring-1 ring-slate-200/80">
                    {current.promise}
                  </div>
                </div>

                <div className="grid gap-3 content-start">
                  {current.highlights.map((highlight) => (
                    <article key={highlight} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-600" />
                        <p className="text-sm leading-7 text-slate-700">{highlight}</p>
                      </div>
                    </article>
                  ))}

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    {current.quickLinks.map((link) => (
                      <ResourceLink key={link.href} {...link} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-[30px] border border-slate-900/5 bg-slate-950 p-4 text-white shadow-xl shadow-slate-900/10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Señales de confianza</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {current.stats.map((stat) => (
                <article key={stat.label} className="rounded-3xl border border-white/10 bg-white/5 p-3.5">
                  <p className="text-3xl font-black leading-none text-white">{stat.value}</p>
                  <p className="mt-1.5 text-sm font-bold leading-6 text-cyan-100">{stat.label}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{stat.hint}</p>
                </article>
              ))}
            </div>
            <div className="mt-3 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4">
              <p className="text-sm font-black text-cyan-100">Qué encontrarás en esta página</p>
              <ul className="mt-3 grid gap-2 text-sm leading-7 text-slate-200">
                {current.highlights.map((highlight) => (
                  <li key={highlight} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-cyan-300" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[270px_minmax(0,1fr)]">
        <nav className="h-fit rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-6" aria-label="Recursos ABRIL360">
          <p className="px-3 pb-2 text-xs font-black uppercase tracking-[0.22em] text-slate-500">Centro de recursos</p>
          {resourcePages.map((item) => {
            const ItemIcon = item.icon;
            const active = item.key === current.key;
            return (
              <Link
                key={item.key}
                to={`/recursos/${item.key}`}
                className={`flex items-start gap-3 rounded-2xl px-3 py-3 transition ${
                  active ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${
                    active ? "bg-white/10 text-cyan-200" : "bg-cyan-50 text-cyan-700"
                  }`}
                >
                  <ItemIcon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-black">{item.title}</span>
                </span>
              </Link>
            );
          })}
        </nav>

        <section className="space-y-6">
          {renderBody(current.key)}

          <Surface
            title="Referencias y recursos relacionados"
            subtitle="Se priorizan fuentes oficiales o de amplia aceptación técnica para que esta información pueda sostener conversaciones profesionales y comerciales con más confianza."
            icon={<FileText className="h-5 w-5" />}
          >
            <div className="grid gap-3 md:grid-cols-2">
              {current.references.map((reference) => (
                <ResourceLink key={reference.href} {...reference} />
              ))}
            </div>
          </Surface>
        </section>
      </div>
    </main>
  );
}
