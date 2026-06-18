import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import { api } from '../api'

// ── SVG helpers ────────────────────────────────────────────────────────────
function polarToCart(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}
function arcPath(cx, cy, r1, r2, a1, a2) {
  const [x1,y1] = polarToCart(cx,cy,r2,a1)
  const [x2,y2] = polarToCart(cx,cy,r2,a2)
  const [x3,y3] = polarToCart(cx,cy,r1,a2)
  const [x4,y4] = polarToCart(cx,cy,r1,a1)
  const lg = a2 - a1 > 180 ? 1 : 0
  return `M${x1},${y1} A${r2},${r2} 0 ${lg},1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 ${lg},0 ${x4},${y4}Z`
}

function DonutChart({ rev, apr, rec, size = 160 }) {
  const total = rev + apr + rec
  if (total === 0) return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={54} fill="none" stroke={T.line} strokeWidth={18} />
      <text x={size/2} y={size/2+5} textAnchor="middle" fontSize="13" fill={T.faint} fontFamily={T.sans}>Sin datos</text>
    </svg>
  )
  const cx = size/2, cy = size/2, r1=44, r2=62, G=2
  const segs = [
    { v:apr, color:'#22c55e' },
    { v:rev, color:'#f59e0b' },
    { v:rec, color:'#ef4444' },
  ]
  let cur = 0
  const paths = segs.map((s, i) => {
    const deg = (s.v/total)*360
    const a1 = cur + (i>0 ? G/2 : 0)
    const a2 = cur + deg - (i<segs.length-1 ? G/2 : 0)
    cur += deg
    return { ...s, a1, a2 }
  })
  const pct = total > 0 ? Math.round((apr/total)*100) : 0
  return (
    <svg width={size} height={size}>
      {paths.map((p, i) => p.a2 > p.a1 && (
        <path key={i} d={arcPath(cx,cy,r1,r2,p.a1,p.a2)} fill={p.color}
          style={{ transition:'d .6s cubic-bezier(.2,.8,.2,1)', filter:`drop-shadow(0 0 6px ${p.color}55)` }} />
      ))}
      <text x={cx} y={cy-8} textAnchor="middle" fontSize="26" fontWeight="800" fill={T.ink} fontFamily={T.mono}>{pct}%</text>
      <text x={cx} y={cy+10} textAnchor="middle" fontSize="10" fill={T.faint} fontFamily={T.sans}>aprobación</text>
    </svg>
  )
}

function WeeklyBars({ data }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 18, GAP = 5, H = 44
  return (
    <svg width={data.length*(W+GAP)-GAP} height={H+16} style={{ overflow:'visible' }}>
      {data.map((d, i) => {
        const bh = Math.max((d.count/max)*(H-6), d.count>0 ? 6 : 0)
        const x = i*(W+GAP), y = H-bh
        const isToday = i === data.length-1
        return (
          <g key={i}>
            <rect x={x} y={y} width={W} height={bh} rx={5}
              fill={isToday ? '#1f3a5f' : d.count > 0 ? '#93c5fd' : T.lineSoft} />
            <text x={x+W/2} y={H+13} textAnchor="middle" fontSize="9" fill={T.faint} fontFamily={T.sans}>
              {d.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function AnalystBar({ nombre, total, maxTotal, aprobados, rechazados }) {
  const pct = maxTotal > 0 ? (total/maxTotal)*100 : 0
  const ini = (() => {
    const p = (nombre||'').trim().split(/\s+/).filter(Boolean)
    return p.length>=2 ? (p[0][0]+p[p.length-1][0]).toUpperCase() : (nombre||'?').slice(0,2).toUpperCase()
  })()
  const bg = ['#1f3a5f','#2d6a4f','#7b3f00','#4a3568']
  const aColor = bg[(nombre||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%bg.length]

  return (
    <div style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:`1px solid ${T.lineSoft}` }}>
      <div style={{
        width:36, height:36, borderRadius:'50%', background:aColor, color:'#fff', flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, fontFamily:T.sans,
      }}>{ini}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
          <span style={{ fontSize:13.5, fontWeight:600, color:T.ink }}>{nombre}</span>
          <span style={{ fontFamily:T.mono, fontSize:12, color:T.sub, fontWeight:600 }}>{total} exp.</span>
        </div>
        <div style={{ height:7, background:T.lineSoft, borderRadius:4, overflow:'hidden', marginBottom:4 }}>
          <div style={{ width:`${pct}%`, height:'100%', background:aColor, borderRadius:4, transition:'width .5s cubic-bezier(.2,.8,.2,1)' }} />
        </div>
        <div style={{ display:'flex', gap:12, fontSize:11, color:T.sub }}>
          <span style={{ color:'#16a34a' }}>✓ {aprobados}</span>
          <span style={{ color:'#dc2626' }}>✕ {rechazados}</span>
          <span>{total - aprobados - rechazados} en revisión</span>
        </div>
      </div>
    </div>
  )
}

const DIAS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const ESTADOS_LABEL = { en_revision:'En revisión', aprobado:'Aprobado', rechazado:'Rechazado' }
const ESTADOS_COLOR = { en_revision:'#d97706', aprobado:'#16a34a', rechazado:'#dc2626' }
const ESTADOS_BG    = { en_revision:'#fffbeb',  aprobado:'#f0fdf4',  rechazado:'#fff1f2' }

function fechaRel(iso) {
  const d = Math.floor((Date.now()-new Date(iso))/86400000)
  if (d===0) return 'Hoy'
  if (d===1) return 'Ayer'
  if (d<7) return `Hace ${d}d`
  return new Date(iso).toLocaleDateString('es-MX',{day:'2-digit',month:'short'})
}

function greet() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function Dashboard() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const analista = localStorage.getItem('analista_nombre') || ''

  useEffect(() => {
    api.expedientes.list().then(setExpedientes).finally(() => setLoading(false))
  }, [])

  const total    = expedientes.length
  const rev      = expedientes.filter(e => e.estado === 'en_revision').length
  const apr      = expedientes.filter(e => e.estado === 'aprobado').length
  const rec      = expedientes.filter(e => e.estado === 'rechazado').length

  // Weekly bars — last 7 days
  const today = new Date()
  const last7 = Array.from({length:7}, (_, i) => {
    const d = new Date(today); d.setDate(d.getDate() - (6-i))
    const iso = d.toISOString().slice(0,10)
    return { iso, label: DIAS[d.getDay()], count: expedientes.filter(e => e.creado_en?.slice(0,10) === iso).length }
  })

  // Analyst leaderboard
  const analistas = {}
  for (const e of expedientes) {
    const n = e.analista_nombre || 'Sin asignar'
    if (!analistas[n]) analistas[n] = { nombre:n, total:0, aprobados:0, rechazados:0 }
    analistas[n].total++
    if (e.estado==='aprobado') analistas[n].aprobados++
    if (e.estado==='rechazado') analistas[n].rechazados++
  }
  const leaderboard = Object.values(analistas).sort((a,b) => b.total-a.total)
  const maxT = leaderboard[0]?.total ?? 0

  // Recent feed
  const feed = [...expedientes].sort((a,b) => new Date(b.creado_en)-new Date(a.creado_en)).slice(0,8)

  // Now date string
  const nowStr = new Date().toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long',year:'numeric'})

  const statCards = [
    { label:'Total',       value:total, color:T.navy,    bg:T.navySoft, estado:null,          icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={T.navy} strokeWidth="1.6" strokeLinecap="round"><rect x="3" y="2" width="12" height="14" rx="2"/><path d="M6 6h6M6 9h6M6 12h4"/></svg> },
    { label:'En revisión', value:rev,   color:'#d97706', bg:'#fffbeb',  estado:'en_revision', icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#d97706" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 5.5V9l2.5 2"/></svg> },
    { label:'Aprobados',   value:apr,   color:'#16a34a', bg:'#f0fdf4',  estado:'aprobado',    icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#16a34a" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M5.5 9l2.5 2.5 5-5"/></svg> },
    { label:'Rechazados',  value:rec,   color:'#dc2626', bg:'#fff1f2',  estado:'rechazado',   icon:<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#dc2626" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="7"/><path d="M6.5 6.5l5 5M11.5 6.5l-5 5"/></svg> },
  ]

  return (
    <div style={{ fontFamily:T.sans }}>
      {/* Hero */}
      <div style={{
        background:'linear-gradient(135deg,#1b2330 0%,#1f3a5f 55%,#2d6a8f 100%)',
        padding:'32px 0 36px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', right:-80,top:-80, width:300,height:300, borderRadius:'50%', background:'rgba(255,255,255,.04)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', left:120,bottom:-40, width:180,height:180, borderRadius:'50%', background:'rgba(255,255,255,.025)', pointerEvents:'none' }} />
        <div style={{ maxWidth:1040, margin:'0 auto', padding:'0 32px' }}>
          <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginBottom:4, textTransform:'capitalize' }}>{nowStr}</div>
          <h1 style={{ fontFamily:T.serif, fontSize:30, fontWeight:600, color:'#fff', margin:0, letterSpacing:-0.5 }}>
            {greet()}{analista ? `, ${analista}` : ''}
          </h1>
          <div style={{ fontSize:14, color:'rgba(255,255,255,.55)', marginTop:6 }}>
            {loading ? 'Cargando datos…' : `${total} expediente${total!==1?'s':''} registrado${total!==1?'s':''} · ${rev} pendiente${rev!==1?'s':''} de revisión`}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1040, margin:'0 auto', padding:'28px 32px 48px' }}>
        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
          {statCards.map(s => (
            <button
              key={s.label}
              onClick={() => navigate('/expedientes', { state: { filtroEstado: s.estado } })}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = `0 10px 24px ${s.color}28`
                e.currentTarget.style.borderColor = s.color
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'
                e.currentTarget.style.borderColor = `${s.color}22`
              }}
              style={{
                background:'#fff', borderRadius:14, padding:'20px 22px',
                border:`1.5px solid ${s.color}22`, boxShadow:'0 1px 4px rgba(0,0,0,.06)',
                cursor:'pointer', textAlign:'left', fontFamily:T.sans,
                transition:'all .18s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <div style={{ width:38,height:38, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                {s.icon}
              </div>
              <div style={{ fontFamily:T.mono, fontSize:34, fontWeight:800, color:s.color, lineHeight:1, letterSpacing:-1.5, marginBottom:4 }}>
                {loading ? '–' : s.value}
              </div>
              <div style={{ fontSize:12, color:T.sub, fontWeight:500 }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Middle row */}
        <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, marginBottom:24 }}>
          {/* Donut + weekly */}
          <div style={{ background:'#fff', borderRadius:14, padding:'24px', border:`1px solid ${T.line}`, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:T.faint, marginBottom:20 }}>Distribución</div>
            <div style={{ display:'flex', alignItems:'center', gap:24, marginBottom:24 }}>
              <DonutChart rev={rev} apr={apr} rec={rec} size={150} />
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['#22c55e','Aprobados',apr],['#f59e0b','En revisión',rev],['#ef4444','Rechazados',rec]].map(([c,l,v]) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:c, flexShrink:0 }} />
                    <span style={{ fontSize:12, color:T.sub }}>{l}</span>
                    <span style={{ fontFamily:T.mono, fontSize:13, fontWeight:700, color:T.ink, marginLeft:'auto' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ borderTop:`1px solid ${T.lineSoft}`, paddingTop:18 }}>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:T.faint, marginBottom:12 }}>Últimos 7 días</div>
              <WeeklyBars data={last7} />
            </div>
          </div>

          {/* Activity feed */}
          <div style={{ background:'#fff', borderRadius:14, padding:'24px', border:`1px solid ${T.line}`, boxShadow:'0 1px 4px rgba(0,0,0,.05)', overflow:'hidden' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:T.faint }}>Actividad reciente</div>
              <button onClick={() => navigate('/expedientes')} style={{
                background:'none', border:`1px solid ${T.line}`, borderRadius:6, padding:'4px 10px',
                fontSize:11.5, color:T.navy, cursor:'pointer', fontFamily:T.sans, fontWeight:600,
              }}>Ver todos →</button>
            </div>
            <div>
              {loading ? (
                <div style={{ color:T.faint, fontSize:13 }}>Cargando…</div>
              ) : feed.length === 0 ? (
                <div style={{ color:T.faint, fontSize:13 }}>Sin actividad aún.</div>
              ) : feed.map((e, i) => {
                const c = ESTADOS_COLOR[e.estado]; const bg = ESTADOS_BG[e.estado]
                return (
                  <div
                    key={e.id}
                    onClick={() => navigate(`/expedientes/${e.id}`)}
                    onMouseEnter={ev => ev.currentTarget.style.background = T.paper}
                    onMouseLeave={ev => ev.currentTarget.style.background = 'transparent'}
                    style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'10px 8px', borderBottom: i<feed.length-1 ? `1px solid ${T.lineSoft}` : 'none',
                      cursor:'pointer', borderRadius:6, transition:'background .12s',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:7, height:7, borderRadius:'50%', background:c, flexShrink:0 }} />
                      <div>
                        <span style={{ fontFamily:T.mono, fontSize:11, color:T.sub }}>{e.numero} </span>
                        <span style={{ fontSize:13, fontWeight:500, color:T.ink }}>{e.solicitante}</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontSize:10.5, fontWeight:600, color:c, background:bg, padding:'2px 8px', borderRadius:20 }}>
                        {ESTADOS_LABEL[e.estado]}
                      </span>
                      <span style={{ fontSize:11, color:T.faint, flexShrink:0 }}>{fechaRel(e.creado_en)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Analyst leaderboard */}
        {leaderboard.length > 0 && (
          <div style={{ background:'#fff', borderRadius:14, padding:'24px', border:`1px solid ${T.line}`, boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize:12, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:T.faint, marginBottom:4 }}>Analistas</div>
            <div style={{ fontSize:13, color:T.sub, marginBottom:18 }}>Expedientes procesados por analista</div>
            {leaderboard.map(a => (
              <AnalystBar key={a.nombre} nombre={a.nombre} total={a.total} maxTotal={maxT} aprobados={a.aprobados} rechazados={a.rechazados} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
