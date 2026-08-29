import type { FrequenciaConta } from '@/types/database';

const MESES_POR_FREQUENCIA: Record<Exclude<FrequenciaConta, 'unica'>, number> = {
  mensal: 1,
  bimestral: 2,
  trimestral: 3,
  semestral: 6,
  anual: 12,
};

function dataIsoDoAno(ano: number, mesIndex0: number, diaDesejado: number): string {
  const ultimoDiaDoMes = new Date(ano, mesIndex0 + 1, 0).getDate();
  const dia = Math.min(diaDesejado, ultimoDiaDoMes);
  const mm = String(mesIndex0 + 1).padStart(2, '0');
  const dd = String(dia).padStart(2, '0');
  return `${ano}-${mm}-${dd}`;
}

/**
 * Calcula a próxima data (YYYY-MM-DD) em que um `dia_vencimento` (1-31)
 * cai, a partir de hoje. Se o dia já passou neste mês, avança para o mês
 * seguinte. Meses mais curtos (ex: fevereiro com dia 31) são "clampados"
 * para o último dia do mês.
 */
export function proximaDataVencimento(diaVencimento: number, from = new Date()): string {
  const ano = from.getFullYear();
  const mesAtual = from.getMonth();
  const diaHoje = from.getDate();

  let anoAlvo = ano;
  let mesAlvo = diaHoje <= diaVencimento ? mesAtual : mesAtual + 1;
  if (mesAlvo > 11) {
    mesAlvo = 0;
    anoAlvo += 1;
  }

  return dataIsoDoAno(anoAlvo, mesAlvo, diaVencimento);
}

/**
 * Avança uma data de vencimento (YYYY-MM-DD) para o próximo ciclo, de
 * acordo com a frequência da conta. Usado quando uma conta recorrente é
 * marcada como paga, para calcular o próximo vencimento.
 */
export function avancarCiclo(dataAtualIso: string, frequencia: FrequenciaConta): string {
  if (frequencia === 'unica') return dataAtualIso;

  const [ano, mes, dia] = dataAtualIso.split('-').map(Number);
  const incrementoMeses = MESES_POR_FREQUENCIA[frequencia];

  const mesIndexTotal = mes - 1 + incrementoMeses;
  const anoAlvo = ano + Math.floor(mesIndexTotal / 12);
  const mesIndexAlvo = ((mesIndexTotal % 12) + 12) % 12;

  return dataIsoDoAno(anoAlvo, mesIndexAlvo, dia);
}

/** Converte um Date local para "YYYY-MM-DD" sem passar por UTC (evita
 * deslocar o dia por causa do fuso horário, como toISOString() faria). */
export function dataParaIso(data: Date): string {
  return dataIsoDoAno(data.getFullYear(), data.getMonth(), data.getDate());
}

export function formatarDataBR(dataIso: string | null): string {
  if (!dataIso) return '—';
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function hojeIso(): string {
  return dataIsoDoAno(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
}

/** Primeiro e último dia (YYYY-MM-DD) do mês de `from`, para filtrar
 * consultas de "resumo do mês". */
export function limitesDoMes(from = new Date()): { inicio: string; fim: string } {
  const ano = from.getFullYear();
  const mes = from.getMonth();
  return {
    inicio: dataIsoDoAno(ano, mes, 1),
    fim: dataIsoDoAno(ano, mes, 31), // clampado para o último dia real do mês
  };
}

export function nomeDoMesAtual(): string {
  return new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}
