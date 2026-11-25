import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResultadosCxPage from "./ResultadosCxPage";

const { obtenerResultadosCx } = vi.hoisted(() => ({ obtenerResultadosCx: vi.fn() }));
vi.mock("@/services/cxResultadosService", () => ({ obtenerResultadosCx }));

const resumen = {
  total_envios: 68, contactos: 22, periodo: { desde: "2026-09-26", hasta: "2026-11-23" }, n_minimo: 5,
  indicador_principal: { tipo: "NPS_RELACIONAL", valor: 20.59, n: 68, distribucion: { promotores: 34, pasivos: 14, detractores: 20 }, histograma: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [String(i), i === 9 ? 34 : 0])) },
  indicadores: [], factores: [{ id: "factor-1", nombre: "Atención", media: 4.2, n: 68 }],
  palancas: [{ id: "factor-1", nombre: "Atención", promotores: { media: 4.4, n: 34 }, detractores: { media: 3.2, n: 20 }, brecha: 1.2 }],
  mensual: [{ mes: "2026-11", indicador: { tipo: "NPS_RELACIONAL", valor: 20.59, n: 68, distribucion: {}, histograma: {} } }],
  desglose: { sede: [], servicio: [], punto: [], campana: [], encuesta: [] },
  trazas: [{ campana_id: "campana-1", campana: "Campaña Norte", estado: "ACTIVA", encuesta: "Satisfacción", version: 1, n: 68, contactos: 22, primera_fecha: "2026-09-26T12:00:00Z", ultima_fecha: "2026-11-23T12:00:00Z" }], opciones: { encuesta: [], campana: [], sede: [], servicio: [], punto: [] },
};

describe("ResultadosCxPage", () => {
  beforeEach(() => { obtenerResultadosCx.mockReset(); obtenerResultadosCx.mockResolvedValue(resumen); });

  it("presenta indicadores, método y privacidad de contactos", async () => {
    render(<ResultadosCxPage />);
    await waitFor(() => expect(screen.getByText("+20.59")).toBeInTheDocument());
    expect(screen.getByText("68", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/La sede, el servicio y el punto los fija la campaña/)).toBeInTheDocument();
    expect(screen.getByText(/nombre, correo y teléfono no se consultan aquí/)).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Trazabilidad por campaña" })).toBeInTheDocument();
  });

  it("muestra error de acceso sin ocultar su estado", async () => {
    obtenerResultadosCx.mockRejectedValueOnce(new Error("El usuario no tiene permiso para consultar estos resultados."));
    render(<ResultadosCxPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Sin permiso para ver resultados");
  });
});
