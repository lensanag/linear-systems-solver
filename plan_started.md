Plan de Implementación — Solver de Sistemas de Ecuaciones Lineales
Stack confirmado
- Bundler: Vite + React + TypeScript
- UI: shadcn/ui + Tailwind CSS + KaTeX
- Estado: Zustand
- Validación: zod + react-hook-form
- Motor numérico: fraction.js
- Motor simbólico: Pyodide (WASM) + SymPy
- i18n: i18next + react-i18next
- Tutorial: driver.js
- Exportación: jsPDF + html2canvas
- Persistencia: IndexedDB (Dexie.js) + LocalStorage
- Service Worker: Workbox
---
Fases de implementación
Fase 1: Proyecto base y configuración
1. Inicializar Vite + React + TypeScript
2. Configurar Tailwind + shadcn/ui
3. Configurar i18n (es.json, en.json)
4. Configurar Zustand store
5. Configurar Service Worker con Workbox
Fase 2: Motor numérico (engines/numeric)
- Parser de fracciones (fraction.js)
- Eliminación Gaussiana → pasos
- Gauss-Jordan (RREF) → pasos
- Regla de Cramer → pasos
- Matriz Inversa → pasos
- Descomposición LU con pivoteo parcial → pasos
- Detección de sistemas sin solución/infinite soluciones
Fase 3: Motor simbólico (engines/symbolic)
- Worker con Pyodide
- Carga diferida bajo demanda
- Parser de notación matemática → SymPy
- Eliminación Gaussiana simbólica
- Gauss-Jordan simbólico
- Análisis de casos para determinantes simbólicos
Fase 4: UI del editor
- MatrixInput con celdas editables
- Controles de dimensión (+fila, +columna, eliminar)
- Encabezados de columna editables
- Selector de modo (numérico/simbólico)
- Selector de método con compatibilidad
- Botón Ejecutar con validación
Fase 5: Panel de pasos
- StepSidebar con marcadores por fase
- StepPanel con renderizado KaTeX
- SolutionDisplay
- Sidebar como drawer en móvil
Fase 6: Historial (IndexedDB)
- HistoryPanel
- Guardado automático al ejecutar
- Recuperar, eliminar individual, limpiar todo
Fase 7: Exportación
- ExportMenu (PDF, Imagen, LaTeX)
- PDFExporter con jsPDF
- ImageExporter con html2canvas
- LaTeXExporter generando documento completo
Fase 8: Tutorial
- TourGuide con driver.js
- ExampleSelector con ejemplos precargados
- ExampleRunner con ejecución automática
Fase 9: Notificaciones y modales
- Sistema de modales para confirmaciones
- Toasts para notificaciones no bloqueantes
- Manejo de errores matemáticos en ejecución
---
Archivos a crear (~50 archivos)
src/
├── engines/
│   ├── shared/
│   │   ├── types.ts              # Step, Cell, MethodId, etc.
│   │   └── i18n-keys.ts          # Keys para descripciones de pasos
│   ├── numeric/
│   │   ├── parser.ts             # Parser de fracciones
│   │   ├── gaussian.ts           # Eliminación Gaussiana
│   │   ├── gauss-jordan.ts       # RREF
│   │   ├── cramer.ts             # Regla de Cramer
│   │   ├── inverse.ts            # Matriz Inversa
│   │   └── lu.ts                 # Descomposición LU
│   └── symbolic/
│       ├── parser.ts             # Notación → SymPy
│       ├── worker.ts             # Pyodide Worker
│       ├── gaussian.ts           # Gaussiana simbólica
│       └── gauss-jordan.ts       # RREF simbólica
├── components/
│   ├── matrix/
│   │   ├── MatrixInput.tsx
│   │   ├── CellInput.tsx
│   │   ├── ResizeControls.tsx
│   │   └── HeaderCell.tsx
│   ├── solver/
│   │   ├── MethodSelector.tsx
│   │   ├── StepPanel.tsx
│   │   ├── StepSidebar.tsx
│   │   └── SolutionDisplay.tsx
│   ├── history/
│   │   ├── HistoryPanel.tsx
│   │   └── HistoryList.tsx
│   ├── tutorial/
│   │   ├── TourGuide.tsx
│   │   └── ExampleSelector.tsx
│   ├── settings/
│   │   ├── LanguageSelector.tsx
│   │   └── PyodideStatus.tsx
│   ├── export/
│   │   ├── ExportMenu.tsx
│   │   └── exporters/
│   │       ├── pdf.ts
│   │       ├── image.ts
│   │       └── latex.ts
│   └── common/
│       ├── Modal.tsx
│       ├── Toast.tsx
│       ├── LoadingBar.tsx
│       └── InfoIcon.tsx
├── hooks/
│   ├── usePyodide.ts
│   ├── useHistory.ts
│   ├── useMatrixState.ts
│   └── useI18n.ts
├── lib/
│   ├── db.ts                     # IndexedDB con Dexie
│   ├── fraction-utils.ts
│   └── latex-utils.ts
├── i18n/
│   ├── es.json
│   └── en.json
├── store/
│   └── useStore.ts               # Zustand store
├── sw/
│   └── service-worker.ts
├── App.tsx
├── main.tsx
└── index.css
