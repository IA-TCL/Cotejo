// Shared design tokens + the comparison scenario data.
// Plain global script (no Babel). Read from JSX via window.CMP.
window.CMP = (function () {
  const tok = {
    ink: '#1b2330',
    sub: '#5d6b7a',
    faint: '#94a0ae',
    line: '#e6e1d8',
    lineSoft: '#f0ece4',
    paper: '#faf8f4',
    panel: '#ffffff',
    navy: '#1f3a5f',
    navyInk: '#15293f',
    navySoft: '#eef2f7',
    match: '#1f7a52',
    matchBg: '#e9f3ed',
    diff: '#9a5b16',
    diffBg: '#fbf1dd',
    diffMark: '#f4d79f',
    reject: '#a3372e',
    rejectBg: '#f8e9e6',
    serif: "'Source Serif 4', Georgia, serif",
    sans: "'Public Sans', system-ui, sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  };

  // st: 'match' | 'diff'  (both files present; diff = mismatch)
  const groups = [
    {
      name: 'Identidad',
      fields: [
        { id: 'nombre', label: 'Nombre completo', user: 'María Fernanda Robles Díaz', analyst: 'María Fernanda Robles Díaz', st: 'match' },
        { id: 'rfc', label: 'RFC', user: 'ROBM850412QX3', analyst: 'ROBM850412QX8', st: 'diff', mono: true },
        { id: 'curp', label: 'CURP', user: 'ROBM850412MDFBRR07', analyst: 'ROBM850412MDFBRR07', st: 'match', mono: true },
        { id: 'nacimiento', label: 'Fecha de nacimiento', user: '12 abr 1985', analyst: '12 abr 1985', st: 'match' },
      ],
    },
    {
      name: 'Contacto',
      fields: [
        { id: 'domicilio', label: 'Domicilio', user: 'Av. Insurgentes Sur 1234, Del Valle, CDMX', analyst: 'Av. Insurgentes Sur 1243, Del Valle, CDMX', st: 'diff' },
        { id: 'telefono', label: 'Teléfono', user: '+52 55 4821 7790', analyst: '+52 55 4821 7790', st: 'match', mono: true },
        { id: 'correo', label: 'Correo electrónico', user: 'mf.robles@correo.com', analyst: 'mf.robles@correo.com', st: 'match' },
      ],
    },
    {
      name: 'Información financiera',
      fields: [
        { id: 'ingreso', label: 'Ingreso mensual', user: '$48,500', analyst: '$42,100', st: 'diff', mono: true },
        { id: 'antiguedad', label: 'Antigüedad laboral', user: '5 años 3 meses', analyst: '5 años 3 meses', st: 'match' },
        { id: 'fuente', label: 'Fuente de ingreso', user: 'Empleo formal', analyst: 'Empleo formal', st: 'match' },
      ],
    },
    {
      name: 'Solicitud',
      fields: [
        { id: 'monto', label: 'Monto solicitado', user: '$350,000', analyst: '$350,000', st: 'match', mono: true },
        { id: 'plazo', label: 'Plazo', user: '36 meses', analyst: '36 meses', st: 'match' },
        { id: 'clabe', label: 'CLABE interbancaria', user: '002 180 0123 4567 8901', analyst: '002 180 0123 4567 8910', st: 'diff', mono: true },
        { id: 'banco', label: 'Banco receptor', user: 'Banamex', analyst: 'Banamex', st: 'match' },
      ],
    },
  ];

  const allFields = groups.flatMap((g) => g.fields);
  const total = allFields.length;
  const diffs = allFields.filter((f) => f.st === 'diff').length;
  const matches = total - diffs;

  const meta = {
    expediente: 'EXP-2024-0815',
    tipo: 'Solicitud de crédito · Persona física',
    solicitante: 'María Fernanda Robles Díaz',
    recibido: '08 jun 2026, 14:32',
    analista: 'C. Vega',
    total, diffs, matches,
  };

  // Char-level diff: returns [{ch, changed}] aligning two strings position by
  // position (good enough for codes/numbers that stay aligned).
  function diffParts(a, b) {
    a = a || ''; b = b || '';
    const out = [];
    const n = Math.max(a.length, b.length);
    for (let i = 0; i < n; i++) {
      const ca = a[i] ?? '';
      const cb = b[i] ?? '';
      if (ca) out.push({ ch: ca, changed: ca !== cb });
    }
    return out;
  }

  return { tok, groups, allFields, meta, diffParts };
})();
