-- =========================================================
-- Migration: adapta push_subscriptions de Web Push para Expo Notifications
--
-- Use este arquivo SOMENTE SE você já executou o schema_contas.sql
-- original (com endpoint/p256dh/auth_key) em um projeto Supabase real.
-- Se o banco ainda não foi criado, ignore esta migration e rode
-- diretamente supabase/schema_contas.sql (já vem com o ajuste).
--
-- Isso apaga qualquer subscription de Web Push existente (não há como
-- migrar endpoint -> expo_push_token, são mecanismos diferentes) —
-- os usuários vão precisar re-registrar o device no primeiro uso do app.
-- =========================================================

drop policy if exists "push_select_own" on push_subscriptions;
drop policy if exists "push_insert_own" on push_subscriptions;
drop policy if exists "push_delete_own" on push_subscriptions;

drop table if exists push_subscriptions;

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  expo_push_token text not null,
  device_id text not null,
  platform text check (platform in ('ios', 'android')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (user_id, device_id)
);

create index idx_push_subscriptions_user_id on push_subscriptions(user_id);
create index idx_push_subscriptions_expo_push_token on push_subscriptions(expo_push_token);

alter table push_subscriptions enable row level security;

create policy "push_select_own" on push_subscriptions for select using (auth.uid() = user_id);
create policy "push_insert_own" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_update_own" on push_subscriptions for update using (auth.uid() = user_id);
create policy "push_delete_own" on push_subscriptions for delete using (auth.uid() = user_id);

drop trigger if exists trg_push_subscriptions_updated_at on push_subscriptions;
create trigger trg_push_subscriptions_updated_at
  before update on push_subscriptions
  for each row execute function set_updated_at();
