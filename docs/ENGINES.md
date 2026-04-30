# Numerical Engines Documentation

All solvers follow the same interface and produce consistent output format.

## Common Interface

```typescript
function solveMethod(coefficients: string[][]): SolveResult

interface SolveResult {
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  freeVariables?: string[];
}

interface Step {
  phase: string;
  operationLabel: string;
  matrixBefore: Cell[][];
  matrixAfter: Cell[][];
  descriptionKey: string;
  isKeyStep: boolean;
}
```

## Fraction System

### Representation
```typescript
interface FractionCell {
  type: 'fraction';
  num: number;  // Numerator (can be negative)
  den: number;  // Denominator (always positive)
}
```

### Normalization Rules
1. Zero is always `0/1`
2. Denominator is always positive
3. Fraction is reduced by GCD
4. Examples: `2/4` → `1/2`, `3/-6` → `-1/2`

### Parser Functions (`parser.ts`)

| Function | Description |
|----------|-------------|
| `parseFraction(input)` | Parse string like "3", "-2/5" to FractionCell |
| `createFraction(num, den)` | Create FractionCell from numbers |
| `normalizeFraction(num, den)` | Reduce and fix sign conventions |
| `isZero(num, den)` | Check if fraction is zero |

### Arithmetic Functions

| Function | Formula |
|----------|---------|
| `addFractions(a, b)` | `(a.num*b.den + b.num*a.den) / (a.den*b.den)` then normalize |
| `subtractFractions(a, b)` | `(a.num*b.den - b.num*a.den) / (a.den*b.den)` then normalize |
| `multiplyFractions(a, b)` | `(a.num*b.num) / (a.den*b.den)` then normalize |
| `divideFractions(a, b)` | `(a.num*b.den) / (a.den*b.num)` then normalize |

## Gaussian Elimination (`gaussian.ts`)

**Method**: Forward elimination + back substitution

### Algorithm Steps

1. **Forward Elimination**
   - For each column `col` from 0 to n-1:
     - Find pivot (largest absolute value in column)
     - Swap rows if needed
     - For each row below pivot:
       - `factor = A[row][col] / A[col][col]`
       - `Row[row] = Row[row] - factor * Row[col]`

2. **Back Substitution**
   - For each row from bottom to top:
     - `x[pivotCol] = (b - sum(A[row][k]*x[k] for k>pivotCol)) / A[row][pivotCol]`

### Step Generation
- `steps.forward_elimination` - Row operations
- `steps.pivoting.swap` - Row swaps
- `steps.backward_substitution` - Back sub steps

### Special Cases
- **No solution**: Zero row with non-zero b
- **Infinite solutions**: Fewer pivots than variables

## Gauss-Jordan Elimination (`gauss-jordan.ts`)

**Method**: Full reduction to Reduced Row Echelon Form (RREF)

### Algorithm Steps

1. **Forward Phase** (same as Gaussian)
   - But continue to reduce ALL rows, not just below

2. **Backward Phase**
   - For each pivot from bottom to top:
     - Normalize pivot row to 1
     - Eliminate above and below

### Key Difference from Gaussian
- Produces identity matrix in coefficient columns
- Solution directly readable from b column
- More operations but simpler extraction

### Step Generation
- `steps.normalize_pivot` - When dividing row by pivot
- `steps.backward_elimination` - Elimination operations
- `steps.pivoting.swap` - Row swaps

## Cramer's Rule (`cramer.ts`)

**Method**: Using determinants

### Formula
For Ax = b:
- `det(A)` - determinant of coefficient matrix
- `xᵢ = det(Aᵢ) / det(A)` where Aᵢ replaces column i with b

### Implementation
1. Compute main determinant
2. For each variable, replace column with b vector
3. Compute new determinant
4. Divide

### Limitations
- Only works for square matrices (n equations, n unknowns)
- Numerically unstable for large systems

## Inverse Matrix Method (`inverse.ts`)

**Method**: x = A⁻¹ × b

### Formula
Uses adjugate method:
1. Compute matrix of minors
2. Apply cofactor signs
3. Transpose to get adjugate
4. Divide by determinant

### Step Generation
- `steps.inverse.adjugate` - Cofactor matrix
- `steps.inverse.normalize` - Division by det
- `steps.inverse.multiply` - Final multiplication

## LU Decomposition (`lu.ts`)

**Method**: A = LU where L is unit lower triangular, U is upper triangular (Doolittle)

### Algorithm (with partial pivoting)

1. **Decomposition** — column by column:
   ```
   For col = 0 to n-1:
     a. Find pivot: maxRow = argmax |A[row][col]| for row = col..n-1
     b. If maxRow != col:
          swap A[col] ↔ A[maxRow]
          swap b[col] ↔ b[maxRow]
          for k = 0..col-1: swap L[col][k] ↔ L[maxRow][k]   ← L entries only, NOT U
     c. Upper-triangle entries (row = 0..col):
          U[row][col] = A[row][col] - Σ L[row][k]*U[k][col]  for k = 0..row-1
     d. Lower-triangle entries (row = col+1..n-1):
          L[row][col] = (A[row][col] - Σ L[row][k]*U[k][col]  for k = 0..col-1) / U[col][col]
   ```

2. **Forward Substitution**: Ly = b
   ```
   For row = 0 to n-1:
     y[row] = b[row] - Σ L[row][k]*y[k]  for k = 0..row-1
   ```
   (L has unit diagonal, so no division needed)

3. **Backward Substitution**: Ux = y
   ```
   For row = n-1 to 0:
     x[row] = (y[row] - Σ U[row][k]*x[k]  for k = row+1..n-1) / U[row][row]
   ```

### Partial Pivoting Notes
- Swap `A` rows and `b` entries to put the largest-magnitude element at the pivot position.
- Also swap the **already-computed L entries** (columns `0..col-1`) for the same row pair — this keeps L consistent after the reordering.
- Do **not** swap U rows: U is upper-triangular and its entries for the current column have not been filled yet at the point of the swap.

### Steps Generated
- `steps.lu.decompose` - Initial state
- `steps.lu.matrices` - L and U matrices
- `steps.lu.forward` - Forward substitution
- `steps.lu.backward` - Back substitution

## Matrix Utilities (`utils.ts`)

### createMatrixFromStrings
Converts string[][] to fraction matrix for algorithm input.

```typescript
createMatrixFromStrings(coefficients: string[][], augCols: number): FractionCell[][]
```

### createStep
Creates a step object for the step list.

```typescript
createStep(
  phase: string,
  operationLabel: string,
  matrixBefore: Cell[][],
  matrixAfter: Cell[][],
  descriptionKey: string,
  isKeyStep: boolean
): Step
```

### cloneMatrix
Creates deep copy of fraction matrix.

### createEmptyResult
Returns empty SolveResult for error cases.

## Type Definitions (`shared/types.ts`)

### MethodId
```typescript
type MethodId = 'gaussian' | 'gauss-jordan' | 'cramer' | 'inverse' | 'lu';
```

### Cell
```typescript
type Cell = FractionCell;  // { type: 'fraction', num: number, den: number }
```

### SolveResult
```typescript
interface SolveResult {
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  freeVariables?: string[];
  caseAnalysis?: CaseAnalysis;
}
```

### Step
```typescript
interface Step {
  phase: string;
  operationLabel: string;
  matrixBefore: Cell[][];
  matrixAfter: Cell[][];
  descriptionKey: string;
  isKeyStep: boolean;
}
```
