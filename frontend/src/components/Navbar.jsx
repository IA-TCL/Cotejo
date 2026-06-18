import { T } from '../tokens'

export function Avatar({ nombre, size = 28 }) {
  const parts = (nombre || '').trim().split(/\s+/).filter(Boolean)
  const ini = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (nombre || '?').slice(0, 2).toUpperCase()
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'rgba(255,255,255,.18)',
      border: '1.5px solid rgba(255,255,255,.3)',
      color: '#fff',
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
      height: 52,
      background: 'linear-gradient(135deg, #1b2330 0%, #1f3a5f 60%, #15293f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 28px', flexShrink: 0,
      boxShadow: '0 2px 10px rgba(15,32,53,.4)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* subtle decorative ring */}
      <div style={{
        position: 'absolute', right: -60, top: -60,
        width: 200, height: 200, borderRadius: '50%',
        background: 'rgba(255,255,255,.03)', pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'rgba(255,255,255,.15)',
          border: '1px solid rgba(255,255,255,.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 5h10M3 8h7M3 11h9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontFamily: T.serif, fontSize: 16, fontWeight: 600, color: '#fff', letterSpacing: -0.2 }}>
          Portal de Cotejo
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: 'relative' }}>
        <Avatar nombre={analista} />
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', fontFamily: T.sans }}>{analista}</span>
      </div>
    </header>
  )
}
