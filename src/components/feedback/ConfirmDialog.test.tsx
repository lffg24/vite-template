import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ConfirmDialog } from "./ConfirmDialog";

// Lo que se prueba aquí NO es el aspecto: es que la confirmación cumpla las
// cuatro promesas que no cumplía. Son las que importan en el único control del
// producto donde alguien decide algo que consume créditos o bloquea un
// instrumento.

function pintar(extra: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utilidades = render(
    <ConfirmDialog
      open
      title="Cerrar y calcular la aplicación"
      description="Al cerrar se congelará la captura y se ejecutará el cálculo oficial."
      confirmLabel="Cerrar aplicación"
      cancelLabel="Seguir revisando"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...extra}
    />
  );
  return { ...utilidades, onConfirm, onCancel };
}

describe("ConfirmDialog", () => {
  it("se anuncia como diálogo y toma su nombre del título", () => {
    pintar();
    const dialogo = screen.getByRole("dialog");
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(dialogo).toHaveAccessibleName("Cerrar y calcular la aplicación");
  });

  it("recibe el foco al abrirse", () => {
    pintar();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("Escape cancela, no confirma", () => {
    // La distinción es el punto: salir sin decidir tiene que dejar las cosas
    // como estaban. Si `Escape` confirmara, cerrar por costumbre cerraría una
    // aplicación.
    const { onCancel, onConfirm } = pintar();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("el velo cancela y el interior no", () => {
    const { onCancel } = pintar();
    const dialogo = screen.getByRole("dialog");
    fireEvent.mouseDown(dialogo);
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.mouseDown(dialogo.parentElement!);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("los dos botones hacen lo que dicen", () => {
    const { onCancel, onConfirm } = pintar();
    fireEvent.click(screen.getByRole("button", { name: "Cerrar aplicación" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Seguir revisando" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cerrada no pinta nada", () => {
    pintar({ open: false });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
