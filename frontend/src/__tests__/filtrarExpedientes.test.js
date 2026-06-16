import { filtrarExpedientes } from '../utils/filtrarExpedientes'

const LISTA = [
  { id: 1, numero: 'EXP-2026-0001', solicitante: 'Ana Torres', analista_nombre: 'C. Vega',  estado: 'en_revision' },
  { id: 2, numero: 'EXP-2026-0002', solicitante: 'Luis Reyes', analista_nombre: 'M. López', estado: 'aprobado' },
  { id: 3, numero: 'EXP-2026-0003', solicitante: 'Rosa Mora',  analista_nombre: 'C. Vega',  estado: 'rechazado' },
  { id: 4, numero: 'EXP-2026-0004', solicitante: 'Ana Ruiz',   analista_nombre: 'M. López', estado: 'en_revision' },
]

test('sin filtros devuelve lista completa', () => {
  expect(filtrarExpedientes(LISTA, { busqueda: '', estado: null, soloMios: false, analista: 'C. Vega' })).toHaveLength(4)
})

test('filtra por nombre del solicitante (case-insensitive)', () => {
  const r = filtrarExpedientes(LISTA, { busqueda: 'ana', estado: null, soloMios: false, analista: 'C. Vega' })
  expect(r).toHaveLength(2)
  expect(r.map(e => e.id)).toEqual([1, 4])
})

test('filtra por numero de expediente', () => {
  const r = filtrarExpedientes(LISTA, { busqueda: '0002', estado: null, soloMios: false, analista: 'C. Vega' })
  expect(r).toHaveLength(1)
  expect(r[0].id).toBe(2)
})

test('filtra por estado', () => {
  const r = filtrarExpedientes(LISTA, { busqueda: '', estado: 'aprobado', soloMios: false, analista: 'C. Vega' })
  expect(r).toHaveLength(1)
  expect(r[0].id).toBe(2)
})

test('soloMios filtra por analista activo', () => {
  const r = filtrarExpedientes(LISTA, { busqueda: '', estado: null, soloMios: true, analista: 'C. Vega' })
  expect(r).toHaveLength(2)
  expect(r.every(e => e.analista_nombre === 'C. Vega')).toBe(true)
})

test('combinacion de filtros (busqueda + estado)', () => {
  const r = filtrarExpedientes(LISTA, { busqueda: 'ana', estado: 'en_revision', soloMios: false, analista: 'C. Vega' })
  expect(r).toHaveLength(2)
  expect(r.map(e => e.id)).toEqual([1, 4])
})
