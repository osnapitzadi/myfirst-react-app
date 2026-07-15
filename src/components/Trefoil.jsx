// The radiation trefoil, drawn as inline SVG so it renders with zero network.
// `spin` lets the caller animate it (respecting prefers-reduced-motion in CSS).
export default function Trefoil({ size = 48, className = '', spin = false }) {
  // Three 60°-wide blades at 120° spacing around a central disc — the ISO
  // trefoil proportions (inner radius : blade start : blade end ≈ 1 : 1.5 : 5).
  const blades = [0, 120, 240]
  return (
    <svg
      className={`trefoil ${spin ? 'trefoil--spin' : ''} ${className}`}
      width={size}
      height={size}
      viewBox="-50 -50 100 100"
      role="img"
      aria-label="Radiation trefoil"
    >
      <circle r="45" fill="none" />
      {blades.map((deg) => (
        <path
          key={deg}
          transform={`rotate(${deg})`}
          d={bladePath()}
          fill="currentColor"
        />
      ))}
      <circle r="9" fill="currentColor" />
    </svg>
  )
}

// One blade: an annular wedge from radius 13.5 to 45, spanning -30°..30°.
function bladePath() {
  const rIn = 13.5
  const rOut = 45
  const a = (30 * Math.PI) / 180
  const x1 = rIn * Math.cos(-a)
  const y1 = rIn * Math.sin(-a)
  const x2 = rOut * Math.cos(-a)
  const y2 = rOut * Math.sin(-a)
  const x3 = rOut * Math.cos(a)
  const y3 = rOut * Math.sin(a)
  const x4 = rIn * Math.cos(a)
  const y4 = rIn * Math.sin(a)
  return [
    `M ${x1} ${y1}`,
    `L ${x2} ${y2}`,
    `A ${rOut} ${rOut} 0 0 1 ${x3} ${y3}`,
    `L ${x4} ${y4}`,
    `A ${rIn} ${rIn} 0 0 0 ${x1} ${y1}`,
    'Z',
  ].join(' ')
}
