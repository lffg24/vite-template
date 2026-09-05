import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { EnlaceGeneradoDialog, urlParticipante } from "./EnlaceGeneradoDialog";
import type { EnlaceCreado } from "@/types/capacitaciones";

const ENLACE: EnlaceCreado = {
  enlace_id: "e1",
  token: "tok3n-de-prueba",
  expira_en: "2026-10-05T12:00:00Z",
  cupo_max: 25,
  curso: "Inducción SST",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("la ventana que muestra el token una sola vez", () => {
  it("dice explícitamente que no se puede volver a ver", () => {
    // No es un detalle de redacción: el servidor guarda solo el SHA-256, así
    // que quien cierre sin copiar pierde el enlace de verdad. Callarlo
    // convertiría una decisión de diseño en una trampa.
    render(<EnlaceGeneradoDialog enlace={ENLACE} alCerrar={vi.fn()} />);

    const avisos = screen.getAllByRole("alert");
    const textos = avisos.map((a) => a.textContent ?? "").join(" ");
    expect(textos).toMatch(/no se puede volver a ver/i);
    expect(textos).toMatch(/se genera uno nuevo/i);
  });

  it("advierte de que la pantalla del participante todavía no existe", () => {
    // `/c/:token` llega con la vertical B. Callarlo dejaría que alguien lo
    // repartiera por WhatsApp y que el hueco lo descubriera un trabajador en
    // turno, viendo un inicio de sesión que no puede usar.
    render(<EnlaceGeneradoDialog enlace={ENLACE} alCerrar={vi.fn()} />);

    const textos = screen
      .getAllByRole("alert")
      .map((a) => a.textContent ?? "")
      .join(" ");
    expect(textos).toMatch(/todavía no lo repartas/i);
  });

  it("el botón de cerrar obliga a afirmar que se copió", () => {
    // «Cerrar» se pulsa sin leer. «Ya lo copié» no.
    render(<EnlaceGeneradoDialog enlace={ENLACE} alCerrar={vi.fn()} />);

    expect(screen.getByRole("button", { name: /ya lo copié/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^cerrar$/i })).not.toBeInTheDocument();
  });

  it("copia la URL completa, no el token suelto", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(<EnlaceGeneradoDialog enlace={ENLACE} alCerrar={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /copiar/i }));

    await vi.waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(urlParticipante("tok3n-de-prueba"))
    );
    expect(await screen.findByText(/enlace copiado al portapapeles/i)).toBeInTheDocument();
  });

  it("sigue sirviendo cuando el portapapeles no está disponible", async () => {
    // `navigator.clipboard` no existe fuera de contextos seguros. Un botón sin
    // efecto sería peor que ninguno, porque el token no se puede volver a pedir:
    // la alternativa selecciona el texto para copiarlo a mano.
    Object.assign(navigator, { clipboard: undefined });
    const select = vi.spyOn(HTMLInputElement.prototype, "select");

    render(<EnlaceGeneradoDialog enlace={ENLACE} alCerrar={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /copiar/i }));

    await vi.waitFor(() => expect(select).toHaveBeenCalled());
    select.mockRestore();
  });

  it("no pinta nada cuando no hay enlace recién creado", () => {
    // El estado que la alimenta se limpia al cerrar. Si el componente pintara
    // igual, el token quedaría en el DOM despues de haberla cerrado.
    const { container } = render(<EnlaceGeneradoDialog enlace={null} alCerrar={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/tok3n/)).not.toBeInTheDocument();
  });

  it("muestra el cupo y el vencimiento para que se reparta con criterio", () => {
    render(<EnlaceGeneradoDialog enlace={ENLACE} alCerrar={vi.fn()} />);
    expect(screen.getByText(/cupo de 25/i)).toBeInTheDocument();
  });
});
