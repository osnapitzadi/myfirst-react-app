import Trefoil from './Trefoil.jsx'

// Safety Message of the Day. Formerly delivered by the A.L.A.R.A cartoon
// mascot; now a clean message panel. The lines are still written in
// A.L.A.R.A's voice and rotate daily from the bank (optionally upgraded by
// local Ollama). A `tone` derived from the streak just tints the accent —
// green when the streak is healthy, amber in single digits, red on reset.
export default function SafetyMessage({ tone = 'ok', message, source = 'bank' }) {
  return (
    <section className={`safety-msg safety-msg--${tone}`} aria-label="Safety Message">
      <div className="safety-msg-head">
        <Trefoil size={22} className="safety-msg-trefoil" />
        <span className="safety-msg-kicker">
          {source === 'ollama' ? 'Safety Message · live' : 'Safety Message'}
        </span>
      </div>
      {/* key on the message so each new line remounts and replays the fade */}
      <p className="safety-msg-text" key={message}>{message}</p>
      <div className="safety-msg-by">— A.L.A.R.A</div>
    </section>
  )
}
