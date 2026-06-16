# Lista — Filtros, Búsqueda y Stats Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Transformar la página Lista en un workspace usable para equipos con múltiples analistas y decenas de expedientes, agregando búsqueda en tiempo real, filtros por estado, toggle "solo los míos", y una barra de métricas visuales.

**Architecture:** Toda la lógica es client-side sobre la lista ya cargada del API. Un nuevo componente `FilterBar` encapsula los controles de filtrado y emite el estado de filtros hacia `Lista`. La función de filtrado es pura (sin efectos secundarios) y vive en `src/utils/filtrarExpedientes.js` para ser testeable de forma aislada. `Lista` aplica los filtros sobre el array crudo antes de renderizar.

**Tech Stack:** React 18, Vitest + Testing Library (tests ya configurados), design tokens existentes (`T`).

---

## Componentes y archivos

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `frontend/src/utils/filtrarExpedientes.js` | Crear | Función pura: recibe lista + filtros, retorna lista filtrada |
| `frontend/src/__tests__/filtrarExpedientes.test.js` | Crear | Tests unitarios de la función de filtrado |
| `frontend/src/components/FilterBar.jsx` | Crear | UI: search input + chips de estado + toggle "solo los míos" |
| `frontend/src/components/StatsBar.jsx` | Crear | 3 tarjetas de métricas (En revisión / Aprobado / Rechazado) |
| `frontend/src/pages/Lista.jsx` | Modificar | Integrar FilterBar + StatsBar + aplicar filtros |

---

## Diseño detallado

### `filtrarExpedientes(expedientes, { busqueda, estado, soloMios, analista })`

Función pura que recibe el array completo y un objeto de filtros:
- `busqueda` (string): filtra cuando el nombre del solicitante O el número de expediente incluyen el texto (case-insensitive)
- `estado` (string | null): `"en_revision"`, `"aprobado"`, `"rechazado"`, o `null` para todos
- `soloMios` (boolean): si true, solo muestra expedientes cuyo `analista_nombre` === `analista`
- `analista` (string): nombre del analista activo (del localStorage)

Los filtros se aplican en AND — cada filtro activo reduce el resultado del anterior.

### `StatsBar`

Recibe el array **completo** (no filtrado) y muestra 3 tarjetas:
- **En revisión** — count con color `T.diff` / fondo `T.diffBg`
- **Aprobados** — count con color `T.match` / fondo `T.matchBg`
- **Rechazados** — count con color `T.reject` / fondo `T.rejectBg`

Cada tarjeta es clickeable y activa ese filtro de estado en `FilterBar` (prop `onEstadoClick`).

### `FilterBar`

Props: `{ filtros, onChange, analista }`

Renderiza:
1. **Input de búsqueda** — placeholder "Buscar por nombre o número…", ícono lupa, debounce 200ms
2. **Chips de estado** — `[Todos, En revisión, Aprobado, Rechazado]`, el activo resaltado en `T.navy`
3. **Toggle "Solo los míos"** — checkbox + label "Solo mis expedientes"
4. **Contador de resultados** — "Mostrando X de Y expedientes" (aparece solo cuando hay filtros activos)

### `Lista` modificado

- Agrega estado local `filtros = { busqueda: '', estado: null, soloMios: false }`
- Calcula `expedientesFiltrados = filtrarExpedientes(expedientes, { ...filtros, analista })`
- Renderiza `<StatsBar>` arriba, `<FilterBar>` debajo, tabla usa `expedientesFiltrados`
- StatsBar y FilterBar están coordinados: click en tarjeta de StatsBar actualiza `filtros.estado`

---

## Error handling

No hay nuevas llamadas de red — los errores de carga ya los maneja el `useEffect` existente. Si la búsqueda no encuentra resultados, la tabla muestra "No hay expedientes con esos filtros. [Limpiar filtros]" con un link que resetea los filtros.

---

## Testing

`filtrarExpedientes.test.js` — 6 tests unitarios (función pura, sin render):
1. Sin filtros devuelve lista completa
2. Filtro por busqueda por nombre (case-insensitive)
3. Filtro por busqueda por número
4. Filtro por estado
5. Toggle soloMios
6. Combinación de filtros (busqueda + estado)

No se testea FilterBar ni StatsBar (son presentacionales puros sin lógica).
