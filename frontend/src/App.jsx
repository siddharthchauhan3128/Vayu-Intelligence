import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useWebSocket } from './hooks/useWebSocket'
import ForecastChart from './components/Dashboard/ForecastChart.jsx'
import SourceAttribution from './components/SourceAttribution.jsx'
import SatelliteLayer from './components/SatelliteLayer.jsx'
import FireAlertBadge from './components/Dashboard/FireAlertBadge.jsx'
import AttributionAgent from './components/Dashboard/AttributionAgent.jsx'

// ── AQI helpers ───────────────────────────────────────────────────────────────

function aqiColor(aqi) {
  if (aqi <= 50)  return '#22C55E'
  if (aqi <= 100) return '#84CC16'
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

const WARD_COORDS = {
  'Dharavi':    [19.0422, 72.8530],
  'Kurla':      [19.0726, 72.8846],
  'Andheri E':  [19.1136, 72.8697],
  'Govandi':    [19.0619, 72.9161],
  'Chembur':    [19.0522, 72.8994],
  'Bhandup':    [19.1439, 72.9396],
  'Worli':      [19.0039, 72.8178],
  'Colaba':     [18.9067, 72.8147],
  'Anand Vihar':[28.6469, 77.3152],
  'Rohini':     [28.7041, 77.1025],
  'Okhla':      [28.5355, 77.2637],
  'Dwarka':     [28.5921, 77.0460],
}

// ── Styles (defined once, outside component) ─────────────────────────────────

const S = {
  app: {
    display: 'flex', flexDirection: 'column',
    height: '100vh', background: '#060D1F',
    fontFamily: "'Inter', -apple-system, sans-serif",
    color: '#F1F5F9',
  },

  // Topbar
  topbar: {
    height: 48, background: 'rgba(6,13,31,0.95)',
    borderBottom: '1px solid #1A2744',
    display: 'flex', alignItems: 'center',
    padding: '0 20px', gap: 16, flexShrink: 0,
    backdropFilter: 'blur(8px)', zIndex: 1000,
  },
  logo: { fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: '#F1F5F9' },
  logoAccent: { color: '#3B82F6' },
  topbarRight: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 },
  topStat: { textAlign: 'right' },
  topStatVal: { fontSize: 13, fontWeight: 700 },
  topStatLbl: { fontSize: 9, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' },
  liveDot: {
    width: 7, height: 7, borderRadius: '50%', background: '#22C55E',
    animation: 'livepulse 2s ease-in-out infinite',
  },
  cityBtn: (active) => ({
    padding: '3px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontSize: 11, textTransform: 'capitalize',
    background: active ? '#1E3A5C' : 'transparent',
    color: active ? '#60A5FA' : '#475569',
    transition: 'all 0.15s',
  }),

  // Body container (full screen relative overlay)
  body: { 
    flex: 1, position: 'relative', overflow: 'hidden' 
  },

  // Floating Right Panel
  rightPanel: {
    position: 'absolute',
    top: 16, right: 16, bottom: 16, width: 360,
    background: 'rgba(8, 15, 32, 0.95)',
    backdropFilter: 'blur(12px)',
    border: '1px solid #1A2744', borderRadius: 16,
    display: 'flex', flexDirection: 'column',
    zIndex: 1000, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    overflow: 'hidden'
  },

  // Ward list section
  sectionLabel: {
    fontSize: 9, color: '#334155',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    padding: '16px 20px 8px', borderBottom: '1px solid #0F1A2E',
  },
  wardRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 20px', cursor: 'pointer',
    borderLeft: '2px solid transparent',
    transition: 'background 0.1s',
  },
  wardDot: (color) => ({
    width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
  }),
  wardName: { flex: 1, fontSize: 13, color: '#94A3B8' },
  wardAqi: (color) => ({ fontSize: 13, fontWeight: 700, color }),

  // Header inside the analysis panel
  analysisHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #1A2744',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.05)', border: 'none',
    color: '#94A3B8', width: 28, height: 28, borderRadius: '50%',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.2s', fontSize: 16
  },
  wardTitle: { fontSize: 20, fontWeight: 800, color: '#F1F5F9', marginBottom: 4 },
  wardMeta: { fontSize: 11, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' },
  
  aqiBadge: (color) => ({
    background: `${color}15`, border: `1px solid ${color}33`,
    borderRadius: 8, padding: '4px 10px', textAlign: 'center', marginTop: 8
  }),
  aqiNum: (color) => ({ fontSize: 22, fontWeight: 800, color, lineHeight: 1 }),
  aqiLbl: (color) => ({ fontSize: 9, color, textTransform: 'uppercase', letterSpacing: '0.08em' }),

  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '0 20px' },
  statBox: { background: 'rgba(6, 13, 31, 0.5)', borderRadius: 8, padding: '10px 12px', border: '1px solid #1A2744' },
  statLabel: { fontSize: 10, color: '#475569', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 700, color: '#F1F5F9' },
  statUnit: { fontSize: 10, color: '#64748B' },

  subLabel: {
    fontSize: 10, color: '#334155',
    textTransform: 'uppercase', letterSpacing: '0.1em', 
    marginBottom: 12, fontWeight: 600
  },

  // Legend
  legend: { padding: '16px 20px', borderTop: '1px solid #0F1A2E' },
  legendRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  legendDot: (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
  legendText: { fontSize: 11, color: '#64748B' },

  // Map legend overlay (bottom left)
  mapLegend: {
    position: 'absolute', bottom: 24, left: 24, zIndex: 999,
    background: 'rgba(8,15,32,0.92)', border: '1px solid #1A2744',
    borderRadius: 12, padding: '12px 16px', backdropFilter: 'blur(6px)',
  },
}

// ── Stat box ──────────────────────────────────────────────────────────────────

function StatBox({ label, value, unit }) {
  return (
    <div style={S.statBox}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}<span style={S.statUnit}>{unit}</span></div>
    </div>
  )
}

// ── AQI Legend overlay on map ─────────────────────────────────────────────────

function MapLegend() {
  const items = [
    { label: 'Good',         color: '#22C55E', range: '0–50'   },
    { label: 'Satisfactory', color: '#84CC16', range: '51–100' },
    { label: 'Moderate',     color: '#FACC15', range: '101–200'},
    { label: 'Poor',         color: '#FB923C', range: '201–300'},
    { label: 'Very Poor',    color: '#EF4444', range: '301–400'},
    { label: 'Severe',       color: '#7C3AED', range: '400+'   },
  ]
  return (
    <div style={S.mapLegend}>
      <div style={{ ...S.subLabel, marginBottom: 10 }}>AQI Index</div>
      {items.map(i => (
        <div key={i.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={S.legendDot(i.color)} />
          <span style={{ fontSize: 11, color: '#94A3B8', flex: 1 }}>{i.label}</span>
          <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{i.range}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [allWards, setAllWards]   = useState({ mumbai: [], delhi: [] })
  const [selected, setSelected]   = useState(null)
  const [city, setCity]           = useState('mumbai')
  const [lastUpdate, setLastUpdate] = useState(null)

  const wards = allWards[city] || []

  const severeCount = wards.filter(w => w.aqi > 300).length
  const avgAqi = wards.length
    ? Math.round(wards.reduce((s, w) => s + w.aqi, 0) / wards.length)
    : 0

  useEffect(() => {
    ['mumbai', 'delhi'].forEach(c => {
      fetch(`http://localhost:3001/api/wards?city=${c}`)
        .then(r => r.json())
        .then(d => { if (d.success) setAllWards(prev => ({ ...prev, [c]: d.data })) })
        .catch(console.error)
    })
  }, [])

  const handleWsMessage = useCallback((updatedCity, data) => {
    if (data?.length > 0) {
      setAllWards(prev => ({ ...prev, [updatedCity]: data }))
      setLastUpdate(new Date().toLocaleTimeString())
    }
  }, [])

  useWebSocket(handleWsMessage)

  const color = selected ? aqiColor(selected.aqi) : '#3B82F6'

  return (
    <>
      <style>{`
        @keyframes livepulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #1A2744; border-radius: 2px; }
        .ward-row:hover { background: rgba(26, 39, 68, 0.4) !important; }
        .close-btn:hover { background: rgba(255,255,255,0.1) !important; color: #fff !important; }
        .leaflet-container { background: #060D1F; }
      `}</style>

      <div style={S.app}>

        {/* ── Top Bar ─────────────────────────────────────────────────────── */}
        <div style={S.topbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Vayu Geospatial Logo */}
            <svg width="24" height="24" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              {/* Orbital Ring */}
              <circle cx="50" cy="50" r="40" fill="none" stroke="#1E3A5C" strokeWidth="8" strokeDasharray="50 15 25 15" strokeLinecap="round" transform="rotate(-45 50 50)" />
              {/* Lower Wave */}
              <path d="M 25 45 C 20 75, 55 90, 75 65" fill="none" stroke="#3B82F6" strokeWidth="10" strokeLinecap="round" />
              {/* Upper Wave */}
              <path d="M 75 55 C 80 25, 45 10, 25 35" fill="none" stroke="#00D4FF" strokeWidth="10" strokeLinecap="round" />
              {/* AI Core */}
              <circle cx="50" cy="50" r="12" fill="#60A5FA" />
            </svg>
            
            {/* Vayu Text */}
            <div style={S.logo}>va<span style={S.logoAccent}>yu</span></div>
          </div>

          {/* City switcher */}
          <div style={{ display: 'flex', gap: 4, background: '#0A1628', borderRadius: 20, padding: 3, border: '1px solid #1A2744' }}>
            {['mumbai', 'delhi'].map(c => (
              <button key={c} style={S.cityBtn(city === c)}
                onClick={() => { setCity(c); setSelected(null) }}>
                {c}
              </button>
            ))}
          </div>

          <div style={S.topbarRight}>
            <div style={S.topStat}>
              <div style={{ ...S.topStatVal, color: '#EF4444' }}>{severeCount} wards</div>
              <div style={S.topStatLbl}>Very Poor+</div>
            </div>
            <div style={{ width: 1, height: 24, background: '#1A2744' }} />
            <div style={S.topStat}>
              <div style={{ ...S.topStatVal, color: aqiColor(avgAqi) }}>{avgAqi}</div>
              <div style={S.topStatLbl}>City avg AQI</div>
            </div>
            <div style={{ width: 1, height: 24, background: '#1A2744' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={S.liveDot} />
              <div style={{ fontSize: 10, color: '#22C55E' }}>
                {lastUpdate ? `Updated ${lastUpdate}` : 'Live'}
              </div>
            </div>
          </div>
        </div>

        {/* ── Body Overlay ────────────────────────────────────────────────── */}
        <div style={S.body}>

          {/* MAP CONTAINER (Absolute Full Screen behind panels) */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <MapContainer
              center={city === 'delhi' ? [28.61, 77.20] : [19.07, 72.87]}
              zoom={11}
              style={{ width: '100%', height: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com">CARTO</a>'
                maxZoom={19}
              />

              <SatelliteLayer city={city}/>

              {wards.map(ward => {
                const coords = WARD_COORDS[ward.ward_name]
                if (!coords) return null
                const isSelected = selected?.id === ward.id
                const r = Math.max(16, Math.min(28, ward.aqi / 14))
                return (
                  <CircleMarker
                    key={ward.id}
                    center={coords}
                    radius={r}
                    pathOptions={{
                      fillColor: aqiColor(ward.aqi),
                      fillOpacity: isSelected ? 0.95 : 0.75,
                      color: isSelected ? '#fff' : 'rgba(255,255,255,0.2)',
                      weight: isSelected ? 2.5 : 1,
                    }}
                    eventHandlers={{ click: () => setSelected(ward) }}
                  >
                    <Tooltip direction="top" offset={[0, -r]}>
                      <span style={{ fontWeight: 700 }}>{ward.ward_name}</span><br />
                      AQI {ward.aqi} · {aqiLabel(ward.aqi)}
                    </Tooltip>
                  </CircleMarker>
                )
              })}
            </MapContainer>
            <MapLegend />
          </div>

          {/* RIGHT PANEL (Toggles between Ward List and Selected Analysis) */}
          <div style={S.rightPanel}>
            
            {!selected ? (
              // DEFAULT VIEW: WARD LIST
              <>
                <div style={S.sectionLabel}>Wards · {wards.length} total</div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {wards.map(w => (
                    <div
                      key={w.id}
                      className="ward-row"
                      style={S.wardRow}
                      onClick={() => setSelected(w)}
                    >
                      <div style={S.wardDot(aqiColor(w.aqi))} />
                      <div style={S.wardName}>{w.ward_name}</div>
                      <div style={S.wardAqi(aqiColor(w.aqi))}>{w.aqi}</div>
                    </div>
                  ))}

                </div>
            
                {/* Embedded Legend inside Sidebar */}
                <div style={S.legend}>
                  <div style={{ ...S.subLabel, marginBottom: 8 }}>AQI Guide</div>
                  {[
                    ['Good',         '#22C55E', '0–50'   ],
                    ['Satisfactory', '#84CC16', '51–100' ],
                    ['Moderate',     '#FACC15', '101–200'],
                    ['Poor',         '#FB923C', '201–300'],
                    ['Very Poor',    '#EF4444', '301–400'],
                    ['Severe',       '#7C3AED', '400+'   ],
                  ].map(([label, color, range]) => (
                    <div key={label} style={S.legendRow}>
                      <div style={S.legendDot(color)} />
                      <div style={S.legendText}>{label}</div>
                      <div style={{ marginLeft: 'auto', fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>{range}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // ACTIVE VIEW: ANALYSIS CARD
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* Header Block */}
                <div style={S.analysisHeader}>
                  <div>
                    <div style={S.wardTitle}>{selected.ward_name}</div>
                    <div style={S.wardMeta}>{selected.city} · {selected.land_use_type?.replace(/_/g, ' ')}</div>
                    <div style={S.aqiBadge(color)}>
                      <div style={S.aqiNum(color)}>{Math.round(selected.aqi)}</div>
                      <div style={S.aqiLbl(color)}>{aqiLabel(selected.aqi)}</div>
                    </div>
                  </div>
                  <button className="close-btn" onClick={() => setSelected(null)} style={S.closeBtn}>✕</button>
                </div>

                {/* Scrolling Content Block */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 24 }}>
                  
                  {/* Top Stats */}
                  <div style={S.statsGrid}>
                    <StatBox label="PM2.5" value={selected.pm25} unit=" μg" />
                    <StatBox label="PM10"  value={selected.pm10} unit=" μg" />
                    <StatBox label="NO₂"   value={selected.no2 || '—'} unit={selected.no2 ? ' μg' : ''} />
                  </div>

                  <div style={{ padding: '0 20px' }}>
                    <FireAlertBadge city={city} selectedWard={selected.ward_name} />
                  </div>

                  {/* Pollution Sources */}
                  <div style={{ padding: '0 20px' }}>
                    <div style={S.subLabel}>Pollution Sources</div>
                    <SourceAttribution wardId={selected.id} />
                    <AttributionAgent selectedWard={selected.ward_name} wardId={selected.id} aqi={selected.aqi} />
                  </div>


                  {/* Forecast Chart */}
                  <div style={{ padding: '0 20px' }}>
                    <div style={S.subLabel}>72-Hour Forecast</div>
                    <ForecastChart wardId={selected.id} />
                  </div>

                </div>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </>
  )
}