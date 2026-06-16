// Variación A — Cotejo a doble columna (split clásico tipo documento)
// Two document panels side by side, rows aligned, center rail marks =/≠.
(function () {
  const { tok: T, groups, meta, diffParts } = window.CMP;

  function Mark({ a, b, mono }) {
    // Highlight differing characters between the two values.
    const parts = diffParts(a, b);
    return (
      <span style={{ fontFamily: mono ? T.mono : T.sans, fontSize: mono ? 14.5 : 15.5, letterSpacing: mono ? 0.2 : 0, color: T.ink }}>
        {parts.map((p, i) => (
          <span key={i} style={p.changed ? { background: T.diffMark, borderRadius: 2, padding: '1px 0', boxShadow: `0 0 0 1px ${T.diffMark}` } : null}>{p.ch}</span>
        ))}
      </span>
    );
  }

  function Cell({ f, side }) {
    const isDiff = f.st === 'diff';
    const val = side === 'user' ? f.user : f.analyst;
    const other = side === 'user' ? f.analyst : f.user;
    return (
      <div style={{
        padding: '9px 22px',
        background: isDiff ? T.diffBg : 'transparent',
        borderLeft: side === 'analyst' ? `1px solid ${isDiff ? 'transparent' : T.lineSoft}` : 'none',
      }}>
        <div style={{ fontSize: 10.5, letterSpacing: 0.8, textTransform: 'uppercase', color: T.faint, fontWeight: 600, marginBottom: 3 }}>{f.label}</div>
        {isDiff
          ? <Mark a={val} b={other} mono={f.mono} />
          : <span style={{ fontFamily: f.mono ? T.mono : T.sans, fontSize: f.mono ? 14.5 : 15.5, letterSpacing: f.mono ? 0.2 : 0, color: T.ink }}>{val}</span>}
      </div>
    );
  }

  function Rail({ st }) {
    const isDiff = st === 'diff';
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDiff ? T.diffBg : 'transparent' }}>
        <div style={{
          width: 22, height: 22, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isDiff ? T.diff : 'transparent', color: isDiff ? '#fff' : T.faint,
          border: isDiff ? 'none' : `1px solid ${T.line}`, fontSize: 13, fontWeight: 700,
        }}>{isDiff ? '≠' : '='}</div>
      </div>
    );
  }

  function Btn({ children, kind }) {
    const [h, setH] = React.useState(false);
    const base = { fontFamily: T.sans, fontSize: 14, fontWeight: 600, padding: '10px 20px', borderRadius: 7, cursor: 'pointer', transition: 'all .15s', letterSpacing: 0.1 };
    const styles = kind === 'primary'
      ? { ...base, border: 'none', background: h ? T.navyInk : T.navy, color: '#fff', boxShadow: '0 1px 2px rgba(20,40,60,.25)' }
      : { ...base, border: `1px solid ${h ? T.reject : T.line}`, background: h ? T.rejectBg : '#fff', color: T.reject };
    return <button style={styles} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{children}</button>;
  }

  function VariationA() {
    return (
      <div style={{ width: '100%', height: '100%', background: T.paper, fontFamily: T.sans, color: T.ink, display: 'flex', flexDirection: 'column' }}>
        {/* App bar */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', background: '#fff', borderBottom: `1px solid ${T.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: T.serif, fontWeight: 600, fontSize: 18, flexShrink: 0 }}>C</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}>
                <span style={{ fontFamily: T.serif, fontSize: 21, fontWeight: 600, letterSpacing: -0.2 }}>Cotejo de expediente</span>
                <span style={{ fontFamily: T.mono, fontSize: 13, color: T.sub }}>{meta.expediente}</span>
              </div>
              <div style={{ fontSize: 12.5, color: T.sub, marginTop: 1 }}>{meta.tipo} · Recibido {meta.recibido}</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.diff, background: T.diffBg, border: `1px solid ${T.diffMark}`, padding: '5px 12px', borderRadius: 20 }}>En revisión</span>
            <div style={{ width: 1, height: 24, background: T.line }} />
            <Btn kind="ghost">Rechazar</Btn>
            <Btn kind="primary">Aprobar cotejo</Btn>
          </div>
        </header>

        {/* Summary strip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 28px', background: T.navySoft, borderBottom: `1px solid ${T.line}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
            <span style={{ fontWeight: 700, color: T.diff, fontFamily: T.mono, fontSize: 15 }}>{meta.diffs}</span>
            <span style={{ color: T.sub }}>de {meta.total} campos presentan diferencias entre el archivo del usuario y el del analista.</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12.5, color: T.sub }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 5, background: T.match, display: 'inline-block' }} /> {meta.matches} coinciden</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 5, background: T.diff, display: 'inline-block' }} /> {meta.diffs} difieren</span>
          </div>
        </div>

        {/* Panel headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr', background: '#fff', borderBottom: `1px solid ${T.line}` }}>
          <PanelHead title="Archivo del usuario" sub="Declarado por el solicitante" icon="◰" />
          <div style={{ borderBottom: 'none' }} />
          <PanelHead title="Archivo del analista" sub={`Verificado · ${meta.analista}`} icon="◳" right />
        </div>

        {/* Field rows */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 56px 1fr' }}>
            {groups.map((g) => (
              <React.Fragment key={g.name}>
                <div style={{ gridColumn: '1 / -1', padding: '7px 22px', background: T.paper, borderTop: `1px solid ${T.line}`, borderBottom: `1px solid ${T.lineSoft}` }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.navy }}>{g.name}</span>
                </div>
                {g.fields.map((f) => (
                  <React.Fragment key={f.id}>
                    <Cell f={f} side="user" />
                    <Rail st={f.st} />
                    <Cell f={f} side="analyst" />
                  </React.Fragment>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function PanelHead({ title, sub, icon, right }) {
    return (
      <div style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 11, justifyContent: right ? 'flex-end' : 'flex-start', textAlign: right ? 'right' : 'left', borderLeft: right ? `1px solid ${T.lineSoft}` : 'none' }}>
        {!right && <span style={{ fontSize: 20, color: T.navy }}>{icon}</span>}
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{title}</div>
          <div style={{ fontSize: 11.5, color: T.sub }}>{sub}</div>
        </div>
        {right && <span style={{ fontSize: 20, color: T.navy }}>{icon}</span>}
      </div>
    );
  }

  window.VariationA = VariationA;
})();
