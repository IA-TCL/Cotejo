import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PanelDecision from '../components/PanelDecision'

const base = {
  matches: 10,
  totalDiff: 4,
  resueltos: 0,
  nota: '',
  onNotaChange: () => {},
  onAprobar: () => {},
  onRechazar: () => {},
  loading: false,
  disabled: false,
}

test('botón aprobar deshabilitado si hay pendientes', () => {
  render(<PanelDecision {...base} resueltos={2} totalDiff={4} />)
  expect(screen.getByRole('button', { name: /aprobar/i })).toBeDisabled()
})

test('botón aprobar habilitado si todo está resuelto', () => {
  render(<PanelDecision {...base} resueltos={4} totalDiff={4} />)
  expect(screen.getByRole('button', { name: /aprobar cotejo/i })).toBeEnabled()
})

test('llama onAprobar al hacer clic en aprobar', async () => {
  const user = userEvent.setup()
  const onAprobar = vi.fn()
  render(<PanelDecision {...base} resueltos={4} totalDiff={4} onAprobar={onAprobar} />)
  await user.click(screen.getByRole('button', { name: /aprobar cotejo/i }))
  expect(onAprobar).toHaveBeenCalled()
})

test('llama onRechazar al hacer clic en rechazar', async () => {
  const user = userEvent.setup()
  const onRechazar = vi.fn()
  render(<PanelDecision {...base} onRechazar={onRechazar} />)
  await user.click(screen.getByRole('button', { name: /rechazar/i }))
  expect(onRechazar).toHaveBeenCalled()
})
