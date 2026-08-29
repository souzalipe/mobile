import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { MarcarPagaModal } from '@/components/marcar-paga-modal';
import { useCategorias } from '@/hooks/use-categorias';
import { useMarcarComoPaga } from '@/hooks/use-marcar-como-paga';
import { formatarMoeda } from '@/lib/currency-utils';
import { formatarDataBR } from '@/lib/date-utils';
import { supabase } from '@/lib/supabase';
import type { Conta, StatusConta } from '@/types/database';

const STATUS_OPCOES: { value: StatusConta | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'atrasado', label: 'Atrasado' },
  { value: 'pago', label: 'Pago' },
  { value: 'cancelado', label: 'Cancelado' },
];

const CORES_STATUS: Record<StatusConta, string> = {
  pendente: '#eab308',
  atrasado: '#ef4444',
  pago: '#22c55e',
  cancelado: '#a3a3a3',
};

export default function ContasScreen() {
  const { categorias } = useCategorias();
  const categoriaPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);

  const [contas, setContas] = useState<Conta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusConta | 'todos'>('todos');

  const carregarContas = useCallback(async () => {
    let query = supabase
      .from('contas')
      .select('*')
      .eq('ativo', true)
      .order('data_vencimento', { ascending: true, nullsFirst: false });

    if (filtroCategoria) query = query.eq('categoria_id', filtroCategoria);
    if (filtroStatus !== 'todos') query = query.eq('status', filtroStatus);

    const { data } = await query;
    setContas(data ?? []);
    setCarregando(false);
  }, [filtroCategoria, filtroStatus]);

  useFocusEffect(
    useCallback(() => {
      carregarContas();
    }, [carregarContas])
  );

  const pagamento = useMarcarComoPaga(carregarContas);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Pressable onPress={() => router.back()} className="py-2">
          <Text className="text-base text-neutral-500 dark:text-neutral-400">Voltar</Text>
        </Pressable>
        <Link href="/contas/nova" asChild>
          <Pressable className="rounded-full bg-neutral-900 px-4 py-2 dark:bg-white">
            <Text className="text-sm font-semibold text-white dark:text-neutral-900">+ Nova</Text>
          </Pressable>
        </Link>
      </View>

      <Text className="px-6 pb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        Contas
      </Text>

      <View className="gap-2 pb-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-6">
          <Chip
            label="Todas categorias"
            selected={filtroCategoria === null}
            onPress={() => setFiltroCategoria(null)}
          />
          {categorias.map((categoria) => (
            <Chip
              key={categoria.id}
              label={categoria.nome}
              color={categoria.cor}
              selected={filtroCategoria === categoria.id}
              onPress={() => setFiltroCategoria(categoria.id === filtroCategoria ? null : categoria.id)}
            />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-6">
          {STATUS_OPCOES.map((opcao) => (
            <Chip
              key={opcao.value}
              label={opcao.label}
              selected={filtroStatus === opcao.value}
              onPress={() => setFiltroStatus(opcao.value)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={contas}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 px-6 pb-6"
        refreshing={carregando}
        onRefresh={carregarContas}
        ListEmptyComponent={
          !carregando ? (
            <Text className="mt-10 text-center text-neutral-400">Nenhuma conta encontrada.</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const categoria = item.categoria_id ? categoriaPorId.get(item.categoria_id) : null;
          const podeQuitar = item.status !== 'pago' && item.status !== 'cancelado';

          return (
            <View className="gap-2 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
              <Link href={`/contas/${item.id}`} asChild>
                <Pressable className="gap-2">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 gap-1 pr-2">
                      <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                        {item.nome}
                      </Text>
                      {categoria ? (
                        <View className="flex-row items-center gap-1.5">
                          <View
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: categoria.cor }}
                          />
                          <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                            {categoria.nome}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <View className="items-end gap-1">
                      <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                        {formatarMoeda(item.valor_estimado)}
                      </Text>
                      <View
                        className="rounded-full px-2 py-0.5"
                        style={{ backgroundColor: `${CORES_STATUS[item.status]}22` }}
                      >
                        <Text className="text-xs font-medium" style={{ color: CORES_STATUS[item.status] }}>
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Link>

              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-neutral-400">
                  Vencimento: {formatarDataBR(item.data_vencimento)}
                  {item.recorrente ? ` · ${item.frequencia}` : ''}
                </Text>
                {podeQuitar ? (
                  <Pressable onPress={() => pagamento.abrir(item)} hitSlop={8}>
                    <Text className="text-xs font-semibold text-emerald-600">Marcar como paga</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
      />

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
