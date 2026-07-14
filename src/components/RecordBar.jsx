// Record-to-beat + progress bar. Progress is streak/record, capped at 100%.
// When the current streak matches the record, we're setting a new best.
export default function RecordBar({ streak, record }) {
  const target = Math.max(record, 1)
  const pct = Math.min(100, Math.round((streak / target) * 100))
  const isRecord = streak >= record && record > 0

  return (
    <div className="record">
      <div className="record-head">
        <span className="record-label">Record to Beat</span>
        <span className="record-value">{record} days</span>
      </div>
      <div className="record-track" role="progressbar" aria-valuenow={streak} aria-valuemin={0} aria-valuemax={target}>
        <div
          className={`record-fill ${isRecord ? 'record-fill--best' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="record-note">
        {isRecord
          ? '🏆 New site record — keep it going!'
          : `${Math.max(0, record - streak)} day(s) to tie the record.`}
      </div>
    </div>
  )
}
