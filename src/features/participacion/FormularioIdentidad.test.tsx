import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";

import { FormularioIdentidad } from "./FormularioIdentidad";
import type { TextoPresentado } from "@/types/participacion";

const TEXTOS: TextoPresentado[] = [
  {
    clave: "autorizacion_datos_participante",
    texto_id: "t1",
    version: 1,
    finalidad: "Autorizo el tratamiento de mis datos personales.",
    contenido: "Texto largo de la autorización de datos.",
  },
  {
    clave: "declaracion_veracidad",
    texto_id: "t2",
    version: 1,
    finalidad: "Declaro que los datos son veraces.",
    contenido: "Texto largo de la declaración de veracidad.",
  },
];

function montar(onEnviar = vi.fn()) {
  render(<FormularioIdentidad textos={TEXTOS} enviando={false} onEnviar={onEnviar} />);
  return onEnviar;
}

function rellenarDatos() {
  fireEvent.change(screen.getByLabelText(/^número/i), {
    target: { value: "1018442907" },
  });
  fireEvent.change(screen.getByLabelText(/^nombres/i), {
    target: { value: "Maria Fernanda" },
  });
  fireEvent.change(screen.getByLabelText(/^apellidos/i), {
    target: { value: "Ospina Ruiz" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("el foco cuando falla la validación", () => {
  it("va al grupo de autorizaciones cuando es lo único que falta", () => {
    // Era el caso más frecuente —los datos están bien y solo falta marcar— y el
    // foco no iba a ninguna parte: la búsqueda era por `[aria-invalid]`, y las
    // casillas no llevan ese atributo. Quien usa lector de pantalla oía el aviso
    // y no tenía forma de llegar a lo que había que arreglar.
    montar();
    rellenarDatos();

    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    const casillas = screen.getAllByRole("checkbox");
    expect(document.activeElement).toBe(casillas[0]);
  });

  it("va al primer campo con problema cuando falta un dato", () => {
    // Contraprueba: el arreglo del grupo no puede robarle el foco a los campos.
    montar();

    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(document.activeElement).toBe(screen.getByLabelText(/^número/i));
  });

  it("asocia el error del grupo al conjunto, no a una casilla suelta", () => {
    // Faltan LAS DOS, así que el problema es del conjunto. Al enfocar una
    // casilla, el lector anuncia la leyenda del fieldset y su descripción.
    montar();
    rellenarDatos();
    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    const grupo = screen.getByRole("group", { name: /autorizaciones/i });
    const id = grupo.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)?.textContent).toMatch(/marca las dos/i);
  });
});

describe("la asociación accesible del texto legal", () => {
  it("NO describe la casilla con un texto oculto", () => {
    // `hidden` saca el elemento del árbol de accesibilidad, así que apuntar ahí
    // estando colapsado deja un `aria-describedby` que no resuelve a nada: el
    // lector no anuncia ninguna descripción y la referencia es inválida.
    montar();

    for (const casilla of screen.getAllByRole("checkbox")) {
      const id = casilla.getAttribute("aria-describedby");
      if (!id) continue;
      const descripcion = document.getElementById(id);
      expect(descripcion?.hasAttribute("hidden")).toBe(false);
    }
  });

  it("sí la describe cuando el texto está desplegado", () => {
    // Contraprueba: quitar la referencia siempre habría pasado la anterior y
    // habría dejado la casilla sin descripción nunca.
    montar();

    const botones = screen.getAllByRole("button", { name: /leer el texto completo/i });
    fireEvent.click(botones[0]);

    const casilla = screen.getAllByRole("checkbox")[0];
    const id = casilla.getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    expect(document.getElementById(id!)?.hasAttribute("hidden")).toBe(false);
  });

  it("los dos botones de «leer el texto» se distinguen entre sí", () => {
    // Quien navega por botones con un lector de pantalla oiría lo mismo dos
    // veces y no sabría cuál abre cuál.
    montar();

    const nombres = screen
      .getAllByRole("button", { name: /texto completo/i })
      .map((b) => b.getAttribute("aria-label"));

    expect(new Set(nombres).size).toBe(2);
  });
});

describe("lo que el formulario promete", () => {
  it("NO dice que el correo sirva para enviar la constancia", () => {
    // No hay envío por correo. Pedir un dato personal invocando un uso que no
    // existe es pedirlo bajo un motivo falso.
    const { container } = render(
      <FormularioIdentidad textos={TEXTOS} enviando={false} onEnviar={vi.fn()} />
    );

    expect(container.textContent ?? "").not.toMatch(/enviarte la constancia/i);
  });
});

describe("el envío", () => {
  it("manda la versión EXACTA del texto que se presentó", () => {
    // Entre que la pantalla se pinta y la persona marca la casilla cabe una
    // publicación nueva. Sin el `texto_id`, la aceptación quedaría contra un
    // texto que nadie leyó.
    const onEnviar = montar();
    rellenarDatos();
    for (const c of screen.getAllByRole("checkbox")) fireEvent.click(c);

    fireEvent.click(screen.getByRole("button", { name: /ingresar/i }));

    expect(onEnviar).toHaveBeenCalledTimes(1);
    const enviado = onEnviar.mock.calls[0][0];
    expect(enviado.aceptaciones).toEqual([
      { clave: "autorizacion_datos_participante", texto_id_presentado: "t1" },
      { clave: "declaracion_veracidad", texto_id_presentado: "t2" },
    ]);
  });
});
