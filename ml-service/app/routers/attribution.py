from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.models.source_attributor import attribute_sources

router = APIRouter()

class AttributionRequest(BaseModel):
    ward_name: str
    land_use: str = 'mixed'
    aqi: int = 200
    wind_speed: float = 3.0

@router.post("/attribute")
def get_attribution(req: AttributionRequest):
    try:
        hour = datetime.now().hour
        sources = attribute_sources(
            land_use=req.land_use,
            hour=hour,
            wind_speed=req.wind_speed,
            aqi=req.aqi
        )
        # Sort by percentage descending
        sources.sort(key=lambda x: x['percentage'], reverse=True)
        return {
            "ward": req.ward_name,
            "aqi": req.aqi,
            "hour": hour,
            "sources": sources,
            "top_source": sources[0]['source'],
            "confidence": round(sources[0]['percentage'], 1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))