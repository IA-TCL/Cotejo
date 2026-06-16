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
