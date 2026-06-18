import { T } from '../tokens'

export function Avatar({ nombre, size = 28 }) {
  const parts = (nombre || '').trim().split(/\s+/).filter(Boolean)
  const ini = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (nombre || '?').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: T.navy, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.38), fontWeight: 700, letterSpacing: 0.3,
      fontFamily: T.sans, flexShrink: 0,
    }}>
      {ini}
    </div>
  )
}

export default function Navbar({ analista }) {
  return (
    <header style={{
      height: 48, background: T.panel,
      borderBottom: `1px solid ${T.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect width="22" height="22" rx="6" fill={T.navy} />
          <path d="M6 8h10M6 11h7M6 14h9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 600, color: T.ink, letterSpacing: -0.2 }}>
          Portal de Cotejo
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar nombre={analista} />
        <span style={{ fontSize: 13, color: T.sub, fontFamily: T.sans }}>{analista}</span>
      </div>
    </header>
  )
}
