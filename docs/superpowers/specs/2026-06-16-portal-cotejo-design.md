# Portal de cotejo — Especificación de diseño

**Fecha:** 2026-06-16
**Estado:** Aprobado

## Resumen

Aplicación web para analistas de crédito que permite capturar, comparar y resolver diferencias entre el archivo del usuario y el archivo del analista en expedientes KYC. El frontend está basado en la Variación C del prototipo existente (`C:\Users\USER\Downloads\prototipo`).

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite |
| Backend | FastAPI (Python) |
| ORM | SQLAlchemy |
| Validación | Pydantic v2 |
| Base de datos | PostgreSQL |
| Comunicación | REST / JSON |
| Contenedores | Docker + Docker Compose |

---

## Arquitectura

```
Navegador del analista
  └── React 18 + Vite (SPA)
        │  HTTP/JSON
        ▼
  FastAPI (Python)
    ├── SQLAlchemy ORM
    └── PostgreSQL
```

El frontend corre en su propio servidor de desarrollo (Vite, puerto 5173). El backend corre en FastAPI (puerto 8000). Se comunican vía REST. CORS configurado para desarrollo local.

---

## Estructura de carpetas

```
prototipo/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routers/
│   │       ├── expedientes.py
│   │       └── resoluciones.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── api.js
│   │   ├── tokens.js          ← reutilizado del prototipo
│   │   ├── pages/
│   │   │   ├── Lista.jsx
│   │   │   └── Cotejo.jsx
│   │   └── components/
│   │       ├── DiffCard.jsx
│   │       ├── RailIzq.jsx
│   │       └── PanelDecision.jsx
│   ├── index.html
│   └── vite.config.js
└── docs/
    └── superpowers/specs/
        └── 2026-06-16-portal-cotejo-design.md
```

---

## Base de datos — 4 tablas

### `expedientes`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | SERIAL PK | |
| numero | VARCHAR | Auto: EXP-YYYY-NNNN |
| solicitante | VARCHAR | Nombre del solicitante |
| tipo | VARCHAR | Ej: "Solicitud de crédito · Persona física" |
| analista_nombre | VARCHAR | Quien creó el expediente |
| estado | ENUM | `en_revision` · `aprobado` · `rechazado` |
| nota_decision | TEXT | Nullable. Nota al aprobar/rechazar |
| creado_en | TIMESTAMP | Auto |
| cerrado_en | TIMESTAMP | Nullable. Se llena al decidir |

### `campos`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | SERIAL PK | |
| expediente_id | FK → expedientes | |
| grupo | VARCHAR | "Identidad", "Contacto", etc. |
| orden | INTEGER | Orden de display dentro del grupo |
| etiqueta | VARCHAR | "RFC", "Domicilio", etc. |
| valor_usuario | TEXT | Lo que declaró el solicitante |
| valor_analista | TEXT | Lo que verificó el analista |
| es_mono | BOOLEAN | True = fuente monoespaciada (códigos) |
| estado | ENUM | `match` · `diff` — calculado al guardar |

### `resoluciones`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | SERIAL PK | |
| expediente_id | FK → expedientes | |
| campo_id | FK → campos | |
| analista_nombre | VARCHAR | Quien resolvió |
| valor_elegido | ENUM | `usuario` · `analista` |
| creado_en | TIMESTAMP | Auto |

**Constraint:** UNIQUE (expediente_id, campo_id) → upsert al actualizar.

### `plantillas_campo`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | SERIAL PK | |
| tipo_expediente | VARCHAR | Ej: "credito_persona_fisica" |
| grupo | VARCHAR | |
| orden | INTEGER | |
| etiqueta | VARCHAR | |
| es_mono | BOOLEAN | |
| activo | BOOLEAN | Default true |

Datos iniciales (seed) basados en los campos del prototipo: Identidad, Contacto, Información financiera, Solicitud.

---

## API — 6 endpoints

### `GET /expedientes`
Lista todos los expedientes.
- Response: `[{ id, numero, solicitante, analista_nombre, estado, creado_en }]`

### Convención: header `X-Analista`
Todos los endpoints de escritura leen el nombre del analista desde el header `X-Analista` (enviado automáticamente por el frontend desde `localStorage`). No se repite en el body.

### `POST /expedientes`
Crea un nuevo expediente y pre-llena sus campos desde la plantilla.
- Header: `X-Analista: <nombre>`
- Body: `{ solicitante, tipo }`
  - `tipo` acepta: `"credito_persona_fisica"` (único valor en v1; el selector en el modal muestra solo esta opción)
- Acción: busca `plantillas_campo` por `tipo`, crea un `campo` por cada entrada con `valor_usuario=""` y `valor_analista=""`.
- Response: expediente completo con campos.

### `GET /expedientes/{id}`
Detalle completo de un expediente.
- Response: expediente + campos agrupados por `grupo` + resoluciones ya guardadas (keyed por `campo_id`).

### `PATCH /expedientes/{id}/campos/{campo_id}`
Corrige el valor de un campo (solo si el expediente está en `en_revision`).
- Body: `{ valor_usuario?, valor_analista? }` — al menos uno requerido.
- Recalcula `estado` (match/diff) al guardar. Si un campo pasa de `diff` a `match`, su resolución se elimina.
- Error 409 si expediente está cerrado.

### `PUT /expedientes/{id}/resoluciones/{campo_id}`
Guarda o actualiza la resolución de un campo con diferencia.
- Header: `X-Analista: <nombre>`
- Body: `{ valor_elegido }` (`"usuario"` | `"analista"`)
- Error 409 si expediente está cerrado.
- Error 400 si el campo es `match` (no necesita resolución).

### `POST /expedientes/{id}/decision`
Aprueba o rechaza un expediente.
- Header: `X-Analista: <nombre>`
- Body: `{ resultado, nota_decision }` — `resultado`: `"aprobado"` | `"rechazado"`.
- Validación: todos los campos `diff` deben tener resolución antes de poder aprobar. El rechazo no requiere resoluciones completas.
- Actualiza `estado`, `cerrado_en` y `nota_decision` del expediente.
- Error 409 si expediente ya está cerrado.

---

## Frontend — 2 páginas

### `/expedientes` — Lista
- Tabla con columnas: Número, Solicitante, Analista, Estado (pill de color), Fecha.
- Botón "Nuevo expediente" abre modal:
  - Campos: Solicitante, Tipo (selector), nombre del analista (pre-llenado desde localStorage).
  - Al confirmar, hace `POST /expedientes` y redirige al cotejo.

### `/expedientes/:id` — Cotejo
Adaptación directa de la Variación C del prototipo:
- **Rail izquierdo:** nombre + expediente, barra de progreso de resoluciones, lista de grupos/secciones.
- **Centro:** DiffCards para cada campo `diff`, lista de campos `match` abajo.
- **Panel derecho:** resumen de coincidencias/diferencias, textarea de nota, botón Aprobar/Rechazar.
- Modo solo-lectura automático si `expediente.estado !== 'en_revision'`: DiffCards deshabilitadas, botones Aprobar/Rechazar ocultos, banner de estado visible ("Aprobado" / "Rechazado").
- Cada clic en una DiffCard hace `PUT /resoluciones/{campo_id}` inmediatamente (sin botón de guardar).

---

## Multi-analista sin autenticación

Al cargar la app por primera vez (o si no hay nombre guardado):
- Se muestra un modal de bienvenida pidiendo el nombre del analista.
- El nombre se guarda en `localStorage` bajo la clave `analista_nombre`.
- Cada request al backend incluye el header `X-Analista: <nombre>`.
- No hay passwords, sesiones, ni JWT. Cualquier analista puede abrir cualquier expediente.

---

## Reglas de negocio

1. Un expediente solo puede aprobarse/rechazarse cuando **todas** las resoluciones de campos `diff` están registradas.
2. Una vez que un expediente está `aprobado` o `rechazado`, ningún endpoint de escritura acepta cambios (error 409).
3. El `estado` de un campo se calcula automáticamente: `match` si `valor_usuario == valor_analista` (strip + lowercase), `diff` si no.
4. El número de expediente se genera automáticamente: `EXP-{AÑO}-{NNNN}` con padding de 4 dígitos.

---

## Docker

### Servicios (`docker-compose.yml`)

| Servicio | Imagen | Puerto | Notas |
|----------|--------|--------|-------|
| `db` | postgres:16-alpine | 5432 | Datos persistidos en volumen `pgdata` |
| `backend` | build desde `backend/Dockerfile` | 8000 | Recarga automática con `--reload` en dev |

El frontend **no corre en Docker** durante desarrollo — Vite corre localmente (`npm run dev`, puerto 5173) para aprovechar el hot-reload instantáneo. El `vite.config.js` tiene un proxy que redirige `/api/*` → `http://localhost:8000`.

### Variables de entorno (`.env.example`)
```
POSTGRES_USER=cotejo
POSTGRES_PASSWORD=cotejo
POSTGRES_DB=cotejo
DATABASE_URL=postgresql://cotejo:cotejo@db:5432/cotejo
```

### `backend/Dockerfile`
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/ ./app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### Arranque en desarrollo
```bash
docker compose up        # levanta db + backend
npm run dev              # en /frontend, corre el frontend
```

Las migraciones (creación de tablas + seed de plantillas) corren automáticamente al iniciar el backend con SQLAlchemy `create_all`.

---

## Fuera de alcance (v1)

- Autenticación / passwords
- Filtros y búsqueda en la lista de expedientes (v2)
- Exportar a PDF o Excel
- Notificaciones o correos
- Subir archivos / documentos adjuntos
