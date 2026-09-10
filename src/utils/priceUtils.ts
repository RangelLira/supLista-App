// ===========================
// UTILITÁRIOS: PREÇO
// ===========================

/**
 * Normaliza entrada de preço BR/US para número.
 *   "25,90"     → 25.9
 *   "1.600,00"  → 1600
 *   "1.500"     → 1500   (milhar sem decimal)
 *   "1.50"      → 1.5    (decimal com ponto)
 *   "0" / "0,00"→ 0      (preço zero é válido — item grátis/brinde)
 * Rejeita (retorna null): vazio, ",90", ".90", "99,99,999", "88.88.9", negativo.
 */
export function normalizePrice(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed || !/^\d/.test(trimmed)) return null;

  const commaCount = (trimmed.match(/,/g) || []).length;
  if (commaCount > 1) return null;

  let normalized: string;
  if (commaCount === 1) {
    const parts = trimmed.split(',');
    if (parts[1].includes('.')) return null;
    normalized = trimmed.replace(/\./g, '').replace(',', '.');
  } else {
    const dotParts = trimmed.split('.');
    if (dotParts.length === 1) {
      normalized = trimmed;
    } else if (dotParts.length === 2) {
      normalized = dotParts[1].length <= 2 ? trimmed : trimmed.replace(/\./g, '');
    } else {
      if (!dotParts.slice(1).every(p => p.length === 3)) return null;
      normalized = trimmed.replace(/\./g, '');
    }
  }

  const value = parseFloat(normalized);
  return isNaN(value) || value < 0 ? null : value;
}
