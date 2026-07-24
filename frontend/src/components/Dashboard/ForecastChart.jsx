import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ReferenceLine, ResponsiveContainer 
} from 'recharts';

const API_BASE = "http://localhost:3001";

export default function ForecastChart({ wardId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wardId) return;
    
    setLoading(true);
    fetch(`${API_BASE}/api/forecast/${wardId}`)
      .then(res => res.json())
      .then(json => {
        // Handle various JSON response patterns from your backend pipeline
        const forecastArray = json.data?.forecast || json.forecast || (Array.isArray(json.data) ? json.data : null);
        
        if (json.success && forecastArray && forecastArray.length > 0) {
          const processedForecast = forecastArray.map(item => ({
            hour_label: item.hour_label || item.time,
            aqi: Math.round(Number(item.aqi || item.value)),
            lowerBound: Math.round(Number(item.aqi || item.value) * 0.85),
            upperBound: Math.round(Number(item.aqi || item.value) * 1.15)
          }));
          setData(processedForecast);
        } else {
          setData([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch real forecast:", err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [wardId]);

  if (loading) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', fontSize: '12px' }}>
        <span style={{ animation: 'pulse 1.5s infinite' }}>Loading ML predictions from pipeline...</span>
      </div>
    );
  }

  if (!data.length) {
    return <div style={{ color: '#64748B', fontSize: '12px', padding: '10px 0' }}>No forecast data available from pipeline.</div>;
  }

  return (
    <div style={{ height: 220, width: '100%', background: 'transparent' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, bottom: 0, left: -25 }}>
          <defs>
            <linearGradient id="colorAqi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorBound" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#1A2744" vertical={false} />
          
          <XAxis 
            dataKey="hour_label" 
            stroke="#64748B" 
            fontSize={9} 
            tickMargin={8} 
            axisLine={false}
            tickLine={false}
            minTickGap={25}
            interval="preserveStartEnd"
          />
          
          <YAxis 
            stroke="#64748B" 
            fontSize={9} 
            domain={['dataMin - 20', 'dataMax + 50']} 
            axisLine={false}
            tickLine={false}
          />
          
          <Tooltip 
            formatter={(value, name) => [Math.round(value), name === 'upperBound' ? 'Max Predicted' : name === 'aqi' ? 'Forecast AQI' : name]}
            contentStyle={{ backgroundColor: '#0B1120', borderColor: '#1A2744', borderRadius: '8px', color: '#F1F5F9', fontSize: 11 }}
            itemStyle={{ color: '#FCA5A5' }}
            labelStyle={{ color: '#94A3B8', marginBottom: '4px' }}
          />
          
          <Area 
            type="monotone" 
            dataKey="upperBound" 
            stroke="none" 
            fillOpacity={1} 
            fill="url(#colorBound)" 
          />

          <ReferenceLine y={300} label={{ position: 'insideTopLeft', value: 'Hazard Threshold', fill: '#EF4444', fontSize: 9 }} stroke="#EF4444" strokeDasharray="3 3" strokeOpacity={0.6} />
          
          <Area 
            type="monotone" 
            dataKey="aqi" 
            stroke="#EF4444" 
            strokeWidth={3} 
            fillOpacity={1} 
            fill="url(#colorAqi)"
            activeDot={{ r: 6, fill: '#EF4444', stroke: '#0B1120', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}