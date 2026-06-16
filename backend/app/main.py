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
