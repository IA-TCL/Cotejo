import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AnalistaModal from './components/AnalistaModal'
import Navbar from './components/Navbar'
import Lista from './pages/Lista'
import Cotejo from './pages/Cotejo'
import Dashboard from './pages/Dashboard'
import { ToastProvider } from './components/ToastProvider'

export default function App() {
  const [analista, setAnalista] = useState(
    () => localStorage.getItem('analista_nombre') || ''
  )

  function confirmarAnalista(nombre) {
    localStorage.setItem('analista_nombre', nombre)
    setAnalista(nombre)
  }

  if (!analista) {
    return <ToastProvider><AnalistaModal onConfirm={confirmarAnalista} /></ToastProvider>
  }

  return (
    <BrowserRouter>
      <ToastProvider>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar analista={analista} />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/expedientes" element={<Lista />} />
            <Route path="/expedientes/:id" element={<Cotejo />} />
          </Routes>
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}
