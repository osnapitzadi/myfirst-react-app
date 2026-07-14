// A.L.A.R.A herself — the hard-hat site safety officer, drawn as inline SVG so
// she renders with zero network. Her mood tracks the streak:
//   - faceplant : just reset (incident reported) — she's face-down, defeated
//   - sweating  : single-digit streak — nervous, wide-eyed, sweat bead
//   - okay      : 10–29 days — steady, small smile
//   - cool      : 30+ days — shades on, thumbs up
//
// She delivers the Safety Message of the Day next to her portrait.
export default function Mascot({ mood = 'okay', message, source = 'bank' }) {
  return (
    <section className={`mascot mascot--${mood}`} aria-label="A.L.A.R.A, site safety officer">
      <div className="mascot-portrait">
        <AlaraFace mood={mood} />
      </div>
      <div className="mascot-speech">
        <div className="mascot-name">
          A.L.A.R.A
          <span className="mascot-title">Site Safety Officer</span>
        </div>
        <p className="mascot-message">{message}</p>
        <div className="mascot-tag">
          {source === 'ollama' ? 'Safety Message of the Day · live' : 'Safety Message of the Day'}
        </div>
      </div>
    </section>
  )
}

function AlaraFace({ mood }) {
  const cool = mood === 'cool'
  const sweating = mood === 'sweating'
  const faceplant = mood === 'faceplant'

  return (
    <svg viewBox="0 0 120 120" width="100%" height="100%" role="img" aria-hidden="true">
      {/* rotate the whole character face-down for the faceplant gag */}
      <g transform={faceplant ? 'rotate(90 60 60)' : ''}>
        {/* neck + shoulders */}
        <rect x="46" y="86" width="28" height="20" rx="6" className="m-skin" />
        <path d="M28 118 Q60 92 92 118 Z" className="m-vest" />
        {/* head */}
        <circle cx="60" cy="62" r="26" className="m-skin" />

        {/* hard hat */}
        <path d="M30 58 Q60 26 90 58 Z" className="m-hat" />
        <rect x="28" y="56" width="64" height="7" rx="3.5" className="m-hat" />
        {/* hat trefoil badge */}
        <circle cx="60" cy="46" r="6.5" className="m-hat-badge" />

        {/* eyes */}
        {cool ? (
          // shades
          <g className="m-shades">
            <rect x="40" y="58" width="16" height="9" rx="3" />
            <rect x="64" y="58" width="16" height="9" rx="3" />
            <rect x="56" y="61" width="8" height="2.5" />
          </g>
        ) : (
          <>
            <circle cx="51" cy="62" r={sweating ? 4 : 3} className="m-eye" />
            <circle cx="69" cy="62" r={sweating ? 4 : 3} className="m-eye" />
          </>
        )}

        {/* mouth */}
        {faceplant ? (
          <path d="M50 76 Q60 74 70 76" className="m-mouth" />
        ) : sweating ? (
          <path d="M52 78 Q60 72 68 78" className="m-mouth" /> // worried
        ) : cool ? (
          <path d="M50 74 Q60 84 70 74" className="m-mouth" /> // big grin
        ) : (
          <path d="M52 75 Q60 80 68 75" className="m-mouth" /> // small smile
        )}

        {/* sweat bead when nervous */}
        {sweating && <path d="M80 60 q4 6 0 10 q-4 -4 0 -10Z" className="m-sweat" />}
      </g>

      {/* thumbs-up when cool (kept upright, outside the rotate group) */}
      {cool && (
        <g className="m-thumb" transform="translate(88 84)">
          <rect x="0" y="4" width="10" height="14" rx="3" className="m-skin" />
          <rect x="4" y="-4" width="5" height="10" rx="2.5" className="m-skin" />
        </g>
      )}
    </svg>
  )
}
