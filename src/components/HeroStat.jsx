// One headline counter: a wide-tracked label над a row of industrial digit
// tiles. Reused for each of the three hero columns.
//   variant   — accent color of the digits ('green' | 'amber' | 'tba')
//   placeholder — render dim "--" tiles instead of a number (for TBA)
//   alarm     — force the digits red (used on the streak during a reset)
export default function HeroStat({
  label,
  value,
  variant = 'green',
  placeholder = false,
  alarm = false,
}) {
  let digits
  if (placeholder) {
    digits = ['-', '-']
  } else {
    const text = String(Math.max(0, value ?? 0))
    digits = text.padStart(Math.max(2, text.length), '0').split('')
  }

  const cls = [
    'hero-stat',
    `hero-stat--${variant}`,
    placeholder ? 'hero-stat--placeholder' : '',
    alarm ? 'hero-stat--alarm' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section className={cls}>
      <div className="hero-label">{label}</div>
      <div
        className="digit-board"
        role="img"
        aria-label={placeholder ? `${label}: to be announced` : `${label}: ${value}`}
      >
        {digits.map((d, i) => (
          <span className="digit-tile" key={i}>
            {/* keyed on the digit so it remounts and replays the roll on change */}
            <span className="digit-tile-inner" key={d}>
              {d}
            </span>
          </span>
        ))}
      </div>
      {placeholder && <div className="hero-tba">Coming soon</div>}
    </section>
  )
}
