import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import CapacitacionesConstanciasPage from "./CapacitacionesConstanciasPage";
import { anularConstancia, listarConstancias } from "@/services/capacitacionesService";
import type { ConstanciaResumen } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({
  listarConstancias: vi.fn(),
  anularConstancia: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function constancia(over: Partial<ConstanciaResumen> = {}): ConstanciaResumen {
  return {
    id: "k1",
    folio: 12,
    codigo_verificacion: "ABCD-2345",
    estado: "VIGENTE",
    nombres: "Maria Fernanda",
    apellidos: "Ospina Ruiz",
    curso: "Trabajo en alturas",
    emitida_en: "2026-05-10T15:30:00Z",
    vence_el: "2027-05-10",
    anulada_en: null,
    anulacion_motivo: null,
    ...over,
  };
}

function montar() {
  return render(
    <MemoryRouter>
      <CapacitacionesConstanciasPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("el listado administrativo", () => {
  it("muestra el nombre COMPLETO, al revés que el verificador público", async () => {
    // No es una inconsistencia: son dos audiencias. Quien administra su empresa
    // ya tiene esos datos y abre esta pantalla justamente para cotejarlos con su
    // nómina; enmascararlos le impediría hacer su trabajo.
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();

    expect(await screen.findByText("Maria Fernanda Ospina Ruiz")).toBeInTheDocument();
  });

  it("deja el folio y el código a la vista", async () => {
    // Son los dos datos con los que se responde a «demuéstrame que esta persona
    // hizo esta capacitación».
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("ABCD-2345")).toBeInTheDocument();
  });

  it("una constancia anulada SIGUE en la lista", async () => {
    // Anular no borra. Un expediente del que desaparecen renglones es peor que
    // uno que registra sus propias correcciones.
    vi.mocked(listarConstancias).mockResolvedValue([
      constancia({
        estado: "ANULADA",
        anulada_en: "2026-06-01T10:00:00Z",
        anulacion_motivo: "Se emitió con el curso equivocado",
      }),
    ]);

    montar();

    expect(await screen.findByText("Anulada")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });

  it("no ofrece anular lo que ya está anulado", async () => {
    vi.mocked(listarConstancias).mockResolvedValue([
      constancia({ estado: "ANULADA", anulada_en: "2026-06-01T10:00:00Z" }),
    ]);

    montar();
    await screen.findByText("Anulada");

    expect(screen.queryByRole("button", { name: /anular/i })).not.toBeInTheDocument();
  });

  it("no promete un PDF que todavía no existe", async () => {
    // Falta aprobar la librería. Un botón que no hiciera nada, o que bajara un
    // documento a medias, sería peor que decir dónde está el límite.
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();
    await screen.findByText("ABCD-2345");

    expect(screen.queryByRole("button", { name: /descargar|pdf/i })).not.toBeInTheDocument();
  });

  it("dice de dónde salen las constancias cuando no hay ninguna", async () => {
    // «No hay datos» a secas dejaría a alguien buscando un botón de crear que no
    // existe: se emiten solas al terminar el curso.
    vi.mocked(listarConstancias).mockResolvedValue([]);

    montar();

    expect(await screen.findByText(/todavía no hay constancias/i)).toBeInTheDocument();
    expect(screen.getByText(/se emiten solas/i)).toBeInTheDocument();
  });
});

describe("el filtro", () => {
  it("busca también por código, no solo por nombre", async () => {
    // Quien llega con una constancia en la mano tiene el código, no siempre el
    // nombre exacto tal como está escrito en el sistema.
    vi.mocked(listarConstancias).mockResolvedValue([
      constancia(),
      constancia({ id: "k2", folio: 13, codigo_verificacion: "WXYZ-9876", nombres: "Juan" }),
    ]);

    montar();
    await screen.findByText("ABCD-2345");

    fireEvent.change(screen.getByLabelText(/buscar por persona/i), {
      target: { value: "wxyz" },
    });

    expect(screen.getByText("WXYZ-9876")).toBeInTheDocument();
    expect(screen.queryByText("ABCD-2345")).not.toBeInTheDocument();
  });
});

describe("la anulación", () => {
  it("exige un motivo antes de dejar confirmar", async () => {
    // El servidor lo exige, pero el botón deshabilitado lo dice antes de gastar
    // una petición y un error.
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();
    fireEvent.click(await screen.findByRole("button", { name: /anular/i }));

    const dialogo = screen.getByRole("alertdialog");
    const confirmar = within(dialogo).getByRole("button", {
      name: /anular la constancia/i,
    });
    expect(confirmar).toBeDisabled();

    fireEvent.change(within(dialogo).getByLabelText(/motivo/i), {
      target: { value: "Se emitió con el curso equivocado" },
    });
    expect(confirmar).toBeEnabled();
  });

  it("advierte de que no se borra y de que el folio no se reutiliza", async () => {
    // Es lo que separa esta acción de un borrado, y quien la pulsa tiene que
    // saberlo antes: no hay operación de reactivar.
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();
    fireEvent.click(await screen.findByRole("button", { name: /anular/i }));

    const texto = screen.getByRole("alertdialog").textContent ?? "";
    expect(texto).toMatch(/no se borra/i);
    expect(texto).toMatch(/seguirá verificándose/i);
    expect(texto).toMatch(/folio no se reutiliza/i);
  });

  it("manda el motivo recortado al servidor", async () => {
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);
    vi.mocked(anularConstancia).mockResolvedValue(
      constancia({ estado: "ANULADA", anulada_en: "2026-06-01T10:00:00Z" })
    );

    montar();
    fireEvent.click(await screen.findByRole("button", { name: /anular/i }));

    const dialogo = screen.getByRole("alertdialog");
    fireEvent.change(within(dialogo).getByLabelText(/motivo/i), {
      target: { value: "  curso equivocado  " },
    });
    fireEvent.click(within(dialogo).getByRole("button", { name: /anular la constancia/i }));

    await vi.waitFor(() =>
      expect(anularConstancia).toHaveBeenCalledWith("k1", "curso equivocado")
    );
  });
});
