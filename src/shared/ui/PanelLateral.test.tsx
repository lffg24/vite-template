import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { PanelLateral } from "./PanelLateral";

function pintar(extra: Partial<Parameters<typeof PanelLateral>[0]> = {}) {
  const alCerrar = vi.fn();
  const utilidades = render(
    <PanelLateral abierto alCerrar={alCerrar} titulo="Asignar créditos" {...extra}>
      <p>Cuerpo del panel</p>
    </PanelLateral>
  );
  return { ...utilidades, alCerrar };
}

describe("PanelLateral", () => {
  it("se anuncia como diálogo y toma su nombre del título", () => {
    pintar();
    const panel = screen.getByRole("dialog");
    expect(panel).toHaveAttribute("aria-modal", "true");
    expect(panel).toHaveAccessibleName("Asignar créditos");
  });

  it("recibe el foco al abrirse", () => {
    // Sin esto, quien navega con teclado sigue en la página de detrás mientras
    // el panel la tapa: el siguiente tabulador va a un enlace que no se ve.
    pintar();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("cierra con Escape", () => {
    const { alCerrar } = pintar();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  it("cierra al pulsar el velo, pero no al pulsar dentro", () => {
    const { alCerrar } = pintar();
    const panel = screen.getByRole("dialog");

    fireEvent.mouseDown(panel);
    expect(alCerrar).not.toHaveBeenCalled();

    // El velo es el padre del panel.
    fireEvent.mouseDown(panel.parentElement as HTMLElement);
    expect(alCerrar).toHaveBeenCalledTimes(1);
  });

  it("cerrado no deja nada en el documento", () => {
    const { container } = render(
      <PanelLateral abierto={false} alCerrar={vi.fn()} titulo="Oculto">
        <p>No debería verse</p>
      </PanelLateral>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("con `alEnviar`, el botón del pie envía el formulario del cuerpo", () => {
    // Es la razón de que el panel entero sea un `<form>`: si el pie quedara
    // fuera, el botón primario tendría que apuntar al formulario por id, y
    // Enter dentro de un campo no enviaría nada.
    const alEnviar = vi.fn((evento) => evento.preventDefault());
    render(
      <PanelLateral
        abierto
        alCerrar={vi.fn()}
        titulo="Con formulario"
        alEnviar={alEnviar}
        acciones={<button type="submit">Guardar</button>}
      >
        <input aria-label="Cantidad" />
      </PanelLateral>
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(alEnviar).toHaveBeenCalledTimes(1);
  });
});
