# ESPECIFICACIÓN FUNCIONAL Y TÉCNICA

SPA — Solver de Sistemas de Ecuaciones Lineales por Matrices  
Versión 1.0  
Fecha: 2026-04-29

---

## 1. Definición Acotada del Producto

Single Page Application (SPA) para ingresar, resolver y visualizar paso a paso sistemas de ecuaciones lineales mediante operaciones matriciales. Opera en dos modos de motor de cálculo: numérico (fracción racional exacta) y simbólico (CAS completo vía SymPy/Pyodide WASM). El sistema es estrictamente cliente-side; no requiere backend.

### 1.1 Restricciones de scope

- Sistemas M×N con M,N ∈ [1, 20]; coeficientes enteros, racionales o expresiones simbólicas con un único parámetro libre.
- Métodos disponibles: Eliminación Gaussiana, Gauss-Jordan (RREF), Regla de Cramer, Matriz Inversa, Descomposición LU con pivoteo parcial.
- Sin backend, sin autenticación, sin sincronización remota.
- Idiomas soportados: español (default) e inglés.
- No se soporta álgebra con múltiples parámetros simbólicos simultáneos.
- No se soportan funciones trascendentes en modo simbólico salvo las que SymPy admita bajo gramática matemática común.

### 1.2 Modos de motor

| Modo      | Motor                  | Aritmética                   | Métodos habilitados                          |
| --------- | ---------------------- | ---------------------------- | -------------------------------------------- |
| Numérico  | fraction.js + TS       | Racional exacta (fracciones) | Gaussiana, Gauss-Jordan, Cramer, Inversa, LU |
| Simbólico | Pyodide / SymPy (WASM) | CAS completo                 | Gaussiana, Gauss-Jordan                      |

---

## 2. Stack Técnico

| Categoría            | Tecnología                                    | Versión / Notas                           |
| -------------------- | --------------------------------------------- | ----------------------------------------- |
| Bundler              | Vite                                          | Última estable                            |
| Framework UI         | React + TypeScript                            |                                           |
| Componentes UI       | shadcn/ui                                     |                                           |
| Render matemático    | KaTeX                                         | Render LaTeX en browser                   |
| Motor numérico       | fraction.js                                   | Aritmética racional exacta                |
| Motor simbólico      | Pyodide + SymPy                               | WASM, carga diferida bajo demanda         |
| Validación           | zod + react-hook-form                         |                                           |
| Internacionalización | i18next + react-i18next                       |                                           |
| Exportación PDF      | jsPDF + html2canvas                           | Render aproximado, se notifica al usuario |
| Exportación imagen   | html2canvas                                   |                                           |
| Exportación LaTeX    | Generación propia desde AST de pasos          | Documento compilable completo             |
| Progreso de carga    | NProgress                                     | Barra top + ícono lateral colapsable      |
| Persistencia         | IndexedDB (primary) + LocalStorage (fallback) |                                           |
| Service Worker       | Workbox o sw-precache custom                  | Cache-first para Pyodide y assets SPA     |
| Routing              | No requerido                                  | SPA single-view con paneles por pestañas  |

---

## 3. Arquitectura de la Solución

### 3.1 Estructura de directorios

```text
src/
├─ engines/        — Motores de cálculo
│  ├─ numeric/        — Motor fracción racional (fraction.js + TS puro)
│  ├─ symbolic/       — Motor SymPy (Worker que instancia Pyodide)
│  ├─ shared/         — Contrato Step[], tipos compartidos
├─ components/     — Componentes React
│  ├─ matrix/         — MatrixInput, CellInput, ResizeControls, HeaderCell
│  ├─ solver/         — MethodSelector, StepPanel, StepSidebar, SolutionDisplay
│  ├─ history/        — HistoryPanel, HistoryEntry, HistoryList
│  ├─ tutorial/       — TourGuide, ExampleSelector, ExampleRunner
│  ├─ settings/       — LanguageSelector, PyodideStatus
│  ├─ export/         — ExportMenu, PDFExporter, ImageExporter, LaTeXExporter
│  ├─ common/         — Modal, Toast/Notification, LoadingBar, InfoIcon
├─ hooks/          — usePyodide, useHistory, useMatrixState, useI18n
├─ lib/            — parser/, fraction-utils, latex-utils
├─ i18n/           — es.json, en.json
├─ sw/             — service-worker.ts
└─ store/          — Zustand o Context
```

### 3.2 Contrato de datos — Step (runtime, no persistido)

```ts
interface Step {
  phase: string; // ej. 'Eliminación hacia adelante'
  operationLabel: string; // ej. 'F2 → F2 - (3/2)F1'
  matrixBefore: Cell[][]; // estado antes de la operación
  matrixAfter: Cell[][]; // estado después
  descriptionKey: string; // i18n key para texto natural
  isKeyStep: boolean; // pivot u operación de fase
}

type Cell = FractionCell | SymbolicCell;

interface FractionCell {
  type: "fraction";
  num: number;
  den: number;
}
interface SymbolicCell {
  type: "symbolic";
  expression: string;
  latex: string;
}
```

### 3.3 Esquema de persistencia (IndexedDB)

Store: linear_systems

| Campo        | Tipo                    | Descripción                                             |
| ------------ | ----------------------- | ------------------------------------------------------- |
| id           | string (UUID)           | Identificador único auto-generado                       |
| label        | string \| null          | Etiqueta opcional ingresada por el usuario              |
| mode         | 'numeric' \| 'symbolic' | Modo de motor seleccionado                              |
| method       | MethodId \| null        | Método seleccionado al guardar                          |
| rows         | number                  | Número de filas (ecuaciones)                            |
| cols         | number                  | Número de columnas (incógnitas + término independiente) |
| headers      | string[]                | Nombres de incógnitas editados por el usuario           |
| coefficients | string[][]              | Valores de celda como strings (fracción o expresión)    |
| paramSymbol  | string \| null          | Símbolo del parámetro simbólico (solo modo simbólico)   |
| createdAt    | number                  | Timestamp Unix (ms)                                     |

---

## 4. Casos de Uso

### CU-01 — Ingresar y resolver sistema numérico

| Campo               | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor               | Usuario                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Precondición        | La aplicación está cargada; modo numérico seleccionado (default)                                                                                                                                                                                                                                                                                                                                                                            |
| Flujo principal     | 1. Usuario selecciona modo numérico<br>2. Agrega filas/columnas mediante botones (+fila, +columna)<br>3. Edita celdas con fracciones explícitas (ej. -3/4, 7, 0)<br>4. Edita encabezados de columna si lo desea<br>5. Selecciona método compatible<br>6. Presiona Ejecutar<br>7. Sistema valida entradas; si hay errores muestra Modal + celdas marcadas<br>8. Sistema resuelve y muestra panel de pasos con sidebar de marcadores por fase |
| Postcondición       | Pasos visibles; entrada guardada en IndexedDB automáticamente                                                                                                                                                                                                                                                                                                                                                                               |
| Métodos disponibles | Gaussiana, Gauss-Jordan, Cramer (solo cuadrado), Inversa (solo cuadrado), LU (solo cuadrado)                                                                                                                                                                                                                                                                                                                                                |

### CU-02 — Ingresar y resolver sistema simbólico

| Campo           | Detalle                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor           | Usuario                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Precondición    | Pyodide cargado (o en carga); usuario selecciona modo simbólico                                                                                                                                                                                                                                                                                                                                                                                                           |
| Flujo principal | 1. Usuario selecciona modo simbólico<br>2. Define el símbolo del parámetro (unicode, ≤5 chars, sin colisión con encabezados)<br>3. Ingresa coeficientes como expresiones en notación matemática común (ej. 2a, a^2, a+1)<br>4. Selecciona método (solo Gaussiana o Gauss-Jordan disponibles)<br>5. Presiona Ejecutar<br>6. Pre-validación regex en frontend; validación final en SymPy Worker<br>7. Sistema resuelve simbólicamente y muestra pasos con expresiones KaTeX |
| Postcondición   | Pasos visibles; entrada guardada en IndexedDB                                                                                                                                                                                                                                                                                                                                                                                                                             |

### CU-03 — Gestionar historial

| Campo           | Detalle                                                                                                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor           | Usuario                                                                                                                                                                                                                                                                                           |
| Flujo principal | 1. Abre panel Historial (pestaña)<br>2. Ve lista de entradas con: etiqueta (o auto-ID), resumen primera fila, dimensión, método, timestamp<br>3. Puede: recuperar entrada (re-ejecuta cálculo), eliminar entrada individual (confirmación Modal), limpiar historial completo (confirmación Modal) |
| Edge case       | Entrada simbólica con Pyodide no cargado: muestra spinner en esa entrada, bloquea su selección hasta carga completa                                                                                                                                                                               |

### CU-04 — Exportar solución

| Campo                | Detalle                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| Actor                | Usuario                                                                                                |
| Formatos             | PDF, Imagen (PNG), LaTeX raw (documento compilable completo)                                           |
| Contenido            | Matriz aumentada original + todos los pasos + solución final + metadata (método, dimensión, timestamp) |
| Nombre de archivo    | sistema*{M}x{N}*{metodo}_{fecha}_{timestamp}.{ext}                                                     |
| Notificaciones       | PDF/imagen: alerta de render aproximado. LaTeX con expresiones largas: alerta de posible complejidad.  |
| Idioma del exportado | Sigue el idioma activo en UI al momento de exportar                                                    |

### CU-05 — Tutorial interactivo

| Campo                | Detalle                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actor                | Usuario                                                                                                                                                                             |
| Modalidades          | Tour guiado UI (driver.js/Shepherd.js) o Ejemplo ejecutado automáticamente                                                                                                          |
| Selección de ejemplo | Modal con listado de ejemplos disponibles: uno por método (3×3) + casos edge (sin solución, infinitas soluciones) + ejemplos simbólicos (si Pyodide disponible)                     |
| Tour guiado          | Secuencia fija: selector modo → controles dimensión → tabla → selector método → ejecutar → panel pasos → sidebar → exportación → historial. Solo acción posible: Siguiente / Salir. |
| Ejemplo automático   | Precarga sistema, ejecuta automáticamente, muestra anotaciones sobre cada elemento. Solo acción: Siguiente anotación / Salir.                                                       |
| Interrupción         | Botón Salir disponible en todo momento; restaura estado previo del editor                                                                                                           |

---

## 5. Edge Cases y su Manejo

| Edge Case                                             | Detección                                   | Manejo                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Sistema sin solución (inconsistente)                  | Durante ejecución del método                | Mostrar mensaje con explicación matemática; abortar pasos post-detección; mostrar hasta qué paso se llegó                           |
| Sistema con infinitas soluciones                      | RREF con variables libres detectadas        | Mostrar solución paramétrica general (vector particular + base del espacio nulo)                                                    |
| det = 0 con Cramer/Inversa seleccionado               | Al ejecutar, antes de continuar             | Error con explicación matemática; abortar                                                                                           |
| Determinante simbólico no simplificable               | SymPy no reduce a 0 o no-0                  | Mostrar análisis de casos (valores del parámetro que anulan el det) al final del panel de pasos                                     |
| Sistema rectangular con método cuadrado               | Al cambiar dimensión de la tabla            | Deshabilitar métodos incompatibles; mostrar ícono de información con explicación                                                    |
| Pyodide falla al cargar                               | Timeout o error de red en Service Worker    | Degradar a modo numérico; notificación única; mostrar botón 'Reintentar carga'; limpiar celdas simbólicas al confirmar notificación |
| Colisión símbolo parámetro con encabezado             | Al validar antes de ejecutar                | Error inline en campo de símbolo; bloquear ejecución                                                                                |
| Celda vacía al ejecutar                               | Validación zod al submit                    | Modal resumen de errores + marcar celdas visualmente                                                                                |
| División por cero en fracción ingresada               | Parser de fracción                          | Error inline en celda; bloquear ejecución                                                                                           |
| Valor fuera de rango numérico                         | Validación zod                              | Mensaje con ejemplos de valores admitidos                                                                                           |
| Encabezado duplicado                                  | Validación al editar encabezado             | Error inline; no permite guardar hasta resolución                                                                                   |
| Redimensión con data ingresada                        | Al remover fila/columna con data            | Modal de confirmación destructiva antes de proceder                                                                                 |
| Recuperar entrada con método deshabilitado            | Al cargar del historial                     | Restaurar método guardado; si está deshabilitado por nueva dimensión/modo, resetear a 'Seleccione método' con notificación          |
| Actualización de Pyodide disponible                   | Service Worker detecta nueva versión        | Ícono en UI notificando actualización disponible; instalar a demanda del usuario                                                    |
| navigator.language difiere del idioma guardado        | Al iniciar la app                           | Ofrecer cambio de idioma en notificación no bloqueante                                                                              |
| Exportación LaTeX con expresiones muy largas          | Al generar exportación simbólica            | Alerta al usuario; usar allowdisplaybreaks en documento generado                                                                    |
| Progreso de Pyodide no obtenible (sin Content-Length) | Interceptor fetch sin Content-Length header | Degradar barra NProgress a modo indeterminado automáticamente                                                                       |
| Múltiples celdas con error simultáneamente            | Validación al submit                        | Modal con resumen listado de todas las celdas inválidas; al cerrar, todas marcadas visualmente                                      |

---

## 6. Especificación del Parser de Entradas

### 6.1 Modo numérico — Parser de fracciones

| Expresión               | Resultado | Válido                                |
| ----------------------- | --------- | ------------------------------------- |
| 7 7/1                   | Sí        |
| -3/4 -3/4               | Sí        |
| 3/-4 -3/4 (normalizado) | Sí        |
| 7/3 7/3                 | Sí        |
| 0 0/1                   | Sí        |
| 0/5                     | Rechazado | No — cero como numerador no permitido |
| 1/0                     | Rechazado | No — división por cero                |
| 1.5                     | Rechazado | No — solo fracciones explícitas       |
| abc                     | Rechazado | No — valor no numérico                |

### 6.2 Modo simbólico — Parser notación matemática común

Gramática: notación WolframAlpha/calculadora. Traducción interna a sintaxis SymPy antes de enviar al Worker.

| Expresión entrada | Interpretación                    | Sintaxis SymPy generada |
| ----------------- | --------------------------------- | ----------------------- |
| 2a                | 2 × a                             | 2\*a                    |
| a2                | a × 2                             | a\*2                    |
| ab                | variable 'ab' (longest-match)     | Symbol('ab')            |
| a^2               | a²                                | a\*\*2                  |
| 2^3^2             | 2^(3^2) = 512 (right-associative) | 2**(3**2)               |
| a(2+1)            | a × 3                             | a\*(2+1)                |
| --3               | 3 (doble negación)                | 3                       |
| -a/2              | -a/2                              | -a/2                    |
| sqrt(a)           | √a (si SymPy lo soporta)          | sqrt(a)                 |

Restricciones adicionales del modo simbólico:

- Un único parámetro simbólico por sistema.
- El símbolo del parámetro no puede coincidir con ningún encabezado de columna (incógnita).
- Símbolo del parámetro: carácter(es) unicode, máximo 5 caracteres.
- Pre-validación superficial regex en frontend antes de enviar a SymPy Worker.
- Validación final por SymPy; error de parse reportado de vuelta al UI.

---

## 7. Matriz de Compatibilidad de Métodos

| Método                | Sistema M×N (M≠N) | Sistema N×N | Modo numérico | Modo simbólico | det=0 en ejecución                            |
| --------------------- | ----------------- | ----------- | ------------- | -------------- | --------------------------------------------- |
| Eliminación Gaussiana | Habilitado        | Habilitado  | Habilitado    | Habilitado     | N/A — muestra sol. paramétrica o sin solución |
| Gauss-Jordan (RREF)   | Habilitado        | Habilitado  | Habilitado    | Habilitado     | N/A — ídem                                    |
| Regla de Cramer       | Deshabilitado     | Habilitado  | Habilitado    | Deshabilitado  | Error + abort + explicación matemática        |
| Matriz Inversa        | Deshabilitado     | Habilitado  | Habilitado    | Deshabilitado  | Error + abort + explicación matemática        |
| LU (pivoteo parcial)  | Deshabilitado     | Habilitado  | Habilitado    | Deshabilitado  | N/A — pivoteo garantiza estabilidad           |

Los métodos deshabilitados muestran ícono de información (ⓘ) con tooltip/popover explicando la razón matemática de la incompatibilidad.

---

## 8. Layout y UX

### 8.1 Vista principal (single-view)

- Header: logo/título, selector de idioma (ES/EN), pestañas de paneles (Historial, Tutorial, Configuración).
- Panel editor (área central):
  - Fila de controles: selector modo (numérico/simbólico), campo símbolo parámetro (modo simbólico), selector método, botón Ejecutar.
  - Controles de dimensión: botones + fila, + columna.
  - Tabla de coeficientes: celdas editables con encabezados editables; botón × por fila y columna para eliminar.
- Panel de pasos (aparece post-ejecución):
  - Sidebar izquierdo fijo: marcadores agrupados por fase del algoritmo.
  - Área de contenido: todos los pasos renderizados con KaTeX; scroll con anchor links desde sidebar.
  - En móvil: sidebar como drawer colapsable desde borde izquierdo.
- Barra NProgress (top) + ícono colapsable lateral derecho durante carga de Pyodide.

### 8.2 Paneles superpuestos (pestañas)

Los paneles Historial, Tutorial y Configuración se abren como overlays/drawers sin destruir el estado del editor.

### 8.3 Sistema de notificaciones

| Tipo de evento                                                               | Componente UI                                   | Bloqueante |
| ---------------------------------------------------------------------------- | ----------------------------------------------- | ---------- |
| Confirmación destructiva (eliminar fila/columna con data, limpiar historial) | Modal                                           | Sí         |
| Resumen de errores de validación al ejecutar                                 | Modal (al cerrar → celdas marcadas visualmente) | Sí         |
| Error matemático en ejecución (det=0, sin solución)                          | Modal                                           | Sí         |
| Alerta de render aproximado en exportación PDF/imagen                        | Modal                                           | Sí         |
| Alerta de complejidad en exportación LaTeX                                   | Modal                                           | Sí         |
| Notificación de fallo de Pyodide + botón Reintentar                          | Toast/Banner persistente                        | No         |
| Oferta de cambio de idioma (navigator.language difiere)                      | Toast/Banner descartable                        | No         |
| Notificación de actualización de Pyodide disponible                          | Ícono en header + tooltip                       | No         |
| Métodos incompatibles (tooltip en ícono ⓘ)                                   | Popover inline                                  | No         |

### 8.4 Responsividad

- Tabla de coeficientes: scroll horizontal dentro de su contenedor en viewports estrechos.
- Sidebar de pasos: drawer colapsable desde borde izquierdo en móvil (< 768px breakpoint).
- Layout general: diseño responsive con breakpoints estándar (sm/md/lg de Tailwind vía shadcn).

### 8.5 Encabezados de columna

- Default: x₁, x₂, ..., xₙ (subíndices unicode).
- Editables por el usuario: hasta 5 caracteres, caracteres unicode permitidos, subíndices/superíndices en notación texto plano (x_1, x^2) renderizado como KaTeX, o unicode directo.
- Sin duplicidad permitida; error inline si se ingresa nombre ya usado.

---

## 9. Internacionalización (i18n)

- Librería: i18next + react-i18next.
- Idiomas: español (es, default) e inglés (en).
- Detección inicial: navigator.language; si difiere del guardado en LocalStorage, ofrecer cambio vía toast no bloqueante.
- Selector de idioma: en header principal y en panel de Configuración.
- Persistencia: LocalStorage (clave: preferred_language).
- Scope de traducción: toda la UI, mensajes de error, descripciones de pasos (via i18n keys predefinidas en bundle), metadata de exportación.
- El idioma del archivo exportado (PDF/imagen/LaTeX) sigue el idioma activo en UI al momento de exportar.
- Las descripciones de pasos generadas por el motor se producen como i18n keys; el texto natural se resuelve en el idioma activo.

---

## 10. Criterios de Aceptación Verificables

### 10.1 Motor numérico

1. Dado un sistema 3×3 con solución única, el resultado de Gauss-Jordan coincide celda a celda con el resultado calculado manualmente con aritmética racional.
2. Los pasos intermedios muestran fracciones exactas (no decimales) en todos los casos.
3. Para un sistema inconsistente 2×3, el sistema detecta la inconsistencia y muestra mensaje de error sin producir solución.
4. Para un sistema dependiente 2×3, el sistema muestra solución paramétrica general con variables libres identificadas.
5. Cramer e Inversa están deshabilitados para sistemas no cuadrados (selector no disponible).
6. Para sistema cuadrado con det=0 y método Cramer seleccionado, la ejecución aborta con explicación matemática.

### 10.2 Motor simbólico

7. Pyodide se carga en segundo plano; la UI es usable en modo numérico durante la carga.
8. La barra NProgress muestra progreso real de descarga (o indeterminado si no hay Content-Length).
9. Si Pyodide falla, la UI degrada a modo numérico con notificación única y botón de reintento.
10. Dado un sistema 2×2 con coeficiente 'a' en modo simbólico y Gaussiana, los pasos muestran expresiones KaTeX con el parámetro sin resolver.
11. Para det simbólico = a²-4, el panel de pasos muestra análisis de casos (a=2, a=-2, caso general).
12. El símbolo del parámetro no puede ser igual a ningún encabezado de columna; el sistema muestra error si se intenta.

### 10.3 Validación de entradas

13. Al presionar Ejecutar con celdas vacías, aparece Modal con resumen de errores y las celdas se marcan visualmente al cerrar.
14. La expresión '1/0' en una celda produce error inline; la ejecución no procede.
15. La expresión '0' es aceptada como coeficiente válido (entero cero).
16. Un encabezado duplicado produce error inline; el sistema bloquea la ejecución hasta resolución.

### 10.4 Historial y persistencia

17. Al ejecutar una solución, la entrada se guarda automáticamente en IndexedDB sin acción del usuario.
18. Al recuperar una entrada del historial, el sistema re-ejecuta el cálculo y restaura el método guardado.
19. Eliminar una entrada individual requiere confirmación Modal; la entrada desaparece del listado post-confirmación.
20. Limpiar historial completo requiere confirmación Modal; el historial queda vacío post-confirmación.

#### 10.5 Exportación

21. La exportación PDF produce un archivo que contiene: matriz aumentada original, todos los pasos, solución final, metadata (método, dimensión, timestamp).
22. El nombre del archivo sigue el patrón: sistema*{M}x{N}*{metodo}_{fecha}_{timestamp}.{ext}.
23. Al exportar PDF/imagen, se muestra Modal de alerta sobre render aproximado antes de descargar.
24. La exportación LaTeX produce un documento .tex compilable completo con preamble estándar.
25. El idioma del contenido exportado coincide con el idioma activo en la UI al momento de exportar.

#### 10.6 Tutorial

26. Al activar el tutorial tipo 'tour', la secuencia de pasos es: selector modo → controles dimensión → tabla → selector método → ejecutar → panel pasos → sidebar → exportación → historial. No es posible modificar valores durante el tour.
27. Al activar tutorial tipo 'ejemplo', el sistema precarga el ejemplo seleccionado, lo ejecuta automáticamente y muestra anotaciones navegables.
28. El botón Salir del tutorial está disponible en todo momento y restaura el estado previo del editor.
29. Los ejemplos simbólicos en el listado de selección están deshabilitados (con indicador visual) si Pyodide no ha cargado.

### 10.7 Internacionalización

30. Al cambiar el idioma a inglés, todos los textos de UI, mensajes de error y descripciones de pasos cambian al inglés sin recargar la página.
31. La preferencia de idioma persiste en LocalStorage y se aplica al reiniciar la sesión.
32. Si navigator.language es 'en' y el idioma guardado es 'es', aparece un toast ofreciendo cambiar a inglés.

### 10.8 Responsividad

33. En viewport de 375px de ancho, la tabla de coeficientes tiene scroll horizontal sin desbordar el layout.
34. En viewport de 375px de ancho, el sidebar de marcadores de pasos es un drawer colapsable desde el borde izquierdo.

---

## 11. Catálogo de Ejemplos Precargados

| ID    | Modo      | Dimensión | Método Tipo           | Tipo                                          |
| ----- | --------- | --------- | --------------------- | --------------------------------------------- |
| EJ-01 | Numérico  | 3×3       | Eliminación Gaussiana | Solución única                                |
| EJ-02 | Numérico  | 3×3       | Gauss-Jordan          | Solución única                                |
| EJ-03 | Numérico  | 3×3       | Regla de Cramer       | Solución única                                |
| EJ-04 | Numérico  | 3×3       | Matriz Inversa        | Solución única                                |
| EJ-05 | Numérico  | 3×3       | LU (pivoteo parcial)  | Solución única                                |
| EJ-06 | Numérico  | 2×3       | Gauss-Jordan          | Edge: sin solución (sistema inconsistente)    |
| EJ-07 | Numérico  | 2×3       | Gauss-Jordan          | Edge: infinitas soluciones (sol. paramétrica) |
| EJ-08 | Simbólico | 2×2       | Gaussiana             | Solución simbólica única                      |
| EJ-09 | Simbólico | 2×2       | Gauss-Jordan          | Edge: análisis de casos (det simbólico)       |

_Fin del documento de especificación — v1.0_
