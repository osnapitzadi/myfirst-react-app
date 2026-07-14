import { useCallback, useEffect, useState } from 'react'

// Everything the board needs to survive a reboot lives in localStorage under
// this one key. The kiosk PC never clears it; the Settings drawer edits it.
const STORAGE_KEY = 'alara.board.v1'

// A sensible starting state for a fresh board. lastIncidentDate defaults to a
// week ago so the counter shows something believable on first boot.
function defaultState() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return {
    boardName: 'A.L.A.R.A SAFETY BOARD',
    // ISO date (YYYY-MM-DD) of the last recordable incident. The hero counter
    // is DERIVED from this, never stored as a raw number — so it self-corrects
    // across reboots, timezone quirks, and midnight ticks.
    lastIncidentDate: toISODate(d),
    record: 0,
    // Near-miss counter. Rolls to 0 at the start of each calendar month; we
    // stamp the month it belongs to so we know when to roll.
    nearMissCount: 0,
    nearMissMonth: monthKey(new Date()),
    // Extra A.L.A.R.A lines the crew adds; merged with the baked-in bank.
    customLines: [],
    // The board has no on-screen buttons (it's a wall display). Actions are
    // driven by keypresses, so any external button that emits a key works.
    // resetKey is HELD for holdSeconds to fire (guards against bumps);
    // nearMissKey is a single tap.
    resetKey: 'r',
    nearMissKey: 'n',
    holdSeconds: 2,
  }
}

export function toISODate(date) {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function monthKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Whole days between a stored ISO date and now, floored at 0. Uses local
// midnight boundaries so the number ticks over exactly at midnight, not on a
// rolling 24h clock.
export function daysSince(isoDate) {
  if (!isoDate) return 0
  const [y, m, d] = isoDate.split('-').map(Number)
  const start = new Date(y, m - 1, d)
  const now = new Date()
  const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const ms = nowMidnight - startMidnight
  return Math.max(0, Math.floor(ms / 86400000))
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...JSON.parse(raw) }
  } catch {
    return defaultState()
  }
}

function save(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked — board keeps running from memory */
  }
}

export function useBoard() {
  const [state, setState] = useState(load)

  // Persist on every change.
  useEffect(() => {
    save(state)
  }, [state])

  const streak = daysSince(state.lastIncidentDate)

  // Roll the near-miss counter when the month changes (covers the case where
  // the board sits running across a month boundary).
  useEffect(() => {
    const nowMonth = monthKey(new Date())
    if (state.nearMissMonth !== nowMonth) {
      setState((s) => ({ ...s, nearMissCount: 0, nearMissMonth: nowMonth }))
    }
    // Re-check hourly so a board left running overnight rolls without a reboot.
    const id = setInterval(() => {
      const m = monthKey(new Date())
      setState((s) =>
        s.nearMissMonth === m ? s : { ...s, nearMissCount: 0, nearMissMonth: m }
      )
    }, 60 * 60 * 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the record honest: if the current streak beats the stored record,
  // bump the record automatically.
  useEffect(() => {
    if (streak > state.record) {
      setState((s) => ({ ...s, record: streak }))
    }
  }, [streak, state.record])

  const update = useCallback((patch) => {
    setState((s) => ({ ...s, ...patch }))
  }, [])

  // The reset gag's data half: capture today's streak as the record if it's a
  // new best, then set the incident date to today (streak -> 0).
  const reportIncident = useCallback(() => {
    setState((s) => {
      const current = daysSince(s.lastIncidentDate)
      return {
        ...s,
        record: Math.max(s.record, current),
        lastIncidentDate: toISODate(new Date()),
      }
    })
  }, [])

  const logNearMiss = useCallback(() => {
    setState((s) => {
      const m = monthKey(new Date())
      const base = s.nearMissMonth === m ? s.nearMissCount : 0
      return { ...s, nearMissCount: base + 1, nearMissMonth: m }
    })
  }, [])

  return { state, streak, update, reportIncident, logNearMiss }
}

export default useBoard
