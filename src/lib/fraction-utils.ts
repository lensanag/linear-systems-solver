import Fraction from 'fraction.js';

export function parseFraction(input: string): { num: number; den: number; value: Fraction } | null {
  const trimmed = input.trim();

  if (trimmed === '' || trimmed === '-') {
    return null;
  }

  const INTEGER_REGEX = /^\s*(-?)\s*(\d+)\s*$/;
  const FRACTION_REGEX = /^\s*(-?)\s*(\d+)\s*\/\s*(\d+)\s*$/;

  if (INTEGER_REGEX.test(trimmed)) {
    const match = INTEGER_REGEX.exec(trimmed);
    if (!match) return null;
    const sign = match[1] === '-' ? -1 : 1;
    const num = parseInt(match[2], 10);
    if (num === 0 && sign === -1) return null;
    return { num, den: 1, value: new Fraction(sign * num) };
  }

  const match = FRACTION_REGEX.exec(trimmed);
  if (!match) return null;

  const sign = match[1] === '-' ? -1 : 1;
  const numerator = parseInt(match[2], 10);
  const denominator = parseInt(match[3], 10);

  if (denominator === 0) return null;
  if (numerator === 0) return null;

  return {
    num: sign * numerator,
    den: denominator,
    value: new Fraction(sign * numerator, denominator),
  };
}

export function toDecimal(num: number, den: number, precision: number = 10): number {
  return Number((num / den).toFixed(precision));
}
