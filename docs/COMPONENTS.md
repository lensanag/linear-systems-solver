# Components Documentation

## AppContent.tsx

**Path**: `src/components/AppContent.tsx`

**Purpose**: Main application layout and orchestration.

### State
- `showHistory`, `showExamples`, `showTour`, `showAbout` - Modal visibility
- `exportResult` - For ExportMenu (separate from store to avoid re-renders)

### Store Integration
Reads directly from store for display:
```typescript
const { steps, solution, hasNoSolution, hasInfiniteSolutions, coefficients, headers, method } = useStore();
```

### Key Handlers

**handleSolve**: Executes selected algorithm
- Gets current method and coefficients from store via `useStore.getState()`
- Calls appropriate solver function
- Stores result via `setResult()`
- Adds to history

**handleRestore**: Restores from history
- Sets method, headers, coefficients
- Calls `clearExecution()` to reset
- Re-executes automatically after 0ms delay

**handleClean**: Resets everything
- Calls `store.resetMatrix()`

## SolverPanel.tsx

**Path**: `src/components/solver/SolverPanel.tsx`

**Purpose**: Method selector, matrix input, and execute button.

### Props
```typescript
interface SolverPanelProps {
  onSolve: (() => void) | null;  // Execute handler (null if no method selected)
  onClean: () => void;            // Reset handler
}
```

### Method Buttons
5-column grid with method abbreviations:
- G (Gaussian), GJ (Gauss-Jordan), Cr (Cramer), Inv (Inverse), LU

### Execute Button States
- **Enabled**: Method selected and matrix/method changed since last execution
- **Disabled**: No method or nothing changed
- **Text**: "Ejecutar" → "Solve" / "Ejecutado" → "Solved" when executed

### MatrixInput Integration
Renders `MatrixInput` with:
- Row add/remove buttons
- Column add/remove buttons
- Individual cell editing

## StepPanel.tsx

**Path**: `src/components/solver/StepPanel.tsx`

**Purpose**: Displays solution steps and final result.

### Props
```typescript
interface StepPanelProps {
  headers: string[];
  steps: Step[];
  solution: Cell[] | null;
  hasNoSolution: boolean;
  hasInfiniteSolutions: boolean;
  initialMatrix: string[][];
  method: MethodId | null;
}
```

### Display Sections
1. **Solution Preview**: Final answer with KaTeX rendering
2. **Steps List**: Expandable accordion of all steps
3. **Step Detail**: Operation description + before/after matrices

### Step Rendering
Each step shows:
- Operation label (e.g., "F₂ → F₂ - (2)F₁")
- Matrix comparison (before → after)
- Key steps highlighted with primary color

## MatrixInput.tsx

**Path**: `src/components/matrix/MatrixInput.tsx`

**Purpose**: Editable matrix grid with variable headers.

### Features
- Variable name headers (x₁, x₂, x₃, ...)
- Augmented matrix separator before last column (b values)
- Row/column add/remove controls
- Individual cell editing with `setCoefficient`

### Layout
```
       x₁      x₂      x₃      b
   ┌─────────────────────────────┐
R₁  │  [  ]  [  ]  [  ]  │  [  ]  │
R₂  │  [  ]  [  ]  [  ]  │  [  ]  │
   └─────────────────────────────┘
         [+ col]    [+ row]
```

## HistoryPanel.tsx

**Path**: `src/components/history/HistoryPanel.tsx`

**Purpose**: Displays saved systems and allows restoration.

### Features
- Modal-style overlay (clicks backdrop to close)
- Preview of each entry (first equation)
- Restore button - reloads system and re-executes
- Delete button - removes single entry
- Clear all button

### Entry Format
```typescript
interface HistoryEntry {
  id: string;
  label: string | null;
  method: MethodId | null;
  rows: number;
  cols: number;
  headers: string[];
  coefficients: string[][];
  createdAt: number;
}
```

## ExportMenu.tsx

**Path**: `src/components/export/ExportMenu.tsx`

**Purpose**: Dropdown menu for exporting solutions.

### Export Formats
- **PDF**: Via browser print dialog
- **PNG**: Canvas rendering of step panel
- **LaTeX**: Raw LaTeX source

### Dependencies
- `jspdf` - PDF generation
- `html2canvas` - PNG capture
- KaTeX - LaTeX rendering

## ExampleSelector.tsx

**Path**: `src/components/tutorial/ExampleSelector.tsx`

**Purpose**: Shows pre-built example systems.

### Data Source
Loads from `/examples.json` (in `public/` folder).

### Examples Format
```typescript
interface Example {
  id: string;
  dimensions: { rows: number; cols: number };
  headers: string[];
  coefficients: string[][];
  method: MethodId;
  description: { es: string; en: string };
  hasNoSolution?: boolean;
  hasInfiniteSolutions?: boolean;
}
```

## TourGuide.tsx

**Path**: `src/components/tutorial/TourGuide.tsx`

**Purpose**: Interactive walkthrough for new users.

### Features
- Step-by-step popovers
- Element highlighting
- Chevron navigation
- Skip/Exit buttons

### Implementation
Uses `driver.js` for the tour engine.

## AboutModal.tsx

**Path**: `src/components/AboutModal.tsx`

**Purpose**: Application information.

### Content
- Description of the tool
- Feature list
- How to use instructions
- Version number

### Styling
Modal overlay with `bg-black/40` backdrop, centered white card.
