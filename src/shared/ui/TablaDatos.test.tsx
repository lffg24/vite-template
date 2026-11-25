import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { Aviso } from "./Aviso";
import { CeldaPrincipal, TablaDatos, type ColumnaTabla } from "./TablaDatos";

type Fila = { id: number; nombre: string; saldo: number };

const FILAS: Fila[] = [
  { id: 1, nombre: "Zeta", saldo: 9 },
  { id: 2, nombre: "Ácido", saldo: 10 },
  { id: 3, nombre: "beta", saldo: 100 },
];

const COLUMNAS: ColumnaTabla<Fila>[] = [
  {
    clave: "nombre",
    titulo: "Nombre",
    celda: (f) => <CeldaPrincipal titulo={f.nombre} a={`/x/${f.id}`} />,
    valor: (f) => f.nombre,
  },
  {
    clave: "saldo",
    titulo: "Saldo",
    alineacion: "derecha",
    celda: (f) => f.saldo,
    valor: (f) => f.saldo,
  },
];

function pintar(extra: Partial<Parameters<typeof TablaDatos<Fila>>[0]> = {}) {
  return render(
    <MemoryRouter>
      <TablaDatos
        filas={FILAS}
        columnas={COLUMNAS}
        claveFila={(f) => String(f.id)}
        etiquetaTabla="Prueba"
        etiquetaElemento="filas"
        {...extra}
      />
    </MemoryRouter>
  );
}

/** Las celdas de la TABLA, no las de la tarjeta de móvil. */
function filasDeTabla() {
  const cuerpo = screen.getByRole("table").querySelectorAll("tbody tr");
  return Array.from(cuerpo).map((tr) => tr.querySelector("td")?.textContent ?? "");
}

describe("TablaDatos · modo cliente", () => {
  it("ordena como un hispanohablante espera: la Á con la A y el 100 después del 10", () => {
    pintar({ ordenInicial: { clave: "nombre" } });
    expect(filasDeTabla()).toEqual(["Ácido", "beta", "Zeta"]);

    fireEvent.click(screen.getByRole("button", { name: /Saldo/ }));
    expect(filasDeTabla()).toEqual(["Zeta", "Ácido", "beta"]);
  });

  it("no muta el array que recibe: el orden del servidor sobrevive", () => {
    const original = [...FILAS];
    pintar({ ordenInicial: { clave: "nombre" } });
    expect(FILAS).toEqual(original);
  });
});

describe("TablaDatos · modo servidor", () => {
  it("NO vuelve a cortar unas filas que ya vienen cortadas", () => {
    // El error clásico al migrar: la pantalla pide la página 3 y la tabla le
    // aplica encima su propio recorte, así que enseña las primeras N de esa
    // página y pierde el resto.
    pintar({
      control: { pagina: 3, tamano: 2, total: 57, onPagina: vi.fn() },
    });
    expect(filasDeTabla()).toHaveLength(3);
    expect(screen.getByText("57")).toBeInTheDocument();
  });

  it("pide la página al dueño de los datos en vez de guardársela", () => {
    const onPagina = vi.fn();
    pintar({ control: { pagina: 2, tamano: 10, total: 100, onPagina } });

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    expect(onPagina).toHaveBeenCalledWith(3);
  });

  it("una columna solo se ordena si el servidor sabe hacerlo", () => {
    const onOrden = vi.fn();
    const columnas: ColumnaTabla<Fila>[] = [
      { ...COLUMNAS[0], ordenable: true },
      // Sin `ordenable`: `valor` no basta cuando manda el servidor, porque
      // ordenar aquí solo ordenaría la página visible.
      COLUMNAS[1],
    ];
    pintar({ columnas, control: { pagina: 1, tamano: 10, total: 3, onPagina: vi.fn(), onOrden } });

    expect(screen.queryByRole("button", { name: /Saldo/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Nombre/ }));
    expect(onOrden).toHaveBeenCalledWith({ clave: "nombre", direccion: "asc" });
  });

  it("esconde el selector de filas por página si el servidor no deja cambiarlo", () => {
    pintar({ control: { pagina: 1, tamano: 10, total: 3, onPagina: vi.fn() } });
    expect(screen.queryByLabelText("Filas por página")).toBeNull();
  });
});

describe("TablaDatos · modo cursor", () => {
  it("no promete un total que el servidor no sabe", () => {
    pintar({
      control: {
        modo: "cursor",
        pagina: 2,
        hayAnterior: true,
        haySiguiente: false,
        onAnterior: vi.fn(),
        onSiguiente: vi.fn(),
      },
    });

    expect(screen.getByText(/Página/)).toBeInTheDocument();
    // Ni «última página» ni «de N registros»: con cursor no se saben.
    expect(screen.queryByRole("button", { name: "Última" })).toBeNull();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });
});

describe("TablaDatos · estados", () => {
  it("el vacío se dice UNA vez, no una en la tabla y otra en las tarjetas", () => {
    pintar({ filas: [], vacio: "No hay nada para este filtro." });
    expect(screen.getAllByText("No hay nada para este filtro.")).toHaveLength(1);
  });

  it("cargando no es lo mismo que vacío, y se oye", () => {
    const { container } = pintar({ filas: [], cargando: true, vacio: "No hay nada." });
    expect(screen.queryByText("No hay nada.")).toBeNull();
    expect(screen.getByText("Cargando filas…")).toBeInTheDocument();

    // Región viva, no `role="status"`: la tabla no puede dejar la pantalla
    // llena de elementos con ese rol, porque el aviso propio de la pantalla
    // deja de poder señalarse.
    expect(container.querySelector("[aria-live]")).not.toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });
});

describe("TablaDatos · tarjetas de móvil", () => {
  /**
   * Pide explícitamente una pantalla estrecha.
   *
   * `vitest.setup.ts` responde «ancha» por omisión, así que las pruebas del
   * resto del producto siguen viendo la tabla y una fila sigue apareciendo UNA
   * vez. Aquí se invierte solo para este bloque.
   */
  function fingirMovil() {
    const original = window.matchMedia;
    const innerWidthOriginal = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { value: 390, configurable: true });
    window.matchMedia = ((consulta: string) => ({
      matches: true,
      media: consulta,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    return () => {
      window.matchMedia = original;
      Object.defineProperty(window, "innerWidth", {
        value: innerWidthOriginal,
        configurable: true,
      });
    };
  }

  it("sustituyen a la tabla, no se pintan junto a ella", () => {
    const restaurar = fingirMovil();
    try {
      pintar();
      // Si las dos formas estuvieran en el documento, cada fila apareceria dos
      // veces: para quien busca texto en la pagina y para cualquier prueba.
      expect(screen.queryByRole("table")).toBeNull();
      expect(screen.getAllByText("Zeta")).toHaveLength(1);
    } finally {
      restaurar();
    }
  });

  it("salen de las mismas columnas, con etiqueta y valor", () => {
    const restaurar = fingirMovil();
    const { container } = pintar();
    const tarjetas = container.querySelectorAll("article");
    expect(tarjetas).toHaveLength(3);

    // La primera columna hace de titular; el resto son pares etiqueta/valor.
    const primera = tarjetas[0] as HTMLElement;
    expect(within(primera).getByRole("link", { name: "Zeta" })).toBeInTheDocument();
    expect(within(primera).getByText("Saldo")).toBeInTheDocument();
    expect(within(primera).getByText("9")).toBeInTheDocument();
    restaurar();
  });

  it("una columna puede quedarse fuera de la tarjeta", () => {
    const restaurar = fingirMovil();
    const { container } = pintar({
      columnas: [COLUMNAS[0], { ...COLUMNAS[1], movil: "oculta" }],
    });
    const primera = container.querySelector("article") as HTMLElement;
    expect(within(primera).queryByText("Saldo")).toBeNull();
    restaurar();
  });
});

describe("CeldaPrincipal", () => {
  it("sin ruta ni acción es texto, no un enlace que no lleva a ninguna parte", () => {
    render(
      <MemoryRouter>
        <CeldaPrincipal titulo="evento.creado" />
      </MemoryRouter>
    );
    expect(screen.getByText("evento.creado")).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });
});

describe("Aviso", () => {
  it("siempre se anuncia: un error que el lector de pantalla calla no llega", () => {
    render(<Aviso titulo="No pudimos guardar">Intenta de nuevo.</Aviso>);
    const aviso = screen.getByRole("alert");
    expect(aviso).toHaveTextContent("No pudimos guardar");
    expect(aviso).toHaveTextContent("Intenta de nuevo.");
  });

  it("el icono es decorativo y el tono sale de los tokens, no de un color crudo", () => {
    const { container } = render(<Aviso tono="atencion">Ojo con esto.</Aviso>);
    const caja = screen.getByRole("alert");
    expect(caja.className).toContain("bg-warning-subtle");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
