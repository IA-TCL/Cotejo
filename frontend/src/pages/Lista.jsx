import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import { api } from '../api'
import NuevoExpedienteModal from '../components/NuevoExpedienteModal'
import StatsBar from '../components/StatsBar'
import FilterBar from '../components/FilterBar'
import { filtrarExpedientes } from '../utils/filtrarExpedientes'

const ESTADO_PILL = {
  en_revision: { label: 'En revisión', color: T.diff, bg: T.diffBg },
  aprobado:    { label: 'Aprobado',    color: T.match, bg: T.matchBg },
  rechazado:   { label: 'Rechazado',   color: T.reject, bg: T.rejectBg },
}

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

export default function Lista() {
  const [expedientes, setExpedientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [filtros, setFiltros] = useState({ busqueda: '', estado: null, soloMios: false })
  const navigate = useNavigate()
  const analista = localStorage.getItem('analista_nombre') || ''

  useEffect(() => {
    api.expedientes.list().then(setExpedientes).finally(() => setLoading(false))
  }, [])

  function handleCreado(exp) {
    setModal(false)
    navigate(`/expedientes/${exp.id}`)
  }

  const expedientesFiltrados = filtrarExpedientes(expedientes, { ...filtros, analista })

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px', fontFamily: T.sans }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: T.serif, fontSize: 26, fontWeight: 600, color: T.ink }}>
            Portal de Cotejo
          </h1>
          <div style={{ fontSize: 13, color: T.sub, marginTop: 4 }}>
            Analista: <b>{analista}</b>
          </div>
        </div>
        <button
          onClick={() => setModal(true)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: T.navy, color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: T.sans,
          }}
        >
          + Nuevo expediente
        </button>
      </div>

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
        <div style={{ color: T.faint, fontSize: 14 }}>Cargando…</div>
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
            display: 'grid', gridTemplateColumns: '160px 1fr 140px 120px 100px',
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
                display: 'grid', gridTemplateColumns: '160px 1fr 140px 120px 100px',
                padding: '13px 20px', borderTop: `1px solid ${T.lineSoft}`,
                cursor: 'pointer', transition: 'background .12s',
                fontSize: 13, color: T.ink, alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = T.paper)}
              onMouseLeave={(e) => (e.currentTarget.style.background = T.panel)}
            >
              <span style={{ fontFamily: T.mono, fontSize: 12 }}>{exp.numero}</span>
              <span style={{ fontWeight: 500 }}>{exp.solicitante}</span>
              <span style={{ color: T.sub }}>{exp.analista_nombre}</span>
              <span><EstadoPill estado={exp.estado} /></span>
              <span style={{ color: T.faint, fontSize: 12 }}>
                {new Date(exp.creado_en).toLocaleDateString('es-MX')}
              </span>
            </div>
          ))}
        </div>
      )}

      {modal && <NuevoExpedienteModal onClose={() => setModal(false)} onCreado={handleCreado} />}
    </div>
  )
}
