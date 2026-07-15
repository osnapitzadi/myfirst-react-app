import { useEffect, useState } from 'react'

// Live wall clock. Ticks every second; also the thing that would flip the hero
// counter at midnight because the whole tree re-renders on each tick.
export default function Clock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const time = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const date = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="clock">
      <div className="clock-time" aria-label="Current time">
        {time}
      </div>
      <div className="clock-date">{date}</div>
    </div>
  )
}
