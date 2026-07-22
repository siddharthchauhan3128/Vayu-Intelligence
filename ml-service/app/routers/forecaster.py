from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.aqi_forecaster import generate_forecast

router = APIRouter()

class ForecastRequest(BaseModel):
    ward_name: str
    current_aqi: int
    hours: int = 72

@router.post("/forecast")
def get_forecast(req: ForecastRequest):
    try:
        forecast = generate_forecast(
            ward_name=req.ward_name,
            current_aqi=req.current_aqi,
            hours=req.hours
        )
        sampled = forecast[::6]
        return {
            "ward": req.ward_name,
            "current_aqi": req.current_aqi,
            "forecast": sampled,
            "generated_at": forecast[0]['time']
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast/health")
def forecast_health():
    return {"status": "ok", "model": "diurnal-pattern-v1"}