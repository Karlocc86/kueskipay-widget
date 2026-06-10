// Pure formatting/text helpers shared across the UI.

/**
 * Iniciales para el avatar de una tienda.
 * Una palabra → primeras 2 letras; varias → inicial de las dos primeras.
 */
export function getIniciales(nombre = '') {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return ''
  if (palabras.length === 1) return palabras[0].slice(0, 2).toUpperCase()
  return (palabras[0][0] + palabras[1][0]).toUpperCase()
}
