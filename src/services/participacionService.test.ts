import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  abrirEnlace,
  inscribirse,
  miCurso,
  reanudarConDocumento,
  verificarConstancia,
} from "./participacionService";
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

  it("reanuda por documento dentro del enlace codificado", async () => {
    post.mockResolvedValueOnce({ data: { curso: "Curso" } });

    await reanudarConDocumento("a/b", "CC", " 1010 ");

    expect(post).toHaveBeenCalledWith("/c/a%2Fb/reanudar", {
      tipo_documento: "CC",
      numero_documento: "1010",
    });
  });

  it("consultar el curso no manda ningún identificador", async () => {
    // La sesión viaja en la cookie `HttpOnly`. Si este cliente mandara un id,
    // sería un identificador elegible por quien llama.
    get.mockResolvedValueOnce({ data: {} });
    await miCurso();
    expect(get).toHaveBeenCalledWith("/c/sesion/estado");
  });
});

describe("la verificación pública de una constancia", () => {
  it("manda el código tal como lo tecleó la persona", async () => {
    // Normalizarlo aquí duplicaría una regla que el servidor ya aplica, y las
    // dos copias divergirían la primera vez que alguien cambie una sola.
    get.mockResolvedValueOnce({ data: { folio: 7 } });

    await verificarConstancia("  abcd-2345  ");

    // Solo se recorta el espacio en blanco, que no es parte de ningún código.
    expect(get).toHaveBeenCalledWith("/c/verificar/abcd-2345");
  });

  it("escapa el código antes de meterlo en la ruta", async () => {
    // Es entrada libre de alguien que no se ha autenticado: va a la URL, así que
    // tiene que salir codificada.
    get.mockResolvedValueOnce({ data: { folio: 1 } });

    await verificarConstancia("a/b?c");

    expect(get).toHaveBeenCalledWith("/c/verificar/a%2Fb%3Fc");
  });

  it("conserva el motivo cuando el código no existe", async () => {
    get.mockRejectedValueOnce(
      fallo(404, {
        motivo: "constancia_no_encontrada",
        mensaje: "No encontramos ninguna constancia con ese código.",
      })
    );

    await expect(verificarConstancia("ZZZZ-ZZZZ")).rejects.toMatchObject({
      motivo: "constancia_no_encontrada",
      status: 404,
    });
  });

  it("distingue el límite de peticiones de un código inexistente", async () => {
    // Son dos pantallas distintas: una dice «espera un minuto», la otra «revisa
    // el código». Confundirlas dejaría a alguien reescribiendo un código
    // correcto una y otra vez.
    get.mockRejectedValueOnce(
      fallo(429, { motivo: "demasiadas_peticiones", mensaje: "Demasiados intentos." })
    );

    const e = (await verificarConstancia("ABCD-2345").catch((x) => x)) as ErrorPublico;
    expect(e.motivo).toBe("demasiadas_peticiones");
  });

  it("un fallo de red NO se disfraza de código inexistente", async () => {
    // El túnel del metro y un código que no existe son cosas distintas para
    // quien está delante: una se arregla esperando, la otra revisando el papel.
    get.mockRejectedValueOnce({ message: "Network Error" });

    const e = (await verificarConstancia("ABCD-2345").catch((x) => x)) as ErrorPublico;
    expect(e.motivo).toBe("desconocido");
  });
});
