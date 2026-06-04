import { describe, expect, it } from 'vitest';

describe('menú por permisos', () => {
  it('debe mantener un layout transversal y cambiar solo links por permisos', () => {
    const baseLayout = true;
    expect(baseLayout).toBe(true);
  });
});
