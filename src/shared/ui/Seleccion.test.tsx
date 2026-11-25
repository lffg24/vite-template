import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { Seleccion } from "./Seleccion";

const MUCHAS = Array.from({ length: 10 }, (_, i) => ({
  valor: `e${i}`,
  etiqueta: `Empresa ${i}`,
  descripcion: `NIT 90012${i}`,
}));

it("elige una opción y devuelve su valor", () => {
  const alCambiar = vi.fn();
  render(<Seleccion aria-label="Empresa" opciones={MUCHAS} valor="" alCambiar={alCambiar} />);
  fireEvent.click(screen.getByRole("combobox", { name: "Empresa" }));
  fireEvent.click(screen.getByRole("option", { name: /Empresa 3/ }));
  expect(alCambiar).toHaveBeenCalledWith("e3");
});

it("con más de siete opciones ofrece búsqueda y acota también por la descripción", () => {
  render(<Seleccion aria-label="Empresa" opciones={MUCHAS} valor="" alCambiar={() => {}} />);
  fireEvent.click(screen.getByRole("combobox", { name: "Empresa" }));
  fireEvent.change(screen.getByPlaceholderText("Buscar…"), { target: { value: "900127" } });
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(screen.getByRole("option", { name: /Empresa 7/ })).toBeTruthy();
});

it("con pocas opciones no muestra el campo de búsqueda", () => {
  render(<Seleccion aria-label="Tipo" opciones={MUCHAS.slice(0, 3)} valor="e1" alCambiar={() => {}} />);
  const boton = screen.getByRole("combobox", { name: "Tipo" });
  expect(boton.textContent).toContain("Empresa 1");
  fireEvent.click(boton);
  expect(screen.queryByPlaceholderText("Buscar…")).toBeNull();
});
