import { describe, expect, it } from "vitest";
import { BULK_EMPLOYEE_MAX_FILE_SIZE_BYTES, validateBulkEmployeeFile } from "./EmpresaEmpleadosPage";

describe("validateBulkEmployeeFile", () => {
  it("acepta archivos .xlsx y .csv dentro del limite", () => {
    expect(validateBulkEmployeeFile({ name: "plantilla.xlsx", size: 1024 })).toBeNull();
    expect(validateBulkEmployeeFile({ name: "colaboradores.csv", size: 1024 })).toBeNull();
  });

  it("rechaza archivos vacios", () => {
    expect(validateBulkEmployeeFile({ name: "plantilla.xlsx", size: 0 })).toBe("El archivo está vacío.");
  });

  it("rechaza extensiones no soportadas", () => {
    expect(validateBulkEmployeeFile({ name: "colaboradores.pdf", size: 1024 })).toBe("Formato no soportado. Usa .xlsx o .csv.");
  });

  it("rechaza archivos mayores a 5 MB", () => {
    expect(validateBulkEmployeeFile({ name: "plantilla.xlsx", size: BULK_EMPLOYEE_MAX_FILE_SIZE_BYTES + 1 })).toBe(
      "El archivo supera el máximo permitido de 5 MB.",
    );
  });
});
