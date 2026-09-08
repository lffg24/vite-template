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

/**
 * La pantalla pinta DOS presentaciones del mismo listado: una tabla para
 * escritorio y tarjetas para el móvil. En jsdom no se aplican las clases
 * `md:hidden`, así que las dos están en el DOM y toda búsqueda global encuentra
 * cada dato dos veces. Se acota por presentación, que además es lo que permite
 * comprobar que las dos traen la misma información.
 */
function enTabla() {
  return within(screen.getByRole("table"));
}

function enTarjetas() {
  // El listado móvil es la única `<ul>` de la pantalla.
  return within(screen.getByRole("list"));
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

    await screen.findByRole("table");
    expect(enTabla().getByText("Maria Fernanda Ospina Ruiz")).toBeInTheDocument();
    // Y la tarjeta móvil trae lo mismo: no es una versión recortada.
    expect(enTarjetas().getByText("Maria Fernanda Ospina Ruiz")).toBeInTheDocument();
  });

  it("deja el folio y el código a la vista", async () => {
    // Son los dos datos con los que se responde a «demuéstrame que esta persona
    // hizo esta capacitación».
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();

    await screen.findByRole("table");
    expect(enTabla().getByText("12")).toBeInTheDocument();
    expect(enTabla().getByText("ABCD-2345")).toBeInTheDocument();
    expect(enTarjetas().getByText(/N.º 12/)).toBeInTheDocument();
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

    await screen.findByRole("table");
    expect(enTabla().getByText("Anulada")).toBeInTheDocument();
    expect(enTabla().getByText("12")).toBeInTheDocument();
  });

  it("no ofrece anular lo que ya está anulado", async () => {
    vi.mocked(listarConstancias).mockResolvedValue([
      constancia({ estado: "ANULADA", anulada_en: "2026-06-01T10:00:00Z" }),
    ]);

    montar();
    await screen.findByRole("table");

    expect(enTabla().queryByRole("button", { name: /anular/i })).not.toBeInTheDocument();
    expect(enTarjetas().queryByRole("button", { name: /anular/i })).not.toBeInTheDocument();
  });

  it("no promete un PDF que todavía no existe", async () => {
    // Falta aprobar la librería. Un botón que no hiciera nada, o que bajara un
    // documento a medias, sería peor que decir dónde está el límite.
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();
    await screen.findByRole("table");

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
    await screen.findByRole("table");

    fireEvent.change(screen.getByLabelText(/buscar por persona/i), {
      target: { value: "wxyz" },
    });

    expect(enTabla().getByText("WXYZ-9876")).toBeInTheDocument();
    expect(enTabla().queryByText("ABCD-2345")).not.toBeInTheDocument();
  });
});

describe("la anulación", () => {
  it("exige un motivo antes de dejar confirmar", async () => {
    // El servidor lo exige, pero el botón deshabilitado lo dice antes de gastar
    // una petición y un error.
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();
    await screen.findByRole("table");
    fireEvent.click(enTabla().getByRole("button", { name: /anular/i }));

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
    await screen.findByRole("table");
    fireEvent.click(enTabla().getByRole("button", { name: /anular/i }));

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
    await screen.findByRole("table");
    fireEvent.click(enTabla().getByRole("button", { name: /anular/i }));

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

describe("sin resultados NO es sin datos", () => {
  it("cuando el filtro no encuentra nada, dice que sí hay constancias", async () => {
    // Confundir los dos estados es lo que hace que alguien crea que perdió su
    // información. Aquí las constancias están: lo que no encaja es la búsqueda.
    vi.mocked(listarConstancias).mockResolvedValue([constancia(), constancia({ id: "k2" })]);

    montar();
    await screen.findByRole("table");

    fireEvent.change(screen.getByLabelText(/buscar por persona/i), {
      target: { value: "nada-que-coincida" },
    });

    const aviso = screen.getByRole("status");
    expect(aviso).toHaveTextContent(/ninguna constancia coincide/i);
    expect(aviso).toHaveTextContent(/hay 2 en total/i);
    // Y no se muestra el vacío de «todavía no hay constancias», que mandaría a
    // buscar un botón de crear que no existe.
    expect(screen.queryByText(/todavía no hay constancias/i)).not.toBeInTheDocument();
  });

  it("ofrece la salida: quitar el filtro", async () => {
    vi.mocked(listarConstancias).mockResolvedValue([constancia()]);

    montar();
    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText(/buscar por persona/i), {
      target: { value: "zzz" },
    });

    fireEvent.click(screen.getByRole("button", { name: /quitar el filtro/i }));

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(enTabla().getByText("ABCD-2345")).toBeInTheDocument();
  });
});

describe("el motivo de la anulación es accesible", () => {
  it("no vive solo en un `title`", async () => {
    // «¿Por qué?» es la única pregunta que se hace ante una fila anulada, y un
    // `title` no llega a quien navega con teclado ni se anuncia de forma fiable
    // con lector de pantalla.
    vi.mocked(listarConstancias).mockResolvedValue([
      constancia({
        estado: "ANULADA",
        anulada_en: "2026-06-01T10:00:00Z",
        anulacion_motivo: "Se emitió con el curso equivocado",
      }),
    ]);

    montar();
    await screen.findByRole("table");

    // Visible como texto, en las dos presentaciones.
    expect(enTabla().getByText(/se emitió con el curso equivocado/i)).toBeInTheDocument();
    expect(enTarjetas().getByText(/se emitió con el curso equivocado/i)).toBeInTheDocument();
  });

  it("está asociado a la insignia por `aria-describedby`", async () => {
    vi.mocked(listarConstancias).mockResolvedValue([
      constancia({
        estado: "ANULADA",
        anulada_en: "2026-06-01T10:00:00Z",
        anulacion_motivo: "Se emitió con el curso equivocado",
      }),
    ]);

    montar();
    await screen.findByRole("table");

    const insignia = enTabla().getByText("Anulada");
    const id = insignia.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)).toHaveTextContent(/curso equivocado/i);
  });
});
