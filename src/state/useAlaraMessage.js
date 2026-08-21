import { useEffect, useMemo, useState } from 'react'
import ALARA_LINES from '../data/alaraLines.js'
import fetchAlaraLine from '../lib/ollama.js'

// The baked-in line advances once per minute (see ROTATE_MS). Using the epoch
// minute as the index makes it deterministic — every board shows the same line
// at the same wall-clock minute — while still cycling the whole bank over time.
const ROTATE_MS = 60_000

function minuteIndex(now = Date.now()) {
  return Math.floor(now / ROTATE_MS)
}

// v1: pick the line for a given rotation index from the merged bank. Pure,
// deterministic, offline.
export function pickLine(index, customLines = []) {
  const bank = [...ALARA_LINES, ...customLines.filter(Boolean)]
  if (bank.length === 0) return 'Stay sharp out there.'
  // Guard against negative modulo just in case index ever goes odd.
  return bank[((index % bank.length) + bank.length) % bank.length]
}

// Returns { message, source } where source is 'bank' or 'ollama'.
// Always resolves to a real line immediately (v1); if Ollama is enabled and
// reachable, it upgrades the message in place once the riff comes back. Both
// the bank line and the Ollama riff refresh on each one-minute tick.
export function useAlaraMessage({ customLines, ollamaEnabled, context }) {
  // Tick once per minute; the value is the epoch-minute index.
  const [tick, setTick] = useState(() => minuteIndex())
  useEffect(() => {
    // Align the first advance to the top of the next minute, then run steady.
    let interval
    const align = setTimeout(() => {
      setTick(minuteIndex())
      interval = setInterval(() => setTick(minuteIndex()), ROTATE_MS)
    }, ROTATE_MS - (Date.now() % ROTATE_MS))
    return () => {
      clearTimeout(align)
      clearInterval(interval)
    }
  }, [])

  const bankLine = useMemo(() => pickLine(tick, customLines), [tick, customLines])
  const [message, setMessage] = useState(bankLine)
  const [source, setSource] = useState('bank')

  useEffect(() => {
    setMessage(bankLine)
    setSource('bank')
  }, [bankLine])

  useEffect(() => {
    if (!ollamaEnabled) return
    let alive = true
    fetchAlaraLine(context).then((line) => {
      if (alive && line) {
        setMessage(line)
        setSource('ollama')
      }
    })
    return () => {
      alive = false
    }
  }, [ollamaEnabled, context, tick])

  return { message, source }
}

export default useAlaraMessage
