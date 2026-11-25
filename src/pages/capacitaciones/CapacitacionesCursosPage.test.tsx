import { beforeEach, describe, expect, it, vi } from "vitest";
// `fireEvent` y no `user-event`: esa libreria no esta en el proyecto y
// agregar una dependencia para escribir una prueba no es una decision que
// corresponda a esta pieza.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CapacitacionesCursosPage from "./CapacitacionesCursosPage";
import { listarCursos } from "@/services/capacitacionesService";
import type { CursoResumen, ErrorApi } from "@/types/capacitaciones";

const useCapacitacionesMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/capacitaciones/ContextoCapacitaciones", () => ({
  useCapacitaciones: useCapacitacionesMock,
}));

vi.mock("@/services/capacitacionesService", () => ({
  listarCursos: vi.fn(),
  crearCurso: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function curso(over: Partial<CursoResumen> = {}): CursoResumen {
  return {
    id: "c1",
    titulo: "Inducción SST",
    categoria: "SST",
    categoria_restringida: false,
    estado: "PUBLICADO",
    version_actual: 2,
    intensidad_horaria_min: 90,
    vigencia_meses: 12,
    lecciones: 3,
    ...over,
  };
}

function montar() {
  return render(
    <MemoryRouter>
      <CapacitacionesCursosPage />
    </MemoryRouter>
  );
}

/**
 * La pantalla pinta DOS presentaciones del mismo listado: una tabla para
 * escritorio y tarjetas para movil, y Tailwind oculta la que no toca.
 *
 * En jsdom no hay hoja de estilos, asi que las dos existen en el arbol y una
 * consulta global encuentra cada titulo dos veces. Las pruebas consultan dentro
 * de la tabla: es una consecuencia de que la version movil sea otra estructura
 * y no la misma comprimida, que es justo lo que §20 pide.
 */
function enLaTabla() {
  return within(screen.getByRole("table"));
}

beforeEach(() => {
  vi.clearAllMocks();
  useCapacitacionesMock.mockReturnValue({
    fase: "listo",
    capacidades: { puede_editar_catalogo: true },
  });
});

it("no consulta ni ofrece crear cursos sin permiso editorial global", async () => {
  useCapacitacionesMock.mockReturnValue({
    fase: "listo",
    capacidades: { puede_editar_catalogo: false, puede_asignar: true },
  });
  montar();

  expect(await screen.findByText(/tu rol gestiona capacitaciones/i)).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /nuevo curso/i })).not.toBeInTheDocument();
  expect(listarCursos).not.toHaveBeenCalled();
});

describe("A-02 · los cuatro estados", () => {
  it("anuncia la carga a un lector de pantalla, no solo visualmente", async () => {
    vi.mocked(listarCursos).mockReturnValue(new Promise(() => {}));
    montar();

    // `role="status"` + `aria-busy` es lo que hace que la espera exista para
    // quien no ve el esqueleto.
    expect(await screen.findByRole("status", { name: /cargando/i })).toBeInTheDocument();
  });

  it("el vacío lleva la acción que lo resuelve", async () => {
    vi.mocked(listarCursos).mockResolvedValue([]);
    montar();

    expect(await screen.findByText(/todavía no hay cursos/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear el primero/i })).toBeInTheDocument();
  });

  it("el error se anuncia y ofrece reintentar sin recargar la página", async () => {
    const err = new Error("La red falló.") as ErrorApi;
    err.status = 500;
    vi.mocked(listarCursos).mockRejectedValueOnce(err);
    montar();

    const alerta = await screen.findByRole("alert");
    expect(alerta).toHaveTextContent("La red falló.");

    vi.mocked(listarCursos).mockResolvedValueOnce([curso()]);
    fireEvent.click(screen.getByRole("button", { name: /reintentar/i }));

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(enLaTabla().getByText("Inducción SST")).toBeInTheDocument();
  });

  it("un 403 manda al estado del módulo en vez de repetir «sin permiso»", async () => {
    // El 403 cubre tres causas distintas —contrato, bandera, permiso— que se
    // arreglan por caminos distintos. La pantalla que las separa es A-08.
    const err = new Error("Operación no habilitada.") as ErrorApi;
    err.status = 403;
    vi.mocked(listarCursos).mockRejectedValue(err);
    montar();

    expect(
      await screen.findByRole("link", { name: /ver estado del módulo/i })
    ).toHaveAttribute("href", "/capacitaciones/estado");
  });
});

describe("A-02 · orden y filtros", () => {
  it("pone los borradores primero: son los únicos con siguiente acción", async () => {
    vi.mocked(listarCursos).mockResolvedValue([
      curso({ id: "a", titulo: "Alturas", estado: "PUBLICADO" }),
      curso({ id: "b", titulo: "Zanjas", estado: "BORRADOR", version_actual: 0 }),
    ]);
    montar();

    await screen.findByRole("table");
    const filas = enLaTabla().getAllByRole("row").slice(1); // sin el encabezado
    expect(filas[0]).toHaveTextContent("Zanjas");
    expect(filas[1]).toHaveTextContent("Alturas");
  });

  it("distingue «no hay cursos» de «el filtro no encontró nada»", async () => {
    // Son dos pantallas distintas: una invita a crear, la otra a limpiar el
    // filtro. Colapsarlas dejaría al usuario creando un curso que ya existe.
    vi.mocked(listarCursos).mockResolvedValue([curso({ titulo: "Alturas" })]);
    montar();

    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText(/buscar por título/i), {
      target: { value: "zzz" },
    });

    expect(await screen.findByText(/ningún curso coincide con el filtro/i)).toBeInTheDocument();
    expect(screen.queryByText(/todavía no hay cursos/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /quitar los filtros/i }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(enLaTabla().getByText("Alturas")).toBeInTheDocument();
  });

  it("resume cuánto falta por publicar en el encabezado", async () => {
    vi.mocked(listarCursos).mockResolvedValue([
      curso({ id: "a", estado: "PUBLICADO" }),
      curso({ id: "b", titulo: "Otro", estado: "BORRADOR", version_actual: 0 }),
    ]);
    montar();

    expect(await screen.findByText(/2 cursos · 1 sin publicar/i)).toBeInTheDocument();
  });
});
