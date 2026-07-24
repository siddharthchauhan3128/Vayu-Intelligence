import numpy as np

# Source categories
SOURCES = ['vehicle', 'construction', 'industrial', 'dust', 'waste_burning']

# Land use → source weights
LAND_USE_WEIGHTS = {
    'industrial':  [0.15, 0.10, 0.55, 0.10, 0.10],
    'residential': [0.45, 0.15, 0.10, 0.20, 0.10],
    'commercial':  [0.55, 0.20, 0.05, 0.15, 0.05],
    'mixed':       [0.40, 0.20, 0.15, 0.15, 0.10],
}

# Time of day → source multipliers
def time_multiplier(hour: int):
    if 7 <= hour <= 10 or 17 <= hour <= 20:
        return [1.4, 0.8, 1.0, 1.0, 0.8]  # rush hour — vehicles up
    elif 10 <= hour <= 16:
        return [0.8, 1.4, 1.2, 1.2, 0.9]  # daytime — construction up
    elif 0 <= hour <= 5:
        return [0.4, 0.2, 0.8, 0.6, 1.8]  # night — waste burning up
    else:
        return [1.0, 1.0, 1.0, 1.0, 1.0]

def attribute_sources(
    land_use: str,
    hour: int,
    wind_speed: float = 3.0,
    aqi: int = 200
):
    base = LAND_USE_WEIGHTS.get(land_use, LAND_USE_WEIGHTS['mixed'])
    multipliers = time_multiplier(hour)

    # Apply multipliers
    weighted = [b * m for b, m in zip(base, multipliers)]

    # Add noise for realism
    noise = np.random.dirichlet(np.ones(5) * 2)
    final = [w * 0.85 + n * 0.15 for w, n in zip(weighted, noise)]

    # Normalize to 100%
    total = sum(final)
    percentages = [round((f / total) * 100, 1) for f in final]

    # Ensure sum = 100
    diff = 100 - sum(percentages)
    percentages[0] += diff

    return [
        {'source': SOURCES[i], 'percentage': percentages[i]}
        for i in range(len(SOURCES))
    ]