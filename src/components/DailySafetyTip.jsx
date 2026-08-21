import SAFETY_TIPS from '../data/safetyTips.js'

// Day-of-year index so the tip is stable for the whole day and rolls to the
// next one at midnight — same idea as the daily line pick.
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d - start) / 86400000)
}

// The third hero column: "Safety Message of the Day". Occupies the same column
// slot the "To Be Announced" placeholder used to, so it lines up with the two
// counter columns and keeps the divider between them.
export default function DailySafetyTip() {
  const tip = SAFETY_TIPS[dayOfYear() % SAFETY_TIPS.length]

  return (
    <section className="hero-stat hero-stat--tip" aria-label="Safety Message of the Day">
      <div className="hero-label">Safety Message of the Day</div>
      <div className="tip-body">
        <div className="tip-topic">{tip.topic}</div>
        <p className="tip-text">{tip.text}</p>
      </div>
    </section>
  )
}
