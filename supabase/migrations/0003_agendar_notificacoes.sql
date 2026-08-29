-- Agenda a Edge Function enviar-notificacoes (ver
-- supabase/functions/enviar-notificacoes/index.ts) para rodar 1x/dia.
--
-- IMPORTANTE — específico deste projeto Supabase (dvsymikjpdrmescrydps):
-- se você reusar este schema em outro projeto, troque a URL e a chave
-- abaixo pelas do seu projeto (Project Settings > API).
--
-- O Authorization usado aqui é a ANON KEY no formato JWT legado do
-- projeto — não é secreta, é a mesma chave pública usada pelo app
-- (protegida por RLS no client; aqui só serve para passar pela
-- verificação de JWT da Edge Function, que por padrão exige um JWT
-- válido — ver "verify_jwt" no deploy da função). A função em si usa a
-- SERVICE_ROLE_KEY internamente (injetada automaticamente pelo runtime
-- da Edge Function) para as consultas privilegiadas — essa sim nunca é
-- exposta aqui.
--
-- Horário: 12:00 UTC = 09:00 no horário de Brasília (BRT, UTC-3),
-- alinhado com o horario_envio padrão de preferencias_usuario. Como o
-- cron roda só 1x/dia (conforme especificado), o horario_envio de cada
-- usuário não é individualmente respeitado nesta versão — todo mundo é
-- verificado no mesmo horário. Para respeitar o horário de cada
-- usuário seria preciso rodar o cron com mais frequência (ex: de hora
-- em hora) e a função filtrar por horario_envio.
select cron.schedule(
  'enviar-notificacoes-diarias',
  '0 12 * * *',
  $$
  select net.http_post(
    url := 'https://dvsymikjpdrmescrydps.supabase.co/functions/v1/enviar-notificacoes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2c3ltaWtqcGRybWVzY3J5ZHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5OTUzMjcsImV4cCI6MjEwMzU3MTMyN30.nqUNtzKFVhSXzKv_XMs_T4549hi9pTqlHlRZ6grTXIo'
    ),
    body := '{}'::jsonb
  );
  $$
);
