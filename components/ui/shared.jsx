// Small shared UI pieces used in multiple screens.
export function Ring({ value, max, size = 120, stroke = 10, color, children }) {
  // Converts progress into an SVG circle that fills smoothly.
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(value / max, 1))

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'relative', textAlign: 'center' }}>{children}</div>
    </div>
  )
}

export function MacroPill({ label, value, goal, color, icon }) {
  return (
    <div style={{ flex: 1, background: 'var(--card2)', border: '1.5px solid var(--b)', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--t2)' }}>
          {icon}
          <span style={{ fontSize: 11, fontWeight: 600 }}>{label}</span>
        </div>
        <span style={{ fontSize: 12, color, fontWeight: 700 }}>{value}g</span>
      </div>
      <div className="progress-track" style={{ height: 4 }}>
        <div className="progress-fill" style={{ width: `${Math.min((value / goal) * 100, 100)}%`, background: color }} />
      </div>
      <span style={{ fontSize: 10, color: 'var(--t3)' }}>{Math.max(goal - value, 0)}g left</span>
    </div>
  )
}

export function ChartTooltip({ active, payload, label }) {
  // Custom tooltip keeps chart text consistent with the app theme.
  if (!active || !payload?.length) return null

  return (
    <div style={{ background: 'var(--card2)', border: '1px solid var(--b)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--tx)' }}>
      <div style={{ fontWeight: 600, marginBottom: 3 }}>{label}</div>
      {payload.map((item) => (
        <div key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {item.value}
          {item.name === 'weight' ? 'kg' : ' kcal'}
        </div>
      ))}
    </div>
  )
}
