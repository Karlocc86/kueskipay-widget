-- ============================================================================
-- Habilitar Row Level Security (RLS) en todas las tablas.
--
-- Contexto: la anon key viaja en el bundle del cliente (es pública por diseño).
-- Sin RLS, cualquiera con esa key puede leer/escribir TODAS las filas.
-- La defensa real es RLS + políticas por usuario.
--
-- ⚠️ Verifica que `id_usuario` en historial_* sea el UUID de auth (auth.uid()).
--    El código hace auth.getUser() -> .eq('id_usuario', user.id), así que debería
--    coincidir. Si usuarios.id es un id propio distinto, ajusta las políticas.
-- ============================================================================

-- 1) Tablas sensibles: cada usuario solo ve lo suyo (sin INSERT/UPDATE/DELETE)
alter table public.usuarios enable row level security;
create policy "own_user" on public.usuarios
  for select using ((auth.jwt() ->> 'email') = correo);

alter table public.historial_crediticio enable row level security;
create policy "own_credit" on public.historial_crediticio
  for select using (auth.uid() = id_usuario);

alter table public.historial_compras enable row level security;
create policy "own_purchases" on public.historial_compras
  for select using (auth.uid() = id_usuario);

-- 2) Catálogo: lectura pública (el content script y el buscador lo consultan sin sesión)
alter table public.tiendas_afiliadas enable row level security;
create policy "public_read_tiendas" on public.tiendas_afiliadas
  for select using (true);

alter table public.productos enable row level security;
create policy "public_read_productos" on public.productos
  for select using (true);
