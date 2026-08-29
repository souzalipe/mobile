-- =========================================================
-- Schema: App de Controle de Contas a Pagar ("Contas em Dia")
-- Banco: Supabase (Postgres)
--
-- NOTA (ajuste feito para Expo Notifications):
-- A seção 5 (push_subscriptions) foi adaptada do schema original.
-- O schema original guardava credenciais de Web Push (endpoint,
-- p256dh, auth_key). Como o app usa Expo Notifications (push nativo
-- via APNs/FCM através do serviço de push da Expo), só precisamos
-- guardar o Expo Push Token por dispositivo. Ver comentário na seção 5.
-- =========================================================

-- Extensão necessária para gen_random_uuid()
create extension if not exists "pgcrypto";

-- =========================================================
-- 1. Tabela de categorias (pré-definidas + customizadas)
-- =========================================================
create table if not exists categorias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- null = categoria padrão do sistema
  nome text not null,
  cor text default '#6b7280', -- hex color para UI
  icone text default 'ti-receipt', -- classe do ícone (Tabler icons)
  created_at timestamptz default now()
);

-- Categorias padrão do sistema (user_id null = visível para todos)
insert into categorias (user_id, nome, cor, icone) values
  (null, 'Água', '#378add', 'ti-droplet'),
  (null, 'Luz', '#ef9f27', 'ti-bolt'),
  (null, 'Internet', '#534ab7', 'ti-wifi'),
  (null, 'Streaming', '#d4537e', 'ti-device-tv'),
  (null, 'Saúde', '#e24b4a', 'ti-heartbeat'),
  (null, 'Transporte', '#639922', 'ti-car'),
  (null, 'Educação', '#1d9e75', 'ti-school'),
  (null, 'Outros', '#888780', 'ti-file-invoice')
on conflict do nothing;

-- =========================================================
-- 2. Tabela principal de contas
-- =========================================================
create table if not exists contas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria_id uuid references categorias(id) on delete set null,

  nome text not null,                          -- "Conta de Luz - Light"
  descricao text,                              -- observações opcionais

  valor_estimado numeric(10,2),                -- estimativa (contas variáveis)
  valor_real numeric(10,2),                    -- valor efetivamente pago no mês

  recorrente boolean default true,
  frequencia text default 'mensal'
    check (frequencia in ('mensal', 'bimestral', 'trimestral', 'semestral', 'anual', 'unica')),

  dia_vencimento int check (dia_vencimento between 1 and 31), -- para contas recorrentes
  data_vencimento date,                                        -- para contas não recorrentes ou próxima ocorrência

  dias_antecedencia int default 3,             -- override por conta (null = usa preferência global)

  status text default 'pendente'
    check (status in ('pendente', 'pago', 'atrasado', 'cancelado')),

  ativo boolean default true,                  -- permite "pausar" sem deletar

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_contas_user_id on contas(user_id);
create index if not exists idx_contas_data_vencimento on contas(data_vencimento);
create index if not exists idx_contas_status on contas(status);
create index if not exists idx_contas_ativo on contas(ativo);

-- =========================================================
-- 3. Histórico de pagamentos (1 registro por ocorrência paga)
-- =========================================================
create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  valor_pago numeric(10,2) not null,
  data_pagamento date not null default current_date,
  data_vencimento_referencia date, -- qual vencimento este pagamento quita

  created_at timestamptz default now()
);

create index if not exists idx_pagamentos_conta_id on pagamentos(conta_id);
create index if not exists idx_pagamentos_user_id on pagamentos(user_id);

-- =========================================================
-- 4. Preferências do usuário (config global de notificação)
-- =========================================================
create table if not exists preferencias_usuario (
  user_id uuid primary key references auth.users(id) on delete cascade,

  dias_antecedencia_padrao int default 3,
  canal_notificacao text default 'push'
    check (canal_notificacao in ('push', 'email', 'ambos')),
  horario_envio time default '09:00:00',       -- horário preferido para receber avisos
  notificar_dia_vencimento boolean default true,
  notificar_atraso boolean default true,

  updated_at timestamptz default now()
);

-- =========================================================
-- 5. Tokens de push nativo (Expo Notifications)
--
-- Ajustado do schema original: em vez de credenciais de Web Push
-- (endpoint/p256dh/auth_key), guardamos o Expo Push Token, que é o
-- identificador usado pela Expo Push API (https://exp.host/--/api/v2/push/send)
-- para rotear a notificação até o device certo via APNs (iOS) ou FCM (Android).
--
-- device_id identifica o aparelho (ex: Application.androidId no Android,
-- ou um UUID gerado e persistido localmente no iOS via expo-application /
-- expo-secure-store) para permitir múltiplos devices por usuário e
-- atualizar o token quando ele mudar, sem duplicar linhas.
-- =========================================================
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  expo_push_token text not null,
  device_id text not null,
  platform text check (platform in ('ios', 'android')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique (user_id, device_id)
);

create index if not exists idx_push_subscriptions_user_id on push_subscriptions(user_id);
create index if not exists idx_push_subscriptions_expo_push_token on push_subscriptions(expo_push_token);

-- =========================================================
-- 6. Log de notificações enviadas (evita duplicar aviso)
-- =========================================================
create table if not exists notificacoes_enviadas (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references contas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  tipo text not null
    check (tipo in ('aviso_previo', 'vencimento_hoje', 'atrasado')),
  data_envio date not null default current_date,
  canal text not null check (canal in ('push', 'email')),

  created_at timestamptz default now(),

  -- evita reenviar a mesma notificação no mesmo dia
  unique (conta_id, tipo, data_envio)
);

create index if not exists idx_notificacoes_conta_id on notificacoes_enviadas(conta_id);

-- =========================================================
-- 7. Trigger para updated_at automático
-- =========================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_contas_updated_at on contas;
create trigger trg_contas_updated_at
  before update on contas
  for each row execute function set_updated_at();

drop trigger if exists trg_preferencias_updated_at on preferencias_usuario;
create trigger trg_preferencias_updated_at
  before update on preferencias_usuario
  for each row execute function set_updated_at();

drop trigger if exists trg_push_subscriptions_updated_at on push_subscriptions;
create trigger trg_push_subscriptions_updated_at
  before update on push_subscriptions
  for each row execute function set_updated_at();

-- =========================================================
-- 8. Row Level Security (RLS)
-- =========================================================
alter table contas enable row level security;
alter table pagamentos enable row level security;
alter table preferencias_usuario enable row level security;
alter table push_subscriptions enable row level security;
alter table notificacoes_enviadas enable row level security;
alter table categorias enable row level security;

-- Contas: usuário só vê/edita as próprias
create policy "contas_select_own" on contas for select using (auth.uid() = user_id);
create policy "contas_insert_own" on contas for insert with check (auth.uid() = user_id);
create policy "contas_update_own" on contas for update using (auth.uid() = user_id);
create policy "contas_delete_own" on contas for delete using (auth.uid() = user_id);

-- Pagamentos
create policy "pagamentos_select_own" on pagamentos for select using (auth.uid() = user_id);
create policy "pagamentos_insert_own" on pagamentos for insert with check (auth.uid() = user_id);
create policy "pagamentos_delete_own" on pagamentos for delete using (auth.uid() = user_id);

-- Preferências
create policy "preferencias_select_own" on preferencias_usuario for select using (auth.uid() = user_id);
create policy "preferencias_upsert_own" on preferencias_usuario for insert with check (auth.uid() = user_id);
create policy "preferencias_update_own" on preferencias_usuario for update using (auth.uid() = user_id);

-- Push tokens (select/insert/update próprios; update é necessário para
-- o upsert por (user_id, device_id) quando o token é renovado)
create policy "push_select_own" on push_subscriptions for select using (auth.uid() = user_id);
create policy "push_insert_own" on push_subscriptions for insert with check (auth.uid() = user_id);
create policy "push_update_own" on push_subscriptions for update using (auth.uid() = user_id);
create policy "push_delete_own" on push_subscriptions for delete using (auth.uid() = user_id);

-- Notificações enviadas (leitura própria; inserção feita via service role no cron)
create policy "notificacoes_select_own" on notificacoes_enviadas for select using (auth.uid() = user_id);

-- Categorias: vê as padrão (user_id null) + as próprias
create policy "categorias_select" on categorias for select
  using (user_id is null or auth.uid() = user_id);
create policy "categorias_insert_own" on categorias for insert with check (auth.uid() = user_id);
create policy "categorias_update_own" on categorias for update using (auth.uid() = user_id);
create policy "categorias_delete_own" on categorias for delete using (auth.uid() = user_id);

-- =========================================================
-- 9. View auxiliar: próximas contas a vencer (para o dashboard)
-- =========================================================
create or replace view vw_proximas_contas as
select
  c.*,
  cat.nome as categoria_nome,
  cat.cor as categoria_cor,
  cat.icone as categoria_icone,
  coalesce(c.dias_antecedencia, p.dias_antecedencia_padrao, 3) as antecedencia_efetiva,
  case
    when c.data_vencimento < current_date then 'atrasado'
    when c.data_vencimento = current_date then 'vence_hoje'
    when c.data_vencimento <= current_date + (coalesce(c.dias_antecedencia, p.dias_antecedencia_padrao, 3) || ' days')::interval then 'proximo'
    else 'normal'
  end as urgencia
from contas c
left join categorias cat on cat.id = c.categoria_id
left join preferencias_usuario p on p.user_id = c.user_id
where c.ativo = true and c.status != 'pago';
