import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '../../supabaseClient'
import { IconSearch } from '../icons'
import { agruparProductosPorNombre } from '../../lib/productos'
import { getIniciales } from '../../lib/format'

export default function TabBuscar({ tiendas, busquedaInicial = '' }) {
  const [busqueda, setBusqueda] = useState(busquedaInicial)
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const topRef = useRef(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  useEffect(() => {
    if (!busqueda.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- limpiar resultados al vaciar la búsqueda
      setResultados([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscando(true)
      const { data } = await supabase
        .from('productos')
        .select('*, tiendas_afiliadas(nombre, logo, url)')
        .ilike('nombre', `%${busqueda}%`)
      setResultados(data ?? [])
      setBuscando(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const productosAgrupados = useMemo(() => agruparProductosPorNombre(resultados), [resultados])

  const hayBusqueda = busqueda.trim().length > 0

  return (
    <div className="buscar">
      <div ref={topRef} />
      <div className="buscar__input-wrapper">
        <span className="buscar__icon"><IconSearch /></span>
        <input
          type="text"
          className="buscar__input"
          placeholder="Busca productos o tiendas..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {!hayBusqueda ? (
        <>
          <h3 className="buscar__seccion-titulo">Tiendas afiliadas</h3>
          <div className="buscar__tiendas-grid">
            {tiendas.map((tienda) => (
              <div key={tienda.id_tienda} className="tienda-card">
                <div className="tienda-card__logo-wrapper">
                  {tienda.logo ? (
                    <img
                      src={tienda.logo}
                      alt={tienda.nombre}
                      className="tienda-card__logo"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="tienda-card__iniciales" style={{ display: tienda.logo ? 'none' : 'flex' }}>
                    {getIniciales(tienda.nombre)}
                  </div>
                </div>
                <span className="tienda-card__nombre">{tienda.nombre}</span>
                <a href={`https://${tienda.url}`} target="_blank" rel="noreferrer" className="tienda-card__link">
                  Ver tienda →
                </a>
              </div>
            ))}
          </div>
        </>
      ) : buscando ? (
        <p className="buscar__loading">Buscando...</p>
      ) : Object.keys(productosAgrupados).length > 0 ? (
        <div className="buscar__resultados">
          {Object.entries(productosAgrupados).map(([nombre, filas]) => (
            <div key={nombre} className="comparador-card">
              <span className="comparador-card__titulo">{nombre}</span>
              <div className="comparador-card__lista">
                {filas.map((producto, i) => {
                  const esMejor = i === 0
                  const tienda = producto.tiendas_afiliadas
                  return (
                    <div
                      key={producto.id_producto}
                      className={`comparador-fila ${esMejor ? 'comparador-fila--mejor' : ''}`}
                      onClick={() => {
                        const url = producto.url_producto || (tienda?.url ? `https://${tienda.url}` : null)
                        if (url) window.open(url, '_blank')
                      }}
                    >
                      <div className="comparador-fila__left">
                        <div className="comparador-fila__logo-wrap">
                          {tienda?.logo ? (
                            <img
                              src={tienda.logo}
                              alt={tienda.nombre}
                              className="comparador-fila__logo"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className="comparador-fila__iniciales" style={{ display: tienda?.logo ? 'none' : 'flex' }}>
                            {getIniciales(tienda?.nombre)}
                          </div>
                        </div>
                        <div className="comparador-fila__info">
                          <span className="comparador-fila__nombre">{tienda?.nombre ?? 'Tienda'}</span>
                          {esMejor && <span className="comparador-fila__badge">Mejor precio ✅</span>}
                        </div>
                      </div>
                      <div className="comparador-fila__right">
                        <span className="comparador-fila__precio">
                          ${(producto.precio ?? 0).toLocaleString('es-MX')}
                        </span>
                        <span className="comparador-fila__arrow">→</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="buscar__empty-wrap">
          <span className="buscar__empty-icon">🔍</span>
          <p className="buscar__empty">No se encontraron productos para tu búsqueda</p>
        </div>
      )}
    </div>
  )
}
