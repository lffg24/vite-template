import { Link } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileText,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

type ResourcePageKey = "manual-uso" | "ficha-tecnica" | "seguridad-cumplimiento" | "certificacion";

type ResourceSection = {
  title: string;
  body: string;
  bullets?: string[];
};

type ResourceReference = {
  label: string;
  href: string;
};

type ResourcePage = {
  key: ResourcePageKey;
  title: string;
  eyebrow: string;
  description: string;
  icon: typeof BookOpen;
  sections: ResourceSection[];
  references: ResourceReference[];
};

const officialReferences = {
  intraManual:
    "https://www.fondoriesgoslaborales.gov.co/wp-content/uploads/2025/06/2.-Manual-evaluacion-de-factores-de-riesgo-psicosociales-intralaboral-forma-AyB.pdf",
  ley1581: "https://www.suin-juriscol.gov.co/viewDocument.asp?id=1684507",
  resolucion2764: "https://www.suin-juriscol.gov.co/viewDocument.asp?id=30056150",
  invima: "https://www.invima.gov.co/productos-vigilados/dispositivos-medicos/preguntas-frecuentes-dispositivos",
};

export const resourcePages: ResourcePage[] = [
  {
    key: "manual-uso",
    title: "Manual de uso para profesionales",
    eyebrow: "Guía operativa",
    description:
      "Ruta práctica para ingresar, administrar empresas, crear aplicaciones, registrar respuestas y descargar informes.",
    icon: BookOpen,
    sections: [
      {
        title: "Ingreso y seguridad de cuenta",
        body:
          "El profesional ingresa con el correo registrado y una clave temporal. En el primer acceso ABRIL360 exige cambiar la contraseña antes de navegar por los módulos protegidos.",
        bullets: [
          "Usa el enlace de ingreso enviado por correo o ve a la pantalla de login.",
          "No compartas la clave temporal ni la contraseña definitiva.",
          "Si olvidas la clave, usa recuperación de contraseña desde el login.",
        ],
      },
      {
        title: "Flujo de trabajo recomendado",
        body:
          "La operación se organiza por empresa, aplicación y colaborador. Cada aplicación conserva su propia captura sociodemográfica y sus respuestas para evitar cruces entre periodos.",
        bullets: [
          "Selecciona o crea la empresa asignada.",
          "Crea la aplicación de batería y asigna colaboradores.",
          "Registra datos generales, intralaboral A o B, extralaboral y estrés según aplique.",
          "Cierra y calcula solo cuando los registros obligatorios estén completos.",
        ],
      },
      {
        title: "Reportes e informes",
        body:
          "Los reportes están disponibles para aplicaciones cerradas. Puedes consultar dashboard, informes oficiales, informes por área, informes sociodemográficos e informes individuales.",
      },
    ],
    references: [
      { label: "Ingresar a ABRIL360", href: "/login" },
      { label: "Ficha técnica y cálculo", href: "/recursos/ficha-tecnica" },
    ],
  },
  {
    key: "ficha-tecnica",
    title: "Ficha técnica y motor de cálculo",
    eyebrow: "Cálculo psicosocial",
    description:
      "Resumen funcional del modelo de tabulación, transformación, baremos y controles de calidad usados por ABRIL360.",
    icon: ClipboardCheck,
    sections: [
      {
        title: "Instrumentos cubiertos",
        body:
          "ABRIL360 soporta los cuestionarios intralaborales Forma A y Forma B, extralaboral, estrés y ficha de datos generales. Las formas A y B usan estructura, ítems y baremos propios.",
      },
      {
        title: "Relación entre respuestas y resultados",
        body:
          "Cada respuesta se normaliza a puntaje bruto según la dirección del ítem. Luego se agrupa por dimensión, dominio e instrumento, y se transforma a escala porcentual para clasificar nivel de riesgo.",
        bullets: [
          "Los ítems directos e inversos se tratan de forma diferenciada.",
          "Las preguntas condicionales no aplicables se excluyen del denominador cuando la norma lo permite.",
          "Los resultados generales se calculan con precisión decimal antes de redondear para presentación.",
        ],
      },
      {
        title: "Control de calidad",
        body:
          "El cierre valida completitud mínima, registros en captura, evaluación de estrés válida y consistencia de scoring antes de habilitar resultados.",
      },
    ],
    references: [
      { label: "Manual oficial intralaboral Forma A y B", href: officialReferences.intraManual },
      { label: "Resolución 2764 de 2022", href: officialReferences.resolucion2764 },
    ],
  },
  {
    key: "seguridad-cumplimiento",
    title: "Seguridad y cumplimiento",
    eyebrow: "Protección de información",
    description:
      "Buenas prácticas implementadas y recomendaciones para el tratamiento responsable de datos personales y sensibles.",
    icon: LockKeyhole,
    sections: [
      {
        title: "Acceso y autenticación",
        body:
          "La plataforma usa sesiones autenticadas, cambio obligatorio de contraseña inicial, recuperación controlada y permisos por rol para separar funciones de SuperAdmin y psicólogo.",
      },
      {
        title: "Datos sensibles",
        body:
          "Los datos de salud, condiciones psicosociales y resultados individuales deben tratarse bajo principios de finalidad, circulación restringida, seguridad y confidencialidad.",
        bullets: [
          "Asigna solo usuarios necesarios por empresa.",
          "Evita descargar informes en equipos no autorizados.",
          "Conserva evidencias de autorización y finalidad del tratamiento.",
        ],
      },
      {
        title: "Trazabilidad",
        body:
          "Las acciones críticas del sistema se apoyan en auditoría funcional y controles de acceso para reducir exposición operativa.",
      },
    ],
    references: [
      { label: "Ley 1581 de 2012", href: officialReferences.ley1581 },
      { label: "Alcance y referencias normativas", href: "/recursos/certificacion" },
    ],
  },
  {
    key: "certificacion",
    title: "Alcance, certificación y referencias",
    eyebrow: "Marco regulatorio",
    description:
      "Declaración prudente del alcance de ABRIL360 como herramienta tecnológica de apoyo a profesionales competentes.",
    icon: ShieldCheck,
    sections: [
      {
        title: "Alcance de la plataforma",
        body:
          "ABRIL360 apoya captura, tabulación, cálculo, visualización e informes de la batería de riesgo psicosocial. No reemplaza el criterio profesional ni constituye por sí misma un diagnóstico clínico.",
      },
      {
        title: "Certificación de seguridad",
        body:
          "La certificación de seguridad suele abordarse mediante gestión de privacidad, controles técnicos, contratos de tratamiento de datos, pruebas de seguridad y, si aplica, auditorías externas como ISO 27001 o SOC 2. No debe declararse una certificación no obtenida.",
      },
      {
        title: "Software y dispositivo médico",
        body:
          "La clasificación regulatoria depende de la finalidad de uso declarada, el riesgo y si el software se presenta como instrumento médico/diagnóstico. Antes de usar sellos o afirmaciones de certificación sanitaria, se recomienda concepto legal-regulatorio especializado.",
      },
    ],
    references: [
      { label: "INVIMA: preguntas frecuentes de dispositivos médicos", href: officialReferences.invima },
      { label: "Manual oficial intralaboral Forma A y B", href: officialReferences.intraManual },
      { label: "Resolución 2764 de 2022", href: officialReferences.resolucion2764 },
      { label: "Ley 1581 de 2012", href: officialReferences.ley1581 },
    ],
  },
];

function resolvePage(page?: ResourcePageKey): ResourcePage {
  return resourcePages.find((item) => item.key === page) || resourcePages[0];
}

export default function RecursosAbril360Page({ page }: { page?: ResourcePageKey }) {
  const current = resolvePage(page);
  const Icon = current.icon;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <Link to="/login" className="text-sm font-black text-brand-primary hover:text-brand-sky">
              ABRIL360
            </Link>
            <div className="mt-5 flex items-start gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-brand-primary">
                <Icon className="h-7 w-7" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-primary">{current.eyebrow}</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight md:text-5xl">{current.title}</h1>
                <p className="mt-4 text-base leading-7 text-slate-600">{current.description}</p>
              </div>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex h-12 items-center justify-center rounded-2xl bg-primary px-5 text-sm font-black text-primary-foreground shadow-sm hover:bg-primary-hover"
          >
            Ingresar a la plataforma
          </Link>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm" aria-label="Recursos ABRIL360">
          {resourcePages.map((item) => {
            const ItemIcon = item.icon;
            const active = item.key === current.key;
            return (
              <Link
                key={item.key}
                to={`/recursos/${item.key}`}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                  active ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-50 hover:text-brand-primary"
                }`}
              >
                <ItemIcon className="h-4 w-4 shrink-0" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <section className="space-y-5">
          {current.sections.map((section) => (
            <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <h2 className="text-xl font-black">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
                  {section.bullets?.length ? (
                    <ul className="mt-4 grid gap-2 text-sm text-slate-700">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            </article>
          ))}

          <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-primary" />
              <h2 className="text-xl font-black">Referencias y enlaces</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {current.references.map((reference) => {
                const external = reference.href.startsWith("http");
                const className =
                  "inline-flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-accent hover:bg-accent hover:text-brand-primary";
                if (external) {
                  return (
                    <a key={reference.href} href={reference.href} target="_blank" rel="noreferrer" className={className}>
                      {reference.label}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  );
                }
                return (
                  <Link key={reference.href} to={reference.href} className={className}>
                    {reference.label}
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                );
              })}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
