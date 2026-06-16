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
