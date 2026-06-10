# ✅ RECOMENDACIONES — Checklist del proyecto

Estado de mejoras, en orden de impacto. Marca `[x]` al completar.
Última actualización: **2026-06-03**.

Leyenda: ✅ hecho · ⏳ pendiente · ℹ️ informativo

---

## 🔴 Seguridad

- [ ] **Aplicar RLS** (⏳ **lo más urgente**) — correr `supabase/migrations/20260603000000_enable_rls.sql` en Supabase → SQL Editor.
  - Verificar antes que `id_usuario` en `historial_*` sea el UUID de auth (`auth.uid()`).
  - Re-testear: `usuarios`/`historial_*` deben dar `*/0` sin sesión; `tiendas_afiliadas`/`productos` seguir públicas.
- [x] ✅ Sacar `.env` del tracking + `.gitignore` + `.env.example`.
- [x] ✅ Acotar `host_permissions` del manifest a solo Supabase.
- [ ] (Opcional) Rotar la anon key en Supabase. ℹ️ Es pública por diseño; con RLS bien puesto no es crítico.

## 🟠 Robustez

- [ ] **Estados de error/loading** en los fetches de Supabase (hoy fallan en silencio).
- [ ] **Error Boundary** raíz para que un crash en un panel no deje el popup en blanco.
- [ ] Decidir sobre **`isCompatible={true}` hardcodeado**: re-conectar la detección `tiendaCompatible` a la UI, o eliminar la detección muerta.
- [ ] Marcar/aislar los **datos demo** (notificaciones, cupones, calendario) como "demo" o conectarlos a backend.

## 🟡 Mantenibilidad

- [x] ✅ Modularizar `Dashboard.jsx` (1750 → 213 líneas) en `icons/`, `panels/`, `tabs/`, `data/`.
- [x] ✅ ESLint en verde (de 45 errores a 0).
- [ ] **Partir `Dashboard.css`** (~3500 líneas) por componente o CSS Modules, junto a los nuevos archivos.
- [ ] Añadir **tipos** (PropTypes en paneles/tabs, o migración gradual a TypeScript).

## 🟢 Testing / CI

- [ ] Montar **Vitest + React Testing Library**.
- [ ] Tests de lógica pura primero: `getRecomendacion` (calculadora) y `buildPaymentSchedule`.
- [ ] **GitHub Action** que corra `npm run lint` + `npm run build` en cada PR.

## ♿ Accesibilidad / UX

- [ ] Paneles overlay: añadir `role="dialog"`, `aria-modal` y focus-trap (ya cierran con Esc + click-fuera ✅).
- [ ] Cambiar `<li role="button" onClick>` (Settings) por `<button>` real (soporte de teclado).

## 📦 Menor

- [ ] Bundle `main.js` ~463 KB (126 KB gzip): margen para code-splitting si se quiere optimizar.
- [x] ✅ README profesional con estructura, seguridad y scripts.
- [ ] (Opcional) Agregar **screenshots** del widget en `docs/` y una sección "Vista previa" en el README.
- [x] ✅ Bug del manifest: `icon18.png` → `icon16.png` en `web_accessible_resources`.

---

### Sugerencia de orden
1. Aplicar RLS (bloqueante de seguridad real).
2. Error/loading + Error Boundary (robustez visible).
3. Vitest con 2–3 tests de lógica (red de seguridad barata).
