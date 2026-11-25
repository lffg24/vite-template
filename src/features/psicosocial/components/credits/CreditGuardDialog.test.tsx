import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreditGuardDialog } from "./CreditGuardDialog";

const info = {
  isInsufficient: true,
  saldoActual: 0,
  requeridos: 2,
  message: "No hay créditos disponibles.",
};

describe("CreditGuardDialog", () => {
  it("expone el bloqueo como diálogo accesible con una acción comercial clara", () => {
    render(<CreditGuardDialog info={info} onClose={vi.fn()} />);

    expect(screen.getByRole("dialog", { name: "Créditos insuficientes" })).toBeInTheDocument();
    expect(screen.getByText("No hay créditos disponibles.")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /comprar créditos/i })).toHaveAttribute(
      "href",
      "https://wa.me/573002458438",
    );
  });

  it("cierra por Escape", () => {
    const onClose = vi.fn();
    render(<CreditGuardDialog info={info} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("cierra por la acción secundaria", () => {
    const onClose = vi.fn();
    render(<CreditGuardDialog info={info} onClose={onClose} />);

    const action = screen
      .getAllByRole("button", { name: "Cerrar" })
      .find((button) => button.textContent === "Cerrar");
    expect(action).toBeDefined();
    fireEvent.click(action!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no deja contenido sensible en el DOM cuando no hay bloqueo", () => {
    const { container } = render(<CreditGuardDialog info={null} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
