import React, { useEffect, useState } from 'react';
import { CircleMarker, Tooltip } from 'react-leaflet';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default function SatelliteLayer({ city }) {
  const [fires, setFires] = useState([]);

  useEffect(() => {
    // Fetch fire hotspots from the backend
    const fetchFires = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/fires?city=${city}`);
        const data = await response.json();
        if (data.success) {
          setFires(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch fire hotspots:", error);
      }
    };

    fetchFires();
    
    // Refresh every 5 minutes 
    const interval = setInterval(fetchFires, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [city]);

  if (!fires || fires.length === 0) return null;

  return (
    <>
      {/* CSS for the pulsing fire effect */}
      <style>{`
        @keyframes firepulse { 
          0% { stroke-width: 2; stroke-opacity: 0.9; fill-opacity: 0.7; }
          50% { stroke-width: 10; stroke-opacity: 0.2; fill-opacity: 0.4; }
          100% { stroke-width: 2; stroke-opacity: 0.9; fill-opacity: 0.7; }
        }
        .fire-marker path {
          animation: firepulse 2s infinite ease-in-out;
        }
      `}</style>
      
      {fires.map((fire) => {
        // Calculate radius based on Fire Radiative Power (FRP)
        const radius = Math.max(6, Math.min(15, fire.frp / 4));
        
        return (
          <CircleMarker
            key={fire.id}
            center={[fire.latitude, fire.longitude]}
            radius={radius}
            pathOptions={{
              fillColor: '#EF4444', // Bright Red
              color: '#FCA5A5',     // Lighter red outer glow
              className: 'fire-marker'
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]}>
              <div style={{ padding: '2px', fontFamily: "'Inter', sans-serif" }}>
                <div style={{ fontWeight: 800, color: '#EF4444', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase' }}>
                  🔥 Thermal Anomaly
                </div>
                <div style={{ fontSize: '11px', color: '#1E293B', lineHeight: '1.4' }}>
                  <strong>FRP:</strong> {fire.frp} MW<br/>
                  <strong>Confidence:</strong> {fire.confidence === 'h' ? 'High' : 'Nominal'}<br/>
                  <strong>Time:</strong> {fire.acq_time} UTC
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}