import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AnalistaModal from '../components/AnalistaModal'

test('muestra campo de nombre y botón deshabilitado si está vacío', () => {
  render(<AnalistaModal onConfirm={() => {}} />)
  expect(screen.getByPlaceholderText(/nombre/i)).toBeInTheDocument()
  expect(screen.getByRole('button', { name: /continuar/i })).toBeDisabled()
})

test('habilita el botón cuando hay texto', async () => {
  const user = userEvent.setup()
  render(<AnalistaModal onConfirm={() => {}} />)
  await user.type(screen.getByPlaceholderText(/nombre/i), 'C. Vega')
  expect(screen.getByRole('button', { name: /continuar/i })).toBeEnabled()
})

test('llama onConfirm con el nombre al hacer clic', async () => {
  const user = userEvent.setup()
  const onConfirm = vi.fn()
  render(<AnalistaModal onConfirm={onConfirm} />)
  await user.type(screen.getByPlaceholderText(/nombre/i), 'C. Vega')
  await user.click(screen.getByRole('button', { name: /continuar/i }))
  expect(onConfirm).toHaveBeenCalledWith('C. Vega')
})
