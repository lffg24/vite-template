import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Esqueleto, EsqueletoTabla, EsqueletoTexto, ZonaCargando } from "./Esqueleto";

describe("sistema de carga", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("por debajo de 300 ms no enseña nada, ni esqueleto ni giro", () => {
    // Es la regla que casi nadie aplica y la que más se nota: un destello de
    // esqueleto se percibe como un fallo gráfico, no como una respuesta.
    render(
      <ZonaCargando cargando esqueleto={<EsqueletoTexto />}>
        <p>Contenido</p>
      </ZonaCargando>
    );
    act(() => { vi.advanceTimersByTime(290); });
    expect(document.querySelectorAll("[aria-hidden='true']")).toHaveLength(0);
  });

  it("pasados los 300 ms sí aparece la forma de lo que viene", () => {
    render(
      <ZonaCargando cargando esqueleto={<EsqueletoTexto lineas={3} />}>
        <p>Contenido</p>
      </ZonaCargando>
    );
    act(() => { vi.advanceTimersByTime(320); });
    expect(document.querySelectorAll("[aria-hidden='true']").length).toBeGreaterThan(0);
  });

  it("anuncia la espera a quien no la ve", () => {
    // Sin esto, un lector de pantalla se queda mudo sobre una región vacía y
    // la persona no sabe si la página está cargando o si no hay nada.
    render(
      <ZonaCargando cargando etiqueta="Cargando psicólogos" esqueleto={<EsqueletoTexto />}>
        <p>Contenido</p>
      </ZonaCargando>
    );
    const zona = screen.getByRole("status");
    expect(zona).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Cargando psicólogos")).toHaveClass("sr-only");
  });

  it("cuando deja de cargar entrega el contenido sin envoltorio", () => {
    render(
      <ZonaCargando cargando={false} esqueleto={<EsqueletoTexto />}>
        <p>Contenido</p>
      </ZonaCargando>
    );
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("el esqueleto no se anuncia: es ausencia de contenido, no contenido", () => {
    const { container } = render(<Esqueleto className="h-4" />);
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
  });

  it("la última línea de texto sale más corta que las demás", () => {
    // Un párrafo real no termina justo en el margen; un bloque de barras
    // todas iguales se delata como relleno.
    const { container } = render(<EsqueletoTexto lineas={3} />);
    const lineas = [...container.querySelectorAll("span.block.overflow-hidden")];
    expect(lineas).toHaveLength(3);
    expect(lineas[2].className).toContain("w-2/3");
    expect(lineas[0].className).not.toContain("w-2/3");
  });

  it("la tabla del esqueleto tiene las medidas que le piden", () => {
    // Si trae cinco filas y llegan veinte, la página pega un salto justo
    // cuando debería sentirse continua.
    const { container } = render(<EsqueletoTabla filas={4} columnas={3} />);
    // 3 de cabecera + 4 filas × 3 columnas
    expect(container.querySelectorAll("span.block.overflow-hidden")).toHaveLength(3 + 4 * 3);
  });
});
