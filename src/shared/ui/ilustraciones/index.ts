// src/shared/ui/ilustraciones/index.ts
//
// Punto único de entrada. Las pantallas importan de aquí y nunca del catálogo:
// así el dibujo se puede partir en varios archivos, renombrar o rehacer sin que
// se entere ninguna.

export { Ilustracion, type TamanoIlustracion } from "./Ilustracion";
export { CATALOGO, type NombreIlustracion } from "./catalogo";
export { PALETA, type ColorIlustracion } from "./paleta";
