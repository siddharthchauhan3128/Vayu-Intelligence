CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE TABLE IF NOT EXISTS wards (
  id SERIAL PRIMARY KEY,
  city VARCHAR(50) NOT NULL,
  ward_name VARCHAR(100) NOT NULL,
  ward_code VARCHAR(20),
  geom GEOMETRY(MULTIPOLYGON, 4326),
  population INTEGER,
  land_use_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS aqi_readings (
  time TIMESTAMPTZ NOT NULL,
  station_id VARCHAR(50) NOT NULL,
  ward_id INTEGER REFERENCES wards(id),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  aqi INTEGER,
  pm25 DOUBLE PRECISION,
  pm10 DOUBLE PRECISION,
  no2 DOUBLE PRECISION,
  so2 DOUBLE PRECISION
);
SELECT create_hypertable('aqi_readings','time', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS fire_hotspots (
  id SERIAL PRIMARY KEY,
  detected_at TIMESTAMPTZ NOT NULL,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  brightness DOUBLE PRECISION,
  city_proximity VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS emission_sources (
  id SERIAL PRIMARY KEY,
  ward_id INTEGER REFERENCES wards(id),
  name VARCHAR(200),
  source_type VARCHAR(50),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  last_inspection DATE,
  violation_count INTEGER DEFAULT 0
);