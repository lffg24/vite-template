import { StrictMode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import VerificarPage from "./VerificarPage";
import { verificarConstancia } from "@/services/participacionService";
import type { ErrorPublico, Verificacion } from "@/types/participacion";

vi.mock("@/services/participacionService", () => ({
  verificarConstancia: vi.fn(),
}));

function verificacion(over: Partial<Verificacion> = {}): Verificacion {
  return {
    codigo_verificacion: "ABCD-2345",
    folio: 12,
    situacion: "VIGENTE",
    participante: "Maria F. O***",
    documento: "CC ***907",
    empresa: "Constructora del Norte",
    curso: "Trabajo en alturas",
    version: 3,
    intensidad_horaria_min: 90,
    emitida_en: "2026-05-10T15:30:00Z",
    vence_el: "2027-05-10",
    anulada_en: null,
    aviso: "Constancia de asistencia. No certifica competencias laborales.",
    ...over,
  };
}

/** Con `StrictMode`, que es como corre en desarrollo: monta, desmonta, monta. */
function montarConCodigo(codigo: string) {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={[`/c/verificar/${codigo}`]}>
        <Routes>
          <Route path="/c/verificar/:codigo" element={<VerificarPage />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("la búsqueda automática desde la ruta", () => {
  it("hace UNA sola petición bajo Strict Mode", async () => {
    // Antes se lanzaba durante el render, que es un efecto secundario en el
    // sitio equivocado: Strict Mode repite el render y salían dos peticiones.
    // Contra un endpoint con límite por IP, eso gasta el doble de cuota de cada
    // visitante — y el que verifica suele ser el más apurado.
    vi.mocked(verificarConstancia).mockResolvedValue(verificacion());

    montarConCodigo("ABCD-2345");

    expect(await screen.findByText(/constancia válida/i)).toBeInTheDocument();
    expect(verificarConstancia).toHaveBeenCalledTimes(1);
  });

  it("no busca nada cuando la ruta no trae código", () => {
    // Contraprueba: el efecto no puede dispararse solo por montar la pantalla.
    render(
      <StrictMode>
        <MemoryRouter initialEntries={["/c/verificar"]}>
          <Routes>
            <Route path="/c/verificar" element={<VerificarPage />} />
          </Routes>
        </MemoryRouter>
      </StrictMode>
    );

    expect(verificarConstancia).not.toHaveBeenCalled();
  });
});

describe("las tres situaciones se muestran distinto", () => {
  it("una constancia ANULADA se muestra como anulada, no como inexistente", async () => {
    // Es la razón de ser de que anular no borre: quien tiene el papel impreso
    // solo puede enterarse de que ya no vale si el verificador se lo dice.
    vi.mocked(verificarConstancia).mockResolvedValue(
      verificacion({ situacion: "ANULADA", anulada_en: "2026-06-01T10:00:00Z" })
    );

    montarConCodigo("ABCD-2345");

    expect(await screen.findByText(/constancia anulada/i)).toBeInTheDocument();
    expect(screen.getByText(/retiró este documento/i)).toBeInTheDocument();
  });

  it("una VENCIDA dice que el documento es auténtico", async () => {
    // Vencer no es lo mismo que ser falsa, y quien la presenta merece que la
    // diferencia quede clara: no debe cargar con una sospecha que no le toca.
    vi.mocked(verificarConstancia).mockResolvedValue(
      verificacion({ situacion: "VENCIDA", vence_el: "2026-01-01" })
    );

    montarConCodigo("ABCD-2345");

    expect(await screen.findByText(/constancia vencida/i)).toBeInTheDocument();
    expect(screen.getByText(/es auténtico/i)).toBeInTheDocument();
  });
});

describe("los errores", () => {
  it("distingue el límite de peticiones de un código que no existe", async () => {
    // Son dos salidas distintas: una se arregla esperando, la otra revisando el
    // papel. Confundirlas deja a alguien reescribiendo un código correcto.
    const err = new Error("x") as ErrorPublico;
    err.motivo = "demasiadas_peticiones";
    vi.mocked(verificarConstancia).mockRejectedValue(err);

    montarConCodigo("ABCD-2345");

    expect(await screen.findByRole("alert")).toHaveTextContent(/espera un minuto/i);
  });

  it("un código inexistente no confirma ni desmiente que exista", async () => {
    const err = new Error("x") as ErrorPublico;
    err.motivo = "constancia_no_encontrada";
    vi.mocked(verificarConstancia).mockRejectedValue(err);

    montarConCodigo("ZZZZ-ZZZZ");

    expect(await screen.findByRole("alert")).toHaveTextContent(/no encontramos/i);
  });
});
