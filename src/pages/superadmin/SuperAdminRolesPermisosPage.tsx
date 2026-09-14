import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, ChevronRight, Copy, Eye, History, KeyRound, LockKeyhole, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { accesoService as api, type CambioAsignacion, type CambioRol, type Capacidad, type Empresa, type Evento, type Explicacion, type Persona, type Rol, type VistaAsignacion, type VistaRol } from "@/services/accesoService";

const campo = "mt-2 h-10 w-full rounded-rel-control border border-rel-border bg-rel-surface px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary";
const panel = "rounded-rel-card border border-rel-border bg-rel-surface p-5 sm:p-6";
const motivos: Record<string, string> = { AUTORIZADO: "Las condiciones de acceso se cumplen.", CONTRATO_NO_VIGENTE: "La empresa necesita un contrato vigente del módulo.", FUNCIONALIDAD_DESHABILITADA: "La funcionalidad está apagada o aún no está declarada.", SIN_PERMISO_EN_ALCANCE: "Ningún rol vigente concede este permiso en el alcance requerido." };
const nombresEvento: Record<string, string> = {
  IAM_ROL_CAMBIADO: "Rol actualizado", IAM_ASIGNACION_CAMBIADA: "Asignación actualizada",
  IAM_USUARIO_INVITADO: "Usuario invitado", IAM_INVITACION_REENVIADA: "Invitación reenviada",
  IAM_MEMBRESIA_CREADA: "Empresa vinculada", IAM_USUARIO_ACTIVADO: "Cuenta activada",
};
const fecha = (valor: string | null) => valor ? new Date(valor).toLocaleString("es-CO") : "Sin límite";
const fechaLocal = (v: string | null) => v ? new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
const fechaISO = (v: string) => v ? new Date(v).toISOString() : null;

/**
 * Agrupa el catálogo por módulo y, dentro, por superficie.
 *
 * La superficie es la distinción que de verdad se confunde: «Editar catálogo»
 * es de PLATAFORMA —contenido global de REL, sin contrato de por medio— y
 * «Gestionar asignaciones» es de EMPRESA. Leídas en una sola lista parecen lo
 * mismo, y conceder la primera creyendo que afecta solo a una empresa es
 * exactamente el error que esta pantalla tiene que impedir.
 *
 * El módulo va por fuera porque hoy hay uno registrado y mañana habrá varios:
 * `crear_router_acceso` recibe el catálogo que le pase cada módulo. Agrupar ya
 * evita que el día que entre el segundo la pantalla quede mezclándolos.
 */
export function agrupar(capacidades: Capacidad[]) {
  const modulos = new Map<string, Map<string, Capacidad[]>>();
  for (const c of capacidades) {
    if (!modulos.has(c.modulo)) modulos.set(c.modulo, new Map());
    const superficies = modulos.get(c.modulo)!;
    if (!superficies.has(c.superficie)) superficies.set(c.superficie, []);
    superficies.get(c.superficie)!.push(c);
  }
  // PLATAFORMA primero: es la que más alcance tiene y la que conviene leer
  // antes de conceder nada.
  const orden = ["PLATAFORMA", "EMPRESA", "SISTEMA"];
  return [...modulos.entries()].map(([modulo, superficies]) => ({
    modulo,
    superficies: [...superficies.entries()]
      .sort((a, b) => orden.indexOf(a[0]) - orden.indexOf(b[0]))
      .map(([superficie, items]) => ({ superficie, items })),
  }));
}

const TITULO_SUPERFICIE: Record<string, string> = {
  PLATAFORMA: "Plataforma · afecta a todas las empresas",
  EMPRESA: "Empresa · exige contrato vigente y funcionalidad encendida",
  SISTEMA: "Sistema · permisos vigentes del rol global",
};

function tituloSuperficie(s: string) {
  return TITULO_SUPERFICIE[s] ?? "Superficie no registrada";
}

export default function SuperAdminRolesPermisosPage() {
  const [seccion, setSeccion] = useState<"roles" | "personas" | "historial">("roles");
  const [capacidades, setCapacidades] = useState<Capacidad[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [seleccion, setSeleccion] = useState<Rol | null>(null);
  const [pagina, setPagina] = useState(1);
  const [mas, setMas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState("");
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [persona, setPersona] = useState(0);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresa, setEmpresa] = useState("");
  const [explicacion, setExplicacion] = useState<Explicacion | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [editor, setEditor] = useState<CambioRol | null>(null);
  const [vistaRol, setVistaRol] = useState<VistaRol | null>(null);
  const [asignacion, setAsignacion] = useState<CambioAsignacion | null>(null);
  const [vistaAsignacion, setVistaAsignacion] = useState<VistaAsignacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [revision, setRevision] = useState(0);
  const [moduloActivo, setModuloActivo] = useState("");

  useEffect(() => {
    let vigente = true;
    setCargando(true); setError(null);
    const cargar = async () => {
      const catalogo = await api.catalogo();
      if (!vigente) return;
      setCapacidades(catalogo.capacidades);
      if (seccion === "roles") {
        const d = await api.roles(consulta, pagina);
        if (vigente) { setRoles(d.items); setMas(d.hay_mas); setSeleccion(d.items[0] ?? null); }
      } else if (seccion === "personas") {
        const [d, r] = await Promise.all([api.usuarios(consulta, pagina), api.roles("IAM_", 1)]);
        if (vigente) { setPersonas(d.items); setRoles(r.items); setMas(d.hay_mas); }
      } else {
        const d = await api.historial(pagina);
        if (vigente) { setEventos(d.items); setMas(d.hay_mas); }
      }
    };
    cargar().catch(e => vigente && setError(e.message)).finally(() => vigente && setCargando(false));
    return () => { vigente = false; };
  }, [seccion, consulta, pagina, revision]);
  useEffect(() => {
    let vigente = true;
    setEmpresa(""); setEmpresas([]); setExplicacion(null);
    if (persona) api.empresas(persona).then(d => { if (vigente) { setEmpresas(d.items); setEmpresa(d.items[0]?.id ?? ""); } }).catch(e => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [persona]);
  useEffect(() => {
    let vigente = true;
    setExplicacion(null);
    if (persona && empresa) api.explicacion(persona, empresa).then(d => vigente && setExplicacion(d)).catch(e => vigente && setError(e.message));
    return () => { vigente = false; };
  }, [persona, empresa, revision]);

  const ejecutar = async (accion: () => Promise<void>) => {
    setOcupado(true); setError(null); setMensaje("");
    try { await accion(); } catch (e) { setError(e instanceof Error ? e.message : "No se pudo completar la operación."); }
    finally { setOcupado(false); }
  };
  const abrirRol = (rol?: Rol, clonar = false) => {
    setVistaRol(null); setError(null);
    setEditor({ rol_id: rol && !clonar ? rol.id : null, version: rol && !clonar ? rol.version ?? 0 : 0,
      nombre: rol ? `${rol.nombre}${clonar ? " · copia" : ""}` : "",
      permisos: rol?.permisos.filter(p => capacidades.some(c => c.clave === p && c.configurable)) ?? [] });
  };
  const cambiarSeccion = (s: typeof seccion) => { setSeccion(s); setPagina(1); setBusqueda(""); setConsulta(""); setError(null); setMensaje(""); };
  const guardarRol = () => ejecutar(async () => {
    if (!editor || !vistaRol) return;
    await api.guardarRol({ ...editor, huella: vistaRol.huella });
    setEditor(null); setVistaRol(null); setRevision(r => r + 1); setMensaje("Rol guardado. El cambio quedó auditado y las sesiones afectadas se invalidaron.");
  });
  const guardarAsignacion = () => ejecutar(async () => {
    if (!asignacion || !vistaAsignacion) return;
    await api.guardarAsignacion({ ...asignacion, huella: vistaAsignacion.huella });
    setAsignacion(null); setVistaAsignacion(null); setRevision(r => r + 1); setMensaje("Asignación guardada. La persona deberá volver a iniciar sesión.");
  });
  const nombrePermiso = (p: string) => capacidades.find(c => c.clave === p)?.nombre ?? p;
  const gruposCatalogo = agrupar(capacidades);
  const moduloSeleccionado = gruposCatalogo.some(g => g.modulo === moduloActivo)
    ? moduloActivo : gruposCatalogo[0]?.modulo;

  return <div className="rel-scope mx-auto min-w-0 max-w-7xl font-rel-body text-rel-dark">
    <header className="mb-7 flex min-w-0 flex-wrap items-start justify-between gap-4"><div className="min-w-0"><p className="mb-2 break-words text-xs font-semibold uppercase tracking-widest text-rel-muted">Administración / Identidad y acceso</p><h1 className="font-rel-heading text-3xl font-bold tracking-tight">Roles y permisos</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-rel-muted">Acceso claro, cambios con contexto. Define qué puede hacer cada persona y comprueba por qué.</p></div>{seccion === "personas" && <Link to="/superadmin/usuarios" className="inline-flex items-center rounded-rel-control bg-rel-primary px-4 py-2 text-sm font-semibold text-white focus-visible:ring-2 focus-visible:ring-rel-primary"><Plus className="mr-2 h-4 w-4" />Invitar usuario</Link>}{seccion === "roles" && <Button variant="rel" onClick={() => abrirRol()} disabled={cargando}><Plus className="mr-2 h-4 w-4" />Crear rol</Button>}</header>
    <div className={`${panel} mb-6 flex flex-wrap items-center gap-3 text-sm`}><span className="grid h-10 w-10 place-items-center rounded-rel-control bg-rel-canvas text-rel-primary"><ShieldCheck className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="font-semibold">Permisos por módulo</p><p className="text-rel-muted">Consulta Psicosocial, Capacitación y Evaluaciones. Solo se editan capacidades registradas como configurables.</p></div><Badge variant="outline" className="hidden sm:inline-flex">Capacidades registradas</Badge></div>
    <nav aria-label="Administración de acceso" className="mb-6 flex min-w-0 flex-col gap-1 border-b border-rel-border sm:flex-row sm:flex-wrap">{([{ id: "roles", nombre: "Roles y capacidades", Icono: KeyRound }, { id: "personas", nombre: "Personas y acceso", Icono: Users }, { id: "historial", nombre: "Historial", Icono: History }] as const).map(s => <button key={s.id} onClick={() => cambiarSeccion(s.id)} aria-current={seccion === s.id ? "page" : undefined} className={`flex min-w-0 items-center gap-2 border-b-2 px-2 py-3 text-left text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary sm:px-4 ${seccion === s.id ? "border-rel-primary text-rel-primary" : "border-transparent text-rel-muted"}`}><s.Icono className="h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{s.nombre}</span></button>)}</nav>
    {error && !editor && !asignacion && <div role="alert" className="mb-5 rounded-rel-control bg-rel-danger-subtle p-4 text-sm text-rel-danger">{error}<Button className="ml-3" variant="outline" size="sm" onClick={() => setRevision(r => r + 1)}>Reintentar</Button></div>}
    {mensaje && <p role="status" className="mb-5 rounded-rel-control bg-rel-success-subtle p-4 text-sm text-rel-success">{mensaje}</p>}
    {seccion !== "historial" && <form className="mb-5 flex min-w-0 max-w-xl flex-col gap-2 sm:flex-row" onSubmit={e => { e.preventDefault(); setPagina(1); setConsulta(busqueda); }}><label className="relative min-w-0 flex-1"><span className="sr-only">Buscar {seccion === "roles" ? "rol" : "persona"}</span><Search className="absolute left-3 top-3 h-4 w-4 text-rel-muted" /><Input className="min-w-0 bg-rel-surface pl-9" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder={seccion === "roles" ? "Buscar por nombre o código" : "Buscar por nombre o correo"} /></label><Button variant="outline" type="submit">Buscar</Button></form>}
    {seccion === "roles" && gruposCatalogo.length > 0 && <div role="tablist" aria-label="Módulos de permisos" className="mb-5 flex flex-wrap gap-2">{gruposCatalogo.map(g => <button key={g.modulo} type="button" role="tab" aria-selected={moduloSeleccionado === g.modulo} onClick={() => setModuloActivo(g.modulo)} className={`rounded-rel-control border px-4 py-2 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-rel-primary ${moduloSeleccionado === g.modulo ? "border-rel-primary bg-rel-canvas text-rel-primary" : "border-rel-border bg-rel-surface text-rel-muted"}`}>{g.modulo}</button>)}</div>}
    {cargando ? <div role="status" aria-busy="true" className={panel}>Cargando configuración de acceso…</div> : <>
      {seccion === "roles" && <div className="grid items-start gap-5 lg:grid-cols-[280px_1fr]"><aside aria-label="Roles disponibles" className="space-y-2">{roles.length === 0 && <p className="p-4 text-sm text-rel-muted">No hay roles que coincidan con la búsqueda.</p>}{roles.map(r => <button key={r.id} onClick={() => setSeleccion(r)} aria-pressed={seleccion?.id === r.id} className={`w-full rounded-rel-card border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary ${seleccion?.id === r.id ? "border-rel-primary bg-rel-canvas" : "border-rel-border bg-rel-surface"}`}><span className="flex items-center justify-between gap-2 font-semibold">{r.nombre}{r.version ? <KeyRound className="h-4 w-4 shrink-0 text-rel-primary" /> : <LockKeyhole className="h-4 w-4 shrink-0 text-rel-muted" />}</span><span className="mt-2 block text-xs text-rel-muted">{r.version ? `Configurable · versión ${r.version}` : "Sistema · protegido"}</span></button>)}</aside>
        {seleccion && <section aria-label="Matriz de capacidades" className="overflow-hidden rounded-rel-card border border-rel-border bg-rel-surface"><div className="flex flex-wrap items-start justify-between gap-3 border-b border-rel-border p-6"><div><h2 className="font-rel-heading text-xl font-bold">{seleccion.nombre}</h2><p className="mt-1 text-sm text-rel-muted">{agrupar(capacidades).map(g => g.modulo).join(" · ") || "Sin módulos registrados"}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => abrirRol(seleccion, true)}><Copy className="mr-2 h-4 w-4" />Clonar</Button>{seleccion.version && <Button variant="rel" size="sm" onClick={() => abrirRol(seleccion)}>Editar</Button>}</div></div><div className="divide-y divide-rel-border">{gruposCatalogo.filter(g => g.modulo === moduloSeleccionado).map(g => <div key={g.modulo}><h3 className="bg-rel-surface-subtle px-6 py-3 text-xs font-bold uppercase tracking-wide text-rel-muted">{g.modulo}</h3>{g.superficies.map(sup => <div key={sup.superficie}><p className="border-t border-rel-border px-6 pt-4 text-xs font-semibold text-rel-muted">{tituloSuperficie(sup.superficie)}</p>{sup.items.map(c => <div key={c.clave} className="grid gap-3 px-6 py-4 sm:grid-cols-[1fr_auto]"><div><h4 className="font-semibold">{c.nombre}</h4><p className="mt-1 text-sm text-rel-muted">{c.descripcion}</p>{!c.configurable && <p className="mt-2 text-xs text-rel-warning">No se concede desde aquí: depende de un rol global.</p>}</div><span className={`flex h-fit items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${seleccion.permisos.includes(c.clave) ? "bg-rel-success-subtle text-rel-success" : "bg-rel-neutral-subtle text-rel-muted"}`}>{seleccion.permisos.includes(c.clave) && <Check className="h-3 w-3" />}{seleccion.permisos.includes(c.clave) ? "Concedido al rol" : "Sin acceso"}</span></div>)}</div>)}</div>)}</div><p className="border-t border-rel-border bg-rel-surface-subtle px-6 py-4 text-xs leading-5 text-rel-muted">Los permisos globales dependen de roles protegidos. Los configurables de empresa también requieren membresía, contrato, funcionalidad y vigencia.</p></section>}
      </div>}
      {seccion === "personas" && <div className="space-y-5"><section className={`${panel} grid gap-4 sm:grid-cols-2`}><label className="min-w-0 text-sm font-semibold">Persona<select className={campo} value={persona || ""} onChange={e => setPersona(Number(e.target.value))}><option value="">Selecciona una persona</option>{personas.map(p => <option key={p.id} value={p.id}>{p.nombre} · {p.email || `#${p.id}`}</option>)}</select></label><label className="min-w-0 text-sm font-semibold">Empresa<select className={campo} disabled={!persona} value={empresa} onChange={e => setEmpresa(e.target.value)}><option value="">Selecciona una empresa</option>{empresas.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label></section>
        {!persona && <div className={`${panel} text-center`}><Eye className="mx-auto mb-3 h-7 w-7 text-rel-muted" /><h2 className="font-semibold">Comprueba un acceso antes de cambiarlo</h2><p className="mt-2 text-sm text-rel-muted">Selecciona una persona y su empresa. La simulación no cambia su sesión.</p></div>}
        {persona > 0 && empresa && !explicacion && !error && <p role="status">Comprobando capacidades…</p>}
        {explicacion && <><section className={`${panel} min-w-0 overflow-hidden`}><div className="mb-5 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><h2 className="text-lg font-bold">Acceso efectivo</h2><p className="break-words text-xs text-rel-muted">{fecha(explicacion.evaluado_en)} · decisión del servidor</p></div><Button className="max-w-full" variant="outline" size="sm" onClick={() => setRevision(r => r + 1)}>Volver a comprobar</Button></div><div className="grid min-w-0 gap-3 xl:grid-cols-3">{explicacion.decisiones.map(d => <article key={d.clave} className="min-w-0 rounded-rel-control border border-rel-border p-4"><Badge variant="outline" className={d.permitido ? "text-rel-success" : "text-rel-muted"}>{d.permitido ? "Permitido" : "Sin acceso"}</Badge><h3 className="mt-3 break-words font-semibold">{d.nombre}</h3><p className="mt-2 break-words text-sm leading-6 text-rel-muted">{motivos[d.motivo] ?? "La capacidad no está registrada para este alcance."}</p><p className="mt-3 break-words text-xs text-rel-muted">{d.superficie === "PLATAFORMA" ? "Alcance de plataforma" : d.superficie === "SISTEMA" ? "Rol global protegido" : "Alcance de empresa"}</p></article>)}</div><p className="mt-4 break-words text-sm text-rel-muted">Roles globales activos: {explicacion.roles_globales.map(r => r.nombre).join(", ") || "Ninguno"}.</p></section>
          <section className={`${panel} min-w-0 overflow-hidden`}><div className="mb-4 flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between"><h2 className="break-words text-lg font-bold">Asignaciones en esta empresa</h2><Button className="max-w-full" variant="rel" size="sm" disabled={!roles.some(r => r.version && r.permisos.length)} onClick={() => { setError(null); setVistaAsignacion(null); setAsignacion({ rol_id: roles.find(r => r.version && r.permisos.length)?.id ?? 0, usuario_id: persona, empresa_id: empresa, activo: true, valido_desde: null, valido_hasta: null }); }}><Plus className="mr-2 h-4 w-4" />Asignar rol</Button></div>{explicacion.asignaciones.length === 0 && <p className="break-words py-5 text-sm text-rel-muted">No hay asignaciones por empresa. Crea un rol configurable con capacidades para conceder acceso.</p>}{explicacion.asignaciones.map(a => <div key={a.id} className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-t border-rel-border py-4"><div className="min-w-0"><p className="break-words font-semibold">{a.nombre}</p><p className="mt-1 break-words text-xs text-rel-muted">{a.modulo} · {a.vigente ? "Vigente" : a.activo ? "Fuera de vigencia" : "Revocada"}</p><p className="mt-1 break-words text-xs text-rel-muted">Desde {fecha(a.valido_desde)} · hasta {fecha(a.valido_hasta)}</p></div>{roles.some(r => r.id === a.role_id && r.version) && <Button variant="outline" size="sm" onClick={() => { setError(null); setVistaAsignacion(null); setAsignacion({ rol_id: a.role_id, usuario_id: persona, empresa_id: empresa, activo: a.activo, valido_desde: a.valido_desde, valido_hasta: a.valido_hasta }); }}>Administrar</Button>}</div>)}</section></>}
      </div>}
      {seccion === "historial" && <section className={panel}><h2 className="mb-4 text-lg font-bold">Cambios de acceso</h2>{eventos.length === 0 && <p className="py-8 text-center text-sm text-rel-muted">Todavía no hay cambios registrados en este espacio.</p>}{eventos.map(e => <details key={e.id} className="border-t border-rel-border py-4"><summary className="cursor-pointer text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"><span className="font-semibold">{nombresEvento[e.evento] ?? e.evento}</span><span className="ml-3 text-rel-muted">{fecha(e.creado_en)} · {e.actor_ref}</span></summary><p className="mt-3 break-all text-xs text-rel-muted">Correlación: {e.correlation_id}</p><pre className="mt-3 overflow-auto rounded-rel-control bg-rel-surface-subtle p-3 text-xs">{JSON.stringify(e.payload, null, 2)}</pre></details>)}</section>}
      <div className="mt-4 flex items-center justify-end gap-3 text-sm text-rel-muted"><Button variant="outline" size="sm" disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></Button><span>Página {pagina}</span><Button variant="outline" size="sm" disabled={!mas} onClick={() => setPagina(p => p + 1)} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></Button></div>
    </>}
    <Dialog open={!!editor} onOpenChange={v => { if (!v && !ocupado) { setEditor(null); setVistaRol(null); } }}><DialogContent className="rel-scope max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{vistaRol ? "Revisa el impacto" : editor?.rol_id ? "Editar rol" : "Crear rol configurable"}</DialogTitle><DialogDescription>{vistaRol ? "El servidor volverá a comprobar el impacto al guardar." : "Solo se editan capacidades configurables de empresa registradas. Los permisos globales y de Psicosocial siguen protegidos."}</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-rel-danger">{error}</p>}
      {editor && !vistaRol && <form id="form-rol" className="space-y-5" onSubmit={e => { e.preventDefault(); ejecutar(async () => setVistaRol(await api.previewRol(editor))); }}><label className="block text-sm font-semibold">Nombre del rol<Input className="mt-2" autoFocus required minLength={3} maxLength={100} value={editor.nombre} onChange={e => setEditor({ ...editor, nombre: e.target.value })} placeholder="Ej. Coordinador de formación" /></label><fieldset className="space-y-5"><legend className="mb-3 text-sm font-semibold">Capacidades configurables</legend>{agrupar(capacidades.filter(c => c.configurable)).map(g => <div key={g.modulo} className="space-y-2"><p className="text-xs font-bold uppercase tracking-wide text-rel-muted">{g.modulo}</p>{g.superficies.map(sup => <div key={sup.superficie} className="space-y-2"><p className="text-xs text-rel-muted">{tituloSuperficie(sup.superficie)}</p>{sup.items.map(c => <label key={c.clave} className="flex gap-3 rounded-rel-control border border-rel-border p-4"><input type="checkbox" className="mt-1 h-4 w-4" checked={editor.permisos.includes(c.clave)} onChange={e => setEditor({ ...editor, permisos: e.target.checked ? [...editor.permisos, c.clave] : editor.permisos.filter(x => x !== c.clave) })} /><span><span className="block text-sm font-semibold">{c.nombre}</span><span className="mt-1 block text-sm text-rel-muted">{c.descripcion}</span></span></label>)}</div>)}</div>)}{capacidades.filter(c => c.configurable).length === 0 && <p className="text-sm text-rel-muted">Ningún módulo registra capacidades configurables por empresa.</p>}</fieldset><p className="text-xs leading-5 text-rel-muted">Clonar copia únicamente capacidades configurables de empresa. Un rol vacío no concede acceso. Contratos y funcionalidades permanecen separados.</p></form>}
      {vistaRol && <div className="space-y-4 text-sm"><p className="text-lg font-semibold">{vistaRol.despues.nombre}</p><div className="rounded-rel-control bg-rel-canvas p-4"><p><strong>{vistaRol.afectados.length}</strong> personas con sesiones que se invalidarán</p><p className="mt-2 text-rel-muted">Versión {vistaRol.antes?.version ?? 0} → {vistaRol.despues.version}</p></div><p>Se conceden: {vistaRol.agregados.map(nombrePermiso).join(", ") || "Ninguna capacidad adicional"}.</p><p>Se retiran: {vistaRol.retirados.map(nombrePermiso).join(", ") || "Ninguna capacidad"}.</p><p className="text-rel-muted">El nombre anterior era «{vistaRol.antes?.nombre ?? "Rol nuevo"}». Guardar no activa contratos ni funcionalidades.</p></div>}
      <DialogFooter>{vistaRol ? <><Button type="button" variant="outline" disabled={ocupado} onClick={e => { e.preventDefault(); setVistaRol(null); setError(null); }}>Volver a editar</Button><Button variant="rel" disabled={ocupado} onClick={guardarRol}>{ocupado ? "Guardando…" : "Confirmar y guardar"}</Button></> : <Button variant="rel" form="form-rol" type="submit" disabled={ocupado}><Eye className="mr-2 h-4 w-4" />Vista previa</Button>}</DialogFooter></DialogContent></Dialog>
    <Dialog open={!!asignacion} onOpenChange={v => { if (!v && !ocupado) { setAsignacion(null); setVistaAsignacion(null); } }}><DialogContent className="rel-scope max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{vistaAsignacion ? "Confirmar asignación" : "Administrar asignación"}</DialogTitle><DialogDescription>Solo afecta a la empresa seleccionada. La persona tendrá que volver a iniciar sesión.</DialogDescription></DialogHeader>{error && <p role="alert" className="text-sm text-rel-danger">{error}</p>}
      {asignacion && !vistaAsignacion && <form id="form-asignacion" className="space-y-4" onSubmit={e => { e.preventDefault(); ejecutar(async () => setVistaAsignacion(await api.previewAsignacion(asignacion))); }}><label className="block text-sm font-semibold">Rol<select required className={campo} value={asignacion.rol_id || ""} onChange={e => setAsignacion({ ...asignacion, rol_id: Number(e.target.value) })}><option value="">Selecciona un rol</option>{roles.filter(r => r.version).map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Vigente desde<input className={campo} type="datetime-local" value={fechaLocal(asignacion.valido_desde)} onChange={e => setAsignacion({ ...asignacion, valido_desde: fechaISO(e.target.value) })} /></label><label className="text-sm font-semibold">Vigente hasta<input className={campo} type="datetime-local" value={fechaLocal(asignacion.valido_hasta)} onChange={e => setAsignacion({ ...asignacion, valido_hasta: fechaISO(e.target.value) })} /></label></div><p className="text-xs text-rel-muted">Fechas en la zona horaria de tu dispositivo. Vacío significa sin límite en ese extremo.</p><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={asignacion.activo} onChange={e => setAsignacion({ ...asignacion, activo: e.target.checked })} />Asignación activa</label></form>}
      {vistaAsignacion && <div className="space-y-3 rounded-rel-control bg-rel-canvas p-4 text-sm"><p className="font-semibold">{roles.find(r => r.id === vistaAsignacion.despues.rol_id)?.nombre}</p><p>Estado anterior: {vistaAsignacion.antes ? vistaAsignacion.antes.activo ? "Activa" : "Revocada" : "Sin asignación"}</p><p>Nuevo estado: <strong>{vistaAsignacion.despues.activo ? "Activa" : "Revocada"}</strong></p><p>Desde {fecha(vistaAsignacion.despues.valido_desde)} · hasta {fecha(vistaAsignacion.despues.valido_hasta)}</p><p className="text-rel-muted">El permiso requiere contrato vigente y funcionalidad habilitada.</p></div>}
      <DialogFooter>{vistaAsignacion ? <><Button type="button" variant="outline" disabled={ocupado} onClick={e => { e.preventDefault(); setVistaAsignacion(null); setError(null); }}>Volver a editar</Button><Button variant="rel" disabled={ocupado} onClick={guardarAsignacion}>{ocupado ? "Guardando…" : "Confirmar y guardar"}</Button></> : <Button variant="rel" form="form-asignacion" type="submit" disabled={ocupado || !asignacion?.rol_id}>Vista previa</Button>}</DialogFooter></DialogContent></Dialog>
    <p className="mt-8 text-xs leading-5 text-rel-muted">ABRIL-360 · Cada cambio conserva actor, impacto y correlación. Las funcionalidades nuevas requieren implementación; este espacio configura capacidades existentes.</p>
  </div>;
}
