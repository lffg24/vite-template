import { beforeEach, describe, expect, it, vi } from "vitest";

import { abrirEnlace, inscribirse, miCurso, reanudar } from "./participacionService";
import type { ErrorPublico } from "@/types/participacion";

// `vi.hoisted` porque `vi.mock` se eleva por encima de las declaraciones del
// archivo: sin esto, la fábrica del mock se ejecuta antes de que `get` exista.
const { get, post } = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));

vi.mock("axios", () => ({
  default: { create: () => ({ get, post }) },
}));

function fallo(status: number, detail: unknown) {
  return { response: { status, data: { detail } }, message: "Request failed" };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("el motivo decide la pantalla, no el texto", () => {
  it("conserva el código estable que devuelve el servidor", async () => {
    // La interfaz elige pantalla por `motivo`. Comparar por mensaje fallaría en
    // silencio la primera vez que alguien reescriba la redacción.
    get.mockRejectedValueOnce(
      fallo(404, { motivo: "enlace_no_disponible", mensaje: "Este enlace no está disponible." })
    );

    await expect(abrirEnlace("tok")).rejects.toMatchObject({
      motivo: "enlace_no_disponible",
      status: 404,
    });
  });

  it("un fallo de red NO se disfraza de enlace inválido", async () => {
    // El túnel del metro y un enlace revocado son cosas distintas para quien
    // está delante: una se arregla esperando, la otra pidiendo otro enlace.
    get.mockRejectedValueOnce({ message: "Network Error" });

    let capturado: ErrorPublico | null = null;
    try {
      await abrirEnlace("tok");
    } catch (e) {
      capturado = e as ErrorPublico;
    }

    expect(capturado?.motivo).toBe("desconocido");
    expect(capturado?.status).toBeUndefined();
  });

  it("un motivo que el servidor invente no se acepta a ciegas", async () => {
    // Si un despliegue introdujera un código nuevo, la interfaz debe caer en su
    // rama genérica en vez de pasarlo a un `switch` que no lo contempla.
    get.mockRejectedValueOnce(fallo(400, { motivo: "algo_nuevo", mensaje: "x" }));

    await expect(abrirEnlace("tok")).rejects.toMatchObject({ motivo: "desconocido" });
  });

  it("el texto que cambió trae la redacción nueva para volver a presentarla", async () => {
    const vigente = { id: "nuevo", version: 2, contenido: "otra redacción" };
    post.mockRejectedValueOnce(
      fallo(409, { motivo: "texto_cambio", mensaje: "Cambió.", texto_vigente: vigente })
    );

    let capturado: ErrorPublico | null = null;
    try {
      await inscribirse("tok", {
        tipo_documento: "CC",
        numero_documento: "1",
        nombres: "A",
        apellidos: "B",
        aceptaciones: [],
      });
    } catch (e) {
      capturado = e as ErrorPublico;
    }

    expect(capturado?.motivo).toBe("texto_cambio");
    expect(capturado?.texto_vigente).toEqual(vigente);
  });
});

describe("rutas y credenciales", () => {
  it("codifica el token en la URL", async () => {
    // Un token puede llevar `-` y `_` de base64url; codificarlo evita que un
    // carácter inesperado rompa la ruta en vez de responder «no disponible».
    get.mockResolvedValueOnce({ data: {} });
    await abrirEnlace("a/b?c");
    expect(get).toHaveBeenCalledWith("/c/a%2Fb%3Fc");
  });

  it("reanudar manda el secreto y nunca el documento", async () => {
    // No hay endpoint que acepte el documento, y este cliente no debe inventarlo.
    post.mockResolvedValueOnce({ data: {} });
    await reanudar("mi-secreto");
    expect(post).toHaveBeenCalledWith("/c/sesion/reanudar", { secreto: "mi-secreto" });
  });

  it("consultar el curso no manda ningún identificador", async () => {
    // La sesión viaja en la cookie `HttpOnly`. Si este cliente mandara un id,
    // sería un identificador elegible por quien llama.
    get.mockResolvedValueOnce({ data: {} });
    await miCurso();
    expect(get).toHaveBeenCalledWith("/c/sesion/estado");
  });
});
