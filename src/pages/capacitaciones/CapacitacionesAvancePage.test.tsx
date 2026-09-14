import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import CapacitacionesAvancePage, { celdaCSV } from "./CapacitacionesAvancePage";
import { obtenerAvance } from "@/services/capacitacionesService";
import type { AvanceAsignacion, AvanceParticipante } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({
  obtenerAvance: vi.fn(),
}));

function persona(over: Partial<AvanceParticipante> = {}): AvanceParticipante {
  return {
    participante_id: "p1",
    nombres: "Ana",
    apellidos: "Alvarez",
    tipo_documento: "CC",
    numero_documento: "1001",
    cargo: "Operaria",
    correo: null,
    situacion: "EN_CURSO",
    obligatorias_completas: 2,
    obligatorias_totales: 5,
    invitacion_estado: "CONSUMIDA",
    invitacion_utilizable: false,
    invitada_en: "2026-09-01T10:00:00Z",
    inscripcion_id: "i1",
    iniciada_en: "2026-09-02T10:00:00Z",
    completada_en: null,
    ultima_actividad: "2026-09-05T10:00:00Z",
    constancia_codigo: null,
    constancia_estado: null,
    constancia_vence_el: null,
    ...over,
  };
}

function avance(over: Partial<AvanceAsignacion> = {}): AvanceAsignacion {
  return {
    asignacion: {
      id: "a1",
      curso_titulo: "Inducción SST",
      numero_version: 2,
      estado: "ACTIVA",
      modo_identidad: "INVITACION_INDIVIDUAL",
      fecha_objetivo: "2026-10-01",
    },
    obligatorias_totales: 5,
    hay_convocatoria: true,
    resumen: {
      personas: 1,
      sin_empezar: 0,
      invitacion_vencida: 0,
      en_curso: 1,
      completados: 0,
      con_constancia: 0,
    },
    participantes: [persona()],
    hay_mas: false,
    limite: 200,
    version_medible: true,
    ...over,
  };
}

function montar() {
  return render(
    <MemoryRouter initialEntries={["/capacitaciones/asignaciones/a1/avance"]}>
      <Routes>
        <Route
          path="/capacitaciones/asignaciones/:asignacionId/avance"
          element={<CapacitacionesAvancePage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

/**
 * Esta pantalla cierra el hueco que el módulo tenía en medio: sabía si alguien
 * estaba invitado y sabía si ya tenía constancia, y entre esas dos cosas —que es
 * donde la gente vive durante días— no había nada.
 */
describe("Avance · quién va por dónde", () => {
  it("pinta la situación de cada persona con el nombre que se usa para actuar", async () => {
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        resumen: {
          personas: 4,
          sin_empezar: 1,
          invitacion_vencida: 1,
          en_curso: 1,
          completados: 1,
          con_constancia: 1,
        },
        participantes: [
          persona({ participante_id: "p1", apellidos: "Alvarez", situacion: "SIN_EMPEZAR" }),
          persona({
            participante_id: "p2",
            apellidos: "Bernal",
            numero_documento: "1002",
            situacion: "INVITACION_VENCIDA",
          }),
          persona({ participante_id: "p3", apellidos: "Castro", numero_documento: "1003" }),
          persona({
            participante_id: "p4",
            apellidos: "Duarte",
            numero_documento: "1004",
            situacion: "COMPLETADO",
            obligatorias_completas: 5,
            constancia_codigo: "ABCD-2345",
          }),
        ],
      })
    );
    montar();

    // El rotulo sale dos veces: en el contador de arriba y en la insignia de la
    // fila. Se comprueba que aparezca, no cuantas veces.
    expect(await screen.findAllByText("Sin empezar")).not.toHaveLength(0);
    // «Invitación vencida» y «sin empezar» parecen lo mismo y piden acciones
    // distintas: a uno se le recuerda, al otro hay que volver a invitarlo.
    expect(screen.getAllByText("Invitación vencida")).not.toHaveLength(0);
    expect(screen.getAllByText("En curso")).not.toHaveLength(0);
    expect(screen.getAllByText("Completado")).not.toHaveLength(0);
    expect(screen.getByText("ABCD-2345")).toBeInTheDocument();
  });

  it("el avance se lee como fracción de lo obligatorio de ESA versión", async () => {
    vi.mocked(obtenerAvance).mockResolvedValue(avance());
    montar();

    expect(await screen.findByText("2/5")).toBeInTheDocument();
    expect(
      screen.getByLabelText("2 de 5 lecciones obligatorias")
    ).toBeInTheDocument();
  });

  it("sin lecciones obligatorias NO inventa una barra", async () => {
    // Contraprueba. Una versión sin obligatorias no tiene de qué llevar cuenta,
    // y una barra al 0 % o al 100 % afirmaría algo que nadie midió.
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        obligatorias_totales: 0,
        participantes: [persona({ obligatorias_completas: 0, obligatorias_totales: 0 })],
      })
    );
    montar();

    await screen.findByText("Alvarez, Ana");
    expect(screen.queryByText("0/0")).not.toBeInTheDocument();
  });

  it("sin convocatoria lo dice en vez de prometer un denominador", async () => {
    // En modo autodeclarado no hay lista previa. Decir «faltan 12» sería
    // inventárselo, y un panel que se calla su incertidumbre se lee como si no
    // la tuviera.
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        hay_convocatoria: false,
        asignacion: { ...avance().asignacion, modo_identidad: "AUTODECLARADA" },
      })
    );
    montar();

    expect(
      await screen.findByText(/no hay lista de convocados/i)
    ).toBeInTheDocument();
  });

  it("con convocatoria NO aparece ese aviso", async () => {
    // Contraprueba del anterior: si el aviso se pintara siempre, dejaría de
    // significar algo.
    vi.mocked(obtenerAvance).mockResolvedValue(avance());
    montar();

    await screen.findByText("Alvarez, Ana");
    expect(screen.queryByText(/no hay lista de convocados/i)).not.toBeInTheDocument();
  });

  it("la búsqueda la resuelve el SERVIDOR, no el navegador", async () => {
    // La lista es la nómina de una empresa: traerla entera para filtrarla aquí
    // manda por la red los datos de todo el personal cada vez que alguien abre
    // la pantalla, aunque venga a buscar a una sola persona.
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        participantes: [
          persona({ participante_id: "p1", apellidos: "Alvarez", numero_documento: "1001" }),
        ],
      })
    );
    montar();

    await screen.findByText("Alvarez, Ana");
    fireEvent.change(screen.getByLabelText("Buscar una persona"), {
      target: { value: "2002" },
    });

    await vi.waitFor(() =>
      expect(obtenerAvance).toHaveBeenCalledWith("a1", { buscar: "2002" })
    );
  });

  it("una lista recortada lo dice en vez de callarlo", async () => {
    // Una lista recortada en silencio es peor que una lista larga: quien
    // exporta se lleva menos gente de la que cree.
    vi.mocked(obtenerAvance).mockResolvedValue(
      avance({
        hay_mas: true,
        limite: 200,
        resumen: { ...avance().resumen, personas: 640 },
      })
    );
    montar();

    expect(await screen.findByText(/Se muestran las primeras/)).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("cuando cabe todo NO anuncia un recorte que no hay", async () => {
    // Contraprueba: un aviso que sale siempre deja de avisar.
    vi.mocked(obtenerAvance).mockResolvedValue(avance());
    montar();

    await screen.findByText("Alvarez, Ana");
    expect(screen.queryByText(/Se muestran las primeras/)).not.toBeInTheDocument();
  });

  it("una versión que no se puede medir lo explica", async () => {
    // Las publicadas antes de que el snapshot congelara el id de cada lección
    // no tienen con qué casar el progreso. Pintar ceros se leería como gente
    // que no ha empezado, que es lo contrario de lo que pasa.
    vi.mocked(obtenerAvance).mockResolvedValue(avance({ version_medible: false }));
    montar();

    expect(
      await screen.findByText(/se publicó antes de una corrección/i)
    ).toBeInTheDocument();
  });
});

/**
 * Entrecomillar no basta para un CSV que alguien va a abrir en Excel: la hoja
 * quita las comillas y evalúa lo que queda. Un cargo escrito como una fórmula se
 * convierte en una petición que saca datos de otras celdas al abrir el archivo, y
 * quien lo abre no hizo nada raro — abrió el listado de su empresa.
 */
describe("la exportación no se puede convertir en una fórmula", () => {
  it("desarma los cuatro inicios que una hoja de cálculo interpreta", () => {
    expect(celdaCSV("=1+1")).toBe(`"'=1+1"`);
    expect(celdaCSV("+34600000000")).toBe(`"'+34600000000"`);
    expect(celdaCSV("-5")).toBe(`"'-5"`);
    expect(celdaCSV("@SUM(A1)")).toBe(`"'@SUM(A1)"`);
  });

  it("no toca lo que no lo necesita, y sigue escapando comillas", () => {
    // Contraprueba: si antepusiera la comilla a todo, cada nombre del archivo
    // saldría con un apóstrofo delante.
    expect(celdaCSV("Ospina Ruiz")).toBe(`"Ospina Ruiz"`);
    expect(celdaCSV('Jefe de "Planta"')).toBe(`"Jefe de ""Planta"""`);
  });
});
