import { T } from '../tokens'

export default function PanelDecision({
  matches, totalDiff, resueltos, nota, onNotaChange,
  onAprobar, onRechazar, loading, disabled,
}) {
  const pendientes = totalDiff - resueltos
  const allResolved = pendientes === 0

  return (
    <aside style={{
      background: T.panel, borderLeft: `1px solid ${T.line}`,
      display: 'flex', flexDirection: 'column', padding: '20px 18px', width: 304, flexShrink: 0,
    }}>
      <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 600, color: T.ink, marginBottom: 3 }}>
        Decisión
      </div>

      <div style={{
        background: T.paper, border: `1px solid ${T.lineSoft}`,
        borderRadius: 10, padding: 14, marginTop: 12, marginBottom: 16,
      }}>
        <Row label="Campos coincidentes" val={matches} color={T.match} />
        <Row label="Diferencias resueltas" val={`${resueltos} / ${totalDiff}`} color={T.ink} />
        <Row label="Pendientes" val={pendientes} color={allResolved ? T.match : T.diff} last />
      </div>

      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, marginBottom: 6, display: 'block' }}>
        Nota de resolución
      </label>
      <textarea
        value={nota}
        onChange={(e) => onNotaChange(e.target.value)}
        disabled={disabled}
        placeholder="Describe la decisión o el motivo del rechazo…"
        style={{
          border: `1px solid ${T.line}`, borderRadius: 9, padding: '10px 12px',
          fontSize: 13, color: T.ink, background: T.paper, minHeight: 72,
          marginBottom: 16, fontFamily: T.sans, resize: 'vertical', outline: 'none',
          width: '100%',
        }}
      />

      <button
        disabled={!allResolved || loading || disabled}
        onClick={onAprobar}
        style={{
          fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, padding: '12px',
          borderRadius: 8, border: 'none', marginBottom: 10, width: '100%',
          cursor: allResolved && !loading && !disabled ? 'pointer' : 'not-allowed',
          background: allResolved && !disabled ? T.match : T.lineSoft,
          color: allResolved && !disabled ? '#fff' : T.faint,
          transition: 'all .15s',
        }}
      >
        {loading ? 'Guardando…' : allResolved ? 'Aprobar cotejo' : `Resuelve ${pendientes} para aprobar`}
      </button>

      <button
        disabled={loading || disabled}
        onClick={onRechazar}
        style={{
          fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, padding: '12px',
          borderRadius: 8, border: `1px solid ${T.line}`, background: '#fff',
          color: T.reject, cursor: loading || disabled ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        Rechazar expediente
      </button>
    </aside>
  )
}

function Row({ label, val, color, last }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', fontSize: 12.5,
      marginBottom: last ? 0 : 7,
    }}>
      <span style={{ color: T.sub }}>{label}</span>
      <span style={{ fontFamily: "'IBM Plex Mono', monospace", color, fontWeight: 600 }}>{val}</span>
    </div>
  )
}
