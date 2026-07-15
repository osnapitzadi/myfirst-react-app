import { useEffect, useState } from 'react'

// Reads public/today.json — same-origin, no CORS, no keys in the browser.
// The daily scheduled pull script (scripts/pull-today.mjs) writes that file
// each morning. If today's pull failed, the file simply still holds yesterday's
// data, and the board shows that (with the stale date visible). If the file is
// missing entirely, we degrade gracefully to null and the UI hides the panel.
export function useToday() {
  const [today, setToday] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | missing

  useEffect(() => {
    let alive = true
    // Cache-bust so the kiosk browser picks up the fresh file after each pull.
    fetch(`today.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!alive) return
        setToday(data)
        setStatus('ready')
      })
      .catch(() => {
        if (!alive) return
        setStatus('missing')
      })
    return () => {
      alive = false
    }
  }, [])

  return { today, status }
}

export default useToday
