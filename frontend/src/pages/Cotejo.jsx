import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { T } from '../tokens'
import { api } from '../api'
import RailIzq from '../components/RailIzq'
import DiffCard from '../components/DiffCard'
import PanelDecision from '../components/PanelDecision'

export default function Cotejo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [exp, setExp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nota, setNota] = useState('')
  const [error, setError] = useState(null)
  const [activeGrupo, setActiveGrupo] = useState(null)
  const mainRef = useRef(null)

  useEffect(() => {
    api.expedientes.get(id).then(setExp).catch(() => navigate('/expedientes')).finally(() => setLoading(false))
  }, [id])

  const isClosed = exp?.estado !== 'en_revision'

  const grupos = useMemo(() => {
    if (!exp) return []
    const map = {}
    for (const c of exp.campos) {
      if (!map[c.grupo]) map[c.grupo] = { name: c.grupo, fields: [] }
      map[c.grupo].fields.push({ ...c, st: c.estado })
    }
    return Object.values(map).sort((a, b) => {
      const first = (g) => g.fields[0]?.orden ?? 0
      return first(a) - first(b)
    })
  }, [exp])

  const diffCampos = useMemo(() => exp?.campos.filter((c) => c.estado === 'diff') ?? [], [exp])
  const matchCampos = useMemo(() => exp?.campos.filter((c) => c.estado === 'match') ?? [], [exp])

  const choices = useMemo(() => {
    if (!exp) return {}
    return Object.fromEntries(exp.resoluciones.map((r) => [r.campo_id, r.valor_elegido]))
  }, [exp])

  const resueltos = useMemo(() => diffCampos.filter((c) => choices[c.id]).length, [diffCampos, choices])

  // Set initial active grupo and track on scroll
  useEffect(() => {
    if (!grupos.length) return
    setActiveGrupo(grupos[0].name)
  }, [grupos])

  useEffect(() => {
    const container = mainRef.current
    if (!container || !grupos.length) return

    const onScroll = () => {
      const cTop = container.getBoundingClientRect().top
      let current = grupos[0].name
      for (const g of grupos) {
        const section = document.getElementById(`grupo-${g.name}`)
        if (section && section.getBoundingClientRect().top - cTop < 120) {
          current = g.name
        }
      }
      setActiveGrupo(current)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [grupos])

  function scrollToGrupo(name) {
    const section = document.getElementById(`grupo-${name}`)
    const container = mainRef.current
    if (!section || !container) return
    const sTop = section.getBoundingClientRect().top
    const cTop = container.getBoundingClientRect().top
    container.scrollBy({ top: sTop - cTop - 80, behavior: 'smooth' })
  }

  async function handleChoose(campoId, valor) {
    try {
      const res = await api.resoluciones.upsert(id, campoId, { valor_elegido: valor })
      setExp((prev) => ({
        ...prev,
        resoluciones: [
          ...prev.resoluciones.filter((r) => r.campo_id !== campoId),
          res,
        ],
      }))
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDecision(resultado) {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.decision.post(id, { resultado, nota_decision: nota || null })
      setExp(updated)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: 40, fontFamily: T.sans, color: T.faint }}>Cargando…</div>
  }

  if (!exp) return null

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 52px)', background: T.paper, fontFamily: T.sans, color: T.ink, display: 'flex' }}>
      <RailIzq
        exp={exp} grupos={grupos} resueltos={resueltos} totalDiff={diffCampos.length}
        choices={choices} activeGrupo={activeGrupo} onGrupoClick={scrollToGrupo}
      />

      <main ref={mainRef} style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', background: T.paper }}>
        <div style={{ padding: '18px 28px 12px', borderBottom: `1px solid ${T.lineSoft}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <button onClick={() => navigate('/expedientes')} style={{
              background: 'none', border: 'none', color: T.sub, cursor: 'pointer',
              fontSize: 12, fontFamily: T.sans, padding: 0, marginBottom: 4,
            }}>
              ← Volver a lista
            </button>
            <h1 style={{ fontFamily: T.serif, fontSize: 22, fontWeight: 600, margin: 0 }}>
              Revisión de diferencias
            </h1>
            <p style={{ fontSize: 13, color: T.sub, margin: '4px 0 0' }}>
              Para cada diferencia, elige el valor correcto.
            </p>
          </div>
          {isClosed && (
            <div style={{
              fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20,
              color: exp.estado === 'aprobado' ? T.match : T.reject,
              background: exp.estado === 'aprobado' ? T.matchBg : T.rejectBg,
              border: `1px solid ${exp.estado === 'aprobado' ? '#cfe6da' : '#e8bfba'}`,
            }}>
              {exp.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
            </div>
          )}
        </div>

        <div style={{ padding: '24px 28px 40px', display: 'flex', flexDirection: 'column', gap: 32 }}>
          {error && (
            <div style={{ fontSize: 13, color: T.reject, padding: '10px 14px', background: T.rejectBg, borderRadius: 8 }}>
              {error}
            </div>
          )}

          {grupos.map((g) => {
            const gDiff = g.fields.filter((f) => f.estado === 'diff')
            const gMatch = g.fields.filter((f) => f.estado === 'match')
            const gResueltos = gDiff.filter((f) => choices[f.id]).length
            const gDone = gDiff.length === 0 || gResueltos === gDiff.length

            return (
              <div key={g.name} id={`grupo-${g.name}`} data-grupo={g.name}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${T.line}` }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: 0.9, textTransform: 'uppercase', color: T.navy, flexShrink: 0 }}>
                    {g.name}
                  </span>
                  <div style={{ flex: 1, height: 1, background: T.lineSoft }} />
                  {gDiff.length === 0 ? (
                    <span style={{ fontSize: 11, color: T.match, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={T.match} strokeWidth="2.2" strokeLinecap="round"><path d="M1.5 6l3 3 6-6" /></svg>
                      Todo coincide
                    </span>
                  ) : gDone ? (
                    <span style={{ fontSize: 11, color: T.match, fontWeight: 700, background: T.matchBg, padding: '2px 8px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round"><path d="M1 5.5l3 3 6-6" /></svg>
                      Resuelto
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: T.diff, fontWeight: 700, background: T.diffBg, padding: '2px 8px', borderRadius: 12 }}>
                      {gDiff.length - gResueltos} pendiente{gDiff.length - gResueltos !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Diff cards for this section */}
                {gDiff.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: gMatch.length > 0 ? 14 : 0 }}>
                    {gDiff.map((campo) => (
                      <DiffCard
                        key={campo.id}
                        campo={campo}
                        choice={choices[campo.id] ?? null}
                        onChoose={handleChoose}
                        disabled={isClosed}
                      />
                    ))}
                  </div>
                )}

                {/* Match summary for this section */}
                {gMatch.length > 0 && (
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px',
                    border: '1px solid #cfe6da', borderRadius: 10, padding: '10px 16px', background: T.matchBg,
                  }}>
                    {gMatch.map((c) => (
                      <div key={c.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 0', borderBottom: `1px solid ${T.lineSoft}`,
                      }}>
                        <span style={{ fontSize: 12.5, color: T.sub }}>{c.etiqueta}</span>
                        <span style={{
                          fontFamily: c.es_mono ? T.mono : T.sans, fontSize: 12.5, color: T.ink,
                          maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {c.valor_usuario || <em style={{ color: T.faint }}>vacío</em>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      <PanelDecision
        matches={matchCampos.length}
        totalDiff={diffCampos.length}
        resueltos={resueltos}
        nota={nota}
        onNotaChange={setNota}
        onAprobar={() => handleDecision('aprobado')}
        onRechazar={() => handleDecision('rechazado')}
        loading={saving}
        disabled={isClosed}
      />
    </div>
  )
}
