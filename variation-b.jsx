// Variación B — Libro de conciliación (tabla densa)
// One unified ledger table with working filter chips. Technical / data-tool feel.
(function () {
  const { tok: T, groups, meta, diffParts } = window.CMP;

  function InlineDiff({ a, b, mono }) {
    const parts = diffParts(a, b);
    return (
      <span style={{ fontFamily: mono ? T.mono : T.sans, fontSize: mono ? 13.5 : 14, color: T.ink }}>
        {parts.map((p, i) => (
          <span key={i} style={p.changed ? { background: T.diffMark, color: '#5e3a08', borderRadius: 2 } : null}>{p.ch}</span>
        ))}
      </span>
    );
  }

  function Val({ v, mono, dim }) {
    return <span style={{ fontFamily: mono ? T.mono : T.sans, fontSize: mono ? 13.5 : 14, color: dim ? T.sub : T.ink }}>{v}</span>;
  }

  function StatePill({ st }) {
    const diff = st === 'diff';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600,
        padding: '3px 10px 3px 8px', borderRadius: 20,
        color: diff ? T.diff : T.match, background: diff ? T.diffBg : T.matchBg,
        border: `1px solid ${diff ? T.diffMark : '#cfe6da'}`,
      }}>
        <i style={{ width: 6, height: 6, borderRadius: 3, background: diff ? T.diff : T.match }} />
        {diff ? 'Difiere' : 'Coincide'}
      </span>
    );
  }

  function Chip({ active, children, onClick, count, tone }) {
    return (
      <button onClick={onClick} style={{
        fontFamily: T.sans, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        padding: '7px 13px', borderRadius: 7, display: 'inline-flex', alignItems: 'center', gap: 7,
        border: `1px solid ${active ? T.navy : T.line}`,
        background: active ? T.navy : '#fff', color: active ? '#fff' : T.sub, transition: 'all .14s',
      }}>
        {children}
        {count != null && <span style={{ fontFamily: T.mono, fontSize: 12, padding: '0 6px', borderRadius: 10, background: active ? 'rgba(255,255,255,.2)' : T.lineSoft, color: active ? '#fff' : (tone || T.sub) }}>{count}</span>}
      </button>
    );
  }

  function Btn({ children, kind }) {
    const [h, setH] = React.useState(false);
    const base = { fontFamily: T.sans, fontSize: 14, fontWeight: 600, padding: '10px 22px', borderRadius: 7, cursor: 'pointer', transition: 'all .15s' };
    const s = kind === 'primary'
      ? { ...base, border: 'none', background: h ? T.navyInk : T.navy, color: '#fff', boxShadow: '0 1px 2px rgba(20,40,60,.25)' }
      : { ...base, border: `1px solid ${h ? T.reject : T.line}`, background: h ? T.rejectBg : '#fff', color: T.reject };
    return <button style={s} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>{children}</button>;
  }

  function VariationB() {
    const [filter, setFilter] = React.useState('all'); // all | diff | match

    return (
      <div style={{ width: '100%', height: '100%', background: T.paper, fontFamily: T.sans, color: T.ink, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 26px', background: '#fff', borderBottom: `1px solid ${T.line}` }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}>
              <span style={{ fontFamily: T.serif, fontSize: 20, fontWeight: 600 }}>Libro de conciliación</span>
              <span style={{ fontFamily: T.mono, fontSize: 13, color: T.sub }}>{meta.expediente}</span>
            </div>
            <div style={{ fontSize: 12.5, color: T.sub, marginTop: 2 }}>{meta.solicitante} · {meta.tipo}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ display: 'flex', gap: 22 }}>
              <Stat n={meta.total} label="Campos" />
              <Stat n={meta.matches} label="Coinciden" tone={T.match} />
              <Stat n={meta.diffs} label="Difieren" tone={T.diff} />
            </div>
          </div>
        </header>

        {/* Toolbar: filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 26px', background: '#fff', borderBottom: `1px solid ${T.line}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: T.faint, marginRight: 4 }}>Mostrar</span>
          <Chip active={filter === 'all'} onClick={() => setFilter('all')} count={meta.total}>Todos</Chip>
          <Chip active={filter === 'diff'} onClick={() => setFilter('diff')} count={meta.diffs} tone={T.diff}>Solo diferencias</Chip>
          <Chip active={filter === 'match'} onClick={() => setFilter('match')} count={meta.matches} tone={T.match}>Conciliados</Chip>
        </div>

        {/* Column header */}
        <div style={{ display: 'grid', gridTemplateColumns: '256px 1fr 1fr 132px', padding: '9px 26px', background: T.navySoft, borderBottom: `1px solid ${T.line}`, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.navy }}>
          <span>Campo</span>
          <span>Valor del usuario</span>
          <span>Valor del analista</span>
          <span style={{ textAlign: 'right' }}>Estado</span>
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
          {groups.map((g) => {
            const rows = g.fields.filter((f) => filter === 'all' || f.st === filter);
            if (!rows.length) return null;
            return (
              <div key={g.name}>
                <div style={{ padding: '6px 26px', background: T.paper, borderBottom: `1px solid ${T.lineSoft}` }}>
                  <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 1.1, textTransform: 'uppercase', color: T.sub }}>{g.name}</span>
                </div>
                {rows.map((f) => {
                  const diff = f.st === 'diff';
                  return (
                    <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '256px 1fr 1fr 132px', alignItems: 'center', padding: '10px 26px', borderBottom: `1px solid ${T.lineSoft}`, background: diff ? 'rgba(251,241,221,.4)' : '#fff' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 500, color: T.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {diff && <i style={{ width: 4, height: 26, borderRadius: 2, background: T.diff, marginLeft: -6 }} />}
                        {f.label}
                      </span>
                      <span>{diff ? <InlineDiff a={f.user} b={f.analyst} mono={f.mono} /> : <Val v={f.user} mono={f.mono} dim />}</span>
                      <span>{diff ? <InlineDiff a={f.analyst} b={f.user} mono={f.mono} /> : <Val v={f.analyst} mono={f.mono} dim />}</span>
                      <span style={{ textAlign: 'right' }}><StatePill st={f.st} /></span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer action bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px', background: '#fff', borderTop: `1px solid ${T.line}` }}>
          <span style={{ fontSize: 13, color: T.sub }}>Resuelve las <b style={{ color: T.diff }}>{meta.diffs} diferencias</b> antes de aprobar, o registra el rechazo con motivo.</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <Btn kind="ghost">Rechazar</Btn>
            <Btn kind="primary">Aprobar cotejo</Btn>
          </div>
        </div>
      </div>
    );
  }

  function Stat({ n, label, tone }) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: T.mono, fontSize: 20, fontWeight: 600, color: tone || T.ink, lineHeight: 1 }}>{n}</div>
        <div style={{ fontSize: 10.5, letterSpacing: 0.5, textTransform: 'uppercase', color: T.faint, marginTop: 3 }}>{label}</div>
      </div>
    );
  }

  window.VariationB = VariationB;
})();
