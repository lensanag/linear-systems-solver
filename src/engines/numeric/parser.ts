import Fraction from 'fraction.js';

export interface ParsedFraction {
  num: number;
  den: number;
  value: Fraction;
}

export function createFraction(num: number, den: number): ParsedFraction {
  return {
    num,
    den,
    value: new Fraction(num, den),
  };
}

const FRACTION_REGEX = /^\s*(-?)\s*(\d+)\s*(?:\/\s*(\d+))?\s*$/;
const INTEGER_REGEX = /^\s*(-?)\s*\d+\s*$/;

export function parseFraction(input: string): ParsedFraction | null {
  const trimmed = input.trim();

  if (trimmed === '' || trimmed === '-') {
    return null;
  }

  if (INTEGER_REGEX.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    if (num === 0 && trimmed.includes('-')) {
      return null;
    }
    return {
      num,
      den: 1,
      value: new Fraction(num),
    };
  }

  const match = FRACTION_REGEX.exec(trimmed);
  if (!match) {
    return null;
  }

  const sign = match[1] === '-' ? -1 : 1;
  const numerator = parseInt(match[2], 10);
  const denominator = match[3] ? parseInt(match[3], 10) : 1;

  if (denominator === 0) {
    return null;
  }

  if (numerator === 0) {
    return null;
  }

  return {
    num: sign * numerator,
    den: denominator,
    value: new Fraction(sign * numerator, denominator),
  };
}

export function fractionToLatex(num: number, den: number): string {
  if (den === 1) {
    return num.toString();
  }
  return `\\frac{${num}}{${den}}`;
}

export function fractionToString(num: number, den: number): string {
  if (den === 1) {
    return num.toString();
  }
  return `${num}/${den}`;
}

export function createFractionCell(num: number, den: number) {
  return {
    type: 'fraction' as const,
    num,
    den,
  };
}

export function multiplyFractions(a: ParsedFraction, b: ParsedFraction): ParsedFraction {
  return {
    num: a.num * b.num,
    den: a.den * b.den,
    value: a.value.mul(b.value),
  };
}

export function addFractions(a: ParsedFraction, b: ParsedFraction): ParsedFraction {
  return {
    num: a.num * b.den + b.num * a.den,
    den: a.den * b.den,
    value: a.value.add(b.value),
  };
}

export function subtractFractions(a: ParsedFraction, b: ParsedFraction): ParsedFraction {
  return {
    num: a.num * b.den - b.num * a.den,
    den: a.den * b.den,
    value: a.value.sub(b.value),
  };
}

export function divideFractions(a: ParsedFraction, b: ParsedFraction): ParsedFraction | null {
  if (b.num === 0) {
    return null;
  }
  return {
    num: a.num * b.den,
    den: a.den * b.num,
    value: a.value.div(b.value),
  };
}

export function normalizeFraction(num: number, den: number): { num: number; den: number } {
  if (num === 0) {
    return { num: 0, den: 1 };
  }
  const gcd = greatestCommonDivisor(Math.abs(num), Math.abs(den));
  const sign = den < 0 ? -1 : 1;
  return {
    num: sign * num / gcd,
    den: sign * den / gcd,
  };
}

function greatestCommonDivisor(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function isZero(num: number, _den: number): boolean {
  return num === 0;
}
