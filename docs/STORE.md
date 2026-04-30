# State Management (Zustand Store)

## Overview

The application uses Zustand for state management with persist middleware for localStorage.

**File**: `src/store/useStore.ts`

## Store Structure

```typescript
interface AppStore {
  // Core state
  method: MethodId | null;
  headers: string[];
  coefficients: string[][];

  // Solution state
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;

  // UI state
  isLoading: boolean;
  language: 'es' | 'en';

  // History
  history: HistoryEntry[];
  lastExecutedCoefficients: string[][] | null;
  lastExecutedMethod: MethodId | null;

  // Actions
  setMethod: (method: MethodId | null) => void;
  setCoefficients: (coefficients: string[][]) => void;
  setHeaders: (headers: string[]) => void;
  setCoefficient: (row: number, col: number, value: string) => void;
  addRow: () => void;
  addCol: () => void;
  removeRow: (index: number) => void;
  removeCol: (index: number) => void;
  setResult: (result: SolveResult, coefficients: string[][], method: MethodId) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: 'es' | 'en') => void;
  addToHistory: (entry: HistoryEntry) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  resetMatrix: () => void;
  clearExecution: () => void;
}
```

## State Fields

### Core State

| Field | Type | Description |
|-------|------|-------------|
| `method` | `MethodId \| null` | Currently selected solving method |
| `headers` | `string[]` | Variable names (x₁, x₂, x₃, ...) |
| `coefficients` | `string[][]` | Matrix values as strings for flexible input |

### Solution State

| Field | Type | Description |
|-------|------|-------------|
| `steps` | `Step[]` | Step-by-step solution operations |
| `solution` | `Cell[] \| null` | Final solution values |
| `hasNoSolution` | `boolean` | System has no solution |
| `hasInfiniteSolutions` | `boolean` | System has infinite solutions |

### UI State

| Field | Type | Description |
|-------|------|-------------|
| `isLoading` | `boolean` | Loading indicator |
| `language` | `'es' \| 'en'` | Current language |

### History State

| Field | Type | Description |
|-------|------|-------------|
| `history` | `HistoryEntry[]` | Previously solved systems |
| `lastExecutedCoefficients` | `string[][] \| null` | Matrix when solve was last executed |
| `lastExecutedMethod` | `MethodId \| null` | Method when solve was last executed |

## Actions

### Matrix Modification Actions

These actions **clear steps and solution** when called:

#### `setCoefficients(coefficients)`
Sets entire matrix. Also updates headers if new columns added.

#### `setCoefficient(row, col, value)`
Updates single cell. Clears steps and solution.

#### `addRow()`
Adds new row at bottom with empty values. Clears steps.

#### `addCol()`
Adds new column before b column. Adds new header (xₙ). Clears steps.

#### `removeRow(index)`
Removes row at index. Cannot go below 1 row. Clears steps.

#### `removeCol(index)`
Removes column at index. Cannot go below 2 columns (1 variable + b). Clears steps.

### Result Actions

#### `setResult(result, coefficients, method)`
Stores computation result and updates execution tracking.

```typescript
setResult: (result, coefficients, method) => {
  // Stores result and tracking state
  lastExecutedCoefficients: coefficients.map(row => [...row]),
  lastExecutedMethod: method,
  steps: result.steps,
  solution: result.solution,
  hasNoSolution: result.hasNoSolution,
  hasInfiniteSolutions: result.hasInfiniteSolutions,
}
```

#### `clearExecution()`
Resets solution state but keeps matrix and method.

```typescript
clearExecution: () => ({
  steps: [],
  solution: null,
  hasNoSolution: false,
  hasInfiniteSolutions: false,
  lastExecutedCoefficients: null,
  lastExecutedMethod: null,
})
```

### Reset Actions

#### `resetMatrix()`
Resets everything to default state:
- 2×2 matrix (2 rows, 1 variable + b)
- Headers: x₁, x₂
- Clears all solution state
- Clears execution tracking

### History Actions

#### `addToHistory(entry)`
Prepends entry to history array.

#### `removeFromHistory(id)`
Filters out entry by ID.

#### `clearHistory()`
Empties history array.

## Persistence

The store uses Zustand persist middleware with localStorage:

```typescript
persist(
  (set, get) => ({ /* store */ }),
  {
    name: 'linear-systems-store',
    partialize: (state) => ({
      language: state.language,
      history: state.history,
    }),
  }
)
```

**Persisted**: `language` and `history` only
**Not persisted**: Matrix, method, solution (transient state)

## Execute Button Logic

The Execute button uses this condition:

```typescript
const coefficientsMatch =
  JSON.stringify(lastExecutedCoefficients) === JSON.stringify(coefficients);
const isUnchanged =
  lastExecutedCoefficients !== null &&
  coefficientsMatch &&
  lastExecutedMethod === method;

const canExecute = method && !isUnchanged;
```

**Button States**:
- **Enabled**: Method selected AND (matrix OR method changed since last execution)
- **Disabled**: No method OR nothing changed

## Usage in Components

### Reading State
```typescript
const { method, coefficients, steps, solution } = useStore();
```

### Calling Actions
```typescript
const { setMethod, setCoefficient } = useStore();

setMethod('gaussian');
setCoefficient(0, 1, '5');
```

### Using getState()
For actions that need current state:

```typescript
const handleSolve = () => {
  const { method, coefficients } = useStore.getState();
  if (!method) return;
  const result = solveGaussian(coefficients);
  useStore.getState().setResult(result, coefficients, method);
};
```

## Default Values

```typescript
const DEFAULT_COEFFICIENTS = [
  ['', '', ''],  // Row 1: x₁, x₂, b
  ['', '', ''],  // Row 2: x₁, x₂, b
];

const generateHeaders = (count: number): string[] =>
  Array.from({ length: count }, (_, i) => `x${i + 1}`);
```

Initial state:
- `method: null`
- `headers: ['x₁', 'x₂']`
- `coefficients: [['', '', ''], ['', '', '']]`
- `steps: []`
- `solution: null`
- `history: []`
