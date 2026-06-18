import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import { api } from '../api'
import NuevoExpedienteModal from '../components/NuevoExpedienteModal'
import StatsBar from '../components/StatsBar'
import FilterBar from '../components/FilterBar'
import SkeletonLista from '../components/SkeletonLista'
import { filtrarExpedientes } from '../utils/filtrarExpedientes'

const ESTADO_PILL = {
  en_revision: { label: 'En revisión', color: T.diff, bg: T.diffBg },
  aprobado:    { label: 'Aprobado',    color: T.match, bg: T.matchBg },
  rechazado:   { label: 'Rechazado',   color: T.reject, bg: T.rejectBg },
}

const AVATAR_COLORS = [T.navy, '#2d6a4f', '#7b3f00', '#5c4033', '#1a3a5c', '#4a3568']

function EstadoPill({ estado }) {
  const p = ESTADO_PILL[estado] || ESTADO_PILL.en_revision
  return (
    <span style={{
      fontSize: 11.5, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      color: p.color, background: p.bg, border: `1px solid ${p.color}33`,
    }}>
      {p.label}
    </span>
  )
}

function AnalistaAvatar({ nombre }) {
  const parts = (nombre || '').trim().split(/\s+/).filter(Boolean)
  const ini = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : (nombre || '?').slice(0, 2).toUpperCase()
  const bg = AVATAR_COLORS[(nombre || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
  return (
    <div title={nombre} style={{
      width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
      background: bg, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700, fontFamily: T.sans,
    }}>
      {ini}
    </div>
  )
}

function fechaRelativa(isoStr) {
  const d = new Date(isoStr)
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Ayer'
  if (dias < 7) return `Hace ${dias} días`
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} sem.`
  return d.toLocaleDateString('es-MX')
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1" width="7" height="8.5" rx="1.2" />
      <rect x="1" y="2.5" width="7" height="8.5" rx="1.2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M1.5 6l3 3 6-6" />
    </svg>
  )
}

export default function Lista() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filtros, setFiltros] = useState({ busqueda: '', estado: null, soloMios: false })
  const [copied, setCopied] = useState(null)
  const navigate = useNavigate()
  const analista = localStorage.getItem('analista_nombre') || ''

  useEffect(() => {
    api.expedientes.list().then(setExpedientes).finally(() => setLoading(false))
  }, [])

  function handleCreado(exp) {
    setModal(false)
    navigate(`/expedientes/${exp.id}`)
  }

  function handleCopy(e, numero, id) {
    e.stopPropagation()
    navigator.clipboard.writeText(numero)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  const expedientesFiltrados = filtrarExpedientes(expedientes, { ...filtros, analista })

  return (
    <div style={{ fontFamily: T.sans }}>
      {/* Hero header */}
      <div style={{
        background: 'linear-gradient(135deg, #1b2330 0%, #1f3a5f 55%, #2d6a8f 100%)',
        padding: '28px 0 32px', position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', right: -80, top: -80, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', right: 100, bottom: -60, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 600, color: '#fff', margin: 0, letterSpacing: -0.3 }}>
              Expedientes
            </h1>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>
              {loading ? 'Cargando…' : `${expedientes.length} expediente${expedientes.length !== 1 ? 's' : ''} en total`}
            </div>
          </div>
          <button
            onClick={() => setModal(true)}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.22)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; e.currentTarget.style.transform = 'none' }}
            style={{
              padding: '10px 20px', borderRadius: 9,
              border: '1px solid rgba(255,255,255,.25)',
              background: 'rgba(255,255,255,.12)', backdropFilter: 'blur(6px)',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', fontFamily: T.sans,
              transition: 'all .15s cubic-bezier(.2,.8,.2,1)',
            }}
          >
            + Nuevo expediente
          </button>
        </div>
      </div>

    <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 24px' }}>

      {!loading && expedientes.length > 0 && (
        <>
          <StatsBar
            expedientes={expedientes}
            estadoActivo={filtros.estado}
            onEstadoClick={(estado) => setFiltros((f) => ({ ...f, estado }))}
          />
          <FilterBar
            filtros={filtros}
            onChange={setFiltros}
            totalVisible={expedientesFiltrados.length}
            totalGeneral={expedientes.length}
          />
        </>
      )}

      {loading ? (
        <SkeletonLista />
      ) : expedientes.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: T.faint, fontSize: 14,
          border: `2px dashed ${T.line}`, borderRadius: 12,
        }}>
          No hay expedientes aún. Crea el primero.
        </div>
      ) : expedientesFiltrados.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: T.faint, fontSize: 14,
          border: `2px dashed ${T.line}`, borderRadius: 12,
        }}>
          No hay expedientes con esos filtros.{' '}
          <button
            onClick={() => setFiltros({ busqueda: '', estado: null, soloMios: false })}
            style={{ background: 'none', border: 'none', color: T.navy, cursor: 'pointer', fontSize: 14, textDecoration: 'underline', fontFamily: T.sans }}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', background: T.panel }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '180px 1fr 160px 120px 100px',
            padding: '10px 20px', background: T.navySoft,
            fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.navy,
          }}>
            <span>Número</span><span>Solicitante</span><span>Analista</span><span>Estado</span><span>Fecha</span>
          </div>
          {expedientesFiltrados.map((exp) => (
            <div
              key={exp.id}
              onClick={() => navigate(`/expedientes/${exp.id}`)}
              style={{
                display: 'grid', gridTemplateColumns: '180px 1fr 160px 120px 100px',
                padding: '13px 20px', borderTop: `1px solid ${T.lineSoft}`,
                cursor: 'pointer', transition: 'background .12s, box-shadow .12s',
                fontSize: 13, color: T.ink, alignItems: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = T.paper
                e.currentTarget.style.boxShadow = `inset 3px 0 0 ${T.navy}`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.panel
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontFamily: T.mono, fontSize: 12 }}>{exp.numero}</span>
                <button
                  onClick={(e) => handleCopy(e, exp.numero, exp.id)}
                  title="Copiar número"
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px 3px', borderRadius: 4, lineHeight: 1,
                    display: 'inline-flex', alignItems: 'center', transition: 'color .15s',
                    color: copied === exp.id ? T.match : T.faint,
                  }}
                >
                  {copied === exp.id ? <CheckIcon /> : <CopyIcon />}
                </button>
              </span>
              <span style={{ fontWeight: 500 }}>{exp.solicitante}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <AnalistaAvatar nombre={exp.analista_nombre} />
                <span style={{ color: T.sub, fontSize: 12.5 }}>{exp.analista_nombre}</span>
              </span>
              <span><EstadoPill estado={exp.estado} /></span>
              <span
                title={new Date(exp.creado_en).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                style={{ color: T.faint, fontSize: 12 }}
              >
                {fechaRelativa(exp.creado_en)}
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && <NuevoExpedienteModal onClose={() => setModal(false)} onCreado={handleCreado} />}
    </div>
    </div>
  )
}
