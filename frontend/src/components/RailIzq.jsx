import { T } from '../tokens'

export default function RailIzq({ exp, grupos, resueltos, totalDiff }) {
  const pct = totalDiff > 0 ? Math.round((resueltos / totalDiff) * 100) : 100
  const allResolved = resueltos === totalDiff

  return (
    <aside style={{
      background: T.panel, borderRight: `1px solid ${T.line}`,
      display: 'flex', flexDirection: 'column', padding: '20px 18px', width: 252, flexShrink: 0,
    }}>
      <div style={{ paddingBottom: 16, borderBottom: `1px solid ${T.lineSoft}`, marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: T.ink, marginBottom: 2 }}>
          {exp.solicitante}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.sub }}>{exp.numero}</div>
        <div style={{ fontSize: 11, color: T.faint, marginTop: 3 }}>Analista: {exp.analista_nombre}</div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.faint }}>
            Progreso
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 13, color: allResolved ? T.match : T.diff, fontWeight: 600 }}>
            {resueltos}/{totalDiff}
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: T.lineSoft, overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: allResolved ? T.match : T.diff,
            borderRadius: 4, transition: 'width .25s',
          }} />
        </div>
        <div style={{ fontSize: 11.5, color: T.sub, marginTop: 7 }}>
          {allResolved ? 'Todas las diferencias resueltas.' : 'Diferencias por resolver.'}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.faint, marginBottom: 10 }}>
          Secciones
        </div>
        {grupos.map((g, i) => {
          const d = g.fields.filter((f) => f.st === 'diff').length
          return (
            <div key={g.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 11px', borderRadius: 7, marginBottom: 2,
              background: i === 0 ? T.navySoft : 'transparent',
            }}>
              <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? T.navy : T.sub }}>
                {g.name}
              </span>
              {d > 0 ? (
                <span style={{
                  fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: '#fff',
                  background: T.diff, borderRadius: 10, padding: '1px 7px',
                }}>
                  {d}
                </span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round">
                  <path d="M2.5 6.5l2.5 2.5 5.5-6" />
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
