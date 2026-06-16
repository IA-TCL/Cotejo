export function filtrarExpedientes(expedientes, { busqueda, estado, soloMios, analista }) {
  let result = expedientes

  if (busqueda && busqueda.trim()) {
    const q = busqueda.trim().toLowerCase()
    result = result.filter(
      (e) =>
        e.solicitante.toLowerCase().includes(q) ||
        e.numero.toLowerCase().includes(q)
    )
  }

  if (estado) {
    result = result.filter((e) => e.estado === estado)
  }

  if (soloMios && analista) {
    result = result.filter((e) => e.analista_nombre === analista)
  }

  return result
}
