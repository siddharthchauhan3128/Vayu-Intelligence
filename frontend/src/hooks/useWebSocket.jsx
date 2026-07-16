import { useEffect, useRef } from 'react'

export function useWebSocket(onMessage) {
  const ws = useRef(null)

  useEffect(() => {
    function connect() {
      ws.current = new WebSocket('ws://localhost:3001')

      ws.current.onopen = () => {
        console.log('[WS] Connected')
      }

      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data)
        if (msg.type === 'AQI_UPDATE') {
          onMessage(msg.city, msg.data)
        }
      }

      ws.current.onclose = () => {
        console.log('[WS] Disconnected — reconnecting in 3s')
        setTimeout(connect, 3000)
      }

      ws.current.onerror = () => ws.current.close()
    }

    connect()
    return () => ws.current?.close()
  }, [])
}