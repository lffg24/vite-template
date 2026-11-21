// Lo que se prueba: que plegar NO desmonte nada (la razón de ser de la pieza) y
// que lo plegado no quede al alcance del lector. Que la altura se anime es CSS.

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SeccionPlegable } from "./SeccionPlegable";

describe("SeccionPlegable", () => {
  it("plegada sigue montada: el formulario a medio llenar no se pierde", () => {
    render(
      <SeccionPlegable titulo="Datos" abiertaPorDefecto>
        <input aria-label="Nombre" defaultValue="" />
      </SeccionPlegable>
    );
    const campo = screen.getByLabelText("Nombre") as HTMLInputElement;
    fireEvent.change(campo, { target: { value: "Ana" } });

    fireEvent.click(screen.getByRole("button", { name: /Datos/ }));
    fireEvent.click(screen.getByRole("button", { name: /Datos/ }));

    // Es el MISMO nodo y conserva lo escrito: si se desmontara, volvería vacío.
    expect(screen.getByLabelText("Nombre")).toBe(campo);
    expect(campo.value).toBe("Ana");
  });

  it("plegada se declara cerrada y se oculta al lector", () => {
    const { container } = render(
      <SeccionPlegable titulo="Datos" abiertaPorDefecto={false}>
        <p>dentro</p>
      </SeccionPlegable>
    );
    const boton = screen.getByRole("button", { name: /Datos/ });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    const region = container.querySelector(`#${CSS.escape(boton.getAttribute("aria-controls")!)}`);
    expect(region).toHaveAttribute("aria-hidden", "true");
    expect(region?.className).toContain("grid-rows-[0fr]");

    fireEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    expect(region).not.toHaveAttribute("aria-hidden");
    expect(region?.className).toContain("grid-rows-[1fr]");
  });

  it("recuerda lo plegado en localStorage por clave", () => {
    window.localStorage.removeItem("t:plegable");
    const { unmount } = render(
      <SeccionPlegable titulo="Datos" claveMemoria="t:plegable">
        <p>dentro</p>
      </SeccionPlegable>
    );
    fireEvent.click(screen.getByRole("button", { name: /Datos/ }));
    unmount();
    render(
      <SeccionPlegable titulo="Datos" claveMemoria="t:plegable">
        <p>dentro</p>
      </SeccionPlegable>
    );
    expect(screen.getByRole("button", { name: /Datos/ })).toHaveAttribute("aria-expanded", "false");
  });
});
