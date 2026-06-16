import { T } from '../tokens'

function diffParts(a, b) {
  a = a || ''; b = b || ''
  const n = Math.max(a.length, b.length)
  return Array.from({ length: n }, (_, i) => ({
    ch: a[i] ?? '',
    changed: (a[i] ?? '') !== (b[i] ?? ''),
  }))
}

function ValorHighlight({ val, contra, mono }) {
  const parts = diffParts(val, contra)
  return (
    <span style={{ fontFamily: mono ? T.mono : T.sans, fontSize: mono ? 14 : 15, position: 'relative' }}>
      {/* visually hidden text node so getByText can match the full value */}
      <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}>
        {val}
      </span>
      <span aria-hidden="true">
        {parts.map((p, i) => (
          <span key={i} style={p.changed ? {
            background: T.diffMark, borderRadius: 2, padding: '1px 0',
          } : null}>
            {p.ch}
          </span>
        ))}
      </span>
    </span>
  )
}

function Choice({ label, value, contra, mono, selected, onClick, tone }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, textAlign: 'left', cursor: 'pointer', padding: '11px 14px',
      borderRadius: 9, border: `1.5px solid ${selected ? tone : T.line}`,
      background: selected ? (tone === T.match ? T.matchBg : T.navySoft) : '#fff',
      position: 'relative', transition: 'all .14s', fontFamily: T.sans,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: selected ? tone : T.faint, marginBottom: 4 }}>
        {label}
      </div>
      <ValorHighlight val={value} contra={contra} mono={mono} />
      <div style={{
        position: 'absolute', top: 10, right: 12, width: 16, height: 16,
        borderRadius: 8, border: `1.5px solid ${selected ? tone : T.line}`,
        background: selected ? tone : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
            <path d="M1.5 4.5l2 2 4-4.5" />
          </svg>
        )}
      </div>
    </button>
  )
}

export default function DiffCard({ campo, choice, onChoose, disabled }) {
  const resolved = !!choice
  return (
    <div style={{
      border: `1px solid ${resolved ? '#cfe6da' : T.diffMark}`,
      borderRadius: 12, overflow: 'hidden', background: '#fff',
      boxShadow: '0 1px 2px rgba(0,0,0,.03)',
      opacity: disabled ? 0.6 : 1,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        background: resolved ? T.matchBg : T.diffBg,
        borderBottom: `1px solid ${resolved ? '#cfe6da' : T.diffMark}`,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{campo.etiqueta}</span>
        {resolved ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: T.match }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round">
              <path d="M2.5 6.5l2.5 2.5 5.5-6" />
            </svg>
            Resuelto
          </span>
        ) : (
          <span style={{ fontSize: 11.5, fontWeight: 600, color: T.diff }}>Requiere decisión</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, padding: 14 }}>
        <Choice
          label="Valor del usuario"
          value={campo.valor_usuario}
          contra={campo.valor_analista}
          mono={campo.es_mono}
          selected={choice === 'usuario'}
          onClick={() => !disabled && onChoose(campo.id, 'usuario')}
          tone={T.navy}
        />
        <Choice
          label="Valor del analista"
          value={campo.valor_analista}
          contra={campo.valor_usuario}
          mono={campo.es_mono}
          selected={choice === 'analista'}
          onClick={() => !disabled && onChoose(campo.id, 'analista')}
          tone={T.match}
        />
      </div>
    </div>
  )
}
