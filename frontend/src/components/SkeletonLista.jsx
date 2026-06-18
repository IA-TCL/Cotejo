import { T } from '../tokens'

const PULSE_CSS = `
  @keyframes skeletonPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .4; }
  }
`

function Bar({ w, h = 12, delay = '0s' }) {
  return (
    <div style={{
      height: h, width: w, borderRadius: 4, background: T.lineSoft,
      animation: `skeletonPulse 1.6s ease-in-out ${delay} infinite`,
    }} />
  )
}

function SkeletonRow({ delay }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '180px 1fr 160px 120px 100px',
      padding: '14px 20px', borderTop: `1px solid ${T.lineSoft}`, alignItems: 'center',
    }}>
      <Bar w={104} delay={delay} />
      <Bar w="60%" delay={delay} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Bar w={26} h={26} delay={delay} />
        <Bar w={72} delay={delay} />
      </div>
      <Bar w={70} h={20} delay={delay} />
      <Bar w={52} delay={delay} />
    </div>
  )
}

export default function SkeletonLista() {
  return (
    <>
      <style>{PULSE_CSS}</style>
      <div style={{ border: `1px solid ${T.line}`, borderRadius: 12, overflow: 'hidden', background: T.panel }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '180px 1fr 160px 120px 100px',
          padding: '10px 20px', background: T.navySoft,
          fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.navy,
        }}>
          <span>Número</span><span>Solicitante</span><span>Analista</span><span>Estado</span><span>Fecha</span>
        </div>
        <SkeletonRow delay="0s" />
        <SkeletonRow delay=".12s" />
        <SkeletonRow delay=".24s" />
      </div>
    </>
  )
}
