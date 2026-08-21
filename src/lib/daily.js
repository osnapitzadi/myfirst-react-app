// "Skids moved today" accrues over the day: the shift starts at 6 AM local
// time with 0, then each skid lands after a random-feeling gap of 10–25 minutes.
// Before 6 AM it reads 0.
//
// The gaps are DETERMINISTIC — seeded from the calendar date and the skid index
// — so they aren't truly random per page load. That's on purpose: every board
// shows the same count at the same moment, and a refresh never changes it. The
// sequence resets each day at the next 6 AM start.

export const SKID_START_HOUR = 6 // shift starts at 6 AM local time
export const SKID_MIN_MS = 10 * 60 * 1000 // shortest gap between skids
export const SKID_MAX_MS = 25 * 60 * 1000 // longest gap between skids

// Safety cap on the walk below: a 24h day at the 10-min floor is ~144 skids.
const MAX_SKIDS_PER_DAY = 200

function todayKey(d) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// Seeded value in [0, 1) from a string. FNV-1a followed by a final avalanche
// mix so that keys differing only in their trailing index still spread across
// the whole range (plain FNV-1a leaves the high bits — which the float uses —
// nearly identical for such keys, clustering the output).
function seededUnit(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

// Deterministic gap (ms) before the i-th skid of the given day, in [MIN, MAX).
// Index goes first in the key so it drives the mix from the start.
function gapMs(dayKey, i) {
  const u = seededUnit(`${i}::skid::${dayKey}`)
  return SKID_MIN_MS + u * (SKID_MAX_MS - SKID_MIN_MS)
}

// How many skids have landed since today's 6 AM start for the given instant.
export function skidsMovedToday(now = Date.now()) {
  const d = new Date(now)
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), SKID_START_HOUR).getTime()
  const elapsed = now - start
  if (elapsed <= 0) return 0 // before the shift begins

  const dayKey = todayKey(d)
  let count = 0
  let cumulative = 0
  while (count < MAX_SKIDS_PER_DAY) {
    cumulative += gapMs(dayKey, count + 1)
    if (cumulative > elapsed) break
    count += 1
  }
  return count
}

export default skidsMovedToday
