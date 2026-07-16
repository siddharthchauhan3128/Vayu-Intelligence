from fastapi import FastAPI
from app.routers import forecaster

app = FastAPI(title="Vayu ML Service", version="1.0")

app.include_router(forecaster.router, prefix="/ml")

@app.get("/health")
def health():
    return {"status": "ok", "service": "vayu-ml"}