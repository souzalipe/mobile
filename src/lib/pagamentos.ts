import { avancarCiclo, hojeIso } from '@/lib/date-utils';
import { supabase } from '@/lib/supabase';
import type { Conta } from '@/types/database';

/**
 * Marca uma conta como paga: registra o pagamento em `pagamentos` e
 * atualiza a conta.
 *
 * - Conta recorrente: volta para status "pendente" com a data de
 *   vencimento avançada para o próximo ciclo (com base na frequência),
 *   já que uma nova ocorrência passa a estar em aberto.
 * - Conta não recorrente ("unica"): fica com status "pago" definitivo.
 */
export async function marcarContaComoPaga(conta: Conta, valorPago: number) {
  const { error: erroPagamento } = await supabase.from('pagamentos').insert({
    conta_id: conta.id,
    user_id: conta.user_id,
    valor_pago: valorPago,
    data_pagamento: hojeIso(),
    data_vencimento_referencia: conta.data_vencimento,
  });

  if (erroPagamento) return { error: erroPagamento };

  const atualizacao = conta.recorrente
    ? {
        status: 'pendente' as const,
        data_vencimento: avancarCiclo(conta.data_vencimento ?? hojeIso(), conta.frequencia),
        valor_real: null,
      }
    : {
        status: 'pago' as const,
        valor_real: valorPago,
      };

  const { error: erroConta } = await supabase.from('contas').update(atualizacao).eq('id', conta.id);

  return { error: erroConta };
}
