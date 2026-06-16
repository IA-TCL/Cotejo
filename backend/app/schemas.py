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
