import { useEffect, useState, useMemo } from 'react'
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
      <RailIzq exp={exp} grupos={grupos} resueltos={resueltos} totalDiff={diffCampos.length} />

      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', background: T.paper }}>
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

        <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && (
            <div style={{ fontSize: 13, color: T.reject, padding: '10px 14px', background: T.rejectBg, borderRadius: 8 }}>
              {error}
            </div>
          )}

          {diffCampos.length > 0 && (
            <>
              {diffCampos.map((campo) => (
                <DiffCard
                  key={campo.id}
                  campo={campo}
                  choice={choices[campo.id] ?? null}
                  onChoose={handleChoose}
                  disabled={isClosed}
                />
              ))}
            </>
          )}

          {matchCampos.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round">
                  <path d="M3 7.5l3 3 6-7" />
                </svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>
                  {matchCampos.length} campos coinciden automáticamente
                </span>
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 28px',
                border: `1px solid #cfe6da`, borderRadius: 10, padding: '10px 16px', background: T.matchBg,
              }}>
                {matchCampos.map((c) => (
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
            </div>
          )}
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
