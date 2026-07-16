import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useWebSocket } from './hooks/useWebSocket.jsx'
// AQI → colour
function aqiColor(aqi) {
  if (aqi <= 50)  return '#22C55E'
  if (aqi <= 100) return '#A3E635'
  if (aqi <= 200) return '#FACC15'
  if (aqi <= 300) return '#FB923C'
  if (aqi <= 400) return '#EF4444'
  return '#7C3AED'
}

function aqiLabel(aqi) {
  if (aqi <= 50)  return 'Good'
  if (aqi <= 100) return 'Satisfactory'
  if (aqi <= 200) return 'Moderate'
  if (aqi <= 300) return 'Poor'
  if (aqi <= 400) return 'Very Poor'
  return 'Severe'
}

// Approximate ward coordinates for Mumbai
const WARD_COORDS = {
  'Dharavi':   [19.0422, 72.8530],
  'Kurla':     [19.0726, 72.8846],
  'Andheri E': [19.1136, 72.8697],
  'Govandi':   [19.0619, 72.9161],
  'Chembur':   [19.0522, 72.8994],
  'Bhandup':   [19.1439, 72.9396],
  'Worli':     [19.0039, 72.8178],
  'Colaba':    [18.9067, 72.8147],
}

export default function App() {
  const [allWards, setAllWards] = useState({ mumbai: [], delhi: [] })
    const [selected, setSelected] = useState(null)
    const [city, setCity] = useState('mumbai')
    const [lastUpdate, setLastUpdate] = useState(null)

    // wards for current city
    const wards = allWards[city] || []

    // Initial fetch for both cities
    useEffect(() => {
      ['mumbai', 'delhi'].forEach(c => {
        fetch(`http://localhost:3001/api/wards?city=${c}`)
          .then(r => r.json())
          .then(d => setAllWards(prev => ({ ...prev, [c]: d.data || [] })))
          .catch(console.error)
      })
    }, [])

    // WebSocket — updates per city
    const handleWsMessage = useCallback((updatedCity, data) => {
      setAllWards(prev => ({ ...prev, [updatedCity]: data }))
      setLastUpdate(new Date().toLocaleTimeString())
    }, [])

    useWebSocket(handleWsMessage)

  return (
    <div style={{ display:'flex', height:'100vh', background:'#0B1120', fontFamily:'sans-serif' }}>

      {/* MAP */}
      <div style={{ flex:1 }}>
        <MapContainer
          center={[19.07, 72.87]}
          zoom={11}
          style={{ width:'100%', height:'100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="&copy; OpenStreetMap &copy; CARTO"
          />

          {wards.map(ward => {
            const coords = WARD_COORDS[ward.ward_name]
            if (!coords) return null
            return (
              <CircleMarker
                key={ward.id}
                center={coords}
                radius={28}
                pathOptions={{
                  fillColor: aqiColor(ward.aqi),
                  fillOpacity: 0.75,
                  color: '#fff',
                  weight: 1.5
                }}
                eventHandlers={{ click: () => setSelected(ward) }}
              >
                <Tooltip direction="top" permanent={false}>
                  <b>{ward.ward_name}</b><br />
                  AQI: {ward.aqi} — {aqiLabel(ward.aqi)}
                </Tooltip>
              </CircleMarker>
            )
          })}
        </MapContainer>
      </div>

      {/* SIDEBAR */}
      <div style={{
        width: 300,
        background: '#0F1A2E',
        borderLeft: '1px solid #1A3A5C',
        padding: 20,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div>
          <div style={{ fontSize:11, color:'#64748B', letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Urban AQI Intelligence
          </div>
          <div style={{ fontSize:20, fontWeight:600, marginTop:4 }}>Vayu</div>
          {lastUpdate && (
              <div style={{ fontSize:10, color:'#22C55E', marginTop:2 }}>
                ● Live · updated {lastUpdate}
              </div>
          )}
        </div>

        {/* City selector */}
        <div style={{ display:'flex', gap:6 }}>
          {['mumbai','delhi'].map(c => (
            <button key={c} onClick={() => setCity(c)} style={{
              flex:1, padding:'6px 0', borderRadius:6, border:'none',
              background: city===c ? '#1A4A7A' : '#1E2D3D',
              color: city===c ? '#00D4FF' : '#64748B',
              cursor:'pointer', fontSize:12, textTransform:'capitalize'
            }}>{c}</button>
          ))}
        </div>

        {/* Ward list */}
        <div>
          <div style={{ fontSize:11, color:'#64748B', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Wards · {wards.length} total
          </div>
          {wards.map(w => (
            <div key={w.id}
              onClick={() => setSelected(w)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 10px', borderRadius:6, marginBottom:4,
                background: selected?.id===w.id ? '#1A3A5C' : 'transparent',
                cursor:'pointer', transition:'background 0.15s'
              }}
            >
              <div style={{
                width:10, height:10, borderRadius:'50%',
                background: aqiColor(w.aqi), flexShrink:0
              }}/>
              <div style={{ flex:1, fontSize:12 }}>{w.ward_name}</div>
              <div style={{ fontSize:12, fontWeight:600, color: aqiColor(w.aqi) }}>
                {w.aqi}
              </div>
            </div>
          ))}
        </div>

        {/* Selected ward detail */}
        {selected && (
          <div style={{
            background:'#1A2744', borderRadius:8, padding:14,
            border:`1px solid ${aqiColor(selected.aqi)}44`
          }}>
            <div style={{ fontSize:14, fontWeight:600, marginBottom:8 }}>
              {selected.ward_name}
            </div>
            <div style={{ fontSize:11, color:'#64748B', marginBottom:12 }}>
              {selected.city.toUpperCase()} · {selected.land_use_type}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              {[
                { label:'AQI', value: selected.aqi, color: aqiColor(selected.aqi) },
                { label:'Status', value: aqiLabel(selected.aqi), color: aqiColor(selected.aqi) },
                { label:'PM2.5', value: selected.pm25 + ' μg', color:'#fff' },
                { label:'PM10',  value: selected.pm10 + ' μg', color:'#fff' },
              ].map(item => (
                <div key={item.label} style={{
                  background:'#0F1A2E', borderRadius:6, padding:'8px 10px'
                }}>
                  <div style={{ fontSize:10, color:'#64748B', marginBottom:2 }}>{item.label}</div>
                  <div style={{ fontSize:13, fontWeight:600, color: item.color }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop:10, fontSize:11, color:'#64748B' }}>
              Population: {selected.population?.toLocaleString()}
            </div>
          </div>
        )}

        {/* Legend */}
        <div>
          <div style={{ fontSize:11, color:'#64748B', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.08em' }}>Legend</div>
          {[
            { label:'Good (0–50)',         color:'#22C55E' },
            { label:'Satisfactory (51–100)', color:'#A3E635' },
            { label:'Moderate (101–200)',  color:'#FACC15' },
            { label:'Poor (201–300)',      color:'#FB923C' },
            { label:'Very Poor (301–400)', color:'#EF4444' },
            { label:'Severe (400+)',       color:'#7C3AED' },
          ].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:item.color, flexShrink:0 }}/>
              <div style={{ fontSize:11, color:'#94A3B8' }}>{item.label}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}