// src/shared/ui/Desplegable.test.tsx
//
// Lo que se prueba aqui es, pieza por pieza, lo que estaba mal en los
// dieciocho desplegables escritos a mano.

import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";

import { Desplegable } from "@/shared/ui/Desplegable";

function pintar(extra: Record<string, unknown> = {}) {
  return render(
    <Desplegable aria-label="Estado" {...extra}>
      <option value="activos">Activos</option>
      <option value="todos">Todos</option>
    </Desplegable>,
  );
}

describe("Desplegable", () => {
  it("sigue siendo un `select` del navegador", () => {
    // Es TODO el motivo para no recrearlo: en movil abre el selector del
    // sistema. Si un dia esto deja de ser un `select`, la pieza perdio su
    // razon de existir y hay que usar el de Radix a conciencia.
    pintar();
    const control = screen.getByRole("combobox", { name: "Estado" });
    expect(control.tagName).toBe("SELECT");
  });

  it("dice su valor al elegir", () => {
    const alCambiar = vi.fn();
    pintar({ value: "activos", onChange: alCambiar });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "todos" } });
    expect(alCambiar).toHaveBeenCalled();
  });

  it("la flecha no es un boton ni se interpone", () => {
    // Un icono encima del control que reciba el clic se come la apertura de
    // la lista; y anunciado al lector de pantalla seria ruido.
    const { container } = pintar();
    const flecha = container.querySelector("svg");
    expect(flecha).not.toBeNull();
    expect(flecha).toHaveAttribute("aria-hidden", "true");
    expect(flecha?.getAttribute("class")).toContain("pointer-events-none");
  });

  it("`className` viste el envoltorio, no el control", () => {
    // Las pantallas lo usan para el ancho. Una anchura puesta en el `select`
    // dentro de un envoltorio ancho dejaria la flecha lejos del borde.
    const { container } = pintar({ className: "sm:w-40" });
    const envoltorio = container.firstElementChild as HTMLElement;
    expect(envoltorio.className).toContain("sm:w-40");
    expect(screen.getByRole("combobox").className).not.toContain("sm:w-40");
  });

  it("bloqueado se ve bloqueado", () => {
    // El defecto concreto: once de los dieciocho recibian `disabled` y
    // ninguno tenia una sola clase `disabled:`. Un desplegable bloqueado se
    // veia igual que uno operable; se hacia clic y no pasaba nada.
    pintar({ disabled: true });
    const control = screen.getByRole("combobox");
    expect(control).toBeDisabled();
    expect(control.className).toMatch(/disabled:/);
  });

  it("deja que `Campo` le enlace la etiqueta y el error", () => {
    // `Campo` clona a su hijo para ponerle `id` y `aria-describedby`. Si esos
    // atributos cayeran en el envoltorio, el mensaje de error no llegaria.
    const referencia = createRef<HTMLSelectElement>();
    pintar({ id: "estado", "aria-describedby": "estado-error", ref: referencia });
    const control = screen.getByRole("combobox");
    expect(control).toHaveAttribute("id", "estado");
    expect(control).toHaveAttribute("aria-describedby", "estado-error");
    expect(referencia.current).toBe(control);
  });
});
