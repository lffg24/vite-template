import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * Un componente por trabajo, y que siga siendo uno.
 *
 * ## Por qué esta prueba y no una convención escrita
 *
 * La convención ya estaba escrita y aun así el producto acumuló **tres
 * componentes muertos duplicados** —dos `ToastCard`, dos `ConfirmDialog`, dos
 * `SuperAdminLayout`— y **dos paginaciones**. No fue descuido de nadie: copiar un
 * componente para tocarlo sin romper lo de al lado es lo razonable en el momento,
 * y nada avisa después.
 *
 * Esto avisa. No impide crear un componente nuevo: impide que aparezca un SEGUNDO
 * componente para un trabajo que ya tiene el suyo, que es distinto.
 *
 * ## Psicosocial NO se migra
 *
 * Es el monolito inicial, funciona, y tocarlo no compra nada. La dirección es la
 * contraria: del monolito se **extrae** lo que el núcleo necesita y se replica
 * aquí; cuando el núcleo haya madurado, se decidirá qué conviene traer. Estas
 * reglas gobiernan el NÚCLEO y lo que se construye sobre él.
 *
 * ## Por qué la lista de pendientes está aquí dentro
 *
 * Congelar la deuda en una lista tiene una propiedad que un comentario no tiene:
 * **no puede crecer**. Cada archivo que se migra sale de la lista; cada archivo
 * nuevo que incumpla, falla. Una lista que solo mengua es una deuda que se paga;
 * un comentario es una deuda que se olvida.
 */

const RAIZ = join(process.cwd(), "src");

function archivos(directorio: string, acumulado: string[] = []): string[] {
  for (const entrada of readdirSync(directorio)) {
    const ruta = join(directorio, entrada);
    if (statSync(ruta).isDirectory()) {
      archivos(ruta, acumulado);
    } else if (/\.tsx?$/.test(entrada) && !/\.test\.tsx?$/.test(entrada)) {
      acumulado.push(ruta);
    }
  }
  return acumulado;
}

const TODOS = archivos(RAIZ);

/** Ruta relativa con barras normales: en Windows `sep` es `\` y la lista no. */
function comoRuta(absoluta: string): string {
  return relative(RAIZ, absoluta).split(sep).join("/");
}

function contenido(absoluta: string): string {
  return readFileSync(absoluta, "utf-8");
}

describe("el núcleo es uno solo", () => {
  it("ningún componente tiene un gemelo con el mismo nombre", () => {
    // Es la forma que tomó el problema las tres veces: alguien copió el archivo
    // a su módulo, el original siguió evolucionando, y quedó una copia muerta
    // que el siguiente en llegar podía importar sin enterarse.
    const porNombre = new Map<string, string[]>();
    for (const ruta of TODOS) {
      if (comoRuta(ruta).startsWith("pages/")) continue;
      const nombre = ruta.split(sep).pop()!;
      // Solo los que exportan un componente: un `constants.ts` repetido por
      // módulo es normal y deseable.
      if (!/^[A-Z]/.test(nombre)) continue;
      porNombre.set(nombre, [...(porNombre.get(nombre) ?? []), comoRuta(ruta)]);
    }

    const gemelos = [...porNombre.entries()].filter(([, rutas]) => rutas.length > 1);
    expect(gemelos, `Hay componentes duplicados: ${JSON.stringify(gemelos)}`).toEqual([]);
  });

  it("hay UNA paginación en el proyecto", () => {
    // Llegó a haber tres: `StandardPagination`, `SuperAdminPagination` y las
    // listas que no paginaban. Dos de ellas se veían distintas en pantallas
    // contiguas.
    const paginaciones = TODOS.filter((ruta) =>
      /Pagination\.tsx$/.test(ruta) && !comoRuta(ruta).startsWith("components/ui/")
    ).map(comoRuta);

    expect(paginaciones).toEqual(["components/common/StandardPagination.tsx"]);
  });

  /**
   * Pantallas que todavía arman su tabla con las piezas crudas de shadcn en vez
   * de `TablaDatos`.
   *
   * **Esta lista solo puede menguar.** No es una excepción permanente: es la
   * deuda que quedaba el día que se puso el freno, escrita para que se vea. Al
   * migrar una pantalla se borra su línea; si alguien añade una, la prueba falla
   * y la conversación ocurre antes y no seis meses después.
   */
  const TABLAS_SIN_MIGRAR = ["pages/superadmin/SuperAdminPsicologosPage.tsx"];

  it("las tablas salen de TablaDatos, y la deuda no crece", () => {
    const crudas = TODOS.filter(
      (ruta) =>
        contenido(ruta).includes('from "@/components/ui/table"') &&
        !comoRuta(ruta).startsWith("components/ui/")
    ).map(comoRuta);

    const nuevas = crudas.filter((r) => !TABLAS_SIN_MIGRAR.includes(r));
    expect(
      nuevas,
      "Usa `TablaDatos` de `@/shared/ui`: trae orden, paginación y la celda " +
        "principal enlazada, y es lo que hace que todas las tablas se lean igual."
    ).toEqual([]);

    // Y al revés: cuando una de la lista se migre, hay que sacarla de aquí. Sin
    // esto la lista se queda con nombres de pantallas que ya no incumplen y deja
    // de decir la verdad.
    const yaMigradas = TABLAS_SIN_MIGRAR.filter((r) => !crudas.includes(r));
    expect(
      yaMigradas,
      "Ya no usan la tabla cruda: bórralas de TABLAS_SIN_MIGRAR."
    ).toEqual([]);
  });

  it("hay UNA familia de ilustración: el registro", () => {
    // Llegó a haber tres a la vez: una vectorial sobre tokens, `Escena` y el
    // registro. Ahora el registro es la única fuente de rutas y `Escena` es solo
    // su puente de compatibilidad; la vectorial se retiró.
    const vectorial = TODOS.filter((ruta) =>
      comoRuta(ruta).startsWith("shared/ui/ilustraciones/")
    );
    expect(vectorial).toEqual([]);
  });

  it("toda ilustración del registro existe como archivo, y al revés", () => {
    // El `import` ya hace fallar el build cuando falta el archivo. Lo que esto
    // añade es el otro sentido: un `.webp` que nadie registra pesa en el
    // repositorio para siempre sin que ninguna pantalla lo pinte.
    const registro = contenido(
      join(RAIZ, "shared", "ui", "illustration", "illustration.registry.ts")
    );
    const declaradas = [...registro.matchAll(/ilustraciones\/([a-z0-9-]+)\.webp/g)].map(
      (m) => m[1]
    );
    const enDisco = readdirSync(join(RAIZ, "assets", "ilustraciones"))
      .filter((f) => f.endsWith(".webp"))
      .map((f) => f.replace(/\.webp$/, ""));

    expect([...new Set(declaradas)].sort()).toEqual(enDisco.sort());
  });

  it("nadie se escribe su propio aviso emergente", () => {
    // El aviso de la casa es `ToastCard` más el `Toaster` compartido. Uno
    // propio se ve distinto, se cierra distinto y —como ya pasó— se olvida de
    // funcionar sin ratón.
    const propios = TODOS.filter((ruta) => {
      const r = comoRuta(ruta);
      if (r === "components/feedback/ToastCard.tsx") return false;
      if (r.startsWith("components/ui/")) return false;
      return /position:\s*fixed[\s\S]*toast/i.test(contenido(ruta));
    }).map(comoRuta);

    expect(propios).toEqual([]);
  });
});
