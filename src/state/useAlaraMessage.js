import { useEffect, useMemo, useState } from 'react'
import ALARA_LINES from '../data/alaraLines.js'
import fetchAlaraLine from '../lib/ollama.js'

// Day-of-year index so the baked-in line rotates once per day and is stable
// for the whole day (same line every render, changes at midnight).
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d - start) / 86400000)
}

// v1: pick today's line from the merged bank. Pure, deterministic, offline.
export function pickDailyLine(customLines = []) {
  const bank = [...ALARA_LINES, ...customLines.filter(Boolean)]
  if (bank.length === 0) return 'Stay sharp out there.'
  return bank[dayOfYear() % bank.length]
}

// Returns { message, source } where source is 'bank' or 'ollama'.
// Always resolves to a real line immediately (v1); if Ollama is enabled and
// reachable, it upgrades the message in place once the riff comes back.
export function useAlaraMessage({ customLines, ollamaEnabled, context }) {
  const bankLine = useMemo(() => pickDailyLine(customLines), [customLines])
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
  }, [ollamaEnabled, context])

  return { message, source }
}

export default useAlaraMessage
