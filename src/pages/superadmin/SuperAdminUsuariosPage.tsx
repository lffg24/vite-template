import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  MailCheck,
  MailPlus,
  Plus,
  Search,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  accesoService as api,
  type Empresa,
  type InvitacionCreada,
  type Persona,
  type Rol,
} from "@/services/accesoService";
import { DialogoCasa } from "@/shared/ui/DialogoCasa";

const panel = "rounded-rel-card border border-rel-border bg-rel-surface p-5";

function SelectorEmpresa({
  empresas,
  seleccion,
  alSeleccionar,
  busqueda,
  alBuscar,
}: {
  empresas: Empresa[];
  seleccion: string;
  alSeleccionar: (id: string) => void;
  busqueda: string;
  alBuscar: (valor: string) => void;
}) {
  const empresaSeleccionada = empresas.find((item) => item.id === seleccion);

  return (
    <fieldset>
      <legend className="text-sm font-semibold">Empresa</legend>
      <label className="relative mt-2 block">
        <span className="sr-only">Buscar dentro del listado de empresas</span>
        <Search className="absolute left-3 top-3 h-4 w-4 text-rel-muted" aria-hidden="true" />
        <Input
          value={busqueda}
          onChange={(event) => alBuscar(event.target.value)}
          placeholder="Busca por nombre"
          className="pl-9"
        />
      </label>
      <div
        role="listbox"
        aria-label="Empresas disponibles"
        className="mt-2 max-h-44 overflow-y-auto rounded-rel-control border border-rel-border bg-rel-surface p-1"
      >
        {empresas.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-rel-muted">No encontramos empresas.</p>
        ) : (
          empresas.map((item) => {
            const activa = item.id === seleccion;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={activa}
                onClick={() => alSeleccionar(item.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-rel-control px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary ${
                  activa ? "bg-rel-canvas font-semibold text-rel-primary" : "hover:bg-rel-surface-subtle"
                }`}
              >
                <span>{item.nombre}</span>
                {activa ? <Check className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })
        )}
      </div>
      {empresaSeleccionada ? (
        <p className="mt-2 text-xs text-rel-muted">Seleccionada: {empresaSeleccionada.nombre}</p>
      ) : null}
    </fieldset>
  );
}

export default function SuperAdminUsuariosPage() {
  const { toast } = useToast();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [consulta, setConsulta] = useState("");
  const [pagina, setPagina] = useState(1);
  const [mas, setMas] = useState(false);
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"invitar" | "membresia" | null>(null);
  const [sujeto, setSujeto] = useState<Persona | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [empresaBusqueda, setEmpresaBusqueda] = useState("");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolesSeleccionados, setRolesSeleccionados] = useState<number[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [resultado, setResultado] = useState<InvitacionCreada | null>(null);
  const [rolesAsignados, setRolesAsignados] = useState(0);

  const rolesConfigurables = useMemo(
    () => roles.filter((rol) => rol.version !== null && rol.permisos.length > 0),
    [roles],
  );

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setError("");
    api
      .usuarios(consulta, pagina)
      .then((data) => {
        if (vigente) {
          setPersonas(data.items);
          setMas(data.hay_mas);
        }
      })
      .catch((caught) => {
        if (vigente) setError(caught instanceof Error ? caught.message : "No pudimos cargar las personas.");
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [consulta, pagina, revision]);

  useEffect(() => {
    if (!modal) return;
    let vigente = true;
    Promise.all([api.todasEmpresas(empresaBusqueda), api.roles()])
      .then(([listaEmpresas, listaRoles]) => {
        if (!vigente) return;
        setEmpresas(listaEmpresas.items);
        setRoles(listaRoles.items);
      })
      .catch((caught) => {
        if (vigente) setError(caught instanceof Error ? caught.message : "No pudimos cargar las opciones.");
      });
    return () => {
      vigente = false;
    };
  }, [modal, empresaBusqueda]);

  function abrirInvitacion() {
    setNombre("");
    setEmail("");
    setEmpresa("");
    setEmpresaBusqueda("");
    setRolesSeleccionados([]);
    setError("");
    setModal("invitar");
  }

  function abrirMembresia(persona: Persona) {
    setSujeto(persona);
    setEmpresa("");
    setEmpresaBusqueda("");
    setError("");
    setModal("membresia");
  }

  async function reenviar(persona: Persona) {
    setOcupado(true);
    setError("");
    try {
      await api.reenviarInvitacion(persona.id);
      toast({
        variant: "success",
        title: "Invitación preparada",
        description: `La entrega para ${persona.nombre} quedó en cola.`,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos reenviar la invitación.");
    } finally {
      setOcupado(false);
    }
  }

  async function asignarRoles(usuarioId: number) {
    let asignados = 0;
    for (const rolId of rolesSeleccionados) {
      const cambio = {
        rol_id: rolId,
        usuario_id: usuarioId,
        empresa_id: empresa,
        activo: true,
        valido_desde: null,
        valido_hasta: null,
      };
      const vista = await api.previewAsignacion(cambio);
      await api.guardarAsignacion({ ...cambio, huella: vista.huella });
      asignados += 1;
    }
    return asignados;
  }

  async function guardar(event: FormEvent) {
    event.preventDefault();
    if (!empresa) {
      setError("Selecciona una empresa.");
      return;
    }
    setOcupado(true);
    setError("");
    try {
      if (modal === "invitar") {
        const invitacion = await api.invitar({
          nombre: nombre.trim(),
          email: email.trim(),
          empresa_id: empresa,
        });
        let asignados = 0;
        try {
          asignados = await asignarRoles(invitacion.id);
        } catch {
          toast({
            variant: "warning",
            title: "La cuenta se creó",
            description: "No pudimos completar todos los roles. Puedes administrarlos desde Roles y permisos.",
          });
        }
        setRolesAsignados(asignados);
        setResultado(invitacion);
      } else if (modal === "membresia" && sujeto) {
        await api.crearMembresia(sujeto.id, empresa);
        toast({
          variant: "success",
          title: "Empresa vinculada",
          description: `${sujeto.nombre} ya pertenece a la empresa seleccionada.`,
        });
      }
      setModal(null);
      setRevision((valor) => valor + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No pudimos guardar el cambio.");
    } finally {
      setOcupado(false);
    }
  }

  async function copiarEnlace() {
    if (!resultado?.enlace_activacion_local) return;
    await navigator.clipboard.writeText(resultado.enlace_activacion_local);
    toast({ variant: "success", title: "Enlace copiado", description: "Ya puedes abrirlo en una ventana privada para activar la cuenta." });
  }

  return (
    <div className="rel-scope mx-auto max-w-6xl space-y-5 font-rel-body text-rel-dark">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-rel-muted">Administración / Identidad y acceso</p>
          <h1 className="mt-2 font-rel-heading text-3xl font-bold">Usuarios</h1>
          <p className="mt-2 text-sm text-rel-muted">Invita personas, vincula empresas y revisa su estado de activación.</p>
        </div>
        <Button variant="rel" onClick={abrirInvitacion}>
          <MailPlus className="mr-2 h-4 w-4" />
          Invitar usuario
        </Button>
      </header>

      <div className={`${panel} flex flex-wrap items-center gap-3 text-sm`}>
        <Users className="h-6 w-6 text-rel-primary" />
        <p className="flex-1">En una sola invitación puedes elegir la empresa y los roles delegables de esa persona.</p>
      </div>

      {error && !modal ? (
        <p role="alert" className="rounded-rel-control bg-rel-danger-subtle p-4 text-sm text-rel-danger">
          {error}{" "}
          <button onClick={() => setRevision((valor) => valor + 1)} className="underline">
            Reintentar
          </button>
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setPagina(1);
          setConsulta(busqueda);
        }}
        className="flex max-w-xl gap-2"
      >
        <label className="relative flex-1">
          <span className="sr-only">Buscar usuarios</span>
          <Search className="absolute left-3 top-3 h-4 w-4 text-rel-muted" />
          <Input value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Nombre o correo" className="bg-rel-surface pl-9" />
        </label>
        <Button type="submit" variant="outline">Buscar</Button>
      </form>

      <section aria-label="Usuarios registrados" className="overflow-hidden rounded-rel-card border border-rel-border bg-rel-surface">
        {cargando ? (
          <p role="status" className="p-6 text-sm">Cargando usuarios…</p>
        ) : personas.length === 0 ? (
          <p className="p-6 text-sm text-rel-muted">No hay usuarios para esta búsqueda.</p>
        ) : (
          personas.map((persona) => (
            <article key={persona.id} className="flex flex-col items-start gap-3 border-b border-rel-border px-5 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-4">
              <div className="w-full min-w-0 flex-1 sm:w-auto">
                <h2 className="font-semibold">{persona.nombre}</h2>
                <p className="break-words text-sm text-rel-muted">{persona.email || `Cuenta #${persona.id}`}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${persona.estado_cuenta === "PENDIENTE" ? "bg-rel-warning-subtle text-rel-warning" : "bg-rel-success-subtle text-rel-success"}`}>
                {persona.estado_cuenta === "PENDIENTE" ? "Pendiente de activación" : "Activa"}
              </span>
              {persona.estado_cuenta === "PENDIENTE" ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={ocupado || persona.estado_entrega === "PENDIENTE" || persona.estado_entrega === "EN_PROCESO"}
                  onClick={() => reenviar(persona)}
                  className="w-full sm:w-auto"
                >
                  {persona.estado_entrega === "PENDIENTE" || persona.estado_entrega === "EN_PROCESO"
                    ? "Entrega en cola"
                    : persona.estado_entrega === "DESCARTADO"
                      ? "Reintentar entrega"
                      : "Reenviar invitación"}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => abrirMembresia(persona)} className="w-full sm:w-auto">
                <Building2 className="mr-2 h-4 w-4" />
                Vincular empresa
              </Button>
            </article>
          ))
        )}
      </section>

      <div className="flex items-center justify-end gap-3 text-sm">
        <Button variant="outline" size="sm" disabled={pagina === 1} onClick={() => setPagina((valor) => valor - 1)}>Anterior</Button>
        <span>Página {pagina}</span>
        <Button variant="outline" size="sm" disabled={!mas} onClick={() => setPagina((valor) => valor + 1)}>Siguiente</Button>
      </div>

      <Dialog open={Boolean(modal)} onOpenChange={(open) => {
        if (!open && !ocupado) {
          setModal(null);
          setError("");
        }
      }}>
        <DialogContent className="rel-scope max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{modal === "invitar" ? "Invitar usuario" : "Vincular empresa"}</DialogTitle>
            <DialogDescription>
              {modal === "invitar"
                ? "La persona recibirá un enlace personal y allí creará su contraseña."
                : `Elige la nueva empresa de ${sujeto?.nombre ?? "esta persona"}.`}
            </DialogDescription>
          </DialogHeader>
          <form id="form-usuario" onSubmit={guardar} className="space-y-5">
            {modal === "invitar" ? (
              <>
                <label className="block text-sm font-semibold">
                  Nombre
                  <Input required minLength={3} maxLength={120} value={nombre} onChange={(event) => setNombre(event.target.value)} className="mt-2" />
                </label>
                <label className="block text-sm font-semibold">
                  Correo
                  <Input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2" />
                </label>
              </>
            ) : null}

            <SelectorEmpresa
              empresas={empresas}
              seleccion={empresa}
              alSeleccionar={setEmpresa}
              busqueda={empresaBusqueda}
              alBuscar={(valor) => {
                setEmpresaBusqueda(valor);
                setEmpresa("");
              }}
            />

            {modal === "invitar" ? (
              <fieldset className="space-y-2">
                <legend className="flex items-center gap-2 text-sm font-semibold">
                  <KeyRound className="h-4 w-4 text-rel-primary" aria-hidden="true" />
                  Roles en esta empresa
                  <span className="font-normal text-rel-muted">(opcional)</span>
                </legend>
                {rolesConfigurables.length === 0 ? (
                  <p className="rounded-rel-control bg-rel-canvas p-3 text-sm text-rel-muted">
                    Aún no hay roles delegables. Puedes crear uno en Roles y permisos.
                  </p>
                ) : (
                  rolesConfigurables.map((rol) => (
                    <label key={rol.id} className="flex cursor-pointer gap-3 rounded-rel-control border border-rel-border p-3">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4"
                        checked={rolesSeleccionados.includes(rol.id)}
                        onChange={(event) =>
                          setRolesSeleccionados((actuales) =>
                            event.target.checked
                              ? [...actuales, rol.id]
                              : actuales.filter((id) => id !== rol.id),
                          )
                        }
                      />
                      <span>
                        <span className="block text-sm font-semibold">{rol.nombre}</span>
                        <span className="mt-1 block text-xs text-rel-muted">
                          {rol.permisos.length} {rol.permisos.length === 1 ? "permiso delegable" : "permisos delegables"}
                        </span>
                      </span>
                    </label>
                  ))
                )}
              </fieldset>
            ) : null}
            {error ? <p role="alert" className="text-sm text-rel-danger">{error}</p> : null}
          </form>
          <DialogFooter>
            <Button form="form-usuario" type="submit" variant="rel" disabled={ocupado || !empresa}>
              <Plus className="mr-2 h-4 w-4" />
              {ocupado ? "Guardando…" : modal === "invitar" ? "Crear invitación" : "Vincular empresa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DialogoCasa
        abierto={Boolean(resultado)}
        alCerrar={() => setResultado(null)}
        antetitulo="Invitación creada"
        titulo="La cuenta está lista para activarse"
        descripcion={
          resultado?.enlace_activacion_local
            ? "Estás en el entorno local. Usa este enlace de prueba para crear la contraseña; no se enviará correo."
            : "En un entorno con correo configurado, la persona recibirá un enlace personal válido por 48 horas para crear su contraseña."
        }
        escena="cambio-password"
        tono="exito"
        acciones={
          resultado?.enlace_activacion_local ? (
            <>
              <Button type="button" variant="outline" onClick={() => setResultado(null)}>Cerrar</Button>
              <Button type="button" variant="rel" onClick={copiarEnlace}><Copy className="mr-2 h-4 w-4" />Copiar enlace</Button>
              <Button type="button" variant="rel" asChild>
                <a href={resultado.enlace_activacion_local} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" />Abrir activación</a>
              </Button>
            </>
          ) : (
            <Button type="button" variant="rel" onClick={() => setResultado(null)}>Entendido</Button>
          )
        }
      >
        <div className="rounded-rel-control bg-rel-canvas p-4 text-sm">
          <div className="flex gap-3">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-rel-success" aria-hidden="true" />
            <div>
              <p className="font-semibold">{resultado?.enlace_activacion_local ? "Prueba local habilitada" : "Correo en preparación"}</p>
              <p className="mt-1 text-rel-muted">
                {rolesAsignados > 0
                  ? `También asignamos ${rolesAsignados} ${rolesAsignados === 1 ? "rol" : "roles"} en la empresa elegida.`
                  : "La cuenta se creó sin roles adicionales."}
              </p>
            </div>
          </div>
        </div>
      </DialogoCasa>
    </div>
  );
}
