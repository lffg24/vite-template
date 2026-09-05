// src/features/capacitaciones/useConsulta.ts
import { useCallback, useEffect, useRef, useState } from "react";
import type { ErrorApi } from "@/types/capacitaciones";

export type FaseConsulta = "cargando" | "listo" | "error";

export interface Consulta<T> {
  datos: T | null;
  fase: FaseConsulta;
  error: ErrorApi | null;
  /** Vuelve a pedir sin pasar por el estado de carga: la pantalla no parpadea. */
  refrescar: () => Promise<void>;
  /** Sustituye los datos en memoria tras una mutación ya confirmada. */
  fijar: (valor: T) => void;
}

/**
 * Consulta con las cuatro fases que la constitución §26 exige poder pintar:
 * carga, éxito, vacío y error.
 *
 * «Vacío» no es una fase aquí a propósito: solo quien conoce los datos sabe si
 * una lista de cero elementos es un vacío legítimo o un filtro sin resultados,
 * y son dos pantallas distintas. Esto entrega los datos; la pantalla decide.
 *
 * Dos cuidados que sí resuelve, porque olvidarlos produce fallos difíciles de
 * reproducir:
 *
 * - Una respuesta que llega después de desmontar no escribe estado.
 * - Una respuesta lenta que llega después de una petición más nueva se
 *   descarta, en vez de pisar el resultado reciente con el viejo.
 */
export function useConsulta<T>(
  pedir: () => Promise<T>,
  deps: unknown[] = []
): Consulta<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [fase, setFase] = useState<FaseConsulta>("cargando");
  const [error, setError] = useState<ErrorApi | null>(null);

  const vivo = useRef(true);
  const peticion = useRef(0);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const ejecutar = useCallback(
    async (conCarga: boolean) => {
      const mia = ++peticion.current;
      if (conCarga) {
        setFase("cargando");
        setError(null);
      }
      try {
        const resultado = await pedir();
        if (!vivo.current || mia !== peticion.current) return;
        setDatos(resultado);
        setError(null);
        setFase("listo");
      } catch (e) {
        if (!vivo.current || mia !== peticion.current) return;
        setError(e as ErrorApi);
        setFase("error");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    deps
  );

  useEffect(() => {
    void ejecutar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refrescar = useCallback(async () => {
    await ejecutar(false);
  }, [ejecutar]);

  const fijar = useCallback((valor: T) => setDatos(valor), []);

  return { datos, fase, error, refrescar, fijar };
}
