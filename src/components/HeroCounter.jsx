// The hero: "DAYS SINCE LAST RECORDABLE INCIDENT" rendered as an industrial
// tally/placard board — one tile per digit, monospace, legible across a room.
// The number is derived (see useBoard) so it self-corrects and ticks at midnight.
export default function HeroCounter({ days, alarm }) {
  // Always show at least 2 tiles so a single-digit streak still looks like a
  // placard, not a lonely number.
  const text = String(Math.max(0, days))
  const digits = text.padStart(Math.max(2, text.length), '0').split('')

  return (
    <section className={`hero ${alarm ? 'hero--alarm' : ''}`} aria-live="polite">
      <div className="hero-label">Days Since Last Recordable Incident</div>
      <div
        className="digit-board"
        role="img"
        aria-label={`${days} days since the last recordable incident`}
      >
        {digits.map((d, i) => (
          <span className="digit-tile" key={i}>
            <span className="digit-tile-inner">{d}</span>
          </span>
        ))}
      </div>
    </section>
  )
}
