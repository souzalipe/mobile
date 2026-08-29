import { useState } from 'react';

import { parseMoeda } from '@/lib/currency-utils';
import { marcarContaComoPaga } from '@/lib/pagamentos';
import type { Conta } from '@/types/database';

/** Estado + ação para o fluxo de "marcar conta como paga", compartilhado
 * entre a listagem de contas e o dashboard. */
export function useMarcarComoPaga(aoConfirmar: () => void) {
  const [conta, setConta] = useState<Conta | null>(null);
  const [valorTexto, setValorTexto] = useState('');

  function abrir(contaSelecionada: Conta) {
    setConta(contaSelecionada);
    setValorTexto(
      contaSelecionada.valor_estimado != null
        ? String(contaSelecionada.valor_estimado).replace('.', ',')
        : ''
    );
  }

  function fechar() {
    setConta(null);
  }

  async function confirmar() {
    if (!conta) return;
    const valor = parseMoeda(valorTexto) ?? 0;
    await marcarContaComoPaga(conta, valor);
    setConta(null);
    aoConfirmar();
  }

  return { conta, valorTexto, setValorTexto, abrir, fechar, confirmar };
}
