import { useEffect, useState } from 'react'

// Current weather for Brampton, ON from Open-Meteo — a free, keyless, CORS-
// enabled public API, so the kiosk browser can fetch it directly (no server
// pull, no API key). Refreshes every 10 minutes; fails soft to an 'error'
// status the UI shows gently.
const BRAMPTON = { lat: 43.7315, lon: -79.7624 }
const URL =
  `https://api.open-meteo.com/v1/forecast?latitude=${BRAMPTON.lat}&longitude=${BRAMPTON.lon}` +
  '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
  '&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto'
const REFRESH_MS = 10 * 60 * 1000

export default function useWeather() {
  const [weather, setWeather] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error

  useEffect(() => {
    let alive = true

    async function load() {
      try {
        const res = await fetch(URL, { cache: 'no-store' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const c = data.current || {}
        if (!alive) return
        setWeather({
          temp: Math.round(c.temperature_2m),
          feels: Math.round(c.apparent_temperature),
          code: c.weather_code,
          humidity: Math.round(c.relative_humidity_2m),
          wind: Math.round(c.wind_speed_10m),
        })
        setStatus('ready')
      } catch {
        if (alive) setStatus((s) => (s === 'ready' ? 'ready' : 'error'))
      }
    }

    load()
    const id = setInterval(load, REFRESH_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { weather, status }
}
