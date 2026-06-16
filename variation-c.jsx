// Variación C — Espacio de revisión (workflow)
// Left rail (navegación + progreso) · centro (resolver diferencias) · derecha (decisión).
(function () {
  const { tok: T, groups, meta, allFields } = window.CMP;
  const diffFields = allFields.filter((f) => f.st === 'diff');
  const matchFields = allFields.filter((f) => f.st === 'match');

  function Avatar({ name, size = 34 }) {
    const initials = name.split(' ').slice(0, 2).map((s) => s[0]).join('');
    return <div style={{ width: size, height: size, borderRadius: size / 2, background: T.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: size * 0.4, fontFamily: T.sans }}>{initials}</div>;
  }

  function Choice({ label, value, mono, selected, onClick, tone }) {
    return (
      <button onClick={onClick} style={{
        flex: 1, textAlign: 'left', cursor: 'pointer', padding: '11px 14px', borderRadius: 9,
        border: `1.5px solid ${selected ? tone : T.line}`,
        background: selected ? (tone === T.match ? T.matchBg : T.navySoft) : '#fff',
        transition: 'all .14s', position: 'relative',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: selected ? tone : T.faint, marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: mono ? T.mono : T.sans, fontSize: mono ? 14 : 15, color: T.ink, fontWeight: 500 }}>{value}</div>
        <div style={{ position: 'absolute', top: 10, right: 12, width: 16, height: 16, borderRadius: 8, border: `1.5px solid ${selected ? tone : T.line}`, background: selected ? tone : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M1.5 4.5l2 2 4-4.5" /></svg>}
        </div>
      </button>
    );
  }

  function DiffCard({ f, choice, onChoose }) {
    const resolved = !!choice;
    return (
      <div style={{ border: `1px solid ${resolved ? '#cfe6da' : T.diffMark}`, borderRadius: 12, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: resolved ? T.matchBg : T.diffBg, borderBottom: `1px solid ${resolved ? '#cfe6da' : T.diffMark}` }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{f.label}</span>
          {resolved
            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: T.match }}><svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round"><path d="M2.5 6.5l2.5 2.5 5.5-6" /></svg>Resuelto</span>
            : <span style={{ fontSize: 11.5, fontWeight: 600, color: T.diff }}>Requiere decisión</span>}
        </div>
        <div style={{ display: 'flex', gap: 10, padding: 14 }}>
          <Choice label="Valor del usuario" value={f.user} mono={f.mono} selected={choice === 'user'} onClick={() => onChoose('user')} tone={T.navy} />
          <Choice label="Valor del analista" value={f.analyst} mono={f.mono} selected={choice === 'analyst'} onClick={() => onChoose('analyst')} tone={T.match} />
        </div>
      </div>
    );
  }

  function VariationC() {
    const [choices, setChoices] = React.useState({});
    const resolved = diffFields.filter((f) => choices[f.id]).length;
    const pct = Math.round((resolved / diffFields.length) * 100);
    const allResolved = resolved === diffFields.length;

    return (
      <div style={{ width: '100%', height: '100%', background: T.paper, fontFamily: T.sans, color: T.ink, display: 'grid', gridTemplateColumns: '252px 1fr 304px' }}>
        {/* LEFT RAIL */}
        <aside style={{ background: '#fff', borderRight: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', padding: '20px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, paddingBottom: 16, borderBottom: `1px solid ${T.lineSoft}` }}>
            <Avatar name={meta.solicitante} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.solicitante}</div>
              <div style={{ fontFamily: T.mono, fontSize: 11.5, color: T.sub }}>{meta.expediente}</div>
            </div>
          </div>

          <div style={{ padding: '18px 0', borderBottom: `1px solid ${T.lineSoft}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.faint }}>Progreso</span>
              <span style={{ fontFamily: T.mono, fontSize: 13, color: allResolved ? T.match : T.diff, fontWeight: 600 }}>{resolved}/{diffFields.length}</span>
            </div>
            <div style={{ height: 7, borderRadius: 4, background: T.lineSoft, overflow: 'hidden' }}>
              <div style={{ width: pct + '%', height: '100%', background: allResolved ? T.match : T.diff, borderRadius: 4, transition: 'width .25s' }} />
            </div>
            <div style={{ fontSize: 11.5, color: T.sub, marginTop: 7 }}>{allResolved ? 'Todas las diferencias resueltas.' : 'Diferencias por resolver.'}</div>
          </div>

          <div style={{ paddingTop: 16, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.faint, marginBottom: 10 }}>Secciones</div>
            {groups.map((g, i) => {
              const d = g.fields.filter((f) => f.st === 'diff').length;
              return (
                <div key={g.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 11px', borderRadius: 7, marginBottom: 2, background: i === 0 ? T.navySoft : 'transparent', cursor: 'pointer' }}>
                  <span style={{ fontSize: 13, fontWeight: i === 0 ? 600 : 500, color: i === 0 ? T.navy : T.sub }}>{g.name}</span>
                  {d > 0
                    ? <span style={{ fontFamily: T.mono, fontSize: 11, fontWeight: 600, color: '#fff', background: T.diff, borderRadius: 10, padding: '1px 7px' }}>{d}</span>
                    : <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round"><path d="M2.5 6.5l2.5 2.5 5.5-6" /></svg>}
                </div>
              );
            })}
          </div>

          <div style={{ fontSize: 11.5, color: T.faint, paddingTop: 12, borderTop: `1px solid ${T.lineSoft}` }}>Analista: <b style={{ color: T.sub }}>{meta.analista}</b></div>
        </aside>

        {/* CENTER */}
        <main style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px 28px 14px' }}>
            <h1 style={{ fontFamily: T.serif, fontSize: 23, fontWeight: 600, margin: 0, letterSpacing: -0.3 }}>Revisión de diferencias</h1>
            <p style={{ fontSize: 13.5, color: T.sub, margin: '5px 0 0' }}>Para cada diferencia, elige el valor correcto entre el archivo del usuario y el del analista.</p>
          </div>
          <div style={{ padding: '0 28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {diffFields.map((f) => (
              <DiffCard key={f.id} f={f} choice={choices[f.id]} onChoose={(v) => setChoices((c) => ({ ...c, [f.id]: c[f.id] === v ? null : v }))} />
            ))}

            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke={T.match} strokeWidth="2" strokeLinecap="round"><path d="M3 7.5l3 3 6-7" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.sub }}>{matchFields.length} campos coinciden automáticamente</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 28px', border: `1px solid ${T.lineSoft}`, borderRadius: 10, padding: '10px 16px', background: '#fff' }}>
                {matchFields.map((f) => (
                  <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${T.lineSoft}` }}>
                    <span style={{ fontSize: 12.5, color: T.sub }}>{f.label}</span>
                    <span style={{ fontFamily: f.mono ? T.mono : T.sans, fontSize: 12.5, color: T.ink, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.user}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* RIGHT — DECISION */}
        <aside style={{ background: '#fff', borderLeft: `1px solid ${T.line}`, display: 'flex', flexDirection: 'column', padding: '20px 18px' }}>
          <div style={{ fontFamily: T.serif, fontSize: 17, fontWeight: 600, marginBottom: 3 }}>Decisión</div>
          <div style={{ fontSize: 12, color: T.sub, marginBottom: 16 }}>Cotejo del expediente {meta.expediente}</div>

          <div style={{ background: T.paper, border: `1px solid ${T.lineSoft}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 7 }}><span style={{ color: T.sub }}>Campos coincidentes</span><span style={{ fontFamily: T.mono, color: T.match, fontWeight: 600 }}>{meta.matches}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 7 }}><span style={{ color: T.sub }}>Diferencias resueltas</span><span style={{ fontFamily: T.mono, color: T.ink, fontWeight: 600 }}>{resolved} / {diffFields.length}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}><span style={{ color: T.sub }}>Pendientes</span><span style={{ fontFamily: T.mono, color: allResolved ? T.match : T.diff, fontWeight: 600 }}>{diffFields.length - resolved}</span></div>
          </div>

          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, marginBottom: 6, display: 'block' }}>Nota de resolución</label>
          <div style={{ border: `1px solid ${T.line}`, borderRadius: 9, padding: '10px 12px', fontSize: 13, color: T.faint, background: T.paper, minHeight: 64, marginBottom: 18 }}>Describe la decisión o el motivo del rechazo…</div>

          <button disabled={!allResolved} style={{
            fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, padding: '12px', borderRadius: 8, border: 'none', marginBottom: 10,
            cursor: allResolved ? 'pointer' : 'not-allowed',
            background: allResolved ? T.match : T.lineSoft, color: allResolved ? '#fff' : T.faint,
            boxShadow: allResolved ? '0 1px 3px rgba(31,122,82,.3)' : 'none', transition: 'all .15s',
          }}>{allResolved ? 'Aprobar cotejo' : `Resuelve ${diffFields.length - resolved} para aprobar`}</button>
          <button style={{ fontFamily: T.sans, fontSize: 14.5, fontWeight: 600, padding: '12px', borderRadius: 8, border: `1px solid ${T.line}`, background: '#fff', color: T.reject, cursor: 'pointer' }}>Rechazar expediente</button>

          <div style={{ marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.lineSoft}`, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.faint, marginBottom: 12 }}>Actividad</div>
            {[['Expediente recibido', meta.recibido], ['Cotejo iniciado', 'hace 6 min'], ['—', 'En curso']].map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: i === 2 ? T.diff : T.match, marginTop: 3 }} />
                  {i < 2 && <div style={{ width: 1, flex: 1, background: T.lineSoft, marginTop: 2 }} />}
                </div>
                <div>
                  <div style={{ fontSize: 12.5, color: T.ink, fontWeight: 500 }}>{a[0]}</div>
                  <div style={{ fontSize: 11.5, color: T.faint }}>{a[1]}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    );
  }

  window.VariationC = VariationC;
})();
