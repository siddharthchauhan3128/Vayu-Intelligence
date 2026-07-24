import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE = "http://localhost:3001";

// Map Python/FastAPI source keys to UI labels and colors
const SOURCE_MAPPING = {
  'vehicle': { label: 'Vehicle', color: '#EF4444' },
  'construction': { label: 'Construction', color: '#F59E0B' },
  'industrial': { label: 'Industrial', color: '#8B5CF6' },
  'dust': { label: 'Dust', color: '#FCD34D' },
  'waste_burning': { label: 'Waste', color: '#64748B' }
};

export default function SourceAttribution({ wardId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wardId) return;
    
    setLoading(true);
    fetch(`${API_BASE}/api/attribution/${wardId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.sources) {
          // Format the FastAPI output for Recharts
          const formattedData = json.data.sources.map(item => ({
            name: SOURCE_MAPPING[item.source]?.label || item.source,
            value: Number(Number(item.percentage).toFixed(1)),
            color: SOURCE_MAPPING[item.source]?.color || '#94A3B8'
          })).sort((a, b) => b.value - a.value); // Sort highest to lowest
          
          setData(formattedData);
        }
      })
      .catch(err => console.error("Failed to fetch ML attribution:", err))
      .finally(() => setLoading(false));
  }, [wardId]);

  if (loading) return <div style={{ color: '#3B82F6', fontSize: 12 }}>Loading ML attribution...</div>;
  if (!data.length) return <div style={{ color: '#64748B', fontSize: 12 }}>No source data available.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. The Donut Chart */}
      <div style={{ height: 180, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `${Number(value).toFixed(1)}%`}
              contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1A2744', color: '#F1F5F9', borderRadius: '8px' }}
              itemStyle={{ color: '#F1F5F9', fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center Text inside Donut */}
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: data[0]?.color, textTransform: 'uppercase' }}>
            {data[0]?.name}
          </div>
          <div style={{ fontSize: 10, color: '#64748B', letterSpacing: '0.05em' }}>Top Source</div>
        </div>
      </div>

      {/* 2. The Progress Bar Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: item.color }} />
            <div style={{ flex: 1, fontSize: '13px', color: '#94A3B8' }}>{item.name}</div>
            
            {/* Visual Bar */}
            <div style={{ width: '80px', height: '4px', backgroundColor: '#1A2744', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: `${item.value}%`, height: '100%', backgroundColor: item.color }} />
            </div>
            
            <div style={{ fontSize: '13px', fontWeight: 700, color: item.color, width: '45px', textAlign: 'right' }}>
              {Number(item.value).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}