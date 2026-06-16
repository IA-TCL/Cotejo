import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiffCard from '../components/DiffCard'

const campo = {
  id: 1,
  etiqueta: 'RFC',
  valor_usuario: 'ROBM850412QX3',
  valor_analista: 'ROBM850412QX8',
  es_mono: true,
}

test('muestra etiqueta y valores', () => {
  render(<DiffCard campo={campo} choice={null} onChoose={() => {}} />)
  expect(screen.getByText('RFC')).toBeInTheDocument()
  expect(screen.getByText('ROBM850412QX3')).toBeInTheDocument()
  expect(screen.getByText('ROBM850412QX8')).toBeInTheDocument()
})

test('llama onChoose con "usuario" al hacer clic', async () => {
  const user = userEvent.setup()
  const onChoose = vi.fn()
  render(<DiffCard campo={campo} choice={null} onChoose={onChoose} />)
  await user.click(screen.getByText('Valor del usuario'))
  expect(onChoose).toHaveBeenCalledWith(1, 'usuario')
})

test('llama onChoose con "analista" al hacer clic', async () => {
  const user = userEvent.setup()
  const onChoose = vi.fn()
  render(<DiffCard campo={campo} choice={null} onChoose={onChoose} />)
  await user.click(screen.getByText('Valor del analista'))
  expect(onChoose).toHaveBeenCalledWith(1, 'analista')
})

test('muestra estado resuelto cuando hay choice', () => {
  render(<DiffCard campo={campo} choice="usuario" onChoose={() => {}} />)
  expect(screen.getByText('Resuelto')).toBeInTheDocument()
})
