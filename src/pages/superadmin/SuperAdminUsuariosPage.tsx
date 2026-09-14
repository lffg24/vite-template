import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Building2, MailPlus, Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { accesoService as api, type Empresa, type Persona } from "@/services/accesoService";

const panel = "rounded-rel-card border border-rel-border bg-rel-surface p-5";

export default function SuperAdminUsuariosPage() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mas, setMas] = useState(false);
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modal, setModal] = useState<"invitar" | "membresia" | null>(null);
  const [sujeto, setSujeto] = useState<Persona | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [empresaBusqueda, setEmpresaBusqueda] = useState("");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    let vigente = true;
    setCargando(true); setError("");
    api.usuarios(consulta, pagina).then(data => { if (vigente) { setPersonas(data.items); setMas(data.hay_mas); } })
      .catch(caught => { if (vigente) setError(caught instanceof Error ? caught.message : "No pudimos cargar las personas."); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, [consulta, pagina, revision]);

  useEffect(() => {
    if (!modal) return;
    let vigente = true;
    api.todasEmpresas(empresaBusqueda).then(data => { if (vigente) setEmpresas(data.items); })
      .catch(caught => { if (vigente) setError(caught instanceof Error ? caught.message : "No pudimos buscar empresas."); });
    return () => { vigente = false; };
  }, [modal, empresaBusqueda]);

  function abrirInvitacion() { setNombre(""); setEmail(""); setEmpresa(""); setEmpresaBusqueda(""); setError(""); setModal("invitar"); }
  function abrirMembresia(persona: Persona) { setSujeto(persona); setEmpresa(""); setEmpresaBusqueda(""); setError(""); setModal("membresia"); }
  async function reenviar(persona: Persona) {
    setOcupado(true); setError(""); setMensaje("");
    try { await api.reenviarInvitacion(persona.id); setMensaje(`La invitación de ${persona.nombre} quedó en cola.`); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "No pudimos reenviar la invitación."); }
    finally { setOcupado(false); }
  }
  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (!empresa) { setError("Selecciona una empresa."); return; }
    setOcupado(true); setError(""); setMensaje("");
    try {
      if (modal === "invitar") {
        await api.invitar({ nombre: nombre.trim(), email: email.trim(), empresa_id: empresa });
        setMensaje("Cuenta pendiente creada. La invitación quedó en cola para su entrega.");
      } else if (modal === "membresia" && sujeto) {
        await api.crearMembresia(sujeto.id, empresa);
        setMensaje("Empresa vinculada. El vínculo no concede roles ni permisos.");
      }
      setModal(null); setRevision(v => v + 1);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "No pudimos guardar el cambio."); }
    finally { setOcupado(false); }
  }

  return <div className="rel-scope mx-auto max-w-6xl space-y-5 font-rel-body text-rel-dark">
    <header className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-rel-muted">Administración / Identidad y acceso</p><h1 className="mt-2 font-rel-heading text-3xl font-bold">Usuarios</h1><p className="mt-2 text-sm text-rel-muted">Invita personas, vincula empresas y revisa su estado de activación.</p></div><Button variant="rel" onClick={abrirInvitacion}><MailPlus className="mr-2 h-4 w-4" />Invitar usuario</Button></header>
    <div className={`${panel} flex flex-wrap items-center gap-3 text-sm`}><Users className="h-6 w-6 text-rel-primary" /><p className="flex-1">Las empresas y los roles se gestionan por separado. Para conceder capacidades, usa <Link className="font-semibold text-rel-primary underline" to="/superadmin/roles-permisos">Roles y permisos</Link>.</p></div>
    {mensaje && <p role="status" className="rounded-rel-control bg-rel-success-subtle p-4 text-sm text-rel-success">{mensaje}</p>}
    {error && !modal && <p role="alert" className="rounded-rel-control bg-rel-danger-subtle p-4 text-sm text-rel-danger">{error} <button onClick={() => setRevision(v => v + 1)} className="underline">Reintentar</button></p>}
    <form onSubmit={event => { event.preventDefault(); setPagina(1); setConsulta(busqueda); }} className="flex max-w-xl gap-2"><label className="relative flex-1"><span className="sr-only">Buscar usuarios</span><Search className="absolute left-3 top-3 h-4 w-4 text-rel-muted" /><Input value={busqueda} onChange={event => setBusqueda(event.target.value)} placeholder="Nombre o correo" className="bg-rel-surface pl-9" /></label><Button type="submit" variant="outline">Buscar</Button></form>
    <section aria-label="Usuarios registrados" className="overflow-hidden rounded-rel-card border border-rel-border bg-rel-surface">
      {cargando ? <p role="status" className="p-6 text-sm">Cargando usuarios…</p> : personas.length === 0 ? <p className="p-6 text-sm text-rel-muted">No hay usuarios para esta búsqueda.</p> : personas.map(persona => <article key={persona.id} className="flex flex-col items-start gap-3 border-b border-rel-border px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-4"><div className="min-w-0 w-full flex-1 sm:w-auto"><h2 className="font-semibold">{persona.nombre}</h2><p className="break-words text-sm text-rel-muted">{persona.email || `Cuenta #${persona.id}`}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${persona.estado_cuenta === "PENDIENTE" ? "bg-rel-warning-subtle text-rel-warning" : "bg-rel-success-subtle text-rel-success"}`}>{persona.estado_cuenta === "PENDIENTE" ? "Pendiente de activación" : "Activa"}</span>{persona.estado_cuenta === "PENDIENTE" && <Button variant="outline" size="sm" disabled={ocupado || persona.estado_entrega === "PENDIENTE" || persona.estado_entrega === "EN_PROCESO"} onClick={() => reenviar(persona)} className="w-full sm:w-auto">{persona.estado_entrega === "PENDIENTE" || persona.estado_entrega === "EN_PROCESO" ? "Entrega en cola" : persona.estado_entrega === "DESCARTADO" ? "Reintentar entrega" : "Reenviar invitación"}</Button>}<Button variant="outline" size="sm" onClick={() => abrirMembresia(persona)} className="w-full sm:w-auto"><Building2 className="mr-2 h-4 w-4" />Vincular empresa</Button></article>)}
    </section>
    <div className="flex items-center justify-end gap-3 text-sm"><Button variant="outline" size="sm" disabled={pagina === 1} onClick={() => setPagina(v => v - 1)}>Anterior</Button><span>Página {pagina}</span><Button variant="outline" size="sm" disabled={!mas} onClick={() => setPagina(v => v + 1)}>Siguiente</Button></div>
    <Dialog open={!!modal} onOpenChange={open => { if (!open && !ocupado) { setModal(null); setError(""); } }}><DialogContent className="rel-scope max-h-[90vh] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{modal === "invitar" ? "Invitar usuario" : "Vincular empresa"}</DialogTitle><DialogDescription>{modal === "invitar" ? "La persona creará su contraseña desde una invitación personal. No recibe roles al crear su cuenta." : `El vínculo de ${sujeto?.nombre ?? "esta persona"} no concede permisos.`}</DialogDescription></DialogHeader><form id="form-usuario" onSubmit={guardar} className="space-y-4">{modal === "invitar" && <><label className="block text-sm font-semibold">Nombre<Input required minLength={3} maxLength={120} value={nombre} onChange={event => setNombre(event.target.value)} className="mt-2" /></label><label className="block text-sm font-semibold">Correo<Input required type="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-2" /></label></>}<label className="block text-sm font-semibold">Buscar empresa<Input value={empresaBusqueda} onChange={event => { setEmpresaBusqueda(event.target.value); setEmpresa(""); }} placeholder="Escribe el nombre" className="mt-2" /></label><label className="block text-sm font-semibold">Empresa<select required value={empresa} onChange={event => setEmpresa(event.target.value)} className="mt-2 h-10 w-full rounded-rel-control border border-rel-border bg-rel-surface px-3"><option value="">Selecciona una empresa</option>{empresas.map(item => <option key={item.id} value={item.id}>{item.nombre}</option>)}</select></label>{error && <p role="alert" className="text-sm text-rel-danger">{error}</p>}</form><DialogFooter><Button form="form-usuario" type="submit" variant="rel" disabled={ocupado || !empresa}><Plus className="mr-2 h-4 w-4" />{ocupado ? "Guardando…" : modal === "invitar" ? "Crear invitación" : "Vincular empresa"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
