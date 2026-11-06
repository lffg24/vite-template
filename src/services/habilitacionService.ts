// src/services/habilitacionService.ts
//
// Abrir un módulo a una empresa.
//
// Es superficie de PLATAFORMA: no la opera un cliente sobre sus propios datos,
// la opera quien administra ABRIL-360 sobre los de cualquiera. Por eso no vive
// en el cliente de Capacitaciones: la misma pantalla sirve para todos los
// módulos.

import { api } from "@/lib/apiClient";
import { errorApi } from "@/services/capacitacionesService";

const BASE = "/habilitacion";

export interface BanderaDeModulo {
  clave: string;
  nombre: string;
  /** Qué se rompe si no está. Lo dice el servidor para no duplicar el texto. */
  para_que: string;
  /**
   * Lo que de verdad aplica a esta empresa: el override si existe, si no el
   * valor global. `null` es «todavía no está declarada», que no es lo mismo que
   * apagada — aunque el efecto para la empresa sea el mismo.
   */
  efectiva: boolean | null;
  habilitado_global?: boolean;
  override?: boolean | null;
  superficie?: "PLATAFORMA" | "EMPRESA";
}

export interface EstadoDePlataforma {
  modulo: string;
  banderas: Array<BanderaDeModulo & { habilitado_global: boolean }>;
}

export interface ContratoDeModulo {
  id: string;
  estado: "ACTIVO" | "SUSPENDIDO" | "FINALIZADO" | string;
  vigencia_desde: string;
  vigencia_hasta: string | null;
  notas: string | null;
  /** Activo **y** dentro de fechas. Lo calcula el servidor con su propio hoy. */
  vigente: boolean;
}

export interface EstadoDeHabilitacion {
  modulo: string;
  contratos: ContratoDeModulo[];
  contratado: boolean;
  banderas: BanderaDeModulo[];
}

export async function obtenerHabilitacion(
  empresaId: string,
  modulo = "CAPACITACIONES"
): Promise<EstadoDeHabilitacion> {
  try {
    const { data } = await api.get<EstadoDeHabilitacion>(
      `${BASE}/empresas/${empresaId}`,
      { params: { modulo } }
    );
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos consultar la habilitación de esta empresa.");
  }
}

export async function obtenerHabilitacionPlataforma(
  modulo = "CAPACITACIONES"
): Promise<EstadoDePlataforma> {
  try {
    const { data } = await api.get<EstadoDePlataforma>(`${BASE}/plataforma`, {
      params: { modulo },
    });
    return data;
  } catch (e) {
    throw errorApi(e, "No pudimos consultar las funcionalidades globales.");
  }
}

export async function cambiarBanderaGlobal(datos: {
  modulo: string;
  clave: string;
  habilitado: boolean;
}): Promise<void> {
  try {
    await api.post(`${BASE}/plataforma/bandera`, datos);
  } catch (e) {
    throw errorApi(e, "No pudimos cambiar esta funcionalidad global.");
  }
}

export async function crearContrato(
  empresaId: string,
  datos: {
    modulo: string;
    vigencia_desde: string;
    vigencia_hasta?: string | null;
    notas?: string | null;
  }
): Promise<void> {
  try {
    await api.post(`${BASE}/empresas/${empresaId}/contrato`, datos);
  } catch (e) {
    throw errorApi(e, "No pudimos dar de alta el contrato.");
  }
}

export async function cambiarBandera(
  empresaId: string,
  datos: { modulo: string; clave: string; habilitado: boolean }
): Promise<void> {
  try {
    await api.post(`${BASE}/empresas/${empresaId}/bandera`, datos);
  } catch (e) {
    throw errorApi(e, "No pudimos cambiar esta funcionalidad.");
  }
}
