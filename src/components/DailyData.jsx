import Trefoil from './Trefoil.jsx'

// Renders the two daily rotating panels fed by public/today.json:
//   - Radiation reading (Safecast)
//   - Isotope of the Day (IAEA nuclide data)
// Degrades gracefully: missing fields just don't render. If the whole file is
// missing, the parent hides this section.
export default function DailyData({ today, status }) {
  if (status === 'missing' || !today) return null

  const rad = today.radiation
  const iso = today.isotope
  const stale = isStale(today.date)

  return (
    <div className="daily">
      {rad && (
        <div className="panel daily-panel">
          <Bolts />
          <div className="panel-label">
            <Trefoil size={18} /> Live Radiation Reading
          </div>
          <div className="daily-value">
            {rad.value}
            <span className="daily-unit">{rad.unit || 'CPM'}</span>
          </div>
          <div className="daily-sub">
            {rad.location || 'Unknown site'}
            {rad.device ? ` · ${rad.device}` : ''}
          </div>
          <div className="daily-source">Source: {today.sources?.radiation || 'Safecast'}</div>
        </div>
      )}

      {iso && (
        <div className="panel daily-panel">
          <Bolts />
          <div className="panel-label">Isotope of the Day</div>
          <div className="daily-value daily-value--iso">{iso.name}</div>
          <div className="daily-sub">
            {iso.halfLife ? `Half-life: ${iso.halfLife}` : ''}
            {iso.decayMode ? ` · ${iso.decayMode}` : ''}
          </div>
          {iso.note && <div className="daily-note">{iso.note}</div>}
          <div className="daily-source">Source: {today.sources?.isotope || 'IAEA'}</div>
        </div>
      )}

      {stale && (
        <div className="daily-stale">
          ⚠ Showing cached data from {today.date} — this morning's pull hasn't landed yet.
        </div>
      )}
    </div>
  )
}

// today.date is the ISO date the file was generated for. If it isn't today,
// the morning pull hasn't run (or failed) and we're showing yesterday's file.
function isStale(fileDate) {
  if (!fileDate) return false
  const now = new Date()
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`
  return fileDate !== iso
}

function Bolts() {
  return (
    <>
      <span className="bolt bolt--tl" />
      <span className="bolt bolt--tr" />
      <span className="bolt bolt--bl" />
      <span className="bolt bolt--br" />
    </>
  )
}
