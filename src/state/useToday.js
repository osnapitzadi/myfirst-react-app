import { useEffect, useState } from 'react'

// Reads public/today.json — same-origin, no CORS, no keys in the browser.
// The daily scheduled pull script (scripts/pull-today.mjs) writes that file
// each morning. If today's pull failed, the file simply still holds yesterday's
// data, and the board shows that (with the stale date visible). If the file is
// missing entirely, we degrade gracefully to null and the UI hides the panel.
//
// The kiosk browser stays open for days, so we RE-READ the file every 10 min
// (not just on mount). That way the board picks up the morning pull on its own,
// without anyone reloading the page.
const REFRESH_MS = 10 * 60 * 1000

export function useToday() {
  const [today, setToday] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | missing

  useEffect(() => {
    let alive = true

    const load = () => {
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
          // Keep showing good data if a later refresh blips; only report
          // 'missing' if we never had any.
          setStatus((s) => (s === 'ready' ? 'ready' : 'missing'))
        })
    }

    load()
    const id = setInterval(load, REFRESH_MS)

    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  return { today, status }
}

export default useToday
