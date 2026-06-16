import enum
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
    valor_usuario = Column(Text, nullable=False, server_default="")
    valor_analista = Column(Text, nullable=False, server_default="")
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
