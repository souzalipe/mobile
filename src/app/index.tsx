import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MarcarPagaModal } from '@/components/marcar-paga-modal';
import { useAuth } from '@/lib/auth-context';
import { formatarMoeda } from '@/lib/currency-utils';
import { formatarDataBR, limitesDoMes, nomeDoMesAtual } from '@/lib/date-utils';
import { useMarcarComoPaga } from '@/hooks/use-marcar-como-paga';
import { supabase } from '@/lib/supabase';
import type { ProximaConta, UrgenciaConta } from '@/types/database';

const ORDEM_URGENCIA: Record<UrgenciaConta, number> = {
  atrasado: 0,
  vence_hoje: 1,
  proximo: 2,
  normal: 3,
};

const LABEL_URGENCIA: Record<UrgenciaConta, string> = {
  atrasado: 'Atrasado',
  vence_hoje: 'Vence hoje',
  proximo: 'Em breve',
  normal: 'Normal',
};

const COR_URGENCIA: Record<UrgenciaConta, string> = {
  atrasado: '#ef4444',
  vence_hoje: '#f97316',
  proximo: '#eab308',
  normal: '#22c55e',
};

function somaValor(valores: (number | null)[]): number {
  return valores.reduce<number>((total, v) => total + (v ?? 0), 0);
}

function StatCard({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <View
      className={`flex-1 gap-1 rounded-2xl border p-4 ${
        destaque
          ? 'border-neutral-900 bg-neutral-900 dark:border-white dark:bg-white'
          : 'border-neutral-200 dark:border-neutral-800'
      }`}
    >
      <Text
        className={`text-xs font-medium ${
          destaque ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500 dark:text-neutral-400'
        }`}
      >
        {titulo}
      </Text>
      <Text
        className={`text-xl font-bold ${
          destaque ? 'text-white dark:text-neutral-900' : 'text-neutral-900 dark:text-neutral-50'
        }`}
      >
        {valor}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { session } = useAuth();

  const [proximasContas, setProximasContas] = useState<ProximaConta[]>([]);
  const [totalEstimado, setTotalEstimado] = useState(0);
  const [totalPago, setTotalPago] = useState(0);
  const [carregando, setCarregando] = useState(true);

  const carregarDashboard = useCallback(async () => {
    const { inicio, fim } = limitesDoMes();

    const [proximas, estimadoDoMes, pagoDoMes] = await Promise.all([
      supabase.from('vw_proximas_contas').select('*'),
      supabase.from('contas').select('valor_estimado').eq('ativo', true).gte('data_vencimento', inicio).lte('data_vencimento', fim),
      supabase.from('pagamentos').select('valor_pago').gte('data_pagamento', inicio).lte('data_pagamento', fim),
    ]);

    const ordenadas = (proximas.data ?? []).slice().sort((a, b) => {
      const diferencaUrgencia = ORDEM_URGENCIA[a.urgencia] - ORDEM_URGENCIA[b.urgencia];
      if (diferencaUrgencia !== 0) return diferencaUrgencia;
      return (a.data_vencimento ?? '').localeCompare(b.data_vencimento ?? '');
    });

    setProximasContas(ordenadas);
    setTotalEstimado(somaValor((estimadoDoMes.data ?? []).map((c) => c.valor_estimado)));
    setTotalPago(somaValor((pagoDoMes.data ?? []).map((p) => p.valor_pago)));
    setCarregando(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarDashboard();
    }, [carregarDashboard])
  );

  const pagamento = useMarcarComoPaga(carregarDashboard);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-6 pt-4">
        <View>
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
            Contas em Dia
          </Text>
          <Text className="text-sm capitalize text-neutral-500 dark:text-neutral-400">
            {nomeDoMesAtual()}
          </Text>
        </View>
        <Link href="/perfil" asChild>
          <Pressable className="h-10 w-10 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700">
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
              {session?.user.email?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </Pressable>
        </Link>
      </View>

      <View className="flex-row gap-3 px-6 py-4">
        <StatCard titulo="Estimado no mês" valor={formatarMoeda(totalEstimado)} />
        <StatCard titulo="Pago no mês" valor={formatarMoeda(totalPago)} destaque />
      </View>

      <View className="flex-row items-center justify-between px-6 pb-2">
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Próximas contas
        </Text>
        <Link href="/contas" asChild>
          <Pressable>
            <Text className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
              Ver todas
            </Text>
          </Pressable>
        </Link>
      </View>

      {carregando ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={proximasContas}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 px-6 pb-6"
          refreshing={carregando}
          onRefresh={carregarDashboard}
          ListEmptyComponent={
            <View className="mt-10 items-center gap-3">
              <Text className="text-center text-neutral-400">
                Nenhuma conta em aberto por enquanto.
              </Text>
              <Link href="/contas/nova" asChild>
                <Pressable className="rounded-xl bg-neutral-900 px-4 py-2 dark:bg-white">
                  <Text className="text-sm font-semibold text-white dark:text-neutral-900">
                    Adicionar conta
                  </Text>
                </Pressable>
              </Link>
            </View>
          }
          renderItem={({ item }) => {
            const cor = COR_URGENCIA[item.urgencia];

            return (
              <View
                className="gap-2 rounded-2xl border-l-4 border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
                style={{ borderLeftColor: cor }}
              >
                <Link href={`/contas/${item.id}`} asChild>
                  <Pressable className="gap-2">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 gap-1 pr-2">
                        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                          {item.nome}
                        </Text>
                        {item.categoria_nome ? (
                          <View className="flex-row items-center gap-1.5">
                            <View
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.categoria_cor ?? '#6b7280' }}
                            />
                            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                              {item.categoria_nome}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <View className="items-end gap-1">
                        <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                          {formatarMoeda(item.valor_estimado)}
                        </Text>
                        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: `${cor}22` }}>
                          <Text className="text-xs font-medium" style={{ color: cor }}>
                            {LABEL_URGENCIA[item.urgencia]}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                </Link>

                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-neutral-400">
                    Vencimento: {formatarDataBR(item.data_vencimento)}
                  </Text>
                  <Pressable onPress={() => pagamento.abrir(item)} hitSlop={8}>
                    <Text className="text-xs font-semibold text-emerald-600">Marcar como paga</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}

      <MarcarPagaModal
        conta={pagamento.conta}
        valorTexto={pagamento.valorTexto}
        onChangeValor={pagamento.setValorTexto}
        onCancelar={pagamento.fechar}
        onConfirmar={pagamento.confirmar}
      />
    </SafeAreaView>
  );
}
