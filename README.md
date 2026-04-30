# Sistemas Lineales - Linear Systems Solver

An educational web application for solving systems of linear equations with step-by-step visualization.

![Linear Systems Solver](https://img.shields.io/badge/version-1.0.0-pink)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

**Sistemas Lineales** allows you to:

- Enter custom systems of linear equations
- Solve using 5 different numerical methods
- View step-by-step solution process
- Export results to PDF, PNG, or LaTeX
- Switch between Spanish and English

## Live Demo

Visit the application at `http://localhost:5173` after running the development server.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Features

### 5 Solving Methods

| Method | Description |
|--------|-------------|
| **Gaussian Elimination** | Forward elimination with back substitution |
| **Gauss-Jordan** | Full reduction to Reduced Row Echelon Form (RREF) |
| **Cramer's Rule** | Solution using determinants |
| **Inverse Matrix** | Compute A⁻¹ and multiply by b |
| **LU Decomposition** | Factor A = LU with partial pivoting |

### Step-by-Step Visualization

Each method shows:
- Pivot operations
- Row elimination steps
- Back substitution
- Final solution

### Additional Features

- **Dynamic Matrix Size**: 2×2 up to 6×6 systems
- **Pre-built Examples**: 7 example systems including consistent, inconsistent, and infinite solutions
- **History**: Save and restore previous calculations
- **Export**: PDF, PNG, or LaTeX source
- **Bilingual**: Full Spanish and English support
- **Responsive**: Works on desktop and tablet

## Usage

### 1. Enter Your System

Click on matrix cells to edit coefficients. Add/remove rows and columns as needed.

### 2. Select a Method

Click one of the 5 method buttons:
- **G** - Gaussian Elimination
- **GJ** - Gauss-Jordan
- **Cr** - Cramer's Rule
- **Inv** - Inverse Matrix
- **LU** - LU Decomposition

### 3. Execute

Click **Ejecutar** (Solve) to compute the solution.

### 4. View Steps

Expand each step to see the matrix transformation.

## Color Palette

The application uses a warm, pastel color scheme:

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#d4526e` | Buttons, active elements |
| Secondary | `#008c7a` | Accents, links |
| Background | `#f7f5dd` | Page background |
| Surface | `#ffffff` | Cards, panels |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Zustand | State management |
| Tailwind CSS | Styling |
| KaTeX | Math rendering |
| lucide-react | Icons |
| react-i18next | Internationalization |

## Project Structure

```
src/
├── components/           # React components
│   ├── solver/         # SolverPanel, StepPanel
│   ├── matrix/         # MatrixInput
│   ├── history/        # HistoryPanel
│   ├── export/         # ExportMenu
│   └── tutorial/       # ExampleSelector, TourGuide
├── engines/            # Numerical algorithms
│   ├── numeric/        # gaussian, gauss-jordan, cramer, inverse, lu
│   └── shared/         # types
├── store/              # Zustand state
├── i18n/               # es.json, en.json
└── lib/                # Utilities

public/
├── examples.json       # Pre-built examples
└── favicon.ico
```

## Documentation

For detailed technical documentation, see the `docs/` folder:

| Document | Content |
|----------|---------|
| `docs/README.md` | Technical overview |
| `docs/AGENTS.md` | AI agent guide for contributing |
| `docs/COMPONENTS.md` | Component documentation |
| `docs/ENGINES.md` | Algorithm details |
| `docs/STORE.md` | State management |
| `docs/INDEX.md` | Documentation index |

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - See LICENSE file for details.

---

Built with React + TypeScript + Zustand
