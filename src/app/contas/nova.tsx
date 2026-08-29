import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContaForm, type ContaFormOutput } from '@/components/conta-form';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function NovaContaScreen() {
  const { session } = useAuth();

  async function handleSalvar(dados: ContaFormOutput): Promise<string | null> {
    if (!session) return 'Sessão expirada, entre novamente.';

    const { error } = await supabase.from('contas').insert({ ...dados, user_id: session.user.id });
    if (error) return error.message;

    router.back();
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center gap-3 px-6 pt-4">
        <Pressable onPress={() => router.back()} className="py-2">
          <Text className="text-base text-neutral-500 dark:text-neutral-400">Voltar</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Nova conta
        </Text>
      </View>

      <ContaForm onSalvar={handleSalvar} />
    </SafeAreaView>
  );
}
