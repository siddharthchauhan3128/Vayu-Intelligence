import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_forecast(ward_name: str, current_aqi: int, hours: int = 72):
    """
    Generates realistic 72h AQI forecast using pattern simulation.
    In production this would use trained Prophet model on historical data.
    """
    now = datetime.now()
    forecasts = []

    # Diurnal pattern — AQI peaks at morning/evening rush hours
    diurnal = {
        0:0.85, 1:0.80, 2:0.78, 3:0.75, 4:0.78,
        5:0.85, 6:0.95, 7:1.10, 8:1.20, 9:1.15,
        10:1.05, 11:1.00, 12:0.98, 13:0.95, 14:0.93,
        15:0.95, 16:1.00, 17:1.10, 18:1.20, 19:1.15,
        20:1.05, 21:1.00, 22:0.95, 23:0.90
    }

    base = current_aqi
    for i in range(hours):
        future_time = now + timedelta(hours=i)
        hour = future_time.hour

        # Apply diurnal pattern + slight random walk
        noise = np.random.normal(0, current_aqi * 0.03)
        trend = -0.5 if i > 36 else 0.3  # slight improvement after 36h
        predicted = base * diurnal[hour] + noise + (trend * i * 0.1)
        predicted = max(20, min(500, round(predicted)))

        forecasts.append({
            'time': future_time.isoformat(),
            'aqi': predicted,
            'hour_label': future_time.strftime('%d %b %I%p')
        })

    return forecasts