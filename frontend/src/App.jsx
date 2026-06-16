import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AnalistaModal from './components/AnalistaModal'
import Lista from './pages/Lista'
import Cotejo from './pages/Cotejo'

export default function App() {
  const [analista, setAnalista] = useState(
    () => localStorage.getItem('analista_nombre') || ''
  )

  function confirmarAnalista(nombre) {
    localStorage.setItem('analista_nombre', nombre)
    setAnalista(nombre)
  }

  if (!analista) {
    return <AnalistaModal onConfirm={confirmarAnalista} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/expedientes" replace />} />
        <Route path="/expedientes" element={<Lista />} />
        <Route path="/expedientes/:id" element={<Cotejo />} />
      </Routes>
    </BrowserRouter>
  )
}
