# Linear Systems Solver

Educational SPA for solving linear systems with step-by-step visualization.

## Quick Start

```bash
npm install
npm run dev      # Development server at http://localhost:5173
npm run build    # Production build
npm run test     # Run tests
```

## Tech Stack

- **Framework**: Vite + React 18 + TypeScript
- **State Management**: Zustand with persist middleware
- **Styling**: Tailwind CSS
- **Math Rendering**: KaTeX
- **Icons**: lucide-react
- **i18n**: react-i18next
- **Testing**: Vitest

## Architecture Overview

```
src/
├── components/           # React components
│   ├── AppContent.tsx    # Main application layout
│   ├── solver/           # Solver-related components
│   │   ├── SolverPanel.tsx   # Method selector + execute button
│   │   └── StepPanel.tsx     # Step-by-step solution display
│   ├── matrix/           # Matrix input components
│   │   └── MatrixInput.tsx   # Editable matrix grid
│   ├── history/          # History panel
│   │   └── HistoryPanel.tsx  # Restore previous systems
│   ├── export/           # Export functionality
│   │   └── ExportMenu.tsx    # PDF, PNG, LaTeX export
│   ├── tutorial/         # Help components
│   │   ├── ExampleSelector.tsx  # Pre-built examples
│   │   └── TourGuide.tsx       # Interactive tour
│   └── AboutModal.tsx
├── engines/              # Numerical algorithms
│   ├── numeric/          # Solver implementations
│   │   ├── gaussian.ts       # Gaussian elimination
│   │   ├── gauss-jordan.ts   # Gauss-Jordan elimination
│   │   ├── cramer.ts         # Cramer's rule
│   │   ├── inverse.ts        # Inverse matrix method
│   │   ├── lu.ts             # LU decomposition
│   │   ├── parser.ts         # Fraction arithmetic
│   │   └── utils.ts          # Matrix helpers
│   └── shared/
│       └── types.ts          # Shared TypeScript interfaces
├── store/
│   └── useStore.ts       # Zustand store
├── i18n/                 # Translations
│   ├── es.json           # Spanish
│   └── en.json           # English
└── lib/                  # Utility libraries
    ├── fraction-utils.ts # Fraction formatting
    ├── latex-utils.ts    # LaTeX generation
    └── db.ts             # IndexedDB helpers
```

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Primary | `#d4526e` | Buttons, active states |
| Secondary | `#008c7a` | Accents, links |
| Background | `#f7f5dd` | Page background |
| Surface | `#ffffff` | Cards, panels |
| Border | `#e8e4cf` | Dividers |
| Text Primary | `#1a1a1a` | Headings |
| Text Secondary | `#4a4a4a` | Body text |
| Text Muted | `#6b6b6b` | Hints, timestamps |

## Supported Methods

1. **Gaussian Elimination** - Forward elimination + back substitution
2. **Gauss-Jordan** - Full reduction to RREF
3. **Cramer's Rule** - Using determinants
4. **Inverse Matrix** - A⁻¹ × b
5. **LU Decomposition** - With partial pivoting

## Key Concepts

### Fraction Handling
All calculations use exact fractions via `fraction.js`. The `parser.ts` module provides:
- `parseFraction(input)` - Parse string to fraction
- `createFraction(num, den)` - Create fraction object
- `multiplyFractions`, `addFractions`, `subtractFractions`, `divideFractions` - Arithmetic
- `normalizeFraction(num, den)` - Reduce fraction and fix sign

### Step Generation
Each algorithm produces `Step[]` with:
- `phase` - Operation phase key
- `operationLabel` - Human-readable operation (e.g., "F₂ → F₂ - (2)F₁")
- `matrixBefore` / `matrixAfter` - State snapshots
- `descriptionKey` - i18n key for translation
- `isKeyStep` - Whether to highlight this step

### State Flow
1. User edits matrix via `MatrixInput`
2. `setCoefficient` updates store, clears `steps`
3. User selects method and clicks Execute
4. Algorithm computes solution, generates steps
5. `setResult` stores results and tracks `lastExecutedCoefficients`
6. Execute button becomes disabled until matrix/method changes
