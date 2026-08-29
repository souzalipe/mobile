// Edge Function: enviar-notificacoes
//
// Roda 1x/dia via pg_cron (ver supabase/migrations/0003_agendar_notificacoes.sql).
// Também pode ser chamada manualmente (ex: botão "Rodar verificação de
// contas agora" na tela de Configurações do app) para testar o fluxo
// sem esperar o cron.
//
// O que faz:
// 1. Consulta vw_proximas_contas (todas as contas ativas e não pagas,
//    de todos os usuários — usa a service role key, que ignora RLS).
// 2. Para cada conta com urgência atrasado/vence_hoje/proximo, decide o
//    tipo de notificação e filtra pelas preferências do usuário
//    (notificar_dia_vencimento, notificar_atraso, canal_notificacao).
// 3. Pula quem já foi notificado hoje para aquela conta+tipo (consulta
//    notificacoes_enviadas, que tem um unique constraint pra isso).
// 4. Envia via Expo Push API em lotes de até 100 mensagens.
// 5. Grava em notificacoes_enviadas o que foi enviado.

import { createClient } from 'npm:@supabase/supabase-js@2';

type Urgencia = 'atrasado' | 'vence_hoje' | 'proximo' | 'normal';
type TipoNotificacao = 'aviso_previo' | 'vencimento_hoje' | 'atrasado';

type ProximaConta = {
  id: string;
  user_id: string;
  nome: string;
  data_vencimento: string | null;
  urgencia: Urgencia;
};

type PreferenciasUsuario = {
  user_id: string;
  canal_notificacao: 'push' | 'email' | 'ambos';
  notificar_dia_vencimento: boolean;
  notificar_atraso: boolean;
};

type PushSubscription = {
  user_id: string;
  expo_push_token: string;
};

const URGENCIA_PARA_TIPO: Partial<Record<Urgencia, TipoNotificacao>> = {
  atrasado: 'atrasado',
  vence_hoje: 'vencimento_hoje',
  proximo: 'aviso_previo',
};

const MENSAGENS: Record<TipoNotificacao, (nome: string) => { title: string; body: string }> = {
  atrasado: (nome) => ({ title: 'Conta atrasada', body: `"${nome}" está atrasada.` }),
  vencimento_hoje: (nome) => ({ title: 'Vence hoje', body: `"${nome}" vence hoje.` }),
  aviso_previo: (nome) => ({ title: 'Conta próxima do vencimento', body: `"${nome}" vence em breve.` }),
};

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const hoje = new Date().toISOString().slice(0, 10);

  const { data: proximas, error: erroProximas } = await supabase
    .from('vw_proximas_contas')
    .select('id, user_id, nome, data_vencimento, urgencia')
    .returns<ProximaConta[]>();

  if (erroProximas) {
    return Response.json({ error: erroProximas.message }, { status: 500 });
  }

  const candidatas = (proximas ?? []).filter((c) => URGENCIA_PARA_TIPO[c.urgencia]);
  if (candidatas.length === 0) {
    return Response.json({ candidatas: 0, enviadas: 0 });
  }

  const userIds = [...new Set(candidatas.map((c) => c.user_id))];
  const contaIds = candidatas.map((c) => c.id);

  const [{ data: preferencias }, { data: subscriptions }, { data: jaEnviadas }] = await Promise.all([
    supabase
      .from('preferencias_usuario')
      .select('user_id, canal_notificacao, notificar_dia_vencimento, notificar_atraso')
      .in('user_id', userIds)
      .returns<PreferenciasUsuario[]>(),
    supabase
      .from('push_subscriptions')
      .select('user_id, expo_push_token')
      .in('user_id', userIds)
      .returns<PushSubscription[]>(),
    supabase
      .from('notificacoes_enviadas')
      .select('conta_id, tipo')
      .eq('data_envio', hoje)
      .in('conta_id', contaIds)
      .returns<{ conta_id: string; tipo: TipoNotificacao }[]>(),
  ]);

  const preferenciasPorUsuario = new Map((preferencias ?? []).map((p) => [p.user_id, p]));
  const tokensPorUsuario = new Map<string, string[]>();
  for (const sub of subscriptions ?? []) {
    const lista = tokensPorUsuario.get(sub.user_id) ?? [];
    lista.push(sub.expo_push_token);
    tokensPorUsuario.set(sub.user_id, lista);
  }
  const jaEnviadasSet = new Set((jaEnviadas ?? []).map((n) => `${n.conta_id}|${n.tipo}`));

  const mensagensPush: { to: string; title: string; body: string }[] = [];
  const registros: {
    conta_id: string;
    user_id: string;
    tipo: TipoNotificacao;
    data_envio: string;
    canal: 'push';
  }[] = [];

  for (const conta of candidatas) {
    const tipo = URGENCIA_PARA_TIPO[conta.urgencia];
    if (!tipo || jaEnviadasSet.has(`${conta.id}|${tipo}`)) continue;

    const prefs = preferenciasPorUsuario.get(conta.user_id);
    if (prefs) {
      if (tipo === 'vencimento_hoje' && !prefs.notificar_dia_vencimento) continue;
      if (tipo === 'atrasado' && !prefs.notificar_atraso) continue;
      if (prefs.canal_notificacao === 'email') continue; // só implementamos push nesta etapa
    }

    const tokens = tokensPorUsuario.get(conta.user_id) ?? [];
    if (tokens.length === 0) continue;

    const { title, body } = MENSAGENS[tipo](conta.nome);
    for (const token of tokens) {
      mensagensPush.push({ to: token, title, body });
    }
    registros.push({ conta_id: conta.id, user_id: conta.user_id, tipo, data_envio: hoje, canal: 'push' });
  }

  for (let i = 0; i < mensagensPush.length; i += 100) {
    const lote = mensagensPush.slice(i, i + 100);
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(lote),
    });
  }

  if (registros.length > 0) {
    await supabase.from('notificacoes_enviadas').insert(registros);
  }

  return Response.json({
    candidatas: candidatas.length,
    enviadas: registros.length,
    mensagensPush: mensagensPush.length,
  });
});
