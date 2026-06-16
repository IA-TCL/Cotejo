# Portal de Cotejo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el prototipo de Variación C en una aplicación web funcional con FastAPI, PostgreSQL y React, con pruebas unitarias en backend (pytest/SQLite) y frontend (Vitest/Testing Library).

**Architecture:** FastAPI expone una REST API en puerto 8000; React 18 + Vite corre en puerto 5173 con proxy a `/api`; PostgreSQL persiste los datos en Docker. El backend no toca la DB en tiempo de importación — las tablas se crean vía `entrypoint.sh` al iniciar el contenedor, lo que permite que los tests usen SQLite sin depender de Docker.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2, Pydantic v2, pytest, React 18, Vite 5, react-router-dom v6, Vitest, @testing-library/react, Docker Compose, PostgreSQL 16.

---

## Mapa de archivos

```
prototipo/
├── docker-compose.yml
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              ← FastAPI app + CORS + routers
│   │   ├── database.py          ← engine, SessionLocal, Base, get_db
│   │   ├── models.py            ← Expediente, Campo, Resolucion, PlantillaCampo
│   │   ├── schemas.py           ← Pydantic request/response schemas
│   │   ├── seed.py              ← seed de plantillas_campo (idempotente)
│   │   ├── create_tables.py     ← create_all + seed (llamado por entrypoint)
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── expedientes.py   ← GET list, POST create, GET detail, PATCH campo
│   │       └── resoluciones.py  ← PUT resolución, POST decisión
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py          ← SQLite fixture, TestClient, override get_db
│       ├── test_expedientes.py
│       └── test_resoluciones.py
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── tokens.js            ← design tokens (adaptado del prototipo)
        ├── api.js               ← fetch wrapper con X-Analista header
        ├── App.jsx              ← router + guard de analista
        ├── test/
        │   └── setup.js
        ├── components/
        │   ├── AnalistaModal.jsx
        │   ├── NuevoExpedienteModal.jsx
        │   ├── RailIzq.jsx
        │   ├── DiffCard.jsx
        │   └── PanelDecision.jsx
        ├── pages/
        │   ├── Lista.jsx
        │   └── Cotejo.jsx
        └── __tests__/
            ├── AnalistaModal.test.jsx
            ├── DiffCard.test.jsx
            ├── RailIzq.test.jsx
            └── PanelDecision.test.jsx
```

---

## Task 1: Infraestructura Docker

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `backend/Dockerfile`
- Create: `backend/entrypoint.sh`

- [ ] **Step 1: Crear `docker-compose.yml`**

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file: .env
    volumes:
      - ./backend:/app
    depends_on:
      db:
        condition: service_healthy

volumes:
  pgdata:
```

- [ ] **Step 2: Crear `.env.example`**

```env
POSTGRES_USER=cotejo
POSTGRES_PASSWORD=cotejo
POSTGRES_DB=cotejo
DATABASE_URL=postgresql://cotejo:cotejo@db:5432/cotejo
```

- [ ] **Step 3: Copiar `.env.example` a `.env`**

```bash
cp .env.example .env
```

- [ ] **Step 4: Crear `backend/Dockerfile`**

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

- [ ] **Step 5: Crear `backend/entrypoint.sh`**

```bash
#!/bin/sh
set -e
python -m app.create_tables
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- [ ] **Step 6: Verificar que Docker levanta**

```bash
docker compose up --build
```

Esperado: `backend_1 | INFO: Application startup complete.` en los logs.

- [ ] **Step 7: Commit**

```bash
git add docker-compose.yml .env.example backend/Dockerfile backend/entrypoint.sh
git commit -m "feat: docker-compose con postgres y backend fastapi"
```

---

## Task 2: Backend — database.py + models.py

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/database.py`
- Create: `backend/app/models.py`

- [ ] **Step 1: Crear `backend/requirements.txt`**

```
fastapi==0.115.0
uvicorn[standard]==0.30.6
sqlalchemy==2.0.35
psycopg2-binary==2.9.9
python-dotenv==1.0.1
pydantic==2.9.2
pytest==8.3.3
httpx==0.27.2
```

- [ ] **Step 2: Crear `backend/app/__init__.py`** (vacío)

```python
```

- [ ] **Step 3: Crear `backend/app/database.py`**

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://cotejo:cotejo@localhost:5432/cotejo")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: Crear `backend/app/models.py`**

```python
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Text, Boolean,
    Enum, ForeignKey, DateTime, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class EstadoExpediente(str, enum.Enum):
    en_revision = "en_revision"
    aprobado = "aprobado"
    rechazado = "rechazado"


class EstadoCampo(str, enum.Enum):
    match = "match"
    diff = "diff"


class ValorElegido(str, enum.Enum):
    usuario = "usuario"
    analista = "analista"


class Expediente(Base):
    __tablename__ = "expedientes"

    id = Column(Integer, primary_key=True)
    numero = Column(String, unique=True, nullable=False)
    solicitante = Column(String, nullable=False)
    tipo = Column(String, nullable=False)
    analista_nombre = Column(String, nullable=False)
    estado = Column(
        Enum(EstadoExpediente, name="estadoexpediente"),
        default=EstadoExpediente.en_revision,
        nullable=False,
    )
    nota_decision = Column(Text, nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    cerrado_en = Column(DateTime(timezone=True), nullable=True)

    campos = relationship("Campo", back_populates="expediente", cascade="all, delete-orphan")
    resoluciones = relationship("Resolucion", back_populates="expediente", cascade="all, delete-orphan")


class Campo(Base):
    __tablename__ = "campos"

    id = Column(Integer, primary_key=True)
    expediente_id = Column(Integer, ForeignKey("expedientes.id"), nullable=False)
    grupo = Column(String, nullable=False)
    orden = Column(Integer, nullable=False)
    etiqueta = Column(String, nullable=False)
    valor_usuario = Column(Text, default="")
    valor_analista = Column(Text, default="")
    es_mono = Column(Boolean, default=False)
    estado = Column(
        Enum(EstadoCampo, name="estadocampo"),
        default=EstadoCampo.match,
        nullable=False,
    )

    expediente = relationship("Expediente", back_populates="campos")
    resolucion = relationship("Resolucion", back_populates="campo", uselist=False)


class Resolucion(Base):
    __tablename__ = "resoluciones"

    id = Column(Integer, primary_key=True)
    expediente_id = Column(Integer, ForeignKey("expedientes.id"), nullable=False)
    campo_id = Column(Integer, ForeignKey("campos.id"), nullable=False)
    analista_nombre = Column(String, nullable=False)
    valor_elegido = Column(Enum(ValorElegido, name="valorelegido"), nullable=False)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    __table_args__ = (UniqueConstraint("expediente_id", "campo_id", name="uq_resolucion_campo"),)

    expediente = relationship("Expediente", back_populates="resoluciones")
    campo = relationship("Campo", back_populates="resolucion")


class PlantillaCampo(Base):
    __tablename__ = "plantillas_campo"

    id = Column(Integer, primary_key=True)
    tipo_expediente = Column(String, nullable=False)
    grupo = Column(String, nullable=False)
    orden = Column(Integer, nullable=False)
    etiqueta = Column(String, nullable=False)
    es_mono = Column(Boolean, default=False)
    activo = Column(Boolean, default=True)
```

- [ ] **Step 5: Commit**

```bash
git add backend/requirements.txt backend/app/__init__.py backend/app/database.py backend/app/models.py
git commit -m "feat: sqlalchemy models (expediente, campo, resolucion, plantilla)"
```

---

## Task 3: Backend — schemas.py + seed.py + create_tables.py

**Files:**
- Create: `backend/app/schemas.py`
- Create: `backend/app/seed.py`
- Create: `backend/app/create_tables.py`

- [ ] **Step 1: Crear `backend/app/schemas.py`**

```python
from __future__ import annotations
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel
from .models import EstadoExpediente, EstadoCampo, ValorElegido


class CampoOut(BaseModel):
    id: int
    expediente_id: int
    grupo: str
    orden: int
    etiqueta: str
    valor_usuario: str
    valor_analista: str
    es_mono: bool
    estado: EstadoCampo
    model_config = {"from_attributes": True}


class ResolucionOut(BaseModel):
    id: int
    campo_id: int
    analista_nombre: str
    valor_elegido: ValorElegido
    creado_en: datetime
    model_config = {"from_attributes": True}


class ExpedienteCreate(BaseModel):
    solicitante: str
    tipo: str


class ExpedienteListOut(BaseModel):
    id: int
    numero: str
    solicitante: str
    analista_nombre: str
    estado: EstadoExpediente
    creado_en: datetime
    model_config = {"from_attributes": True}


class ExpedienteDetailOut(BaseModel):
    id: int
    numero: str
    solicitante: str
    tipo: str
    analista_nombre: str
    estado: EstadoExpediente
    nota_decision: Optional[str]
    creado_en: datetime
    cerrado_en: Optional[datetime]
    campos: list[CampoOut]
    resoluciones: list[ResolucionOut]
    model_config = {"from_attributes": True}


class CampoPatch(BaseModel):
    valor_usuario: Optional[str] = None
    valor_analista: Optional[str] = None


class ResolucionCreate(BaseModel):
    valor_elegido: ValorElegido


class DecisionCreate(BaseModel):
    resultado: Literal["aprobado", "rechazado"]
    nota_decision: Optional[str] = None
```

- [ ] **Step 2: Crear `backend/app/seed.py`**

```python
from .models import PlantillaCampo

CAMPOS_CREDITO = [
    {"grupo": "Identidad",               "orden": 1,  "etiqueta": "Nombre completo",      "es_mono": False},
    {"grupo": "Identidad",               "orden": 2,  "etiqueta": "RFC",                   "es_mono": True},
    {"grupo": "Identidad",               "orden": 3,  "etiqueta": "CURP",                  "es_mono": True},
    {"grupo": "Identidad",               "orden": 4,  "etiqueta": "Fecha de nacimiento",   "es_mono": False},
    {"grupo": "Contacto",                "orden": 5,  "etiqueta": "Domicilio",             "es_mono": False},
    {"grupo": "Contacto",                "orden": 6,  "etiqueta": "Teléfono",              "es_mono": True},
    {"grupo": "Contacto",                "orden": 7,  "etiqueta": "Correo electrónico",    "es_mono": False},
    {"grupo": "Información financiera",  "orden": 8,  "etiqueta": "Ingreso mensual",       "es_mono": True},
    {"grupo": "Información financiera",  "orden": 9,  "etiqueta": "Antigüedad laboral",    "es_mono": False},
    {"grupo": "Información financiera",  "orden": 10, "etiqueta": "Fuente de ingreso",     "es_mono": False},
    {"grupo": "Solicitud",               "orden": 11, "etiqueta": "Monto solicitado",      "es_mono": True},
    {"grupo": "Solicitud",               "orden": 12, "etiqueta": "Plazo",                 "es_mono": False},
    {"grupo": "Solicitud",               "orden": 13, "etiqueta": "CLABE interbancaria",   "es_mono": True},
    {"grupo": "Solicitud",               "orden": 14, "etiqueta": "Banco receptor",        "es_mono": False},
]


def seed_plantillas(db) -> None:
    tipo = "credito_persona_fisica"
    existe = db.query(PlantillaCampo).filter_by(tipo_expediente=tipo).count()
    if existe:
        return
    for c in CAMPOS_CREDITO:
        db.add(PlantillaCampo(tipo_expediente=tipo, **c))
    db.commit()
```

- [ ] **Step 3: Crear `backend/app/create_tables.py`**

```python
from .database import engine, SessionLocal, Base
from . import models  # noqa: F401 — registra todos los modelos en Base
from .seed import seed_plantillas


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_plantillas(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas.py backend/app/seed.py backend/app/create_tables.py
git commit -m "feat: pydantic schemas, seed de plantillas, script de creacion de tablas"
```

---

## Task 4: Backend — main.py + tests/conftest.py + test de salud

**Files:**
- Create: `backend/app/main.py`
- Create: `backend/app/routers/__init__.py`
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_expedientes.py` (primer test)

- [ ] **Step 1: Crear `backend/app/routers/__init__.py`** (vacío)

```python
```

- [ ] **Step 2: Crear `backend/app/main.py`**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import expedientes, resoluciones

app = FastAPI(title="Portal de Cotejo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expedientes.router)
app.include_router(resoluciones.router)


@app.get("/health")
def health():
    return {"status": "ok"}
```

Nota: los routers aún no existen — los crearemos en los siguientes tasks. Por ahora el import fallará; créalos como módulos vacíos temporalmente.

- [ ] **Step 3: Crear `backend/app/routers/expedientes.py` (stub temporal)**

```python
from fastapi import APIRouter
router = APIRouter()
```

- [ ] **Step 4: Crear `backend/app/routers/resoluciones.py` (stub temporal)**

```python
from fastapi import APIRouter
router = APIRouter()
```

- [ ] **Step 5: Crear `backend/tests/__init__.py`** (vacío)

```python
```

- [ ] **Step 6: Crear `backend/tests/conftest.py`**

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.seed import seed_plantillas

TEST_DB_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(autouse=True)
def fresh_db():
    Base.metadata.create_all(bind=test_engine)
    db = TestSession()
    seed_plantillas(db)
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def client(fresh_db):
    def override_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 7: Escribir test de salud en `backend/tests/test_expedientes.py`**

```python
def test_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
```

- [ ] **Step 8: Ejecutar test y verificar que pasa**

```bash
cd backend
pip install -r requirements.txt
pytest tests/test_expedientes.py::test_health -v
```

Esperado: `PASSED`

- [ ] **Step 9: Commit**

```bash
git add backend/app/main.py backend/app/routers/ backend/tests/
git commit -m "feat: fastapi app, cors, conftest sqlite, test de salud"
```

---

## Task 5: Router expedientes — GET list + POST create

**Files:**
- Modify: `backend/app/routers/expedientes.py`
- Modify: `backend/tests/test_expedientes.py`

- [ ] **Step 1: Escribir los tests primero**

Agregar a `backend/tests/test_expedientes.py`:

```python
def test_list_empty(client):
    res = client.get("/expedientes")
    assert res.status_code == 200
    assert res.json() == []


def test_create_expediente(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["numero"].startswith("EXP-")
    assert data["solicitante"] == "Ana Torres"
    assert data["analista_nombre"] == "C. Vega"
    assert data["estado"] == "en_revision"
    assert len(data["campos"]) == 14  # 14 campos del seed


def test_create_expediente_sin_analista(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
    )
    assert res.status_code == 400


def test_create_expediente_tipo_invalido(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "tipo_inexistente"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 400


def test_list_con_expediente(client):
    client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.get("/expedientes")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["solicitante"] == "Ana Torres"
```

- [ ] **Step 2: Ejecutar para verificar que fallan**

```bash
pytest tests/test_expedientes.py -v -k "not test_health"
```

Esperado: todos FAILED (los endpoints no existen aún)

- [ ] **Step 3: Implementar GET list y POST create en `backend/app/routers/expedientes.py`**

```python
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/expedientes", tags=["expedientes"])


def require_analista(x_analista: Optional[str] = Header(None)) -> str:
    if not x_analista:
        raise HTTPException(status_code=400, detail="Header X-Analista requerido")
    return x_analista


def calc_estado(vu: str, va: str) -> models.EstadoCampo:
    return models.EstadoCampo.match if vu.strip().lower() == va.strip().lower() else models.EstadoCampo.diff


def next_numero(db: Session) -> str:
    year = datetime.now().year
    count = db.query(models.Expediente).filter(
        models.Expediente.numero.like(f"EXP-{year}-%")
    ).count()
    return f"EXP-{year}-{count + 1:04d}"


@router.get("", response_model=list[schemas.ExpedienteListOut])
def list_expedientes(db: Session = Depends(get_db)):
    return db.query(models.Expediente).order_by(models.Expediente.creado_en.desc()).all()


@router.post("", response_model=schemas.ExpedienteDetailOut, status_code=201)
def create_expediente(
    body: schemas.ExpedienteCreate,
    db: Session = Depends(get_db),
    analista: str = Depends(require_analista),
):
    plantillas = (
        db.query(models.PlantillaCampo)
        .filter_by(tipo_expediente=body.tipo, activo=True)
        .order_by(models.PlantillaCampo.orden)
        .all()
    )
    if not plantillas:
        raise HTTPException(status_code=400, detail=f"Tipo desconocido: {body.tipo}")

    exp = models.Expediente(
        numero=next_numero(db),
        solicitante=body.solicitante,
        tipo=body.tipo,
        analista_nombre=analista,
    )
    db.add(exp)
    db.flush()

    for p in plantillas:
        db.add(models.Campo(
            expediente_id=exp.id,
            grupo=p.grupo,
            orden=p.orden,
            etiqueta=p.etiqueta,
            es_mono=p.es_mono,
            valor_usuario="",
            valor_analista="",
            estado=models.EstadoCampo.match,
        ))
    db.commit()
    db.refresh(exp)
    return exp
```

- [ ] **Step 4: Ejecutar tests y verificar que pasan**

```bash
pytest tests/test_expedientes.py -v
```

Esperado: todos PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/expedientes.py backend/tests/test_expedientes.py
git commit -m "feat: GET /expedientes y POST /expedientes con plantilla automatica"
```

---

## Task 6: Router expedientes — GET detail + PATCH campo

**Files:**
- Modify: `backend/app/routers/expedientes.py`
- Modify: `backend/tests/test_expedientes.py`

- [ ] **Step 1: Agregar tests a `backend/tests/test_expedientes.py`**

```python
def _crear_exp(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    return res.json()


def test_get_expediente(client):
    exp = _crear_exp(client)
    res = client.get(f"/expedientes/{exp['id']}")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == exp["id"]
    assert len(data["campos"]) == 14
    assert data["resoluciones"] == []


def test_get_expediente_no_existe(client):
    res = client.get("/expedientes/9999")
    assert res.status_code == 404


def test_patch_campo(client):
    exp = _crear_exp(client)
    campo_id = exp["campos"][0]["id"]  # primer campo

    res = client.patch(
        f"/expedientes/{exp['id']}/campos/{campo_id}",
        json={"valor_usuario": "Ana Torres", "valor_analista": "Ana Torres"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "match"


def test_patch_campo_genera_diff(client):
    exp = _crear_exp(client)
    campo_id = exp["campos"][1]["id"]  # segundo campo (RFC)

    res = client.patch(
        f"/expedientes/{exp['id']}/campos/{campo_id}",
        json={"valor_usuario": "ROBM850412QX3", "valor_analista": "ROBM850412QX8"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "diff"


def test_patch_campo_expediente_cerrado(client):
    exp = _crear_exp(client)
    campo_id = exp["campos"][0]["id"]
    # cerrar expediente primero
    client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "rechazado"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.patch(
        f"/expedientes/{exp['id']}/campos/{campo_id}",
        json={"valor_usuario": "x"},
    )
    assert res.status_code == 409
```

- [ ] **Step 2: Ejecutar para verificar que fallan**

```bash
pytest tests/test_expedientes.py -v -k "get_expediente or patch"
```

Esperado: FAILED

- [ ] **Step 3: Agregar GET detail y PATCH campo a `backend/app/routers/expedientes.py`**

Agregar al final del archivo (después de `create_expediente`):

```python
@router.get("/{exp_id}", response_model=schemas.ExpedienteDetailOut)
def get_expediente(exp_id: int, db: Session = Depends(get_db)):
    exp = db.query(models.Expediente).filter_by(id=exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    return exp


@router.patch("/{exp_id}/campos/{campo_id}", response_model=schemas.CampoOut)
def patch_campo(
    exp_id: int,
    campo_id: int,
    body: schemas.CampoPatch,
    db: Session = Depends(get_db),
):
    exp = db.query(models.Expediente).filter_by(id=exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    if exp.estado != models.EstadoExpediente.en_revision:
        raise HTTPException(status_code=409, detail="El expediente está cerrado")

    campo = db.query(models.Campo).filter_by(id=campo_id, expediente_id=exp_id).first()
    if not campo:
        raise HTTPException(status_code=404, detail="Campo no encontrado")

    if body.valor_usuario is not None:
        campo.valor_usuario = body.valor_usuario
    if body.valor_analista is not None:
        campo.valor_analista = body.valor_analista

    nuevo_estado = calc_estado(campo.valor_usuario, campo.valor_analista)
    if nuevo_estado == models.EstadoCampo.match and campo.estado == models.EstadoCampo.diff:
        res = db.query(models.Resolucion).filter_by(campo_id=campo_id).first()
        if res:
            db.delete(res)
    campo.estado = nuevo_estado
    db.commit()
    db.refresh(campo)
    return campo
```

- [ ] **Step 4: Ejecutar todos los tests**

```bash
pytest tests/test_expedientes.py -v
```

Esperado: todos PASSED

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/expedientes.py backend/tests/test_expedientes.py
git commit -m "feat: GET /expedientes/{id} y PATCH campo con recalculo match/diff"
```

---

## Task 7: Router resoluciones + decisión

**Files:**
- Modify: `backend/app/routers/resoluciones.py`
- Create: `backend/tests/test_resoluciones.py`

- [ ] **Step 1: Crear `backend/tests/test_resoluciones.py`**

```python
def _exp_con_diff(client):
    """Crea expediente con un campo diff (RFC)."""
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    exp = res.json()
    campo_rfc = next(c for c in exp["campos"] if c["etiqueta"] == "RFC")
    client.patch(
        f"/expedientes/{exp['id']}/campos/{campo_rfc['id']}",
        json={"valor_usuario": "ROBM850412QX3", "valor_analista": "ROBM850412QX8"},
    )
    return exp, campo_rfc


def test_upsert_resolucion(client):
    exp, campo = _exp_con_diff(client)
    res = client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "usuario"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["valor_elegido"] == "usuario"


def test_upsert_resolucion_actualiza(client):
    exp, campo = _exp_con_diff(client)
    client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "usuario"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "analista"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["valor_elegido"] == "analista"


def test_resolucion_en_campo_match_falla(client):
    res = client.post(
        "/expedientes",
        json={"solicitante": "Ana Torres", "tipo": "credito_persona_fisica"},
        headers={"X-Analista": "C. Vega"},
    )
    exp = res.json()
    campo_match = exp["campos"][0]  # valor_usuario == valor_analista == ""
    res = client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo_match['id']}",
        json={"valor_elegido": "usuario"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 400


def test_decision_rechazar_sin_resolver(client):
    exp, _ = _exp_con_diff(client)
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "rechazado", "nota_decision": "Datos inválidos"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "rechazado"


def test_decision_aprobar_sin_resolver_falla(client):
    exp, _ = _exp_con_diff(client)
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "aprobado"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 400


def test_decision_aprobar_con_todas_resueltas(client):
    exp, campo = _exp_con_diff(client)
    client.put(
        f"/expedientes/{exp['id']}/resoluciones/{campo['id']}",
        json={"valor_elegido": "analista"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "aprobado"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 200
    assert res.json()["estado"] == "aprobado"
    assert res.json()["cerrado_en"] is not None


def test_decision_en_expediente_cerrado_falla(client):
    exp, _ = _exp_con_diff(client)
    client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "rechazado"},
        headers={"X-Analista": "C. Vega"},
    )
    res = client.post(
        f"/expedientes/{exp['id']}/decision",
        json={"resultado": "aprobado"},
        headers={"X-Analista": "C. Vega"},
    )
    assert res.status_code == 409
```

- [ ] **Step 2: Ejecutar para verificar que fallan**

```bash
pytest tests/test_resoluciones.py -v
```

Esperado: todos FAILED

- [ ] **Step 3: Implementar `backend/app/routers/resoluciones.py`**

```python
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas
from ..database import get_db

router = APIRouter(prefix="/expedientes", tags=["resoluciones"])


def require_analista(x_analista: Optional[str] = Header(None)) -> str:
    if not x_analista:
        raise HTTPException(status_code=400, detail="Header X-Analista requerido")
    return x_analista


def _get_exp_abierto(exp_id: int, db: Session) -> models.Expediente:
    exp = db.query(models.Expediente).filter_by(id=exp_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    if exp.estado != models.EstadoExpediente.en_revision:
        raise HTTPException(status_code=409, detail="El expediente está cerrado")
    return exp


@router.put("/{exp_id}/resoluciones/{campo_id}", response_model=schemas.ResolucionOut)
def upsert_resolucion(
    exp_id: int,
    campo_id: int,
    body: schemas.ResolucionCreate,
    db: Session = Depends(get_db),
    analista: str = Depends(require_analista),
):
    exp = _get_exp_abierto(exp_id, db)
    campo = db.query(models.Campo).filter_by(id=campo_id, expediente_id=exp.id).first()
    if not campo:
        raise HTTPException(status_code=404, detail="Campo no encontrado")
    if campo.estado == models.EstadoCampo.match:
        raise HTTPException(status_code=400, detail="El campo no tiene diferencias")

    res = db.query(models.Resolucion).filter_by(expediente_id=exp_id, campo_id=campo_id).first()
    if res:
        res.valor_elegido = body.valor_elegido
        res.analista_nombre = analista
    else:
        res = models.Resolucion(
            expediente_id=exp_id,
            campo_id=campo_id,
            analista_nombre=analista,
            valor_elegido=body.valor_elegido,
        )
        db.add(res)
    db.commit()
    db.refresh(res)
    return res


@router.post("/{exp_id}/decision", response_model=schemas.ExpedienteDetailOut)
def post_decision(
    exp_id: int,
    body: schemas.DecisionCreate,
    db: Session = Depends(get_db),
    analista: str = Depends(require_analista),
):
    exp = _get_exp_abierto(exp_id, db)

    if body.resultado == "aprobado":
        campos_diff = [c for c in exp.campos if c.estado == models.EstadoCampo.diff]
        resueltos = {r.campo_id for r in exp.resoluciones}
        pendientes = [c for c in campos_diff if c.id not in resueltos]
        if pendientes:
            raise HTTPException(
                status_code=400,
                detail=f"{len(pendientes)} diferencia(s) sin resolver",
            )

    exp.estado = models.EstadoExpediente(body.resultado)
    exp.nota_decision = body.nota_decision
    exp.cerrado_en = datetime.now(timezone.utc)
    db.commit()
    db.refresh(exp)
    return exp
```

- [ ] **Step 4: Ejecutar todos los tests del backend**

```bash
pytest tests/ -v
```

Esperado: todos PASSED (incluyendo test_expedientes.py y test_resoluciones.py)

- [ ] **Step 5: Commit**

```bash
git add backend/app/routers/resoluciones.py backend/tests/test_resoluciones.py
git commit -m "feat: PUT resolucion con upsert y POST decision con validacion"
```

---

## Task 8: Frontend — Scaffolding

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.js`
- Create: `frontend/index.html`
- Create: `frontend/src/main.jsx`
- Create: `frontend/src/test/setup.js`

- [ ] **Step 1: Crear `frontend/package.json`**

```json
{
  "name": "portal-cotejo-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^25.0.1",
    "vite": "^5.4.8",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Crear `frontend/vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

- [ ] **Step 3: Crear `frontend/index.html`**

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Portal de Cotejo</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #faf8f4; font-family: 'Public Sans', system-ui, sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 4: Crear `frontend/src/test/setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Crear `frontend/src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 6: Instalar dependencias y verificar arranque**

```bash
cd frontend
npm install
npm run dev
```

Esperado: Vite corre en `http://localhost:5173` (mostrará error porque App.jsx no existe aún — es normal).

- [ ] **Step 7: Commit**

```bash
git add frontend/
git commit -m "feat: scaffolding frontend vite + vitest + testing-library"
```

---

## Task 9: Frontend — tokens.js + api.js

**Files:**
- Create: `frontend/src/tokens.js`
- Create: `frontend/src/api.js`

- [ ] **Step 1: Crear `frontend/src/tokens.js`**

Adaptado de `tokens.js` del prototipo original, exportado como módulo ES:

```js
export const T = {
  ink: '#1b2330',
  sub: '#5d6b7a',
  faint: '#94a0ae',
  line: '#e6e1d8',
  lineSoft: '#f0ece4',
  paper: '#faf8f4',
  panel: '#ffffff',
  navy: '#1f3a5f',
  navyInk: '#15293f',
  navySoft: '#eef2f7',
  match: '#1f7a52',
  matchBg: '#e9f3ed',
  diff: '#9a5b16',
  diffBg: '#fbf1dd',
  diffMark: '#f4d79f',
  reject: '#a3372e',
  rejectBg: '#f8e9e6',
  serif: "'Source Serif 4', Georgia, serif",
  sans: "'Public Sans', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
}
```

- [ ] **Step 2: Crear `frontend/src/api.js`**

```js
const BASE = '/api'

function headers() {
  return {
    'Content-Type': 'application/json',
    'X-Analista': localStorage.getItem('analista_nombre') || '',
  }
}

async function req(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: headers(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export const api = {
  expedientes: {
    list: () => req('GET', '/expedientes'),
    create: (body) => req('POST', '/expedientes', body),
    get: (id) => req('GET', `/expedientes/${id}`),
  },
  campos: {
    patch: (expId, campoId, body) =>
      req('PATCH', `/expedientes/${expId}/campos/${campoId}`, body),
  },
  resoluciones: {
    upsert: (expId, campoId, body) =>
      req('PUT', `/expedientes/${expId}/resoluciones/${campoId}`, body),
  },
  decision: {
    post: (expId, body) => req('POST', `/expedientes/${expId}/decision`, body),
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/tokens.js frontend/src/api.js
git commit -m "feat: design tokens y api client con X-Analista header"
```

---

## Task 10: Frontend — AnalistaModal + App

**Files:**
- Create: `frontend/src/components/AnalistaModal.jsx`
- Create: `frontend/src/App.jsx`
- Create: `frontend/src/__tests__/AnalistaModal.test.jsx`

- [ ] **Step 1: Escribir test de AnalistaModal primero**

```jsx
// frontend/src/__tests__/AnalistaModal.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalistaModal from '../components/AnalistaModal'

test('muestra campo de nombre y botón deshabilitado si está vacío', () => {
  render(<AnalistaModal onConfirm={() => {}} />)
  expect(screen.getByPlaceholderText(/nombre/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
})

test('habilita el botón cuando hay texto', async () => {
  const user = userEvent.setup()
  render(<AnalistaModal onConfirm={() => {}} />)
  await user.type(screen.getByPlaceholderText(/nombre/i), 'C. Vega')
  expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled()
})

test('llama onConfirm con el nombre al hacer clic', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn()
  render(<AnalistaModal onConfirm={onConfirm} />)
  await user.type(screen.getByPlaceholderText(/nombre/i), 'C. Vega')
  await user.click(screen.getByRole('button', { name: /continuar/i }))
  expect(onConfirm).toHaveBeenCalledWith('C. Vega')
})
```

- [ ] **Step 2: Ejecutar test para verificar que falla**

```bash
cd frontend && npm test
```

Esperado: FAILED (componente no existe)

- [ ] **Step 3: Crear `frontend/src/components/AnalistaModal.jsx`**

```jsx
import { useState } from 'react'
import { T } from '../tokens'

export default function AnalistaModal({ onConfirm }) {
  const [nombre, setNombre] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(27,35,48,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.sans, zIndex: 100,
    }}>
      <div style={{
        background: T.panel, borderRadius: 14, padding: '36px 40px',
        width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
          Portal de Cotejo
        </div>
        <div style={{ fontSize: 14, color: T.sub, marginBottom: 24 }}>
          Ingresa tu nombre para continuar. Se usará para identificar tus resoluciones.
        </div>
        <input
          placeholder="Ej: C. Vega"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && nombre.trim() && onConfirm(nombre.trim())}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 15,
            border: `1px solid ${T.line}`, outline: 'none', fontFamily: T.sans,
            color: T.ink, marginBottom: 16,
          }}
        />
        <button
          disabled={!nombre.trim()}
          onClick={() => onConfirm(nombre.trim())}
          style={{
            width: '100%', padding: '11px', borderRadius: 8, border: 'none',
            background: nombre.trim() ? T.navy : T.line,
            color: nombre.trim() ? '#fff' : T.faint,
            fontSize: 15, fontWeight: 600, cursor: nombre.trim() ? 'pointer' : 'not-allowed',
            fontFamily: T.sans, transition: 'all .15s',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Crear `frontend/src/App.jsx`**

```jsx
import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AnalistaModal from './components/AnalistaModal'
import Lista from './pages/Lista'
import Cotejo from './pages/Cotejo'

export default function App() {
  const [analista, setAnalista] = useState(
    () => localStorage.getItem('analista_nombre') || ''
  )

  function confirmarAnalista(nombre) {
    localStorage.setItem('analista_nombre', nombre)
    setAnalista(nombre)
  }

  if (!analista) {
    return <AnalistaModal onConfirm={confirmarAnalista} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/expedientes" replace />} />
        <Route path="/expedientes" element={<Lista />} />
        <Route path="/expedientes/:id" element={<Cotejo />} />
      </Routes>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Ejecutar tests**

```bash
cd frontend && npm test
```

Esperado: AnalistaModal tests PASSED

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/AnalistaModal.jsx frontend/src/App.jsx frontend/src/__tests__/AnalistaModal.test.jsx
git commit -m "feat: AnalistaModal con guard de nombre y App con router"
```

---

## Task 11: Frontend — Lista + NuevoExpedienteModal

**Files:**
- Create: `frontend/src/components/NuevoExpedienteModal.jsx`
- Create: `frontend/src/pages/Lista.jsx`

- [ ] **Step 1: Crear `frontend/src/components/NuevoExpedienteModal.jsx`**

```jsx
import { useState } from 'react'
import { T } from '../tokens'
import { api } from '../api'

export default function NuevoExpedienteModal({ onClose, onCreado }) {
  const [solicitante, setSolicitante] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!solicitante.trim()) return
    setLoading(true)
    setError(null)
    try {
      const exp = await api.expedientes.create({
        solicitante: solicitante.trim(),
        tipo: 'credito_persona_fisica',
      })
      onCreado(exp)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(27,35,48,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.sans, zIndex: 100,
    }}>
      <div style={{
        background: T.panel, borderRadius: 14, padding: '32px 36px',
        width: 440, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 600, color: T.ink, marginBottom: 20 }}>
          Nuevo expediente
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, display: 'block', marginBottom: 6 }}>
          Nombre del solicitante
        </label>
        <input
          placeholder="Ej: María Fernanda Robles Díaz"
          value={solicitante}
          onChange={(e) => setSolicitante(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
            border: `1px solid ${T.line}`, fontFamily: T.sans, color: T.ink,
            marginBottom: 12, outline: 'none',
          }}
        />

        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, display: 'block', marginBottom: 6 }}>
          Tipo de expediente
        </label>
        <div style={{
          padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.line}`,
          fontSize: 14, color: T.sub, marginBottom: 20, background: T.paper,
        }}>
          Solicitud de crédito · Persona física
        </div>

        {error && (
          <div style={{ fontSize: 13, color: T.reject, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${T.line}`,
            background: '#fff', color: T.sub, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: T.sans,
          }}>
            Cancelar
          </button>
          <button
            disabled={!solicitante.trim() || loading}
            onClick={handleSubmit}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: solicitante.trim() && !loading ? T.navy : T.line,
              color: solicitante.trim() && !loading ? '#fff' : T.faint,
              fontSize: 14, fontWeight: 600,
              cursor: solicitante.trim() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: T.sans,
            }}
          >
            {loading ? 'Creando…' : 'Crear expediente'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `frontend/src/pages/Lista.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import { api } from '../api'
import NuevoExpedienteModal from '../components/NuevoExpedienteModal'

const ESTADO_PILL = {
  en_revision: { label: 'En revisión', color: T.diff, bg: T.diffBg },
  aprobado:    { label: 'Aprobado',    color: T.match, bg: T.matchBg },
  rechazado:   { label: 'Rechazado',   color: T.reject, bg: T.rejectBg },
}

function EstadoPill({ estado }) {
  const p = ESTADO_PILL[estado] || ESTADO_PILL.en_revision
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      color: p.color, background: p.bg, border: `1px solid ${p.color}33`,
    }}>
      {p.label}
    </span>
  )
}

export default function Lista() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const navigate = useNavigate()
  const analista = localStorage.getItem('analista_nombre')

  useEffect(() => {
    api.expedientes.list().then(setExpedientes).finally(() => setLoading(false))
  }, [])

  function handleCreado(exp) {
    setModal(false)
    navigate(`/expedientes/${exp.id}`)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', fontFamily: T.sans }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 600, color: T.ink }}>
            Portal de Cotejo
          </h1>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>
            Analista: <b>{analista}</b>
          </div>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: T.navy, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: T.sans,
          }}
        >
          + Nuevo expediente
        </button>
      </div>

      {loading ? (
        <div style={{ color: T.faint, fontSize: 14 }}>Cargando…</div>
      ) : expedientes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: T.faint, fontSize: 14,
          border: `2px dashed ${T.line}`, borderRadius: 12,
        }}>
          No hay expedientes aún. Crea el primero.
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', background: T.panel }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '160px 1fr 140px 120px 100px',
            padding: '10px 20px', background: T.navySoft,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.navy,
          }}>
            <span>Número</span><span>Solicitante</span><span>Analista</span><span>Estado</span><span>Fecha</span>
          </div>
          {expedientes.map((exp) => (
            <div
              key={exp.id}
              onClick={() => navigate(`/expedientes/${exp.id}`)}
              style={{
                display: 'grid', gridTemplateColumns: '160px 1fr 140px 120px 100px',
                padding: '13px 20px', borderTop: `1px solid ${T.lineSoft}`,
                cursor: 'pointer', transition: 'background .12s',
                fontSize: 13, color: T.ink, alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.paper)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.panel)}
            >
              <span style={{ fontFamily: T.mono, fontSize: 12 }}>{exp.numero}</span>
              <span style={{ fontWeight: 500 }}>{exp.solicitante}</span>
              <span style={{ color: T.sub }}>{exp.analista_nombre}</span>
              <span><EstadoPill estado={exp.estado} /></span>
              <span style={{ color: T.faint, fontSize: 12 }}>
                {new Date(exp.creado_en).toLocaleDateString('es-MX')}
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && <NuevoExpedienteModal onClose={() => setModal(false)} onCreado={handleCreado} />}
    </div>
  )
}
```

- [ ] **Step 3: Verificar en browser**

Con `docker compose up` y `npm run dev` corriendo:
1. Abrir `http://localhost:5173`
2. Ingresar nombre de analista → debe mostrar la lista vacía
3. Hacer clic en "+ Nuevo expediente" → modal aparece
4. Ingresar nombre de solicitante y crear → redirige a `/expedientes/1`

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/NuevoExpedienteModal.jsx frontend/src/pages/Lista.jsx
git commit -m "feat: pagina lista de expedientes con modal de creacion"
```

---

## Task 12: Frontend — RailIzq + DiffCard

**Files:**
- Create: `frontend/src/components/RailIzq.jsx`
- Create: `frontend/src/components/DiffCard.jsx`
- Create: `frontend/src/__tests__/RailIzq.test.jsx`
- Create: `frontend/src/__tests__/DiffCard.test.jsx`

- [ ] **Step 1: Escribir test de RailIzq**

```jsx
// frontend/src/__tests__/RailIzq.test.jsx
import { render, screen } from '@testing-library/react'
import RailIzq from '../components/RailIzq'

const grupos = [
  { name: 'Identidad', fields: [{ st: 'diff' }, { st: 'match' }] },
  { name: 'Contacto',  fields: [{ st: 'match' }] },
]

const exp = { numero: 'EXP-2026-0001', solicitante: 'Ana Torres', analista_nombre: 'C. Vega' }

test('muestra nombre del solicitante', () => {
  render(<RailIzq exp={exp} grupos={grupos} resueltos={0} totalDiff={1} />)
  expect(screen.getByText('Ana Torres')).toBeInTheDocument()
})

test('muestra progreso correcto', () => {
  render(<RailIzq exp={exp} grupos={grupos} resueltos={1} totalDiff={1} />)
  expect(screen.getByText('1/1')).toBeInTheDocument()
})

test('muestra grupos de secciones', () => {
  render(<RailIzq exp={exp} grupos={grupos} resueltos={0} totalDiff={1} />)
  expect(screen.getByText('Identidad')).toBeInTheDocument()
  expect(screen.getByText('Contacto')).toBeInTheDocument()
})
```

- [ ] **Step 2: Escribir test de DiffCard**

```jsx
// frontend/src/__tests__/DiffCard.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiffCard from '../components/DiffCard'

const campo = {
  id: 1,
  etiqueta: 'RFC',
  valor_usuario: 'ROBM850412QX3',
  valor_analista: 'ROBM850412QX8',
  es_mono: true,
}

test('muestra etiqueta y valores', () => {
  render(<DiffCard campo={campo} choice={null} onChoose={() => {}} />)
  expect(screen.getByText('RFC')).toBeInTheDocument()
  expect(screen.getByText('ROBM850412QX3')).toBeInTheDocument()
  expect(screen.getByText('ROBM850412QX8')).toBeInTheDocument()
})

test('llama onChoose con "usuario" al hacer clic', async () => {
  const user = userEvent.setup()
  const onChoose = vi.fn()
  render(<DiffCard campo={campo} choice={null} onChoose={onChoose} />)
  await user.click(screen.getByText('Valor del usuario'))
  expect(onChoose).toHaveBeenCalledWith(1, 'usuario')
})

test('llama onChoose con "analista" al hacer clic', async () => {
  const user = userEvent.setup()
  const onChoose = vi.fn()
  render(<DiffCard campo={campo} choice={null} onChoose={onChoose} />)
  await user.click(screen.getByText('Valor del analista'))
  expect(onChoose).toHaveBeenCalledWith(1, 'analista')
})

test('muestra estado resuelto cuando hay choice', () => {
  render(<DiffCard campo={campo} choice="usuario" onChoose={() => {}} />)
  expect(screen.getByText('Resuelto')).toBeInTheDocument()
})
```

- [ ] **Step 3: Ejecutar tests para verificar que fallan**

```bash
cd frontend && npm test
```

Esperado: RailIzq y DiffCard FAILED

- [ ] **Step 4: Crear `frontend/src/components/RailIzq.jsx`**

```jsx
import { T } from '../tokens'

export default function RailIzq({ exp, grupos, resueltos, totalDiff }) {
  const pct = totalDiff > 0 ? Math.round((resueltos / totalDiff) * 100) : 100
  const allResolved = resueltos === totalDiff

  return (
    <aside style={{
      background: T.panel, borderRight: `1px solid ${T.line}`,
      display: 'flex', flexDirection: 'column', padding: '20px 18px', width: 252, flexShrink: 0,
    }}>
      {/* Cabecera solicitante */}
      <div style={{ paddingBottom: 16, borderBottom: `1px solid ${T.lineSoft}`, marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: T.ink, marginBottom: 2 }}>
          {exp.solicitante}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.sub }}>{exp.numero}</div>
        <div style={{ fontSize: 11, color: T.faint, marginTop: 3 }}>Analista: {exp.analista_nombre}</div>
      </div>

      {/* Barra de progreso */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.faint }}>
            Progreso
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 13, color: allResolved ? T.match : T.diff, fontWeight: 600 }}>
            {resueltos}/{totalDiff}
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: T.lineSoft, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: allResolved ? T.match : T.diff,
            borderRadius: 4, transition: 'width .25s',
          }} />
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginTop: 7 }}>
          {allResolved ? 'Todas las diferencias resueltas.' : 'Diferencias por resolver.'}
        </div>
      </div>

      {/* Secciones */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.faint, marginBottom: 10 }}>
          Secciones
        </div>
        {grupos.map((g, i) => {
          const d = g.fields.filter((f) => f.st === 'diff').length
          return (
            <div key={g.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 11px', borderRadius: 7, marginBottom: 2,
              background: i === 0 ? T.navySoft : 'transparent',
            }}>
              <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? T.navy : T.sub }}>
                {g.name}
              </span>
              {d > 0 ? (
                <span style={{
                  fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: '#fff',
                  background: T.diff, borderRadius: 10, padding: '1px 7px',
                }}>
                  {d}
                </span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round">
                  <path d="M2.5 6.5l2.5 2.5 5.5-6" />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
```

- [ ] **Step 5: Crear `frontend/src/components/DiffCard.jsx`**

```jsx
import { T } from '../tokens'

function diffParts(a, b) {
  a = a || ''; b = b || ''
  const n = Math.max(a.length, b.length)
  return Array.from({ length: n }, (_, i) => ({
    ch: a[i] ?? '',
    changed: (a[i] ?? '') !== (b[i] ?? ''),
  }))
}

function ValorHighlight({ val, contra, mono }) {
  const parts = diffParts(val, contra)
  return (
    <span style={{ fontFamily: mono ? T.mono : T.sans, fontSize: mono ? 14 : 15 }}>
      {parts.map((p, i) => (
        <span key={i} style={p.changed ? {
          background: T.diffMark, borderRadius: 2, padding: '1px 0',
        } : null}>
          {p.ch}
        </span>
      ))}
    </span>
  )
}

function Choice({ label, value, contra, mono, selected, onClick, tone }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, textAlign: 'left', cursor: 'pointer', padding: '11px 14px',
      borderRadius: 9, border: `1.5px solid ${selected ? tone : T.line}`,
      background: selected ? (tone === T.match ? T.matchBg : T.navySoft) : '#fff',
      position: 'relative', transition: 'all .14s', fontFamily: T.sans,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: selected ? tone : T.faint, marginBottom: 4 }}>
        {label}
      </div>
      <ValorHighlight val={value} contra={contra} mono={mono} />
      <div style={{
        position: 'absolute', top: 10, right: 12, width: 16, height: 16,
        borderRadius: 8, border: `1.5px solid ${selected ? tone : T.line}`,
        background: selected ? tone : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M1.5 4.5l2 2 4-4.5" />
          </svg>
        )}
      </div>
    </button>
  )
}

export default function DiffCard({ campo, choice, onChoose, disabled }) {
  const resolved = !!choice
  return (
    <div style={{
      border: `1px solid ${resolved ? '#cfe6da' : T.diffMark}`,
      borderRadius: 12, overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,.03)',
      opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: resolved ? T.matchBg : T.diffBg,
        borderBottom: `1px solid ${resolved ? '#cfe6da' : T.diffMark}`,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{campo.etiqueta}</span>
        {resolved ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: T.match }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round">
              <path d="M2.5 6.5l2.5 2.5 5.5-6" />
            </svg>
            Resuelto
          </span>
        ) : (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.diff }}>Requiere decisión</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, padding: 14 }}>
        <Choice
          label="Valor del usuario"
          value={campo.valor_usuario}
          contra={campo.valor_analista}
          mono={campo.es_mono}
          selected={choice === 'usuario'}
          onClick={() => !disabled && onChoose(campo.id, 'usuario')}
          tone={T.navy}
        />
        <Choice
          label="Valor del analista"
          value={campo.valor_analista}
          contra={campo.valor_usuario}
          mono={campo.es_mono}
          selected={choice === 'analista'}
          onClick={() => !disabled && onChoose(campo.id, 'analista')}
          tone={T.match}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Ejecutar tests**

```bash
cd frontend && npm test
```

Esperado: RailIzq y DiffCard PASSED

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/RailIzq.jsx frontend/src/components/DiffCard.jsx frontend/src/__tests__/
git commit -m "feat: componentes RailIzq y DiffCard con pruebas"
```

---

## Task 13: Frontend — PanelDecision

**Files:**
- Create: `frontend/src/components/PanelDecision.jsx`
- Create: `frontend/src/__tests__/PanelDecision.test.jsx`

- [ ] **Step 1: Escribir test de PanelDecision**

```jsx
// frontend/src/__tests__/PanelDecision.test.jsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PanelDecision from '../components/PanelDecision'

const base = {
  matches: 10,
  totalDiff: 4,
  resueltos: 0,
  nota: '',
  onNotaChange: () => {},
  onAprobar: () => {},
  onRechazar: () => {},
  loading: false,
  disabled: false,
}

test('botón aprobar deshabilitado si hay pendientes', () => {
  render(<PanelDecision {...base} resueltos={2} totalDiff={4} />)
  expect(screen.getByRole('button', { name: /aprobar/i })).toBeDisabled()
})

test('botón aprobar habilitado si todo está resuelto', () => {
  render(<PanelDecision {...base} resueltos={4} totalDiff={4} />)
  expect(screen.getByRole('button', { name: /aprobar cotejo/i })).toBeEnabled()
})

test('llama onAprobar al hacer clic en aprobar', async () => {
  const user = userEvent.setup()
  const onAprobar = vi.fn()
  render(<PanelDecision {...base} resueltos={4} totalDiff={4} onAprobar={onAprobar} />)
  await user.click(screen.getByRole('button', { name: /aprobar cotejo/i }))
  expect(onAprobar).toHaveBeenCalled()
})

test('llama onRechazar al hacer clic en rechazar', async () => {
  const user = userEvent.setup()
  const onRechazar = vi.fn()
  render(<PanelDecision {...base} onRechazar={onRechazar} />)
  await user.click(screen.getByRole('button', { name: /rechazar/i }))
  expect(onRechazar).toHaveBeenCalled()
})
```

- [ ] **Step 2: Ejecutar para verificar que falla**

```bash
cd frontend && npm test
```

Esperado: PanelDecision FAILED

- [ ] **Step 3: Crear `frontend/src/components/PanelDecision.jsx`**

```jsx
import { T } from '../tokens'

export default function PanelDecision({
  matches, totalDiff, resueltos, nota, onNotaChange,
  onAprobar, onRechazar, loading, disabled,
}) {
  const pendientes = totalDiff - resueltos
  const allResolved = pendientes === 0

  return (
    <aside style={{
      background: T.panel, borderLeft: `1px solid ${T.line}`,
      display: 'flex', flexDirection: 'column', padding: '20px 18px', width: 304, flexShrink: 0,
    }}>
      <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
        Decisión
      </div>

      {/* Resumen */}
      <div style={{
        background: T.paper, border: `1px solid ${T.lineSoft}`,
        borderRadius: 10, padding: 14, marginTop: 12, marginBottom: 16,
      }}>
        <Row label="Campos coincidentes" val={matches} color={T.match} />
        <Row label="Diferencias resueltas" val={`${resueltos} / ${totalDiff}`} color={T.ink} />
        <Row label="Pendientes" val={pendientes} color={allResolved ? T.match : T.diff} last />
      </div>

      {/* Nota */}
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, marginBottom: 6, display: 'block' }}>
        Nota de resolución
      </label>
      <textarea
        value={nota}
        onChange={(e) => onNotaChange(e.target.value)}
        disabled={disabled}
        placeholder="Describe la decisión o el motivo del rechazo…"
        style={{
          border: `1px solid ${T.line}`, borderRadius: 9, padding: '10px 12px',
          fontSize: 13, color: T.ink, background: T.paper, minHeight: 72,
          marginBottom: 16, fontFamily: T.sans, resize: 'vertical', outline: 'none',
          width: '100%',
        }}
      />

      <button
        disabled={!allResolved || loading || disabled}
        onClick={onAprobar}
        style={{
          fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, padding: '12px',
          borderRadius: 8, border: 'none', marginBottom: 10, width: '100%',
          cursor: allResolved && !loading && !disabled ? 'pointer' : 'not-allowed',
          background: allResolved && !disabled ? T.match : T.lineSoft,
          color: allResolved && !disabled ? '#fff' : T.faint,
          transition: 'all .15s',
        }}
      >
        {loading ? 'Guardando…' : allResolved ? 'Aprobar cotejo' : `Resuelve ${pendientes} para aprobar`}
      </button>

      <button
        disabled={loading || disabled}
        onClick={onRechazar}
        style={{
          fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, padding: '12px',
          borderRadius: 8, border: `1px solid ${T.line}`, background: '#fff',
          color: T.reject, cursor: loading || disabled ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        Rechazar expediente
      </button>
    </aside>
  )
}

function Row({ label, val, color, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: 12.5,
      marginBottom: last ? 0 : 7,
    }}>
      <span style={{ color: T.sub }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontWeight: 600 }}>{val}</span>
    </div>
  )
}
```

- [ ] **Step 4: Ejecutar todos los tests**

```bash
cd frontend && npm test
```

Esperado: todos PASSED

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/PanelDecision.jsx frontend/src/__tests__/PanelDecision.test.jsx
git commit -m "feat: PanelDecision con validacion de pendientes y pruebas"
```

---

## Task 14: Frontend — Cotejo.jsx (página principal)

**Files:**
- Create: `frontend/src/pages/Cotejo.jsx`

- [ ] **Step 1: Crear `frontend/src/pages/Cotejo.jsx`**

```jsx
import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import { api } from '../api'
import RailIzq from '../components/RailIzq'
import DiffCard from '../components/DiffCard'
import PanelDecision from '../components/PanelDecision'

export default function Cotejo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exp, setExp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nota, setNota] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    api.expedientes.get(id).then(setExp).catch(() => navigate('/expedientes')).finally(() => setLoading(false))
  }, [id])

  const isClosed = exp?.estado !== 'en_revision'

  // Agrupar campos por grupo
  const grupos = useMemo(() => {
    if (!exp) return []
    const map = {}
    for (const c of exp.campos) {
      if (!map[c.grupo]) map[c.grupo] = { name: c.grupo, fields: [] }
      map[c.grupo].fields.push({ ...c, st: c.estado })
    }
    return Object.values(map).sort((a, b) => {
      const first = (g) => g.fields[0]?.orden ?? 0
      return first(a) - first(b)
    })
  }, [exp])

  const diffCampos = useMemo(() => exp?.campos.filter((c) => c.estado === 'diff') ?? [], [exp])
  const matchCampos = useMemo(() => exp?.campos.filter((c) => c.estado === 'match') ?? [], [exp])

  // Resoluciones indexadas por campo_id
  const choices = useMemo(() => {
    if (!exp) return {}
    return Object.fromEntries(exp.resoluciones.map((r) => [r.campo_id, r.valor_elegido]))
  }, [exp])

  const resueltos = useMemo(() => diffCampos.filter((c) => choices[c.id]).length, [diffCampos, choices])

  async function handleChoose(campoId, valor) {
    try {
      const res = await api.resoluciones.upsert(id, campoId, { valor_elegido: valor })
      setExp((prev) => ({
        ...prev,
        resoluciones: [
          ...prev.resoluciones.filter((r) => r.campo_id !== campoId),
          res,
        ],
      }))
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDecision(resultado) {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.decision.post(id, { resultado, nota_decision: nota || null })
      setExp(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, fontFamily: T.sans, color: T.faint }}>Cargando…</div>
  }

  if (!exp) return null

  return (
    <div style={{ width: '100%', height: '100vh', background: T.paper, fontFamily: T.sans, color: T.ink, display: 'flex' }}>
      <RailIzq exp={exp} grupos={grupos} resueltos={resueltos} totalDiff={diffCampos.length} />

      {/* Centro */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '18px 28px 12px', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <button onClick={() => navigate('/expedientes')} style={{
              background: 'none', border: 'none', color: T.sub, cursor: 'pointer',
              fontSize: 12, fontFamily: T.sans, padding: 0, marginBottom: 4,
            }}>
              ← Volver a lista
            </button>
            <h1 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, margin: 0 }}>
              Revisión de diferencias
            </h1>
            <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0' }}>
              Para cada diferencia, elige el valor correcto.
            </p>
          </div>
          {isClosed && (
            <div style={{
              fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20,
              color: exp.estado === 'aprobado' ? T.match : T.reject,
              background: exp.estado === 'aprobado' ? T.matchBg : T.rejectBg,
              border: `1px solid ${exp.estado === 'aprobado' ? '#cfe6da' : '#e8bfba'}`,
            }}>
              {exp.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
            </div>
          )}
        </div>

        <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ fontSize: 13, color: T.reject, padding: '10px 14px', background: T.rejectBg, borderRadius: 8 }}>
              {error}
            </div>
          )}

          {diffCampos.length > 0 && (
            <>
              {diffCampos.map((campo) => (
                <DiffCard
                  key={campo.id}
                  campo={campo}
                  choice={choices[campo.id] ?? null}
                  onChoose={handleChoose}
                  disabled={isClosed}
                />
              ))}
            </>
          )}

          {matchCampos.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round">
                  <path d="M3 7.5l3 3 6-7" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>
                  {matchCampos.length} campos coinciden automáticamente
                </span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 28px',
                border: `1px solid ${T.lineSoft}`, borderRadius: 10, padding: '10px 16px', background: '#fff',
              }}>
                {matchCampos.map((c) => (
                  <div key={c.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: `1px solid ${T.lineSoft}`,
                  }}>
                    <span style={{ fontSize: 12.5, color: T.sub }}>{c.etiqueta}</span>
                    <span style={{
                      fontFamily: c.es_mono ? T.mono : T.sans, fontSize: 12.5, color: T.ink,
                      maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {c.valor_usuario || <em style={{ color: T.faint }}>vacío</em>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <PanelDecision
        matches={matchCampos.length}
        totalDiff={diffCampos.length}
        resueltos={resueltos}
        nota={nota}
        onNotaChange={setNota}
        onAprobar={() => handleDecision('aprobado')}
        onRechazar={() => handleDecision('rechazado')}
        loading={saving}
        disabled={isClosed}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar flujo completo en browser**

Con `docker compose up` y `npm run dev` corriendo:
1. Crear un expediente nuevo desde la lista
2. En la pantalla de cotejo, hacer PATCH en varios campos con valores distintos para generar diffs
3. Resolver todas las diferencias con DiffCards
4. Verificar que el botón "Aprobar cotejo" se habilita
5. Aprobar y verificar que la pantalla pasa a modo solo-lectura con banner "Aprobado"
6. Volver a la lista y verificar que el estado del expediente aparece como "Aprobado"

- [ ] **Step 3: Ejecutar todos los tests**

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```

Esperado: todos PASSED en ambos

- [ ] **Step 4: Commit final**

```bash
git add frontend/src/pages/Cotejo.jsx
git commit -m "feat: pagina de cotejo con diff cards, resoluciones y decision final"
```

---

## Self-Review

**Cobertura del spec:**
- ✅ Stack: FastAPI, React, PostgreSQL, Docker
- ✅ 4 tablas: expedientes, campos, resoluciones, plantillas_campo
- ✅ 6 endpoints con validaciones
- ✅ Plantilla de campos automática al crear expediente
- ✅ PATCH campo con recálculo de match/diff y eliminación de resolución
- ✅ Bloqueo de expedientes cerrados (409 en todos los endpoints de escritura)
- ✅ Rechazo sin necesidad de resolver todas las diferencias
- ✅ Aprobado requiere todas las diferencias resueltas
- ✅ Header X-Analista en todos los endpoints de escritura
- ✅ Multi-analista con localStorage
- ✅ Modo solo-lectura en pantalla de cotejo cerrado
- ✅ Pruebas backend: pytest + SQLite (sin dependencia de Docker en tests)
- ✅ Pruebas frontend: Vitest + @testing-library/react

**Consistencia de tipos:**
- `campo.estado` → `EstadoCampo.match | EstadoCampo.diff` ✅
- `exp.estado` → `EstadoExpediente.en_revision | aprobado | rechazado` ✅
- `resolucion.valor_elegido` → `ValorElegido.usuario | analista` ✅
- `choices` en frontend indexado por `campo_id` (int) ✅
- `onChoose(campo.id, 'usuario'|'analista')` consistente entre DiffCard y Cotejo ✅
