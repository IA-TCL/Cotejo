import { createContext, useContext, useState, useCallback } from 'react'
import { T } from '../tokens'

const ToastCtx = createContext(null)
export const useToast = () => useContext(ToastCtx)

const ANIM = `
  @keyframes toastIn  { from { transform:translateX(120%);opacity:0 } to { transform:translateX(0);opacity:1 } }
  @keyframes toastOut { from { transform:translateX(0);opacity:1;max-height:80px;margin-bottom:8px }
                        to   { transform:translateX(120%);opacity:0;max-height:0;margin-bottom:0 } }
`
const CFG = {
  success: { bg:'#f0fdf4', border:'#86efac', text:'#15803d',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="6"/><path d="M4.5 7.5l2 2.5 4.5-5"/></svg> },
  error: { bg:'#fff1f2', border:'#fca5a5', text:'#dc2626',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="6"/><path d="M5 5l5 5M10 5l-5 5"/></svg> },
  info: { bg:'#eef2f7', border:'#93c5fd', text:'#1f3a5f',
    icon: <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="#1f3a5f" strokeWidth="2.2" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="6"/><path d="M7.5 6.5v4M7.5 5v.5" strokeWidth="2.5"/></svg> },
}

function Toast({ msg, type, removing }) {
  const c = CFG[type] || CFG.info
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10,
      background:c.bg, border:`1px solid ${c.border}`, borderRadius:10,
      padding:'11px 14px', boxShadow:'0 4px 18px rgba(0,0,0,.14)',
      fontFamily:T.sans, fontSize:13.5, color:c.text, fontWeight:500,
      animation:`${removing ? 'toastOut' : 'toastIn'} .28s cubic-bezier(.2,.8,.2,1) forwards`,
      minWidth:240, maxWidth:340, overflow:'hidden',
    }}>
      {c.icon}
      <span style={{ lineHeight:1.45, flex:1 }}>{msg}</span>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg, type = 'success') => {
    const id = performance.now()
    setToasts(p => [...p, { id, msg, type, removing: false }])
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, removing: true } : t))
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 320)
    }, 3500)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      <style>{ANIM}</style>
      {children}
      <div style={{ position:'fixed', bottom:24, right:24, zIndex:9999, display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end' }}>
        {toasts.map(t => <Toast key={t.id} msg={t.msg} type={t.type} removing={t.removing} />)}
      </div>
    </ToastCtx.Provider>
  )
}
