import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ReproductorRecurso, urlIncrustable } from "./ReproductorRecurso";
import type { RecursoPublico } from "@/types/participacion";

function rec(parcial: Partial<RecursoPublico>): RecursoPublico {
  return { proveedor: "URL", url: "https://cdn.test/a.pdf", titulo: "M", ...parcial };
}

describe("la dirección incrustable", () => {
  it("convierte las tres formas de YouTube que la gente pega de verdad", () => {
    // Nadie pega una URL de embed: pega la del navegador, la de «compartir» o
    // la de un enlace ya incrustado. Las tres tienen que llegar al mismo sitio.
    const esperada =
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?playsinline=1&rel=0";

    expect(
      urlIncrustable(rec({ proveedor: "YOUTUBE", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }))
    ).toBe(esperada);
    expect(urlIncrustable(rec({ proveedor: "YOUTUBE", url: "https://youtu.be/dQw4w9WgXcQ" }))).toBe(
      esperada
    );
    expect(
      urlIncrustable(rec({ proveedor: "YOUTUBE", url: "https://www.youtube.com/embed/dQw4w9WgXcQ" }))
    ).toBe(esperada);
  });

  it("convierte Vimeo y Drive a su forma de reproductor", () => {
    expect(urlIncrustable(rec({ proveedor: "VIMEO", url: "https://vimeo.com/123456789" }))).toBe(
      "https://player.vimeo.com/video/123456789"
    );
    expect(
      urlIncrustable(rec({ proveedor: "DRIVE", url: "https://drive.google.com/file/d/ABC123/view?usp=sharing" }))
    ).toBe("https://drive.google.com/file/d/ABC123/preview");
  });

  it("devuelve null cuando NO sabe convertirla, en vez de la original", () => {
    // Contraprueba de las anteriores, y la decisión que más importa: meter una
    // página cualquiera en un marco acaba casi siempre en blanco por política
    // del propio sitio, y un marco vacío no le dice nada a quien está cursando.
    // Con `null` la pantalla enseña el enlace, que sí funciona.
    expect(urlIncrustable(rec({ proveedor: "URL", url: "https://cdn.test/guia.pdf" }))).toBeNull();
    expect(urlIncrustable(rec({ proveedor: "VIMEO", url: "https://vimeo.com/canales/algo" }))).toBeNull();
    expect(
      urlIncrustable(rec({ proveedor: "DRIVE", url: "https://drive.google.com/drive/folders/X" }))
    ).toBeNull();
  });

  it("nunca incrusta algo que no sea https", () => {
    // El servicio ya lo rechaza al guardar. Se comprueba también aquí porque
    // una versión publicada ANTES de esa validación podría llevarlo congelado,
    // y un `javascript:` en un `src` ejecuta código en la página del
    // participante — la superficie menos protegida del producto.
    expect(urlIncrustable(rec({ proveedor: "YOUTUBE", url: "http://youtu.be/abc" }))).toBeNull();
    expect(urlIncrustable(rec({ proveedor: "URL", url: "javascript:alert(1)" }))).toBeNull();
    expect(urlIncrustable(rec({ proveedor: "URL", url: "no-es-una-url" }))).toBeNull();
  });
});

describe("el reproductor", () => {
  it("ofrece SIEMPRE el enlace directo, también cuando incrusta", () => {
    // Un `X-Frame-Options: DENY` deja el marco en blanco sin avisar. El enlace
    // es la única salida que le queda a quien está mirando un rectángulo vacío.
    render(
      <ReproductorRecurso
        recurso={rec({ proveedor: "YOUTUBE", url: "https://youtu.be/abc" })}
        tipo="VIDEO"
      />
    );

    expect(screen.getByRole("link", { name: /ver el video en su sitio/i })).toHaveAttribute(
      "href",
      "https://youtu.be/abc"
    );
  });

  it("el marco va con sandbox y sin permiso para navegar por encima", () => {
    // `allow-top-navigation` dejaría que el material sacara al participante de
    // su curso. No se concede, y esta prueba es la que lo mantiene así.
    const { container } = render(
      <ReproductorRecurso
        recurso={rec({ proveedor: "YOUTUBE", url: "https://youtu.be/abc" })}
        tipo="VIDEO"
      />
    );

    const marco = container.querySelector("iframe");
    expect(marco).toBeTruthy();
    expect(marco?.getAttribute("sandbox")).not.toContain("allow-top-navigation");
    expect(marco?.getAttribute("referrerPolicy") ?? marco?.getAttribute("referrerpolicy")).toBe(
      "strict-origin-when-cross-origin"
    );
  });

  it("sin forma incrustable no pinta un marco vacío", () => {
    const { container } = render(
      <ReproductorRecurso recurso={rec({ proveedor: "URL" })} tipo="DOCUMENTO" />
    );

    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: /abrir el documento/i })).toBeInTheDocument();
  });
});
