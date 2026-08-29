import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContaForm, type ContaFormOutput } from '@/components/conta-form';
import { supabase } from '@/lib/supabase';
import type { Conta } from '@/types/database';

export default function EditarContaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [conta, setConta] = useState<Conta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    supabase
      .from('contas')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (ativo) {
          setConta(data);
          setLoading(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [id]);

  async function handleSalvar(dados: ContaFormOutput): Promise<string | null> {
    const { error } = await supabase.from('contas').update(dados).eq('id', id);
    if (error) return error.message;

    router.back();
    return null;
  }

  async function handleExcluir() {
    Alert.alert('Excluir conta', 'Tem certeza? Isso também apaga o histórico de pagamentos dela.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('contas').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center gap-3 px-6 pt-4">
        <Pressable onPress={() => router.back()} className="py-2">
          <Text className="text-base text-neutral-500 dark:text-neutral-400">Voltar</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Editar conta
        </Text>
      </View>

      {loading || !conta ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ContaForm contaInicial={conta} onSalvar={handleSalvar} onExcluir={handleExcluir} />
      )}
    </SafeAreaView>
  );
}
