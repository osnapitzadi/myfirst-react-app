// Deterministic "daily random" helpers. The value is seeded from the calendar
// date, so it's stable for the whole day (same number every render) and rolls
// to a new one at midnight — no storage needed, no flicker.

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

// FNV-1a hash -> [0,1). Salt lets multiple independent daily values coexist.
function seededUnit(salt = '') {
  const key = `${todayKey()}::${salt}`
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

// Inclusive integer in [min, max], stable per day.
export function seededDailyInt(min, max, salt = '') {
  return min + Math.floor(seededUnit(salt) * (max - min + 1))
}

// The inside joke: skids moved today, 1–100, fresh each day.
export function skidsMovedToday() {
  return seededDailyInt(1, 100, 'skids')
}

export default seededDailyInt
