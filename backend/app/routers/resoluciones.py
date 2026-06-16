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
