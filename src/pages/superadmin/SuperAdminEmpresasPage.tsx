import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Building2, Loader2, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  superadminService,
  type GuardarEmpresaPayload,
  type SuperEmpresa,
} from "@/features/superadmin/api/superadminService";
import { StandardPagination } from "@/components/common/StandardPagination";
import SuperAdminPageHeader from "./SuperAdminPageHeader";

const VACIA: GuardarEmpresaPayload = {
  nombre: "",
  razon_social: "",
  nit: "",
  correo_contacto: "",
  telefono: "",
  direccion: "",
  ciudad: "",
  pais: "Colombia",
  sitio_web: "",
  actividad_economica: "",
  representante_legal: "",
};

function payloadDe(empresa?: SuperEmpresa): GuardarEmpresaPayload {
  if (!empresa) return { ...VACIA };
  const {
    id: _id,
    empleados: _empleados,
    aplicaciones: _aplicaciones,
    ...datos
  } = empresa;
  return { ...VACIA, ...datos };
}

function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rel-dark">
      {etiqueta}
      {children}
    </label>
  );
}

export default function SuperAdminEmpresasPage() {
  const [items, setItems] = useState<SuperEmpresa[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const solicitudCarga = useRef(0);
  // undefined = panel cerrado; null = creación; objeto = edición.
  const [editando, setEditando] = useState<SuperEmpresa | null | undefined>();
  const [form, setForm] = useState<GuardarEmpresaPayload>(VACIA);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    const solicitudActual = ++solicitudCarga.current;
    setCargando(true);
    setError(null);
    try {
      const respuesta = await superadminService.empresas({
        q,
        page,
        page_size: pageSize,
      });
      if (solicitudActual === solicitudCarga.current) {
        setItems(respuesta.items);
        setTotal(respuesta.total);
      }
    } catch (e) {
      if (solicitudActual === solicitudCarga.current) {
        setError(
          e instanceof Error ? e.message : "No pudimos cargar las empresas.",
        );
      }
    } finally {
      if (solicitudActual === solicitudCarga.current) setCargando(false);
    }
  }, [q, page, pageSize]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function abrir(empresa: SuperEmpresa | null) {
    setEditando(empresa);
    setForm(payloadDe(empresa ?? undefined));
    setError(null);
  }

  async function guardar(evento: FormEvent) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      if (editando) await superadminService.updateEmpresa(editando.id, form);
      else await superadminService.createEmpresa(form);
      setEditando(undefined);
      await cargar();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No pudimos guardar la empresa.",
      );
    } finally {
      setGuardando(false);
    }
  }

  const cambiar = (campo: keyof GuardarEmpresaPayload, valor: string) =>
    setForm((actual) => ({ ...actual, [campo]: valor }));

  return (
    <div className="rel-scope font-rel-body text-rel-dark">
      <SuperAdminPageHeader
        title="Empresas"
        subtitle="Crea y administra los clientes que usarán los módulos de Abril360."
        action={
          <Button variant="rel" onClick={() => abrir(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva empresa
          </Button>
        }
      />

      {error && editando === undefined ? (
        <div
          role="alert"
          className="mb-5 rounded-rel-control border border-rel-danger/30 bg-rel-danger-subtle p-4 text-rel-danger"
        >
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-rel-card border border-rel-border bg-rel-surface shadow-sm">
        <div className="p-5">
          <label className="sr-only" htmlFor="buscar-empresa">
            Buscar empresa
          </label>
          <Input
            id="buscar-empresa"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por nombre o NIT"
          />
        </div>
        {cargando ? (
          <div
            aria-live="polite"
            className="flex items-center justify-center gap-3 border-t border-rel-border px-5 py-14 text-sm text-rel-muted"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando empresas…
          </div>
        ) : items.length === 0 ? (
          <div className="grid place-items-center border-t border-rel-border px-5 py-14 text-center">
            <Building2 className="h-9 w-9 text-rel-muted" />
            <p className="mt-3 font-semibold">
              {q ? "No encontramos coincidencias" : "Todavía no hay empresas"}
            </p>
            <p className="mt-1 text-sm text-rel-muted">
              {q
                ? "Prueba otra búsqueda."
                : "Crea la primera para empezar a asignar usuarios y módulos."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto border-t border-rel-border md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-rel-surface-subtle text-xs uppercase tracking-wide text-rel-muted">
                  <tr>
                    <th className="px-5 py-4">Empresa</th>
                    <th>NIT</th>
                    <th>Ubicación</th>
                    <th>Empleados</th>
                    <th>Aplicaciones</th>
                    <th>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((e) => (
                    <tr key={e.id} className="border-t border-rel-border">
                      <td className="px-5 py-4">
                        <div className="font-bold text-rel-dark">
                          {e.nombre}
                        </div>
                        <div className="text-xs text-rel-muted">
                          {e.razon_social ||
                            e.correo_contacto ||
                            "Sin contacto registrado"}
                        </div>
                      </td>
                      <td>{e.nit || "—"}</td>
                      <td>
                        {[e.ciudad, e.pais].filter(Boolean).join(", ") || "—"}
                      </td>
                      <td>{e.empleados ?? 0}</td>
                      <td>{e.aplicaciones ?? 0}</td>
                      <td className="pr-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => abrir(e)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 border-t border-rel-border p-4 md:hidden">
              {items.map((e) => (
                <article
                  key={e.id}
                  className="rounded-rel-control border border-rel-border p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-rel-dark">{e.nombre}</h2>
                      <p className="mt-1 text-xs text-rel-muted">
                        NIT {e.nit || "sin registrar"}
                      </p>
                    </div>
                    <Button
                      aria-label={`Editar ${e.nombre}`}
                      variant="outline"
                      size="icon"
                      onClick={() => abrir(e)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-rel-muted">
                    {[e.ciudad, e.pais].filter(Boolean).join(", ") ||
                      "Ubicación sin registrar"}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}
        <StandardPagination pageSizeOptions={[10, 20, 50, 100]}
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </section>

      <Sheet
        open={editando !== undefined}
        onOpenChange={(abierto) => !abierto && setEditando(undefined)}
      >
        <SheetContent className="rel-scope w-full max-w-3xl overflow-y-auto bg-rel-surface font-rel-body sm:max-w-3xl">
          <SheetHeader className="pr-8">
            <p className="text-xs font-bold uppercase tracking-wide text-rel-primary">
              SuperAdmin
            </p>
            <SheetTitle className="font-rel-heading text-2xl text-rel-dark">
              {editando ? "Editar empresa" : "Nueva empresa"}
            </SheetTitle>
            <SheetDescription className="text-rel-muted">
              Permisos, contratos y funcionalidades se administran por separado
              para no confundir acceso técnico con lo contratado.
            </SheetDescription>
          </SheetHeader>
          <form className="mt-7 grid gap-5" onSubmit={guardar}>
            {error ? (
              <div
                role="alert"
                className="rounded-rel-control border border-rel-danger/30 bg-rel-danger-subtle p-4 text-rel-danger"
              >
                {error}
              </div>
            ) : null}
            <div className="grid gap-4 md:grid-cols-2">
              <Campo etiqueta="Nombre visible *">
                <Input
                  autoFocus
                  required
                  minLength={3}
                  maxLength={255}
                  value={form.nombre ?? ""}
                  onChange={(e) => cambiar("nombre", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Razón social">
                <Input
                  maxLength={255}
                  value={form.razon_social ?? ""}
                  onChange={(e) => cambiar("razon_social", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="NIT">
                <Input
                  maxLength={64}
                  value={form.nit ?? ""}
                  onChange={(e) => cambiar("nit", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Correo de contacto">
                <Input
                  type="email"
                  value={form.correo_contacto ?? ""}
                  onChange={(e) => cambiar("correo_contacto", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Teléfono">
                <Input
                  maxLength={64}
                  value={form.telefono ?? ""}
                  onChange={(e) => cambiar("telefono", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Representante legal">
                <Input
                  maxLength={255}
                  value={form.representante_legal ?? ""}
                  onChange={(e) =>
                    cambiar("representante_legal", e.target.value)
                  }
                />
              </Campo>
              <Campo etiqueta="Ciudad">
                <Input
                  maxLength={160}
                  value={form.ciudad ?? ""}
                  onChange={(e) => cambiar("ciudad", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="País">
                <Input
                  maxLength={120}
                  value={form.pais ?? ""}
                  onChange={(e) => cambiar("pais", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Dirección">
                <Input
                  maxLength={255}
                  value={form.direccion ?? ""}
                  onChange={(e) => cambiar("direccion", e.target.value)}
                />
              </Campo>
              <Campo etiqueta="Sitio web">
                <Input
                  type="url"
                  maxLength={255}
                  value={form.sitio_web ?? ""}
                  onChange={(e) => cambiar("sitio_web", e.target.value)}
                />
              </Campo>
            </div>
            <Campo etiqueta="Actividad económica">
              <textarea
                className="min-h-24 rounded-rel-control border border-rel-border bg-rel-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rel-primary"
                maxLength={2000}
                value={form.actividad_economica ?? ""}
                onChange={(e) => cambiar("actividad_economica", e.target.value)}
              />
            </Campo>
            <SheetFooter className="gap-3 border-t border-rel-border pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditando(undefined)}
              >
                Cancelar
              </Button>
              <Button variant="rel" disabled={guardando}>
                {guardando ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editando ? "Guardar cambios" : "Crear empresa"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
