import { useState, useEffect } from 'react'
import { T } from '../tokens'

const CHIPS = [
  { value: null,          label: 'Todos' },
  { value: 'en_revision', label: 'En revisión' },
  { value: 'aprobado',    label: 'Aprobado' },
  { value: 'rechazado',   label: 'Rechazado' },
]

export default function FilterBar({ filtros, onChange, totalVisible, totalGeneral }) {
  const [inputValue, setInputValue] = useState(filtros.busqueda)

  useEffect(() => {
    const t = setTimeout(() => onChange({ ...filtros, busqueda: inputValue }), 200)
    return () => clearTimeout(t)
  }, [inputValue])

  useEffect(() => {
    setInputValue(filtros.busqueda)
  }, [filtros.busqueda])

  const hayFiltros = filtros.busqueda || filtros.estado || filtros.soloMios

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Fila superior: buscador + toggle */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={T.faint} strokeWidth="1.8" strokeLinecap="round">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10.5 10.5l3 3" />
          </svg>
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Buscar por nombre o número…"
            style={{
              width: '100%', padding: '9px 14px 9px 36px', borderRadius: 8, fontSize: 13.5,
              border: `1px solid ${T.line}`, fontFamily: T.sans, color: T.ink,
              outline: 'none', background: T.panel,
            }}
          />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: T.sub, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input
            type="checkbox"
            checked={filtros.soloMios}
            onChange={(e) => onChange({ ...filtros, soloMios: e.target.checked })}
            style={{ width: 15, height: 15, accentColor: T.navy, cursor: 'pointer' }}
          />
          Solo mis expedientes
        </label>
      </div>

      {/* Chips de estado */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {CHIPS.map(({ value, label }) => {
          const active = filtros.estado === value
          return (
            <button
              key={String(value)}
              onClick={() => onChange({ ...filtros, estado: value })}
              style={{
                padding: '5px 14px', borderRadius: 20, border: `1px solid ${active ? T.navy : T.line}`,
                background: active ? T.navy : T.panel, color: active ? '#fff' : T.sub,
                fontSize: 12.5, fontWeight: active ? 600 : 400, cursor: 'pointer',
                fontFamily: T.sans, transition: 'all .13s',
              }}
            >
              {label}
            </button>
          )
        })}

        {hayFiltros && (
          <button
            onClick={() => { setInputValue(''); onChange({ busqueda: '', estado: null, soloMios: false }) }}
            style={{
              marginLeft: 'auto', padding: '5px 12px', borderRadius: 20, border: 'none',
              background: 'none', color: T.faint, fontSize: 12, cursor: 'pointer',
              fontFamily: T.sans, textDecoration: 'underline',
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contador de resultados */}
      {hayFiltros && (
        <div style={{ fontSize: 12, color: T.faint, marginTop: 8 }}>
          Mostrando <b style={{ color: T.ink }}>{totalVisible}</b> de {totalGeneral} expedientes
        </div>
      )}
    </div>
  )
}
