import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";

import { TransicionDePagina } from "./TransicionDePagina";

function Contador() {
  const [n, setN] = useState(0);
  const navegar = useNavigate();
  return (
    <>
      <p>valor {n}</p>
      <button onClick={() => setN((v) => v + 1)}>sumar</button>
      <button onClick={() => navegar("/otra")}>ir a otra</button>
    </>
  );
}

function pintar() {
  render(
    <MemoryRouter initialEntries={["/una"]}>
      <TransicionDePagina className="flex-1">
        <Routes>
          <Route path="/una" element={<Contador />} />
          <Route path="/otra" element={<Contador />} />
        </Routes>
      </TransicionDePagina>
    </MemoryRouter>
  );
}

describe("la transición de página", () => {
  it("pone la entrada de la casa y conserva el papel del hueco", () => {
    pintar();
    const caja = screen.getByText("valor 0").parentElement!;
    expect(caja.className).toContain("animate-entrada");
    // El `<Outlet />` vivía dentro de una columna flexible y este `div` se
    // mete en medio: sin esto, la pantalla deja de ocupar el alto.
    expect(caja.className).toContain("flex-1");
  });

  /**
   * El `key` por ruta es lo que hace que la animación vuelva a correr, y
   * tiene una consecuencia que conviene tener escrita: la pantalla anterior
   * se desmonta de verdad. Es lo correcto, pero si alguien quita el `key`
   * para «conservar el estado» se lleva por delante la animación sin que
   * nada falle, y esta prueba es el único sitio donde eso se ve.
   */
  it("al cambiar de ruta la pantalla anterior se desmonta", () => {
    pintar();
    fireEvent.click(screen.getByText("sumar"));
    expect(screen.getByText("valor 1")).toBeTruthy();

    fireEvent.click(screen.getByText("ir a otra"));
    expect(
      screen.getByText("valor 0"),
      "una ruta nueva es una pantalla nueva: no hereda el estado de la anterior."
    ).toBeTruthy();
  });
});
