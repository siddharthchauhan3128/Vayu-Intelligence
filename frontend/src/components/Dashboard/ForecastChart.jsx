import React, { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ReferenceLine, ResponsiveContainer 
} from 'recharts';

export default function ForecastChart({ wardId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wardId) return;
    
    setLoading(true);
    // FORCE direct connection to backend port 3001
    fetch(`http://localhost:3001/api/forecast/${wardId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json.data.forecast);
        }
      })
      .catch(err => console.error("Failed to fetch forecast:", err))
      .finally(() => setLoading(false));
  }, [wardId]);

  if (loading) return <div style={{ color: '#00D4FF' }}>Loading forecast model...</div>;
  if (!data || !data.length) return <div style={{ color: '#64748B' }}>No forecast data available.</div>;

  return (
    <div style={{ height: 250, width: '100%', background: '#0F2744', padding: 16, borderRadius: 8, border: '1px solid #1A4A7A' }}>
      <h3 style={{ color: '#E2E8F0', fontWeight: 600, marginBottom: 16, fontSize: 14 }}>72h Predictive Trajectory</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1A4A7A" vertical={false} />
          <XAxis 
            dataKey="hour_label" 
            stroke="#E2E8F0" 
            fontSize={10} 
            tickMargin={10} 
          />
          <YAxis 
            stroke="#E2E8F0" 
            fontSize={10} 
            domain={['dataMin - 20', 'dataMax + 50']} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1A4A7A', color: '#E2E8F0' }}
            itemStyle={{ color: '#00D4FF' }}
          />
          <ReferenceLine y={200} label={{ position: 'top', value: 'Threshold', fill: '#FF6B35', fontSize: 10 }} stroke="#FF6B35" strokeDasharray="3 3" />
          
          <Line 
            type="monotone" 
            dataKey="aqi" 
            stroke="#00D4FF" 
            strokeWidth={3} 
            dot={{ r: 3, fill: '#0F2744', stroke: '#00D4FF', strokeWidth: 2 }} 
            activeDot={{ r: 5, fill: '#00D4FF' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}