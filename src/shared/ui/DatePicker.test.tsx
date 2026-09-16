import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DatePicker } from "./DatePicker";

describe("DatePicker compartido", () => {
  it("ofrece cambio de mes y año y bloquea fechas anteriores al mínimo", () => {
    render(
      <DatePicker
        label="Fecha objetivo"
        value=""
        min="2026-09-16"
        onChange={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /fecha objetivo/i }));

    expect(screen.getByRole("combobox", { name: "Mes" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Año" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /15 de septiembre de 2026/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /16 de septiembre de 2026/i })).toBeEnabled();
  });

  it("devuelve la fecha elegida en formato estable", () => {
    const onChange = vi.fn();
    render(
      <DatePicker
        label="Fecha objetivo"
        value=""
        min="2026-09-16"
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /fecha objetivo/i }));
    fireEvent.click(screen.getByRole("button", { name: /20 de septiembre de 2026/i }));
    expect(onChange).toHaveBeenCalledWith("2026-09-20");
  });
});
