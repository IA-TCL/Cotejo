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
