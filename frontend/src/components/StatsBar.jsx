import { T } from '../tokens'

const STATS = [
  { key: 'en_revision', label: 'En revisión', color: T.diff,   bg: T.diffBg   },
  { key: 'aprobado',    label: 'Aprobados',   color: T.match,  bg: T.matchBg  },
  { key: 'rechazado',   label: 'Rechazados',  color: T.reject, bg: T.rejectBg },
]

export default function StatsBar({ expedientes, estadoActivo, onEstadoClick }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      {STATS.map(({ key, label, color, bg }) => {
        const count = expedientes.filter((e) => e.estado === key).length
        const active = estadoActivo === key
        return (
          <button
            key={key}
            onClick={() => onEstadoClick(active ? null : key)}
            style={{
              flex: 1, padding: '14px 16px', borderRadius: 10, border: `1.5px solid ${active ? color : T.line}`,
              background: active ? bg : T.panel, cursor: 'pointer', textAlign: 'left',
              transition: 'all .15s', fontFamily: T.sans,
              boxShadow: active ? `0 0 0 3px ${color}22` : 'none',
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 700, color, fontFamily: T.mono, lineHeight: 1 }}>
              {count}
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginTop: 4, fontWeight: 500 }}>
              {label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
