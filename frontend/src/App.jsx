import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

export default function App() {
  return (
    <div style={{ display:'flex', height:'100vh', background:'#0B1120' }}>
      <div style={{ flex:1 }}>
        <MapContainer
           center={[19.07, 72.87]}  
          zoom={11}
          style={{ width:'100%', height:'100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="© OpenStreetMap © CARTO"
          />
        </MapContainer>
      </div>
      <div style={{ width:300, color:'white', padding:16 }}>
        <h2>Vayu Intelligence</h2>
        <p style={{ opacity:0.5, fontSize:12 }}>map is live ✓</p>
      </div>
    </div>
  )
}