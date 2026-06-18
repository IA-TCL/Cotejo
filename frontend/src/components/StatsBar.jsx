import { useState, useEffect } from 'react'
import { T } from '../tokens'

function AnimatedNumber({ to }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (to === 0) { setVal(0); return }
    const t0 = performance.now()
    const dur = 650
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(eased * to))
      if (p < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [to])
  return <>{val}</>
}

const ClockIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
    <circle cx="9" cy="9" r="7" />
    <path d="M9 5.5V9l2.5 2" />
  </svg>
)

const CheckIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
    <circle cx="9" cy="9" r="7" />
    <path d="M5.5 9l2.5 2.5 5-5" />
  </svg>
)

const XIcon = ({ color }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round">
    <circle cx="9" cy="9" r="7" />
    <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" />
  </svg>
)

const STATS = [
  {
    key: 'en_revision',
    label: 'En revisión',
    color: '#d97706',
    bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    border: '#fcd34d',
    iconBg: '#fef3c7',
    Icon: ClockIcon,
  },
  {
    key: 'aprobado',
    label: 'Aprobados',
    color: '#16a34a',
    bg: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
    border: '#86efac',
    iconBg: '#dcfce7',
    Icon: CheckIcon,
  },
  {
    key: 'rechazado',
    label: 'Rechazados',
    color: '#dc2626',
    bg: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
    border: '#fca5a5',
    iconBg: '#ffe4e6',
    Icon: XIcon,
  },
]

export default function StatsBar({ expedientes, estadoActivo, onEstadoClick }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {STATS.map(({ key, label, color, bg, border, iconBg, Icon }) => {
        const count = expedientes.filter((e) => e.estado === key).length
        const active = estadoActivo === key
        return (
          <button
            key={key}
            onClick={() => onEstadoClick(active ? null : key)}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 8px 20px ${color}28`
                e.currentTarget.style.borderColor = color
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.07)'
                e.currentTarget.style.borderColor = border
              }
            }}
            style={{
              flex: 1, padding: '16px 18px', borderRadius: 14,
              border: `1.5px solid ${active ? color : border}`,
              background: active ? bg : '#fff',
              cursor: 'pointer', textAlign: 'left',
              fontFamily: T.sans,
              transition: 'all .18s cubic-bezier(.2,.8,.2,1)',
              boxShadow: active
                ? `0 6px 20px ${color}30, 0 0 0 3px ${color}18`
                : '0 1px 4px rgba(0,0,0,.07)',
              transform: active ? 'translateY(-2px)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: active ? iconBg : `${color}14`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background .18s',
              }}>
                <Icon color={color} />
              </div>
              {active && (
                <span style={{
                  fontSize: 9.5, fontWeight: 800, letterSpacing: 0.8,
                  color, background: `${color}14`,
                  padding: '2px 8px', borderRadius: 20, textTransform: 'uppercase',
                }}>
                  Activo
                </span>
              )}
            </div>
            <div style={{
              fontSize: 32, fontWeight: 800, color,
              fontFamily: T.mono, lineHeight: 1, letterSpacing: -1.5,
            }}>
              <AnimatedNumber to={count} />
            </div>
            <div style={{ fontSize: 12, color: T.sub, marginTop: 5, fontWeight: 500 }}>
              {label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
