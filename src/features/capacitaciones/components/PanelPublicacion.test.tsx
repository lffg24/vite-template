import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { PanelPublicacion } from "./PanelPublicacion";
import { publicarCurso } from "@/services/capacitacionesService";
import type { CursoCabecera, ErrorApi } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({
  publicarCurso: vi.fn(),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

function curso(over: Partial<CursoCabecera> = {}): CursoCabecera {
  return {
    id: "c1",
    titulo: "Inducción SST",
    categoria: "SST",
    categoria_restringida: false,
    estado: "BORRADOR",
    version_actual: 0,
    descripcion: null,
    objetivos: null,
    temario: null,
    intensidad_horaria_min: null,
    responsable_contenido: null,
    vigencia_meses: null,
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("A-05 · el checklist se pinta sin intentar publicar", () => {
  it("muestra lo que falta y deja el botón inhabilitado", () => {
    // La lista viene calculada en el detalle. Si hubiera que pulsar «Publicar»
    // para saber qué falta, cada dato ausente costaría una petición y un error.
    render(
      <PanelPublicacion
        curso={curso()}
        faltantes={["el temario", "la intensidad horaria en minutos"]}
        puedePublicar
        alPublicar={vi.fn()}
      />
    );

    expect(screen.getByText("el temario")).toBeInTheDocument();
    expect(screen.getByText("la intensidad horaria en minutos")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publicar versión 1/i })).toBeDisabled();
  });

  it("habilita el botón solo cuando no falta nada", () => {
    render(
      <PanelPublicacion curso={curso()} faltantes={[]} puedePublicar alPublicar={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: /publicar versión 1/i })).toBeEnabled();
  });

  it("separa «el curso está incompleto» de «tú no puedes publicar»", () => {
    // Son dos bloqueos distintos y se arreglan distinto: uno redactando, el
    // otro pidiendo un permiso. Un botón gris sin motivo los confundiría.
    render(
      <PanelPublicacion
        curso={curso()}
        faltantes={[]}
        puedePublicar={false}
        alPublicar={vi.fn()}
      />
    );

    expect(screen.getByText(/no publicar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publicar versión 1/i })).toBeDisabled();
  });
});

describe("A-05 · publicación", () => {
  it("avisa de que la versión queda inmutable ANTES de congelarla", async () => {
    const alPublicar = vi.fn();
    vi.mocked(publicarCurso).mockResolvedValue({ version_id: "v1", numero: 1 });

    render(
      <PanelPublicacion curso={curso()} faltantes={[]} puedePublicar alPublicar={alPublicar} />
    );

    fireEvent.click(screen.getByRole("button", { name: /publicar versión 1/i }));

    expect(await screen.findByText(/queda congelada e inmutable/i)).toBeInTheDocument();
    expect(publicarCurso).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^publicar$/i }));

    await vi.waitFor(() => expect(publicarCurso).toHaveBeenCalledWith("c1"));
    await vi.waitFor(() => expect(alPublicar).toHaveBeenCalled());
  });

  it("si el estado cambió bajo los pies, manda la lista del servidor", async () => {
    // Entre que la pantalla se cargó y alguien pulsó, otra pestaña pudo borrar
    // la última lección. La lista de la pantalla ya no vale; la del 422 sí.
    const err = new Error("No se puede publicar.") as ErrorApi;
    err.status = 422;
    err.faltantes = ["al menos una lección"];
    vi.mocked(publicarCurso).mockRejectedValue(err);

    render(
      <PanelPublicacion curso={curso()} faltantes={[]} puedePublicar alPublicar={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: /publicar versión 1/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^publicar$/i }));

    expect(await screen.findByText("al menos una lección")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /publicar versión 1/i })).toBeDisabled();
  });

  it("un curso publicado propone la versión SIGUIENTE, no la actual", () => {
    render(
      <PanelPublicacion
        curso={curso({ estado: "PUBLICADO", version_actual: 3 })}
        faltantes={[]}
        puedePublicar
        alPublicar={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /publicar versión 4/i })).toBeInTheDocument();
  });
});
