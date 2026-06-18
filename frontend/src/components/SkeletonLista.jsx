import { T } from '../tokens'

const SHIMMER_CSS = `
  @keyframes shimmer {
    0%   { background-position: -600px 0 }
    100% { background-position: 600px 0 }
  }
`
const SHIMMER_STYLE = {
  background: `linear-gradient(90deg, ${T.lineSoft} 25%, ${T.line} 50%, ${T.lineSoft} 75%)`,
  backgroundSize: '1200px 100%',
  animation: 'shimmer 1.5s infinite linear',
  borderRadius: 4,
}

function Bar({ w, h = 12, style = {} }) {
  return <div style={{ height: h, width: w, ...SHIMMER_STYLE, ...style }} />
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '180px 1fr 160px 120px 100px',
      padding: '16px 20px', borderTop: `1px solid ${T.lineSoft}`, alignItems: 'center', gap: 0,
    }}>
      <Bar w={100} />
      <Bar w="58%" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bar w={26} h={26} style={{ borderRadius: '50%' }} />
        <Bar w={68} />
      </div>
      <Bar w={70} h={22} style={{ borderRadius: 20 }} />
      <Bar w={50} />
    </div>
  )
}

export default function SkeletonLista() {
  return (
    <>
      <style>{SHIMMER_CSS}</style>
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr 160px 120px 100px',
          padding: '11px 20px', background: T.navySoft,
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.navy,
        }}>
          <span>Número</span><span>Solicitante</span><span>Analista</span><span>Estado</span><span>Fecha</span>
        </div>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </>
  )
}
