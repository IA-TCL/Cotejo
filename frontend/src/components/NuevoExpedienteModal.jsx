import { useState } from 'react'
import { T } from '../tokens'
import { api } from '../api'

export default function NuevoExpedienteModal({ onClose, onCreado }) {
  const [solicitante, setSolicitante] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!solicitante.trim()) return
    setLoading(true)
    setError(null)
    try {
      const exp = await api.expedientes.create({
        solicitante: solicitante.trim(),
        tipo: 'credito_persona_fisica',
      })
      onCreado(exp)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(27,35,48,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: T.sans, zIndex: 100,
    }}>
      <div style={{
        background: T.panel, borderRadius: 14, padding: '32px 36px',
        width: 440, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontFamily: T.serif, fontSize: 19, fontWeight: 600, color: T.ink, marginBottom: 20 }}>
          Nuevo expediente
        </div>

        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, display: 'block', marginBottom: 6 }}>
          Nombre del solicitante
        </label>
        <input
          placeholder="Ej: María Fernanda Robles Díaz"
          value={solicitante}
          onChange={(e) => setSolicitante(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
            border: `1px solid ${T.line}`, fontFamily: T.sans, color: T.ink,
            marginBottom: 12, outline: 'none',
          }}
        />

        <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, display: 'block', marginBottom: 6 }}>
          Tipo de expediente
        </label>
        <div style={{
          padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.line}`,
          fontSize: 14, color: T.sub, marginBottom: 20, background: T.paper,
        }}>
          Solicitud de crédito · Persona física
        </div>

        {error && (
          <div style={{ fontSize: 13, color: T.reject, marginBottom: 12 }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${T.line}`,
            background: '#fff', color: T.sub, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: T.sans,
          }}>
            Cancelar
          </button>
          <button
            disabled={!solicitante.trim() || loading}
            onClick={handleSubmit}
            style={{
              flex: 1, padding: '10px', borderRadius: 8, border: 'none',
              background: solicitante.trim() && !loading ? T.navy : T.line,
              color: solicitante.trim() && !loading ? '#fff' : T.faint,
              fontSize: 14, fontWeight: 600,
              cursor: solicitante.trim() && !loading ? 'pointer' : 'not-allowed',
              fontFamily: T.sans,
            }}
          >
            {loading ? 'Creando…' : 'Crear expediente'}
          </button>
        </div>
      </div>
    </div>
  )
}
