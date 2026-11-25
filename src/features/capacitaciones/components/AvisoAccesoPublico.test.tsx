import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { AvisoAccesoPublico } from "./AvisoAccesoPublico";
import { useCapacitaciones } from "@/features/capacitaciones/ContextoCapacitaciones";
import type { ContextoCapacidades } from "@/types/capacitaciones";

vi.mock("@/features/capacitaciones/ContextoCapacitaciones", () => ({
  useCapacitaciones: vi.fn(),
}));

function capacidades(bandera: boolean | null): ContextoCapacidades {
  return {
    empresa_id: "e1",
    roles_plataforma: [],
    puede_editar_catalogo: false,
    puede_publicar: false,
    puede_asignar: true,
    puede_gestionar_participantes: false,
    tiene_acceso: true,
    permisos_plataforma: [],
    permisos_empresa: [],
    contratado: true,
    vigencia_hasta: null,
    bandera_catalogo: true,
    bandera_catalogo_empresa: true,
    bandera_asignacion: true,
    bandera_participacion: bandera,
  };
}

function conBandera(bandera: boolean | null) {
  vi.mocked(useCapacitaciones).mockReturnValue({
    capacidades: capacidades(bandera),
    fase: "listo",
    error: null,
    refrescar: vi.fn(),
  } as never);
}

/**
 * El orden en que ocurría el problema es lo que lo hacía caro: se creaba el
 * curso, se asignaba, se generaba el enlace, se imprimía la hoja, se repartía… y
 * el rechazo aparecía delante de la persona a la que se le acababa de dar.
 */
describe("AvisoAccesoPublico", () => {
  it("avisa cuando el recorrido público está cerrado", () => {
    conBandera(false);
    render(<AvisoAccesoPublico que="enlaces" />);

    expect(
      screen.getByText(/el acceso público está cerrado para esta empresa/i)
    ).toBeInTheDocument();
    // Dice dónde se arregla sin prometer un botón que esta persona no tiene:
    // habilitar una empresa es superficie de plataforma.
    expect(screen.getByText(/Habilitar módulos/)).toBeInTheDocument();
  });

  it("una bandera SIN DECLARAR cierra igual que apagada", () => {
    // `null` es «nadie la declaró». El `COALESCE` de la guarda devuelve NULL y
    // el acceso se cierra, así que tratarlo como «quizá sí» haría que la
    // pantalla prometiera lo contrario de lo que va a pasar.
    conBandera(null);
    render(<AvisoAccesoPublico que="invitaciones" />);

    expect(
      screen.getByText(/el acceso público está cerrado para esta empresa/i)
    ).toBeInTheDocument();
  });

  it("con el acceso abierto NO estorba", () => {
    // Contraprueba: un aviso que sale siempre deja de avisar.
    conBandera(true);
    const { container } = render(<AvisoAccesoPublico que="enlaces" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("nombra lo que se iba a repartir", () => {
    // «Las invitaciones se generarían» y «los enlaces se generarían» llevan a
    // acciones distintas, y quien lee está en una de las dos pantallas.
    conBandera(false);
    render(<AvisoAccesoPublico que="invitaciones" />);

    expect(screen.getByText(/^Las invitaciones se generarían/)).toBeInTheDocument();
  });
});
