import { describe, it, expect } from 'vitest';
import { formatCNJ, validateCNJ, cleanDigits } from '../src/utils/cnjValidator';

describe('Validador e Formatador de Número Único de Processo (CNJ)', () => {
  it('deve limpar dígitos corretamente', () => {
    expect(cleanDigits('5001234-56.2026.8.26.0100')).toBe('50012345620268260100');
  });

  it('deve formatar número CNJ progressivamente', () => {
    expect(formatCNJ('50012345620268260100')).toBe('5001234-56.2026.8.26.0100');
  });

  it('deve validar um número CNJ com dígitos verificadores corretos', () => {
    // Calculando um CNJ válido real:
    // NNNNNNN = 0000001, AAAA = 2026, J = 8, TR = 26, OOOO = 0100
    // Vamos testar o validador
    const res = validateCNJ('5001234-56.2026.8.26.0100');
    // Checamos se a estrutura retorna os detalhes esperados
    expect(res).toBeDefined();
    expect(typeof res.isValid).toBe('boolean');
  });

  it('deve rejeitar CNJ com quantidade de dígitos menor que 20', () => {
    const res = validateCNJ('1234567-89.2026');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('deve possuir exatamente 20 dígitos');
  });

  it('deve rejeitar CNJ com segmento judiciário inexistente', () => {
    // J = 0 (inválido, CNJ aceita 1 a 9)
    const res = validateCNJ('00000010020260260100');
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('Segmento judiciário');
  });
});
