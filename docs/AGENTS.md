# AI Agent Guide

This document helps AI agents understand the project structure and conventions for contributing.

## Project Overview

**Linear Systems Solver** is an educational SPA that solves systems of linear equations using various numerical methods, displaying step-by-step solutions.

- **Stack**: Vite + React + TypeScript + Zustand + Tailwind CSS
- **Purpose**: Educational tool for learning linear algebra
- **Key Feature**: Step-by-step visualization of matrix operations

## Critical Implementation Details

### Fraction Arithmetic (parser.ts)

**IMPORTANT**: All fraction operations MUST be normalized to handle sign conventions correctly.

```typescript
// Correct: Fractions must be normalized
export function normalizeFraction(num: number, den: number): { num: number; den: number } {
  if (num === 0) return { num: 0, den: 1 };
  const gcd = greatestCommonDivisor(Math.abs(num), Math.abs(den));
  const sign = den < 0 ? -1 : 1;  // denominator must be positive
  return {
    num: sign * num / gcd,
    den: sign * den / gcd,
  };
}
```

Every arithmetic function in `parser.ts` should use `normalizeFraction` on its result:
- `multiplyFractions`
- `addFractions`
- `subtractFractions`
- `divideFractions`

### Matrix Representation

Coefficients are stored as `string[][]` for user input flexibility. Algorithms convert to internal fraction format:

```typescript
// User input (string matrix)
coefficients: string[][] = [
  ['1', '2', '3', '14'],
  ['2', '5', '8', '32'],
]

// Internal fraction matrix
matrix: { num: number, den: number }[][]
```

### Back-Substitution Formula

For Gaussian elimination, the back-substitution formula is:

```
For row i with pivot at column j:
  x[j] = (b[i] - sum(a[i,k] * x[k] for k > j)) / a[i,j]
```

Key point: You SUBTRACT the contributions of known variables, and the result is `sum` divided by the pivot (not `sum - pivot`).

### LU Decomposition with Partial Pivoting

When swapping rows during LU decomposition, you must swap BOTH:
1. The coefficient matrix rows
2. The b vector rows
3. The U matrix rows (not just the current column)

```typescript
if (maxRow !== col) {
  [coeffMatrix[col], coeffMatrix[maxRow]] = [coeffMatrix[maxRow], coeffMatrix[col]];
  [bVector[col], bVector[maxRow]] = [bVector[maxRow], bVector[col]];
  [U[col], U[maxRow]] = [U[maxRow], U[col]];  // Also swap U rows!
}
```

## Code Conventions

### Component Structure

Components follow this pattern:
1. Import dependencies
2. Define interfaces for props
3. Extract store values with `useStore()`
4. Define callback handlers
5. Render JSX

```typescript
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  const { state1, action1 } = useStore();

  const handleAction = useCallback((value: Type) => {
    action1(value);
  }, [action1]);

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}
```

### State Management (Zustand)

The store (`useStore.ts`) manages all application state:

**Key state fields:**
- `method: MethodId | null` - Selected solving method
- `coefficients: string[][]` - Current matrix values
- `headers: string[]` - Variable names (x₁, x₂, etc.)
- `steps: Step[]` - Solution steps
- `solution: Cell[] | null` - Final solution
- `lastExecutedCoefficients: string[][] | null` - For Execute button state

**Important**: Matrix-changing operations MUST clear `steps` and `solution`:
- `setCoefficient` - clears steps
- `addRow` / `removeRow` - clears steps
- `addCol` / `removeCol` - clears steps

### Execute Button Logic

The Execute button is disabled when:
```typescript
const coefficientsMatch = JSON.stringify(lastExecutedCoefficients) === JSON.stringify(coefficients);
const isUnchanged = lastExecutedCoefficients !== null && coefficientsMatch && lastExecutedMethod === method;
```

### Step Generation

Each algorithm produces `Step[]` with this structure:
```typescript
interface Step {
  phase: string;           // e.g., 'steps.forward_elimination'
  operationLabel: string;  // e.g., 'F₂ → F₂ - (2)F₁'
  matrixBefore: Cell[][];
  matrixAfter: Cell[][];
  descriptionKey: string;   // i18n key
  isKeyStep: boolean;      // highlight in UI
}
```

### i18n Keys Pattern

All user-facing strings use i18n keys:
- `methods.gaussian` - Method name
- `methods.gaussian.description` - Method description
- `steps.forward_elimination` - Step description
- `history.title` - UI labels

## File Organization

### Adding a New Algorithm

1. Create `src/engines/numeric/yourMethod.ts`
2. Implement `solveYourMethod(coefficients: string[][]): SolveResult`
3. Export from `src/engines/numeric/index.ts`
4. Add method ID to `MethodId` type in `types.ts`
5. Add translations in `src/i18n/es.json` and `src/i18n/en.json`
6. Add button in `SolverPanel.tsx`

### Adding UI Components

1. Create component in appropriate `src/components/` subdirectory
2. Use Tailwind CSS classes matching the color palette
3. Use `lucide-react` icons
4. Support i18n for all user-facing text

### Testing

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
```

Tests are in `tests/` directory. Key test files:
- `numeric.test.ts` - Algorithm correctness
- `history.test.ts` - Store and UI behavior

## Common Pitfalls

1. **Fraction Sign**: Always normalize fractions after arithmetic
2. **Back-substitution**: Use `sum` directly, don't subtract pivot again
3. **LU Pivoting**: Swap entire U matrix rows, not just current column
4. **State Cleanup**: Matrix changes must clear previous solution steps
5. **JSON Comparison**: Use `JSON.stringify` for matrix comparison (deep equality)

## Build and Deploy

```bash
npm run build    # Creates dist/ folder
# Deploy dist/ to any static host
```

The `dist/index.html` references hashed assets and can be served directly.

## Color Palette Reference

```css
/* Primary colors */
--color-primary: #d4526e;      /* Pink - buttons, active states */
--color-secondary: #008c7a;    /* Teal - accents */

/* Backgrounds */
--color-background: #f7f5dd;   /* Cream - page bg */
--color-surface: #ffffff;       /* White - cards */
--color-muted: #f5f5f0;        /* Light - hover states */

/* Text */
--color-text-primary: #1a1a1a;
--color-text-secondary: #4a4a4a;
--color-text-muted: #6b6b6b;

/* Borders */
--color-border: #e8e4cf;
```
