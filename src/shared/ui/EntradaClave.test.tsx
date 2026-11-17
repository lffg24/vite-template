import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EntradaClave } from "./EntradaClave";

describe("EntradaClave", () => {
  it("empieza oculta y el interruptor se anuncia como tal", () => {
    // Ninguna de las cuatro copias a mano declaraba `aria-pressed`: para un
    // lector de pantalla eran un botón que cambiaba de nombre, no un
    // interruptor con dos estados.
    render(<EntradaClave aria-label="Contraseña" />);
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "Mostrar contraseña" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });

  it("al pulsar, revela el campo y cambia de estado", () => {
    render(<EntradaClave aria-label="Contraseña" />);
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar contraseña" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("con visibilidad compartida, la pantalla decide y la etiqueta habla en plural", () => {
    // Restablecer clave revela a la vez la contraseña y su confirmación, a
    // propósito: verlas juntas es lo que permite cotejarlas.
    const alAlternar = vi.fn();
    render(<EntradaClave aria-label="Nueva contraseña" visible={false} alAlternar={alAlternar} />);
    const boton = screen.getByRole("button", { name: "Mostrar contraseñas" });
    fireEvent.click(boton);
    expect(alAlternar).toHaveBeenCalledTimes(1);
    // Y no se guarda nada por su cuenta: sigue oculta hasta que la pantalla
    // cambie `visible`.
    expect(screen.getByLabelText("Nueva contraseña")).toHaveAttribute("type", "password");
  });

  it("deja pasar lo que el formulario necesita", () => {
    render(<EntradaClave aria-label="Contraseña" autoComplete="new-password" required />);
    const campo = screen.getByLabelText("Contraseña");
    expect(campo).toHaveAttribute("autocomplete", "new-password");
    expect(campo).toBeRequired();
  });
});
