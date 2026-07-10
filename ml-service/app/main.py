from fastapi import FastAPI

app = FastAPI(title="Vayu ML Service", version="1.0")

@app.get("/health")
def health():
    return {"status": "ok", "service": "vayu-ml"}