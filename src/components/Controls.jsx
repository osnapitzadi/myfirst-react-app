// The two action buttons plus the near-miss tally.
//   - Report Incident · Reset : the dramatic gag. Confirms, then triggers the
//     amber-beacon alarm + screen shake + mascot faceplant (handled by App),
//     and resets the streak to 0.
//   - Log a Near-Miss : celebrated. Bumps this month's counter with a little
//     positive pop. Reporting a near-miss is a CATCH, not a failure.
export default function Controls({ nearMissCount, onReportIncident, onLogNearMiss, justLogged }) {
  function handleReset() {
    const ok = window.confirm(
      'Report a recordable incident?\n\nThis resets "Days Since Last Incident" to 0. ' +
        'The beacon will sound. Only do this for a real recordable event.'
    )
    if (ok) onReportIncident()
  }

  return (
    <div className="controls">
      <button type="button" className="btn btn--danger" onClick={handleReset}>
        <span className="btn-icon" aria-hidden="true">⛔</span>
        Report Incident · Reset
      </button>

      <button
        type="button"
        className={`btn btn--good ${justLogged ? 'btn--pop' : ''}`}
        onClick={onLogNearMiss}
      >
        <span className="btn-icon" aria-hidden="true">✓</span>
        Log a Near-Miss
      </button>

      <div className="nearmiss-tally" aria-label="Near-misses logged this month">
        <span className="nearmiss-count">{nearMissCount}</span>
        <span className="nearmiss-label">
          Near-misses caught
          <br />
          this month
        </span>
      </div>
    </div>
  )
}
