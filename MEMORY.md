# 🧠 MEMORY — Contexto del proyecto

Notas para no perder el hilo entre sesiones. Lo que **no** se deduce solo leyendo el código.
Última actualización: **2026-06-03**.

---

## Qué es

Extensión de Chrome (Manifest V3) **KueskiPay Widget** — proyecto universitario TEC (TC2005, Grupo 502).
Stack: **React 19 + Vite 8 + Supabase**. UI en español. Ver [README](README.md).

## Arquitectura (post-refactor)

`Dashboard.jsx` pasó de **~1750 → ~213 líneas**; ahora solo orquesta. Todo modularizado:

- `components/icons.jsx` — 38 iconos SVG (named exports).
- `components/panels/` — overlays: `NotificationsPanel`, `CouponsPanel`, `PaymentsCalendar`, `SettingsPanel`.
- `components/tabs/` — `TabInicio` (incluye CreditCard, DonutChart, NIP, CardActions), `TabCalculadora`, `TabBuscar`, `TabHistorial`.
- `data/` — datos demo: `logos.js` (PAY_LOGO, compartido), `coupons.js`, `notifications.js`.

Regla aplicada: solo se movió a `data/` lo que cruza módulos; el resto se co-localiza con su panel/tab.

## Decisiones y convenciones

- **ESLint en verde** (`npm run lint` pasa). Config: globals `webextensions` (para `chrome`), `no-empty: allowEmptyCatch`. Los `catch {}` van sin binding.
- 2 `set-state-in-effect` legítimos (animación del donut + limpiar buscador) quedan con `eslint-disable-next-line` documentado.
- Imports ES (`useState`, `supabase`), **no** los alias `useStateD`/`supabaseD` de archivos de referencia viejos.
- Logo del header: `kueskilogo.png`. Componente placeholder de Kueski: `TabInicioKueski`.
- Validar siempre con `npm run lint` + `npm run build` (build ~150ms) tras cada cambio grande.

## ⚠️ NO TOCAR (sin pedir antes)

- `public/fab.js`, `public/content_script.js`, `public/background.js` (content scripts / service worker).
- Lógica de Supabase / autenticación (`App.jsx`, `supabaseClient.jsx`).
- El swap de marca kueski ↔ kueskipay.

## Gotchas / deuda conocida

- **`isCompatible={true}` hardcodeado** en el tab Kueski: ignora la detección `tiendaCompatible` (que sí funciona vía `chrome.tabs.query`). La detección se conservó con nota; decidir si re-conectar o eliminar.
- **Datos demo hardcodeados**: notificaciones, cupones y calendario de pagos son mock (en `data/` y dentro de `PaymentsCalendar`). No están conectados a backend.
- **Content scripts en todas las URLs**: es **por diseño** (FAB "siempre disponible"). Acotarlo sería cambio de producto, no bug.
- `mockData.js` (`userData`, `tiendasAfiliadas`) está **sin usar** (la app usa Supabase).

## 🔒 Seguridad (importante)

- **RLS estaba APAGADO** en todas las tablas (prueba 2026-06-03 con solo la anon key devolvió filas de `usuarios`, `historial_*`, etc.). Migración lista en `supabase/migrations/20260603000000_enable_rls.sql` — **PENDIENTE de aplicar** en Supabase SQL Editor + re-testear.
- La **anon key es pública por diseño** (viaja en `dist/assets/main.js`). Esconderla no protege; RLS sí.
- `.env` ya está fuera del tracking (`git rm --cached`) + en `.gitignore`. Existe `.env.example`.
- La anon key quedó en el historial de git, pero por lo anterior no es crítico (rotarla es opcional).

## Git

- Rama de trabajo: `feat/buscador`. Base: `main`.
- Hay trabajo mezclado sin commitear: feature (notif/cupones) + seguridad/lint + refactor.
- Commits sugeridos si se separan:
  - `feat: panel de notificaciones y cupones, reorden de header`
  - `chore: seguridad y limpieza — untrack .env, acotar permisos del manifest, ESLint en verde`
  - `refactor: modularizar Dashboard en icons/panels/tabs/data (1750→213 líneas)`

## 📌 Pendientes

Ver **[RECOMENDACIONES.md](RECOMENDACIONES.md)** para el checklist priorizado.
