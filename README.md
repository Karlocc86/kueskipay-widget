# KueskiPay Widget — Extensión de Chrome

Widget de Chrome para KueskiPay que lleva el servicio de crédito al navegador del usuario, integrándose en su rutina de compras diaria.

## Descripción

Extensión desarrollada como proyecto universitario para el Tecnológico de Monterrey (TC2005, Grupo 502). Permite a usuarios de KueskiPay consultar su crédito, simular pagos y comparar precios sin salir del sitio donde están comprando.

## Funcionalidades

- **Login con Supabase** — Autenticación real con persistencia de sesión
- **Dashboard dinámico** — Tarjeta digital, círculo de crédito y estado de cuenta según usuario
- **Detección de tienda** — Badge dinámico que indica si el comercio activo es compatible con KueskiPay
- **Calculadora de carrito** — Simulación de pagos quincenales con recomendación inteligente según score crediticio
- **Recordatorio de pagos** — Toggle para activar alertas con anticipación configurable
- **Comparador de precios** — Buscador que muestra el mismo producto en múltiples tiendas ordenado por precio
- **Tiendas afiliadas** — Grid con las 15 tiendas donde puedes usar KueskiPay
- **Score crediticio** — Visualización del historial crediticio con tip personalizado
- **Historial de compras** — Registro de compras financiadas con logo de tienda
- **Menú de configuración** — Datos del usuario y cierre de sesión

## Stack tecnológico

- **Frontend:** React + Vite
- **Base de datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Extensión:** Chrome Manifest V3
- **Estilos:** CSS puro con variables

## Instalación en desarrollo

```bash
git clone https://github.com/Karlocc86/kueskipay-widget.git
cd kueskipay-widget
npm install
cp .env.example .env.local
npm run dev
```

## Variables de entorno

Crea un archivo `.env.local` en la raíz con:
VITE_SUPABASE_URL=tu_project_url
VITE_SUPABASE_ANON_KEY=tu_anon_key

## Instalación como extensión de Chrome

```bash
npm run build
```

1. Ir a `chrome://extensions`
2. Activar **Modo desarrollador**
3. Clic en **Cargar sin empaquetar**
4. Seleccionar la carpeta `dist/`

## Base de datos

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Datos del usuario, crédito y score |
| `tiendas_afiliadas` | Comercios donde aplica KueskiPay |
| `productos` | Catálogo de productos con precios por tienda |
| `historial_compras` | Registro de compras financiadas |
| `historial_crediticio` | Score y estadísticas de pagos |

## Usuarios de prueba

| Email | Contraseña | Score | Perfil |
|-------|-----------|-------|--------|
| karlo@gmail.com | cisco | 850 | Historial excelente |
| camila@gmail.com | cisco | 420 | Historial malo |
| laura@gmail.com | cisco | 720 | Historial bueno |
| carlos@gmail.com | cisco | 780 | Historial muy bueno |
| ana@gmail.com | cisco | 580 | Historial regular |
