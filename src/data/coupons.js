// Demo coupons — estilo "como lo haría otra marca". Logos vía PAY_LOGO (data/logos).
// `descuento` permite simularlos en la calculadora: pct = % sobre el monto,
// fijo = cantidad fija (con compra mínima opcional). Sin `descuento` no aplican al total.
export const COUPONS = [
  { id: 'c1', marca: 'Amazon',        color: '#FF9900', desc: '10% de descuento', terms: 'En electrónicos seleccionados', codigo: 'KUESKI10',   vence: '30 jun', nuevo: true,  descuento: { tipo: 'pct', valor: 10 } },
  { id: 'c2', marca: 'Mercado Libre', color: '#FFE600', dark: true, desc: '$200 de descuento', terms: 'En compras mayores a $1,500', codigo: 'MELIKP200', vence: '15 jul', nuevo: true,  descuento: { tipo: 'fijo', valor: 200, minimo: 1500 } },
  { id: 'c3', marca: 'Liverpool',     color: '#E6007E', desc: 'Envío gratis',     terms: 'Sin monto mínimo de compra',    codigo: 'ENVIOKP',    vence: '28 jun', nuevo: false },
  { id: 'c4', marca: 'Walmart',       color: '#0071CE', desc: '2x1',              terms: 'En productos seleccionados',     codigo: 'WALMART2X1', vence: '10 jul', nuevo: false },
]
