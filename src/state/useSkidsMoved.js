import { useEffect, useState } from 'react'
import { skidsMovedToday } from '../lib/daily.js'

// Live "skids moved today". Recomputes on a steady one-minute tick so the
// counter climbs on its own (a skid every 10–25 min, seeded per day) and resets
// at the 6 AM start. Most ticks compute the same number and React skips the
// re-render, so the digit animation fires only on a real increment.
export default function useSkidsMoved() {
  const [skids, setSkids] = useState(() => skidsMovedToday())

  useEffect(() => {
    const id = setInterval(() => setSkids(skidsMovedToday()), 60_000)
    return () => clearInterval(id)
  }, [])

  return skids
}
