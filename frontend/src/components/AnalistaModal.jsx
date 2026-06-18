import { useState } from 'react'
import { T } from '../tokens'

export default function AnalistaModal({ onConfirm }) {
  const [nombre, setNombre] = useState('')

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(27,35,48,.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.sans, zIndex: 100,
    }}>
      <div style={{
        background: T.panel, borderRadius: 14, padding: '36px 40px',
        width: 400, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: T.navySoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <rect x="4" y="2" width="16" height="20" rx="3" stroke={T.navy} strokeWidth="1.5" fill={T.navySoft} />
            <path d="M8 9h8M8 12.5h6M8 16h7" stroke={T.navy} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, color: T.ink, marginBottom: 8 }}>
          Portal de Cotejo
        </div>
        <div style={{ fontSize: 14, color: T.sub, marginBottom: 24 }}>
          Ingresa tu nombre para continuar. Se usará para identificar tus resoluciones.
        </div>
        <input
          placeholder="Tu nombre (ej: C. Vega)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && nombre.trim() && onConfirm(nombre.trim())}
          onFocus={(e) => (e.target.style.borderColor = T.navy)}
          onBlur={(e) => (e.target.style.borderColor = T.line)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 15,
            border: `1px solid ${T.line}`, outline: 'none', fontFamily: T.sans,
            color: T.ink, marginBottom: 16, transition: 'border-color .15s',
          }}
        />
        <button
          disabled={!nombre.trim()}
          onClick={() => onConfirm(nombre.trim())}
          style={{
            width: '100%', padding: '11px', borderRadius: 8, border: 'none',
            background: nombre.trim() ? T.navy : T.line,
            color: nombre.trim() ? '#fff' : T.faint,
            fontSize: 15, fontWeight: 600, cursor: nombre.trim() ? 'pointer' : 'not-allowed',
            fontFamily: T.sans, transition: 'all .15s',
          }}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}
