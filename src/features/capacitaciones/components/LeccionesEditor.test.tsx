import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { LeccionesEditor } from "./LeccionesEditor";
import { agregarLeccion, editarLeccion } from "@/services/capacitacionesService";
import { listarVersionesElegibles } from "@/services/evaluacionesService";
import type { EvaluacionLeccion, Leccion } from "@/types/capacitaciones";

vi.mock("@/services/capacitacionesService", () => ({
  agregarLeccion: vi.fn().mockResolvedValue({ leccion_id: "l9", orden: 1 }),
  editarLeccion: vi.fn().mockResolvedValue(undefined),
  eliminarLeccion: vi.fn(),
  moverLeccion: vi.fn(),
  reordenarLecciones: vi.fn(),
}));

vi.mock("@/services/evaluacionesService", () => ({
  listarVersionesElegibles: vi.fn(),
}));

const toast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast }),
}));

const VERSION = {
  version_id: "v-banco-1",
  numero: 2,
  cuestionario_id: "q1",
  codigo: "EVA-003",
  titulo: "Inducción SST",
  ambito: "SST" as const,
  nota_minima: 80,
  intentos_max: 2,
  preguntas: 6,
  vigente: true,
};

const EVALUACION_PROPIA: EvaluacionLeccion = {
  nota_minima: 70,
  intentos_max: 1,
  preguntas: [
    {
      tipo: "VERDADERO_FALSO",
      enunciado: "Reportar es obligatorio",
      opciones: ["Verdadero", "Falso"],
      correctas: [0],
      puntos: 1,
    },
  ],
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function leccion(over: Partial<Leccion> = {}): Leccion {
  return {
    id: "l1",
    orden: 1,
    tipo: "EVALUACION",
    titulo: "Final",
    bloques: null,
    recurso: null,
    evaluacion: null,
    cuestionario_version_id: VERSION.version_id,
    duracion_estimada_min: null,
    obligatoria: true,
    ...over,
  };
}

function abrirEdicion(l: Leccion) {
  render(<LeccionesEditor cursoId="c1" lecciones={[l]} editable alCambiar={() => {}} />);
  fireEvent.click(
    screen.getByRole("button", { name: /editar (la lección|la evaluación)/i })
  );
}

function abrirNuevaEvaluacion() {
  render(<LeccionesEditor cursoId="c1" lecciones={[]} editable alCambiar={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: /^agregar evaluación$/i }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listarVersionesElegibles).mockResolvedValue([VERSION]);
});

/**
 * La regla que se prueba aquí es la que impone el servidor: una lección de
 * evaluación lleva el cuestionario del banco O escrito dentro, nunca los dos.
 * Mandar ambos devuelve un 422 que la pantalla no sabría explicar mejor de lo
 * que puede evitarlo, y mandar el nuevo sin soltar el viejo dejaba la lección
 * publicando un cuestionario distinto del que enseñaba.
 */
describe("LeccionesEditor · de dónde sale el cuestionario", () => {
  it("separa la creación de contenido y de evaluación", () => {
    render(<LeccionesEditor cursoId="c1" lecciones={[]} editable alCambiar={() => {}} />);

    expect(screen.getByRole("button", { name: /^agregar lección$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^agregar evaluación$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^agregar evaluación$/i }));

    expect(screen.getByRole("heading", { name: /nueva evaluación/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/tipo de lección/i)).toBeNull();
    expect(screen.getByText(/¿de dónde sale\?/i)).toBeInTheDocument();
  });

  it("envía al servidor el contrato vigente al crear una evaluación propia", async () => {
    abrirNuevaEvaluacion();

    fireEvent.change(screen.getByLabelText(/^título/i), {
      target: { value: "Comprobación final" },
    });
    fireEvent.click(screen.getByRole("radio", { name: /escrito dentro de este curso/i }));
    fireEvent.click(screen.getByRole("button", { name: /agregar pregunta/i }));
    fireEvent.change(screen.getByLabelText(/enunciado de la pregunta 1/i), {
      target: { value: "¿Qué debes hacer primero?" },
    });
    fireEvent.change(screen.getByLabelText(/texto de la opción 1/i), {
      target: { value: "Reportar" },
    });
    fireEvent.change(screen.getByLabelText(/texto de la opción 2/i), {
      target: { value: "Ignorar" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^agregar evaluación$/i }));

    await vi.waitFor(() => expect(agregarLeccion).toHaveBeenCalled());
    const [, payload] = vi.mocked(agregarLeccion).mock.calls[0];
    expect(payload).toMatchObject({
      tipo: "EVALUACION",
      titulo: "Comprobación final",
      evaluacion: {
        preguntas: [
          {
            tipo: "OPCION_UNICA",
            correctas: [0],
            puntos: 1,
          },
        ],
      },
      cuestionario_version_id: null,
    });
  });

  it("una lección del banco se abre en el banco y guarda su referencia", async () => {
    abrirEdicion(leccion());

    const selector = await screen.findByLabelText(/evaluación del banco/i);
    expect(selector).toHaveTextContent("EVA-003 · Inducción SST · v2");
    // Los números que decide el banco quedan a la vista: son los que la lección
    // ya no puede cambiar, y descubrirlos cuando alguien reprueba es tarde.
    expect(screen.getByText("80 %")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /guardar evaluación/i }));

    await vi.waitFor(() => expect(editarLeccion).toHaveBeenCalled());
    const [, , cambios] = vi.mocked(editarLeccion).mock.calls[0];
    expect(cambios.cuestionario_version_id).toBe(VERSION.version_id);
    expect(cambios.evaluacion).toBeNull();
  });

  it("al pasar al cuestionario propio suelta la referencia al banco", async () => {
    abrirEdicion(leccion());
    await screen.findByLabelText(/evaluación del banco/i);

    fireEvent.click(screen.getByRole("radio", { name: /escrito dentro de este curso/i }));

    expect(screen.queryByLabelText(/evaluación del banco/i)).toBeNull();
  });

  it("al pasar al banco suelta el cuestionario escrito dentro", async () => {
    // El camino de vuelta. Es el que deja evidencia contradictoria si falla:
    // la lección enseñaría las preguntas de aquí y congelaría las del banco.
    abrirEdicion(leccion({ evaluacion: EVALUACION_PROPIA, cuestionario_version_id: null }));

    fireEvent.click(screen.getByRole("radio", { name: /del banco de evaluaciones/i }));
    const selector = await screen.findByLabelText(/evaluación del banco/i);
    fireEvent.click(selector);
    fireEvent.click(await screen.findByRole("option", { name: /EVA-003.*Inducción SST.*v2/i }));

    fireEvent.click(screen.getByRole("button", { name: /guardar evaluación/i }));

    await vi.waitFor(() => expect(editarLeccion).toHaveBeenCalled());
    const [, , cambios] = vi.mocked(editarLeccion).mock.calls[0];
    expect(cambios.cuestionario_version_id).toBe(VERSION.version_id);
    expect(cambios.evaluacion).toBeNull();
  });

  it("no deja guardar del banco sin haber elegido ninguna", async () => {
    abrirEdicion(leccion({ evaluacion: EVALUACION_PROPIA, cuestionario_version_id: null }));

    fireEvent.click(screen.getByRole("radio", { name: /del banco de evaluaciones/i }));
    await screen.findByLabelText(/evaluación del banco/i);

    fireEvent.click(screen.getByRole("button", { name: /guardar evaluación/i }));

    expect(await screen.findByText(/elige una evaluación del banco/i)).toBeInTheDocument();
    expect(editarLeccion).not.toHaveBeenCalled();
    expect(agregarLeccion).not.toHaveBeenCalled();
  });
});

describe("LeccionesEditor · lo que la pantalla PROMETE del banco", () => {
  it("no dice que corregir el banco corrija los cursos ya publicados", async () => {
    // Lo decía, y era falso: publicar una versión CONGELA el cuestionario, así
    // que ni los cursos publicados ni esta misma lección cambian solos.
    // Prometerlo enseñaba justo el modelo mental contrario al que sostiene el
    // módulo, y se habría descubierto en una auditoría.
    abrirEdicion(leccion());
    await screen.findByLabelText(/evaluación del banco/i);

    expect(screen.queryByText(/se corrige en todos/i)).toBeNull();
    expect(screen.getByText(/lo ya publicado queda congelado/i)).toBeInTheDocument();
  });

  it("una versión sustituida sigue a la vista, marcada", async () => {
    // Esconderla no cambia a dónde apunta la lección: solo deja la pantalla en
    // blanco afirmando que no hay nada elegido.
    vi.mocked(listarVersionesElegibles).mockResolvedValue([
      { ...VERSION, vigente: false },
    ]);
    abrirEdicion(leccion());

    const selector = await screen.findByLabelText(/evaluación del banco/i);
    expect(selector).toHaveTextContent("EVA-003 · Inducción SST · v2");
    expect(screen.getAllByText(/versión anterior/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ya hay una más reciente publicada/i)).toBeInTheDocument();
  });

  it("pide al servidor que incluya la que la lección ya tiene", async () => {
    // Sin esto, abrir una lección cuya versión fue sustituida pedía la lista sin
    // ella y el desplegable quedaba vacío.
    abrirEdicion(leccion());
    await screen.findByLabelText(/evaluación del banco/i);

    expect(listarVersionesElegibles).toHaveBeenCalledWith(VERSION.version_id);
  });
});
