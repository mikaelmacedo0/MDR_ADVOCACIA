// JurisAcompanha — Validador e Formatador de Número Único de Processo (CNJ)
// Padrão da Resolução CNJ nº 65/2008: NNNNNNN-DD.AAAA.J.TR.OOOO

const COURTS_MAP: Record<string, string> = {
  '1': 'Supremo Tribunal Federal (STF)',
  '2': 'Conselho Nacional de Justiça (CNJ)',
  '3': 'Superior Tribunal de Justiça (STJ)',
  '4': 'Justiça Federal (TRF)',
  '5': 'Justiça do Trabalho (TRT)',
  '6': 'Justiça Eleitoral (TRE)',
  '7': 'Justiça Militar da União',
  '8': 'Justiça Estadual (TJ)',
  '9': 'Justiça Militar Estadual',
};

/**
 * Remove caracteres não numéricos.
 */
export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Formata uma string de 20 dígitos no padrão NNNNNNN-DD.AAAA.J.TR.OOOO.
 */
export function formatCNJ(value: string): string {
  const digits = cleanDigits(value).slice(0, 20);
  if (!digits) return '';

  let res = digits;
  if (digits.length > 7) {
    res = digits.slice(0, 7) + '-' + digits.slice(7);
  }
  if (digits.length > 9) {
    res = digits.slice(0, 7) + '-' + digits.slice(7, 9) + '.' + digits.slice(9);
  }
  if (digits.length > 13) {
    res = digits.slice(0, 7) + '-' + digits.slice(7, 9) + '.' + digits.slice(9, 13) + '.' + digits.slice(13);
  }
  if (digits.length > 14) {
    res = digits.slice(0, 7) + '-' + digits.slice(7, 9) + '.' + digits.slice(9, 13) + '.' + digits.slice(13, 14) + '.' + digits.slice(14);
  }
  if (digits.length > 16) {
    res = digits.slice(0, 7) + '-' + digits.slice(7, 9) + '.' + digits.slice(9, 13) + '.' + digits.slice(13, 14) + '.' + digits.slice(14, 16) + '.' + digits.slice(16);
  }
  return res;
}

/**
 * Validação do dígito verificador CNJ usando Módulo 97 na base 100.
 * Algoritmo da Resolução 65/2008 do CNJ:
 * D1D2 = 98 - ( (NNNNNNN * 10^13 + AAAA * 10^9 + J * 10^8 + TR * 10^6 + OOOO * 10^2) % 97 )
 */
export function validateCNJ(rawNumber: string): {
  isValid: boolean;
  formatted?: string;
  error?: string;
  details?: {
    orderNumber: string;
    checkDigits: string;
    year: string;
    judiciarySegment: string;
    court: string;
    originUnit: string;
  };
} {
  const digits = cleanDigits(rawNumber);

  if (digits.length !== 20) {
    return {
      isValid: false,
      error: `Número CNJ deve possuir exatamente 20 dígitos (fornecidos: ${digits.length}).`,
    };
  }

  const orderNumber = digits.slice(0, 7);
  const checkDigits = digits.slice(7, 9);
  const year = digits.slice(9, 13);
  const judiciarySegment = digits.slice(13, 14);
  const tr = digits.slice(14, 16);
  const originUnit = digits.slice(16, 20);

  // Validação básica do ano
  const currentYear = new Date().getFullYear();
  const yearNum = parseInt(year, 10);
  if (yearNum < 1900 || yearNum > currentYear + 1) {
    return {
      isValid: false,
      error: `Ano do processo inválido: ${year}.`,
    };
  }

  // Validação do segmento judiciário (1 a 9)
  const segmentDesc = COURTS_MAP[judiciarySegment];
  if (!segmentDesc) {
    return {
      isValid: false,
      error: `Segmento judiciário '${judiciarySegment}' não reconhecido.`,
    };
  }

  // Cálculo do Módulo 97:
  // Bloco 1: NNNNNNN % 97
  const n = BigInt(orderNumber);
  const r1 = n % 97n;

  // Bloco 2: (r1 * 1000000 + AAAA * 100 + J) % 97
  const part2 = r1 * 1000000n + BigInt(year) * 100n + BigInt(judiciarySegment);
  const r2 = part2 % 97n;

  // Bloco 3: (r2 * 1000000 + TR * 10000 + OOOO * 100) % 97
  const part3 = r2 * 1000000n + BigInt(tr) * 10000n + BigInt(originUnit) * 100n;
  const r3 = part3 % 97n;

  // Dígito esperado
  const expectedCheckNum = 98n - (r3 % 97n);
  const expectedCheckDigits = expectedCheckNum.toString().padStart(2, '0');

  if (checkDigits !== expectedCheckDigits) {
    return {
      isValid: false,
      error: `Dígitos verificadores inválidos: ${checkDigits} (esperado: ${expectedCheckDigits}).`,
    };
  }

  return {
    isValid: true,
    formatted: formatCNJ(digits),
    details: {
      orderNumber,
      checkDigits,
      year,
      judiciarySegment: segmentDesc,
      court: `${segmentDesc} (Região ${tr})`,
      originUnit,
    },
  };
}
