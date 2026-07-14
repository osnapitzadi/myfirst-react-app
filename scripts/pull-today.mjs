#!/usr/bin/env node
/**
 * A.L.A.R.A daily data pull.
 *
 * Run once each morning from cron / Windows Task Scheduler. It fetches the
 * day's radiation reading (Safecast) and an "Isotope of the Day" (IAEA nuclide
 * data), then writes a single same-origin JSON file the React app reads with no
 * CORS and no API keys in the browser.
 *
 *   node scripts/pull-today.mjs
 *
 * Output path (defaults to public/today.json). When serving the built board,
 * point it at your served folder instead:
 *   ALARA_OUT=./dist/today.json node scripts/pull-today.mjs
 *
 * FAIL-SAFE: if a source is unreachable, we keep whatever that section had in
 * the existing file (so the board shows yesterday's value) rather than writing
 * garbage. If EVERYTHING fails and no prior file exists, we still write a valid
 * file using the baked-in isotope rotation so the board never sees broken JSON.
 *
 * Requires Node 18+ (built-in fetch). No npm dependencies.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'

const OUT = process.env.ALARA_OUT || 'public/today.json'
const TIMEOUT_MS = 12000

// A curated rotation of common facility isotopes. Used as the pick list; we try
// to enrich the chosen one with a live half-life from IAEA, but each entry is
// already complete so the board works with zero network.
const ISOTOPES = [
  { name: 'Cobalt-60', symbol: 'Co-60', z: 27, a: 60, halfLife: '5.27 years', decayMode: 'β⁻ then γ', note: 'Radiography & sterilization workhorse. Those 1.17 & 1.33 MeV gammas don’t ask permission.' },
  { name: 'Cesium-137', symbol: 'Cs-137', z: 55, a: 137, halfLife: '30.1 years', decayMode: 'β⁻', note: 'The gauge-and-blood-irradiator classic. Water-soluble, so contamination spreads fast — respect the wipe test.' },
  { name: 'Iridium-192', symbol: 'Ir-192', z: 77, a: 192, halfLife: '73.8 days', decayMode: 'β⁻ / EC', note: 'Portable radiography source. Short half-life means the camera gets recharged often — track that source.' },
  { name: 'Americium-241', symbol: 'Am-241', z: 95, a: 241, halfLife: '432 years', decayMode: 'α', note: 'Smoke detectors and density gauges. Alpha emitter — harmless outside, a problem if inhaled.' },
  { name: 'Technetium-99m', symbol: 'Tc-99m', z: 43, a: 99, halfLife: '6.0 hours', decayMode: 'IT (γ)', note: 'The most-used medical isotope on Earth. Six-hour half-life: here for a good time, not a long time.' },
  { name: 'Strontium-90', symbol: 'Sr-90', z: 38, a: 90, halfLife: '28.8 years', decayMode: 'β⁻', note: 'Bone-seeker — chemically mimics calcium. Pure beta, so shield with plastic, not lead.' },
  { name: 'Uranium-238', symbol: 'U-238', z: 92, a: 238, halfLife: '4.47 billion years', decayMode: 'α', note: 'The patient one. Half-life about the age of the Earth — outlasts your entire safety streak.' },
  { name: 'Plutonium-238', symbol: 'Pu-238', z: 94, a: 238, halfLife: '87.7 years', decayMode: 'α', note: 'Powers deep-space probes via its own heat. Alpha emitter — containment is everything.' },
  { name: 'Iodine-131', symbol: 'I-131', z: 53, a: 131, halfLife: '8.02 days', decayMode: 'β⁻', note: 'Thyroid-seeking. Short half-life makes it useful and, after a spill, briefly annoying.' },
  { name: 'Carbon-14', symbol: 'C-14', z: 6, a: 14, halfLife: '5,730 years', decayMode: 'β⁻', note: 'The archaeologist’s clock. Low-energy beta — mostly a concern if you eat it.' },
  { name: 'Radium-226', symbol: 'Ra-226', z: 88, a: 226, halfLife: '1,600 years', decayMode: 'α', note: 'The old glow-dial isotope. Historical, hazardous, and the reason we have ALARA at all.' },
  { name: 'Tritium (H-3)', symbol: 'H-3', z: 1, a: 3, halfLife: '12.3 years', decayMode: 'β⁻', note: 'Exit-sign glow and fusion fuel. Weakest beta around — skin stops it, but don’t drink it.' },
]

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Deterministic day-of-year pick so the isotope changes once per day.
function isotopeOfTheDay() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const doy = Math.floor((now - start) / 86400000)
  return { ...ISOTOPES[doy % ISOTOPES.length] }
}

async function withTimeout(promise) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    return await promise(ctrl.signal)
  } finally {
    clearTimeout(t)
  }
}

// --- Safecast: latest measurements, grab the freshest usable reading ---------
async function pullRadiation() {
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch('https://api.safecast.org/measurements.json?order=captured_at+desc&per_page=25', {
        signal,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) throw new Error(`Safecast HTTP ${res.status}`)
      const rows = await res.json()
      const row = (Array.isArray(rows) ? rows : []).find((r) => r && r.value != null)
      if (!row) throw new Error('Safecast: no usable measurement')
      const place = [row.location_name, row.device].filter(Boolean).join(' ')
      return {
        value: Math.round(Number(row.value) * 10) / 10,
        unit: row.unit || 'CPM',
        location: row.location_name || (row.latitude ? `${row.latitude.toFixed(2)}, ${row.longitude.toFixed(2)}` : 'Safecast network'),
        device: row.device || 'Safecast sensor',
        capturedAt: row.captured_at || null,
        _raw: place || undefined,
      }
    })
  } catch (err) {
    console.warn('[radiation] pull failed:', err.message)
    return null
  }
}

// --- IAEA: enrich today's isotope with a live half-life if reachable ---------
// The relnsd data API returns CSV; we parse the half-life column when present.
async function enrichIsotope(iso) {
  try {
    return await withTimeout(async (signal) => {
      const url = `https://nds.iaea.org/relnsd/v1/data?fields=ground_states&nuclides=${iso.a}${elementSymbol(iso.z)}`
      const res = await fetch(url, { signal, headers: { Accept: 'text/plain' } })
      if (!res.ok) throw new Error(`IAEA HTTP ${res.status}`)
      const csv = await res.text()
      const hl = parseHalfLife(csv)
      return hl ? { ...iso, halfLife: hl, _liveHalfLife: true } : iso
    })
  } catch (err) {
    console.warn('[isotope] enrich failed, using baked-in data:', err.message)
    return iso
  }
}

function elementSymbol(z) {
  // Minimal Z->symbol map covering the isotopes we rotate.
  const map = {
    1: 'h', 6: 'c', 27: 'co', 38: 'sr', 43: 'tc', 53: 'i', 55: 'cs',
    77: 'ir', 88: 'ra', 92: 'u', 94: 'pu', 95: 'am',
  }
  return map[z] || ''
}

function parseHalfLife(csv) {
  const lines = csv.trim().split(/\r?\n/)
  if (lines.length < 2) return null
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const hlIdx = header.findIndex((h) => h.includes('half_life') && h.includes('unit') === false)
  const unitIdx = header.findIndex((h) => h.includes('unit_hl') || h === 'unit')
  const cols = lines[1].split(',')
  const val = hlIdx >= 0 ? cols[hlIdx]?.trim() : ''
  const unit = unitIdx >= 0 ? cols[unitIdx]?.trim() : ''
  if (!val) return null
  return unit ? `${val} ${unit}` : val
}

async function readExisting() {
  try {
    return JSON.parse(await readFile(OUT, 'utf8'))
  } catch {
    return null
  }
}

async function main() {
  const prev = await readExisting()
  const isoBase = isotopeOfTheDay()

  const [radiation, isotope] = await Promise.all([pullRadiation(), enrichIsotope(isoBase)])

  const out = {
    date: todayISO(),
    generatedAt: new Date().toISOString(),
    // Fall back to yesterday's radiation block if today's pull failed.
    radiation: radiation || prev?.radiation || null,
    isotope,
    sources: {
      radiation: 'Safecast (api.safecast.org, CC0)',
      isotope: 'IAEA Live Chart of Nuclides (nds.iaea.org)',
    },
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')

  const radNote = radiation ? 'live' : prev?.radiation ? 'cached' : 'none'
  console.log(
    `[A.L.A.R.A] wrote ${OUT} — radiation: ${radNote}, isotope: ${isotope.name}` +
      `${isotope._liveHalfLife ? ' (live half-life)' : ''}`
  )
}

main().catch((err) => {
  console.error('[A.L.A.R.A] fatal:', err)
  process.exit(1)
})
