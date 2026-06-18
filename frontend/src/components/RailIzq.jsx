import { T } from '../tokens'

export default function RailIzq({ exp, grupos, resueltos, totalDiff, choices = {}, activeGrupo, onGrupoClick }) {
  const pct = totalDiff > 0 ? Math.round((resueltos / totalDiff) * 100) : 100
  const allResolved = resueltos === totalDiff

  return (
    <aside style={{
      background: 'linear-gradient(180deg, #1f3a5f 0%, #15293f 100%)',
      display: 'flex', flexDirection: 'column', padding: '20px 18px', width: 252, flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,.07)',
    }}>
      <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,.1)', marginBottom: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, color: '#fff', marginBottom: 2 }}>
          {exp.solicitante}
        </div>
        <div style={{ fontFamily: T.mono, fontSize: 11.5, color: 'rgba(255,255,255,.5)' }}>{exp.numero}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 3 }}>Analista: {exp.analista_nombre}</div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' }}>
            Progreso
          </span>
          <span style={{ fontFamily: T.mono, fontSize: 13, fontWeight: 600,
            color: allResolved ? '#5de8a4' : '#f4d79f' }}>
            {resueltos}/{totalDiff}
          </span>
        </div>
        <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: allResolved
              ? 'linear-gradient(90deg, #27ae72, #5de8a4)'
              : 'linear-gradient(90deg, #d97706, #f4d79f)',
            borderRadius: 4, transition: 'width .3s cubic-bezier(.2,.8,.2,1)',
            boxShadow: allResolved ? '0 0 8px rgba(93,232,164,.4)' : '0 0 8px rgba(244,215,159,.3)',
          }} />
        </div>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)', marginTop: 7 }}>
          {allResolved ? 'Todas las diferencias resueltas.' : 'Diferencias por resolver.'}
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 10 }}>
          Secciones
        </div>
        {grupos.map((g) => {
          const d = g.fields.filter((f) => f.st === 'diff').length
          const resolved = g.fields.filter((f) => f.st === 'diff' && choices[f.id]).length
          const sectionDone = d === 0 || resolved === d
          const active = g.name === activeGrupo

          return (
            <button
              key={g.name}
              onClick={() => onGrupoClick?.(g.name)}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.08)'
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 11px', borderRadius: 7, marginBottom: 2,
                background: active ? 'rgba(255,255,255,.14)' : 'transparent',
                border: active ? '1px solid rgba(255,255,255,.12)' : '1px solid transparent',
                cursor: 'pointer', width: '100%', textAlign: 'left',
                transition: 'background .14s, border-color .14s',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, color: active ? '#fff' : 'rgba(255,255,255,.55)', fontFamily: T.sans }}>
                {g.name}
              </span>
              {d > 0 && !sectionDone ? (
                <span style={{
                  fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: '#1b2330',
                  background: '#f4d79f', borderRadius: 10, padding: '1px 7px',
                }}>
                  {d - resolved}
                </span>
              ) : (
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#5de8a4" strokeWidth="2" strokeLinecap="round">
                  <path d="M2.5 6.5l2.5 2.5 5.5-6" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
