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
