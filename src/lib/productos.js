// Pure helpers for the price comparator (TabBuscar).

/**
 * Agrupa los productos por nombre y ordena cada grupo por precio ascendente,
 * de modo que el primer elemento de cada grupo es el de mejor precio.
 * @returns {Record<string, Array>} mapa nombre → filas ordenadas
 */
export function agruparProductosPorNombre(resultados = []) {
  const grupos = {}
  resultados.forEach((p) => {
    if (!grupos[p.nombre]) grupos[p.nombre] = []
    grupos[p.nombre].push(p)
  })
  Object.values(grupos).forEach((arr) => arr.sort((a, b) => a.precio - b.precio))
  return grupos
}
