import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { T } from '../tokens'
import { api } from '../api'

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

const ESTADO_COLOR = { en_revision:'#f59e0b', aprobado:'#22c55e', rechazado:'#ef4444' }
const ESTADO_LABEL = { en_revision:'En rev.', aprobado:'Aprobado', rechazado:'Rechazado' }

function NavSearch() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [exps, setExps] = useState([])
  const [sel, setSel] = useState(-1)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)
  const navigate = useNavigate()

  async function handleFocus() {
    setOpen(true)
    if (exps.length === 0) {
      try { setExps(await api.expedientes.list()) } catch {}
    }
  }

  useEffect(() => {
    function onClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false); setQuery(''); setSel(-1)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const results = query.length > 0
    ? exps.filter(e =>
        e.numero.toLowerCase().includes(query.toLowerCase()) ||
        e.solicitante.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : exps.slice(0, 6)

  function go(exp) {
    navigate(`/expedientes/${exp.id}`)
    setOpen(false); setQuery(''); setSel(-1)
  }

  function handleKey(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && sel >= 0 && results[sel]) go(results[sel])
    if (e.key === 'Escape') { setOpen(false); setQuery(''); inputRef.current?.blur() }
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)',
        borderRadius: 8, padding: '6px 12px', transition: 'all .18s',
        ...(open ? { background:'rgba(255,255,255,.16)', border:'1px solid rgba(255,255,255,.3)' } : {}),
      }}>
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="5.5" cy="5.5" r="4" /><path d="M9 9l2.5 2.5" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setSel(-1) }}
          onFocus={handleFocus}
          onKeyDown={handleKey}
          placeholder="Buscar expediente…"
          style={{
            background: 'none', border: 'none', outline: 'none',
            fontSize: 13, color: '#fff', fontFamily: T.sans,
            width: open ? 200 : 150, transition: 'width .2s',
            '::placeholder': { color: 'rgba(255,255,255,.45)' },
          }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setSel(-1) }} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', color:'rgba(255,255,255,.5)' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 2l8 8M10 2l-8 8"/></svg>
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 6,
          background: '#fff', borderRadius: 10, border: `1px solid ${T.line}`,
          boxShadow: '0 12px 36px rgba(15,32,53,.22)', zIndex: 200, overflow: 'hidden',
          minWidth: 320,
        }}>
          {query === '' && (
            <div style={{ padding:'8px 14px 4px', fontSize:10.5, fontWeight:700, letterSpacing:0.8, textTransform:'uppercase', color:T.faint }}>
              Recientes
            </div>
          )}
          {results.map((e, i) => (
            <div
              key={e.id}
              onMouseDown={() => go(e)}
              onMouseEnter={() => setSel(i)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', cursor: 'pointer', transition: 'background .1s',
                background: sel === i ? T.navySoft : 'transparent',
              }}
            >
              <div>
                <span style={{ fontFamily:T.mono, fontSize:11, color:T.sub }}>{e.numero} </span>
                <span style={{ fontSize:13, fontWeight:500, color:T.ink }}>{e.solicitante}</span>
              </div>
              <span style={{
                fontSize:10.5, fontWeight:600,
                color: ESTADO_COLOR[e.estado],
                background: `${ESTADO_COLOR[e.estado]}18`,
                padding:'2px 7px', borderRadius:20,
              }}>
                {ESTADO_LABEL[e.estado]}
              </span>
            </div>
          ))}
          {query && results.length === 0 && (
            <div style={{ padding:'16px 14px', fontSize:13, color:T.faint }}>Sin resultados</div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Navbar({ analista }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const NavLink = ({ to, label }) => {
    const active = pathname === to || (to === '/expedientes' && pathname.startsWith('/expedientes'))
    return (
      <button
        onClick={() => navigate(to)}
        style={{
          background: active ? 'rgba(255,255,255,.15)' : 'none',
          border: active ? '1px solid rgba(255,255,255,.2)' : '1px solid transparent',
          borderRadius: 7, padding:'5px 12px', color:'#fff',
          fontSize:13, fontFamily:T.sans, cursor:'pointer',
          fontWeight: active ? 600 : 400,
          opacity: active ? 1 : 0.65,
          transition:'all .15s',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <header style={{
      height: 52,
      background: 'linear-gradient(135deg, #1b2330 0%, #1f3a5f 60%, #15293f 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', flexShrink: 0,
      boxShadow: '0 2px 10px rgba(15,32,53,.4)',
      position: 'relative', overflow: 'visible', zIndex: 100,
    }}>
      <div style={{ position:'absolute', right:-60, top:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,.03)', pointerEvents:'none' }} />

      {/* Logo */}
      <button onClick={() => navigate('/')} style={{
        display:'flex', alignItems:'center', gap:10, background:'none', border:'none', cursor:'pointer', padding:0,
      }}>
        <div style={{
          width:28, height:28, borderRadius:7,
          background:'rgba(255,255,255,.15)', border:'1px solid rgba(255,255,255,.2)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 5h10M3 8h7M3 11h9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <span style={{ fontFamily:T.serif, fontSize:16, fontWeight:600, color:'#fff', letterSpacing:-0.2 }}>
          Portal de Cotejo
        </span>
      </button>

      {/* Nav links */}
      <div style={{ display:'flex', alignItems:'center', gap:4, position:'relative' }}>
        <NavLink to="/" label="Dashboard" />
        <NavLink to="/expedientes" label="Expedientes" />
      </div>

      {/* Search + avatar */}
      <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative' }}>
        <NavSearch />
        <div style={{ width:1, height:22, background:'rgba(255,255,255,.2)' }} />
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <Avatar nombre={analista} />
          <span style={{ fontSize:13, color:'rgba(255,255,255,.75)', fontFamily:T.sans }}>{analista}</span>
        </div>
      </div>
    </header>
  )
}
