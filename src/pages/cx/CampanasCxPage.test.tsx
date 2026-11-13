import { render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import CampanasCxPage from "./CampanasCxPage";
import { listarCampanasCx } from "@/services/cxCampanasService";
import { listarEncuestasCx } from "@/services/cxEncuestasService";
import { listarContextos } from "@/services/cxContextosService";
import { listarCatalogoCx } from "@/services/cxPuntosFactoresService";

vi.mock("@/services/cxCampanasService", () => ({ listarCampanasCx: vi.fn() }));
vi.mock("@/services/cxEncuestasService", () => ({ listarEncuestasCx: vi.fn() }));
vi.mock("@/services/cxContextosService", () => ({ listarContextos: vi.fn() }));
vi.mock("@/services/cxPuntosFactoresService", () => ({ listarCatalogoCx: vi.fn() }));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listarCampanasCx).mockResolvedValue({ items: [], siguiente_cursor: null });
  vi.mocked(listarEncuestasCx).mockResolvedValue({ items: [], siguiente_cursor: null });
  vi.mocked(listarContextos).mockResolvedValue({ items: [], siguiente_cursor: null });
  vi.mocked(listarCatalogoCx).mockResolvedValue({ items: [], siguiente_cursor: null });
});

it("muestra estado vacío y mantiene la creación deshabilitada sin encuesta publicada", async () => {
  render(<CampanasCxPage />);
  expect(await screen.findByText("Aún no hay campañas. Crea una desde una encuesta publicada.")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Crear campaña y QR" })).toBeDisabled();
});

it("permite consultar campañas aunque falle un catálogo auxiliar", async () => {
  vi.mocked(listarContextos).mockRejectedValue(new Error("Sin permiso de sedes"));
  render(<CampanasCxPage />);
  expect(await screen.findByText("Aún no hay campañas. Crea una desde una encuesta publicada.")).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("faltan permisos o datos de catálogos");
});
