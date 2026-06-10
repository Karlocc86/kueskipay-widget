<div align="center">

# kueskiPay Widget

**Extensión de Chrome que lleva el crédito de KueskiPay al navegador, integrándose en la rutina de compras del usuario.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![ESLint](https://img.shields.io/badge/lint-passing-brightgreen?logo=eslint&logoColor=white)](#scripts)

</div>

---

## Descripción

Extensión desarrollada como proyecto universitario para el **Tecnológico de Monterrey** (TC2005 · Grupo 502). Permite a usuarios de KueskiPay consultar su crédito, simular pagos a quincenas y comparar precios **sin salir del sitio donde están comprando**.

El widget vive en el popup de la extensión y, además, inyecta un **botón flotante (FAB)** en las páginas que visitas, detectando producto y precio para ofrecer financiamiento en el momento.

## Funcionalidades

| Área                       | Detalle                                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| **Autenticación**          | Login real con Supabase Auth y persistencia de sesión                                              |
| **Dashboard**              | Tarjeta digital animada (con NIP dinámico), donut de uso de crédito y estado de cuenta por usuario |
| **Detección de tienda**    | Identifica si el comercio activo es compatible con KueskiPay                                       |
| **Calculadora de carrito** | Simulación de pagos quincenales con recomendación según score crediticio                           |
| **Notificaciones**         | Panel de avisos agrupados (Hoy / Esta semana) con badge de no leídos                               |
| **Cupones**                | Panel con cupones de marca y código copiable                                                       |
| **Calendario de pagos**    | Próximo pago, calendario mensual y desglose por día                                                |
| **Comparador de precios**  | Busca un producto y lo muestra en varias tiendas ordenado por precio                               |
| **Score crediticio**       | Gauge del historial con tip personalizado e historial de compras                                   |
| **Doble marca**            | Conmutador Kueski ↔ KueskiPay con theming dinámico                                                 |

## 🛠️ Stack tecnológico

- **Frontend:** React 19 + Vite 8
- **Base de datos / Auth:** Supabase (PostgreSQL + Supabase Auth)
- **Extensión:** Chrome Manifest V3 (popup + service worker + content scripts)
- **Estilos:** CSS puro con custom properties (theming por marca)

## Puesta en marcha

### Requisitos

- Node.js 18+
- Un proyecto de Supabase con las tablas descritas más abajo

### Desarrollo

```bash
git clone https://github.com/Karlocc86/kueskipay-widget.git
cd kueskipay-widget
npm install
cp .env.example .env          # y rellena tus credenciales
npm run dev
```

### Variables de entorno

Crea un `.env` en la raíz (no se versiona — ver `.env.example`):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

> ℹLa `anon key` se incrusta en el bundle del cliente: es **pública por diseño**. La seguridad real depende de RLS (ver [Seguridad](#-seguridad)).

### Cargar como extensión de Chrome

```bash
npm run build
```

1. Abre `chrome://extensions`
2. Activa **Modo desarrollador**
3. Clic en **Cargar sin empaquetar**
4. Selecciona la carpeta **`dist/`**

## 📁 Estructura del proyecto

```
kueskipay-widget/
├── public/                     # Copiado tal cual al build
│   ├── manifest.json           # Manifest MV3
│   ├── background.js           # Service worker (mensajería)
│   ├── content_script.js       # Detección de producto/precio en la página
│   ├── fab.js                  # Botón flotante inyectado en cada sitio
│   └── *.png / *.svg           # Iconos y logos
├── src/
│   ├── main.jsx                # Entry point de React
│   ├── App.jsx                 # Gate de auth (Login ↔ Dashboard)
│   ├── supabaseClient.jsx      # Cliente Supabase
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx       # Orquestación: header, nav, estado, paneles
│   │   ├── icons.jsx           # Iconos SVG compartidos
│   │   ├── panels/             # Overlays: Notifications · Coupons · Payments · Settings
│   │   └── tabs/               # Inicio · Calculadora · Buscar · Historial
│   └── data/                   # Datos demo (coupons, notifications, logos)
├── supabase/migrations/        # SQL (RLS y esquema)
├── vite.config.js
└── package.json
```

> El `Dashboard` está modularizado: cada panel y cada tab vive en su propio archivo, y los iconos/datos compartidos se importan desde `icons.jsx` y `data/`.

## 🗄️ Base de datos

| Tabla                  | Descripción                                  |
| ---------------------- | -------------------------------------------- |
| `usuarios`             | Datos del usuario, crédito y score           |
| `tiendas_afiliadas`    | Comercios donde aplica KueskiPay             |
| `productos`            | Catálogo de productos con precios por tienda |
| `historial_compras`    | Registro de compras financiadas              |
| `historial_crediticio` | Score y estadísticas de pagos                |

## 🔒 Seguridad

> [!IMPORTANT]
> Habilita **Row Level Security (RLS)** en todas las tablas. Sin RLS, cualquiera con la `anon key` (que es pública) puede leer/escribir todos los datos.

Aplica la migración incluida en Supabase → **SQL Editor**:

```
supabase/migrations/20260603000000_enable_rls.sql
```

Política aplicada: en tablas sensibles (`usuarios`, `historial_*`) cada usuario solo ve lo suyo; `tiendas_afiliadas` y `productos` quedan en lectura pública (las consulta el buscador y el content script sin sesión).

## 🧑Usuarios de prueba

| Email            | Contraseña | Score | Perfil              |
| ---------------- | ---------- | ----- | ------------------- |
| karlo@gmail.com  | Cisco.86   | 850   | Historial excelente |
| carlos@gmail.com | cisco      | 780   | Historial muy bueno |
| laura@gmail.com  | cisco      | 720   | Historial bueno     |
| ana@gmail.com    | cisco      | 580   | Historial regular   |
| camila@gmail.com | cisco      | 420   | Historial malo      |

## 📜 Scripts

| Comando           | Acción                        |
| ----------------- | ----------------------------- |
| `npm run dev`     | Servidor de desarrollo (Vite) |
| `npm run build`   | Build de producción → `dist/` |
| `npm run preview` | Sirve el build de producción  |
| `npm run lint`    | Linter (ESLint)               |

## 📄 Licencia

Proyecto académico — Tecnológico de Monterrey (TC2005, Grupo 502). Uso educativo.
