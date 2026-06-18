import { T } from '../tokens'

const COLS = [
  { key:'en_revision', label:'En revisión', color:'#d97706', bg:'#fffbeb', border:'#fcd34d', dot:'#f59e0b' },
  { key:'aprobado',    label:'Aprobados',   color:'#16a34a', bg:'#f0fdf4', border:'#86efac', dot:'#22c55e' },
  { key:'rechazado',   label:'Rechazados',  color:'#dc2626', bg:'#fff1f2', border:'#fca5a5', dot:'#ef4444' },
]

const AVATAR_COLORS = ['#1f3a5f','#2d6a4f','#7b3f00','#5c4033','#4a3568']

function avatarBg(nombre) {
  const n = (nombre || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

function initials(nombre) {
  const parts = (nombre || '').trim().split(/\s+/).filter(Boolean)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (nombre || '?').slice(0, 2).toUpperCase()
}

function fechaRel(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (d === 0) return 'Hoy'
  if (d === 1) return 'Ayer'
  if (d < 7) return `Hace ${d}d`
  return new Date(iso).toLocaleDateString('es-MX', { day:'2-digit', month:'short' })
}

function KanbanCard({ exp, onNavigate }) {
  return (
    <div
      onClick={() => onNavigate(exp.id)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,.12)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.07)' }}
      style={{
        background:'#fff', borderRadius:10, padding:'13px 14px',
        boxShadow:'0 2px 8px rgba(0,0,0,.07)',
        cursor:'pointer', transition:'all .16s cubic-bezier(.2,.8,.2,1)',
        border:`1px solid ${T.line}`, marginBottom:8,
      }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <span style={{ fontFamily:T.mono, fontSize:11, color:T.sub, fontWeight:600 }}>{exp.numero}</span>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={T.faint} strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 6.5h7M7 3l3 3.5-3 3.5" />
        </svg>
      </div>
      <div style={{ fontSize:13.5, fontWeight:600, color:T.ink, lineHeight:1.3, marginBottom:10 }}>
        {exp.solicitante}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{
            width:22, height:22, borderRadius:'50%', flexShrink:0,
            background:avatarBg(exp.analista_nombre), color:'#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:8.5, fontWeight:700, fontFamily:T.sans,
          }}>
            {initials(exp.analista_nombre)}
          </div>
          <span style={{ fontSize:11.5, color:T.sub }}>{exp.analista_nombre}</span>
        </div>
        <span style={{ fontSize:11, color:T.faint }}>{fechaRel(exp.creado_en)}</span>
      </div>
    </div>
  )
}

export default function KanbanView({ expedientes, onNavigate }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, alignItems:'start' }}>
      {COLS.map(col => {
        const cards = expedientes.filter(e => e.estado === col.key)
        return (
          <div key={col.key}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, marginBottom:12,
              padding:'10px 14px', borderRadius:10,
              background:col.bg, border:`1px solid ${col.border}`,
            }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:col.dot, flexShrink:0 }} />
              <span style={{ fontSize:12, fontWeight:700, color:col.color, letterSpacing:0.3 }}>{col.label}</span>
              <span style={{
                marginLeft:'auto', fontFamily:T.mono, fontSize:12, fontWeight:800,
                color:col.color, background:`${col.color}18`, borderRadius:20, padding:'1px 8px',
              }}>
                {cards.length}
              </span>
            </div>

            {cards.length === 0 ? (
              <div style={{
                textAlign:'center', padding:'28px 0', color:T.faint,
                fontSize:12.5, border:`2px dashed ${T.line}`, borderRadius:10,
              }}>
                Sin expedientes
              </div>
            ) : (
              cards.map(exp => <KanbanCard key={exp.id} exp={exp} onNavigate={onNavigate} />)
            )}
          </div>
        )
      })}
    </div>
  )
}
