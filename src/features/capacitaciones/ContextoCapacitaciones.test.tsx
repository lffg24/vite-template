import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import {
  IndiceCapacitaciones,
  ProveedorCapacitaciones,
  rutaInicial,
  useCapacitaciones,
} from "./ContextoCapacitaciones";
import { obtenerContexto } from "@/services/capacitacionesService";
import type { ContextoCapacidades } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({
  obtenerContexto: vi.fn(),
}));

function contexto(over: Partial<ContextoCapacidades> = {}): ContextoCapacidades {
  return {
    empresa_id: "e1",
    roles_plataforma: [],
    puede_editar_catalogo: false,
    puede_publicar: false,
    puede_asignar: false,
    tiene_acceso: false,
    permisos_plataforma: [],
    permisos_empresa: [],
    contratado: null,
    vigencia_hasta: null,
    bandera_catalogo: null,
    bandera_catalogo_empresa: null,
    bandera_asignacion: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("rutaInicial", () => {
  it("manda a asignaciones a quien solo puede asignar", () => {
    // El defecto que arregla: aterrizar siempre en el catálogo llevaba a un 403
    // a quien no lo puede editar, y un 403 en la primera pantalla parece una
    // avería del sistema, no un límite de permisos.
    expect(rutaInicial(contexto({ puede_asignar: true, tiene_acceso: true }))).toBe(
      "/capacitaciones/asignaciones"
    );
  });

  it("manda al catálogo a quien lo puede editar o publicar", () => {
    expect(
      rutaInicial(contexto({ puede_editar_catalogo: true, tiene_acceso: true }))
    ).toBe("/capacitaciones/cursos");
    expect(rutaInicial(contexto({ puede_publicar: true, tiene_acceso: true }))).toBe(
      "/capacitaciones/cursos"
    );
  });

  it("manda al estado del módulo a quien no puede nada", () => {
    // Es la única pantalla que puede explicar por qué. Mandarlo al catálogo
    // sería mandarlo a un 403 sin salida.
    expect(rutaInicial(contexto())).toBe("/capacitaciones/estado");
    expect(rutaInicial(null)).toBe("/capacitaciones/estado");
  });
});

function Sonda() {
  const { capacidades, fase } = useCapacitaciones();
  return (
    <div>
      <span>fase:{fase}</span>
      <span>asignar:{String(capacidades?.puede_asignar)}</span>
    </div>
  );
}

describe("ProveedorCapacitaciones", () => {
  it("expone las capacidades efectivas que devuelve el servidor", async () => {
    vi.mocked(obtenerContexto).mockResolvedValue(
      contexto({ puede_asignar: true, tiene_acceso: true })
    );
    render(
      <MemoryRouter>
        <ProveedorCapacitaciones>
          <Sonda />
        </ProveedorCapacitaciones>
      </MemoryRouter>
    );

    expect(await screen.findByText("asignar:true")).toBeInTheDocument();
    expect(obtenerContexto).toHaveBeenCalledTimes(1);
  });

  it("usarlo fuera del proveedor falla ruidosamente", () => {
    // Un `null` silencioso haría que las capacidades se leyeran como `false` y
    // las pantallas ocultaran acciones legítimas sin que nada lo delatara.
    const silenciar = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Sonda />)).toThrow(/fuera de ProveedorCapacitaciones/);
    silenciar.mockRestore();
  });
});

describe("IndiceCapacitaciones", () => {
  it("no redirige mientras no sabe las capacidades", async () => {
    // Redirigir antes de saberlas mandaría a todo el mundo al catálogo, que es
    // exactamente el aterrizaje en 403 que esto evita.
    vi.mocked(obtenerContexto).mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter initialEntries={["/capacitaciones"]}>
        <ProveedorCapacitaciones>
          <Routes>
            <Route path="/capacitaciones" element={<IndiceCapacitaciones />} />
            <Route path="/capacitaciones/cursos" element={<p>catálogo</p>} />
          </Routes>
        </ProveedorCapacitaciones>
      </MemoryRouter>
    );

    expect(await screen.findByRole("status")).toHaveTextContent(/comprobando/i);
    expect(screen.queryByText("catálogo")).not.toBeInTheDocument();
  });

  it("redirige a lo primero que el usuario puede abrir", async () => {
    vi.mocked(obtenerContexto).mockResolvedValue(
      contexto({ puede_asignar: true, tiene_acceso: true })
    );
    render(
      <MemoryRouter initialEntries={["/capacitaciones"]}>
        <ProveedorCapacitaciones>
          <Routes>
            <Route path="/capacitaciones" element={<IndiceCapacitaciones />} />
            <Route path="/capacitaciones/cursos" element={<p>catálogo</p>} />
            <Route path="/capacitaciones/asignaciones" element={<p>asignaciones</p>} />
          </Routes>
        </ProveedorCapacitaciones>
      </MemoryRouter>
    );

    expect(await screen.findByText("asignaciones")).toBeInTheDocument();
    expect(screen.queryByText("catálogo")).not.toBeInTheDocument();
  });
});
