// Demo coupons — estilo "como lo haría otra marca". Logos vía PAY_LOGO (data/logos).
export const COUPONS = [
  { id: 'c1', marca: 'Amazon',        color: '#FF9900', desc: '10% de descuento', terms: 'En electrónicos seleccionados', codigo: 'KUESKI10',   vence: '30 jun', nuevo: true },
  { id: 'c2', marca: 'Mercado Libre', color: '#FFE600', dark: true, desc: '$200 de descuento', terms: 'En compras mayores a $1,500', codigo: 'MELIKP200', vence: '15 jul', nuevo: true },
  { id: 'c3', marca: 'Liverpool',     color: '#E6007E', desc: 'Envío gratis',     terms: 'Sin monto mínimo de compra',    codigo: 'ENVIOKP',    vence: '28 jun', nuevo: false },
  { id: 'c4', marca: 'Walmart',       color: '#0071CE', desc: '2x1',              terms: 'En productos seleccionados',     codigo: 'WALMART2X1', vence: '10 jul', nuevo: false },
]
