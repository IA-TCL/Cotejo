import { render, screen } from '@testing-library/react'
import RailIzq from '../components/RailIzq'

const grupos = [
  { name: 'Identidad', fields: [{ st: 'diff' }, { st: 'match' }] },
  { name: 'Contacto',  fields: [{ st: 'match' }] },
]

const exp = { numero: 'EXP-2026-0001', solicitante: 'Ana Torres', analista_nombre: 'C. Vega' }

test('muestra nombre del solicitante', () => {
  render(<RailIzq exp={exp} grupos={grupos} resueltos={0} totalDiff={1} />)
  expect(screen.getByText('Ana Torres')).toBeInTheDocument()
})

test('muestra progreso correcto', () => {
  render(<RailIzq exp={exp} grupos={grupos} resueltos={1} totalDiff={1} />)
  expect(screen.getByText('1/1')).toBeInTheDocument()
})

test('muestra grupos de secciones', () => {
  render(<RailIzq exp={exp} grupos={grupos} resueltos={0} totalDiff={1} />)
  expect(screen.getByText('Identidad')).toBeInTheDocument()
  expect(screen.getByText('Contacto')).toBeInTheDocument()
})
