import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Coordinates for distance checking
const WARD_COORDS = {
  'Dharavi': [19.0422, 72.8530],
  'Kurla': [19.0645, 72.8797],
  'Andheri E': [19.1136, 72.8697],
  'Govandi': [19.0551, 72.9149],
  'Chembur': [19.0308, 72.8966],
  'Bhandup': [19.1439, 72.9338],
  'Worli': [19.0066, 72.8153],
  'Colaba': [18.9067, 72.8147]
};

// Haversine distance formula to calculate km between ward and fire
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; 
}

export default function FireAlertBadge({ city, selectedWard }) {
  const [nearbyFires, setNearbyFires] = useState(0);

  useEffect(() => {
    if (!selectedWard || !WARD_COORDS[selectedWard]) return;

    const fetchFires = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/fires?city=${city}`);
        const data = await response.json();
        
        if (data.success) {
          const wardLocation = WARD_COORDS[selectedWard];
          
          // Filter fires to only those within 5km of the clicked ward
          const closeFires = data.data.filter(fire => {
            const distance = getDistance(
              wardLocation[0], wardLocation[1], 
              fire.latitude, fire.longitude
            );
            return distance <= 5;
          });
          
          setNearbyFires(closeFires.length);
        }
      } catch (error) {
        console.error("Failed to fetch fires:", error);
      }
    };

    fetchFires();
  }, [city, selectedWard]);

  if (!selectedWard) return null;

  return (
    <div style={{
      marginTop: '20px',
      padding: '12px 16px',
      backgroundColor: nearbyFires > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(30, 41, 59, 0.4)',
      border: `1px solid ${nearbyFires > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(71, 85, 105, 0.4)'}`,
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    }}>
      {nearbyFires > 0 ? (
        <>
          <div style={{ position: 'relative', width: '10px', height: '10px' }}>
             <div style={{
               position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
               backgroundColor: '#EF4444', borderRadius: '50%',
               animation: 'firepulse 2s infinite ease-in-out'
             }} />
             <div style={{
               position: 'absolute', top: '2px', left: '2px', width: '6px', height: '6px',
               backgroundColor: '#B91C1C', borderRadius: '50%'
             }} />
          </div>
          <div>
            <div style={{ color: '#FCA5A5', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
              THERMAL ANOMALY ALERT
            </div>
            <div style={{ color: '#EF4444', fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>
              {nearbyFires} Active Fire{nearbyFires > 1 ? 's' : ''} near {selectedWard}
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#475569', borderRadius: '50%' }} />
          <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>
            No nearby fires detected
          </div>
        </>
      )}
    </div>
  );
}