// ===========================
// TESTES: priceUtils.normalizePrice
// ===========================

import { normalizePrice } from '../../src/utils/priceUtils';

describe('normalizePrice — válidos', () => {
  it.each<[string, number]>([
    ['0', 0],
    ['0,00', 0],
    ['0.00', 0],
    ['5', 5],
    ['25,90', 25.9],
    ['25.90', 25.9],
    ['1,5', 1.5],
    ['1.50', 1.5],
    ['1.500', 1500],        // milhar sem decimal
    ['1.600,00', 1600],     // milhar BR + decimal
    ['1.234.567', 1234567],
    ['10,5', 10.5],
    ['999999', 999999],
  ])('normalizePrice(%j) === %p', (input, expected) => {
    expect(normalizePrice(input)).toBe(expected);
  });
});

describe('normalizePrice — inválidos (null)', () => {
  it.each<string>([
    '',
    '   ',
    ',90',
    '.90',
    'abc',
    'R$ 5',
    '99,99,999',   // duas vírgulas
    '88.88.9',     // grupo de milhar inválido
    '-5',          // não começa com dígito
  ])('normalizePrice(%j) === null', (input) => {
    expect(normalizePrice(input)).toBeNull();
  });
});

describe('normalizePrice — preço zero é aceito (item grátis)', () => {
  it('"0" retorna 0, não null', () => {
    expect(normalizePrice('0')).toBe(0);
    expect(normalizePrice('0')).not.toBeNull();
  });
});
