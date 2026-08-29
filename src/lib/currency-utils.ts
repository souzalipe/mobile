export function formatarMoeda(valor: number | null): string {
  if (valor === null) return '—';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Converte texto digitado ("12,50", "12.50", "1.234,56") para number. */
export function parseMoeda(texto: string): number | null {
  const limpo = texto.trim().replace(/[^\d,.-]/g, '');
  if (!limpo) return null;

  const normalizado =
    limpo.includes(',') && limpo.lastIndexOf(',') > limpo.lastIndexOf('.')
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '');

  const valor = Number(normalizado);
  return Number.isFinite(valor) ? valor : null;
}
