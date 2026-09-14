// src/features/capacitaciones/ContextoCapacitaciones.tsx
//
// La única fuente de «¿qué puede hacer esta persona?» dentro del módulo.
//
// Deliberadamente NO se usa `hasPermission` de `AuthContext` en ninguna pantalla
// de Capacitaciones. Aquel lee la lista plana de permisos que el login dejó en
// la sesión, que sale del RBAC global y **no conoce las asignaciones con
// alcance de empresa**. El backend sí las conoce. Las dos fuentes divergían en
// las dos direcciones:
//
// - ocultando una acción que el backend sí autorizaba;
// - y —peor— ofreciendo una que la API iba a rechazar con un 403 que el usuario
//   no puede arreglar.
//
// `GET /capacitaciones/contexto` devuelve capacidades **efectivas**: permiso,
// contrato y bandera ya resueltos por el servidor. Aquí no se recombina nada.

import { createContext, useContext, type ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { obtenerContexto } from "@/services/capacitacionesService";
import type { ContextoCapacidades, ErrorApi } from "@/types/capacitaciones";
import { useConsulta, type FaseConsulta } from "./useConsulta";

interface ValorContexto {
  capacidades: ContextoCapacidades | null;
  fase: FaseConsulta;
  error: ErrorApi | null;
  refrescar: () => Promise<void>;
}

const Contexto = createContext<ValorContexto | null>(null);

export function ProveedorCapacitaciones({ children }: { children: ReactNode }) {
  const consulta = useConsulta<ContextoCapacidades>(() => obtenerContexto(), []);
  return (
    <Contexto.Provider
      value={{
        capacidades: consulta.datos,
        fase: consulta.fase,
        error: consulta.error,
        refrescar: consulta.refrescar,
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useCapacitaciones(): ValorContexto {
  const valor = useContext(Contexto);
  if (valor === null) {
    // Ruidoso a propósito. Un `null` silencioso haría que las capacidades se
    // leyeran como `false` y las pantallas ocultarían acciones legítimas sin
    // que nada lo delatara.
    throw new Error(
      "useCapacitaciones fuera de ProveedorCapacitaciones. El módulo entero " +
        "cuelga de CapacitacionesLayout, que lo monta."
    );
  }
  return valor;
}

/**
 * La primera ruta que este usuario puede abrir.
 *
 * Existe porque aterrizar siempre en el catálogo mandaba a un 403 a quien solo
 * puede asignar. La ruta inicial se calcula con lo que de verdad puede hacer,
 * no con el orden en que se escribieron las pantallas.
 */
export function rutaInicial(capacidades: ContextoCapacidades | null): string {
  // El tablero va PRIMERO cuando se puede asignar: es quien opera la empresa el
  // que necesita saber que hay en marcha. Quien solo redacta catalogo no tiene
  // empresa que mirar —el catalogo es de plataforma—, asi que para el la
  // portada util sigue siendo la lista de cursos.
  if (capacidades?.puede_asignar) return "/capacitaciones/inicio";
  if (capacidades?.puede_editar_catalogo || capacidades?.puede_publicar) {
    return "/capacitaciones/cursos";
  }
  // Sin ninguna capacidad, el estado del módulo es lo único que puede explicar
  // por qué. Y si tampoco puede verlo, esa pantalla lo dirá sin filtrar nada.
  return "/capacitaciones/estado";
}

/**
 * El índice del módulo: manda a la primera pantalla utilizable.
 *
 * Vive aquí y no en `App.tsx` porque necesita el contexto, y el contexto lo
 * monta el layout. Mientras se resuelve no redirige a ninguna parte: hacerlo
 * antes de saber las capacidades mandaría a todo el mundo al catálogo, que es
 * exactamente el aterrizaje en 403 que esto evita.
 */
export function IndiceCapacitaciones() {
  const { capacidades, fase } = useCapacitaciones();
  if (fase === "cargando") {
    return (
      <p role="status" className="font-rel-body text-sm text-rel-muted">
        Comprobando tus permisos…
      </p>
    );
  }
  return <Navigate to={rutaInicial(capacidades)} replace />;
}
