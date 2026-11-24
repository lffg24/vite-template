import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GraficaBarrasFactores, GraficaComposicionNps, GraficaEvolucionMensual, GraficaHistogramaNps, GraficaPalancasFactores } from "./GraficasCx";

describe("gráficas reutilizables de CX", () => {
  it("expone etiquetas y muestras legibles además del gráfico", () => {
    render(<><GraficaComposicionNps distribucion={{ promotores: 34, pasivos: 14, detractores: 20 }} /><GraficaHistogramaNps valores={{ "0": 2, "10": 5 }} /></>);
    expect(screen.getByRole("img", { name: /composición nps/i })).toBeInTheDocument();
    expect(screen.getByText("Promotores: 34")).toBeInTheDocument();
    expect(screen.getByText(/Detractores 0–6/)).toBeInTheDocument();
  });

  it("corta la línea en el mes sin muestra y admite paneles de factores", () => {
    const { container } = render(<><GraficaEvolucionMensual puntos={[{ mes: "2026-09", valor: 10 }, { mes: "2026-10", valor: null }, { mes: "2026-11", valor: 20 }]} /><GraficaBarrasFactores filas={[{ nombre: "Atención", media: 4, n: 12 }]} /><GraficaPalancasFactores filas={[{ nombre: "Atención", promotores: { media: 4.4, n: 8 }, detractores: { media: null, n: 2 } }]} /></>);
    expect(container.querySelectorAll("polyline")).toHaveLength(0);
    expect(screen.getAllByText("Atención")).toHaveLength(2);
    expect(screen.getByText("Detractores")).toBeInTheDocument();
  });
});
