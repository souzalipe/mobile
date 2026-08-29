import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function PerfilScreen() {
  const { session } = useAuth();
  const user = session?.user;

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const criadoEm = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 px-6 py-4">
        <Pressable onPress={() => router.back()} className="self-start py-2">
          <Text className="text-base text-neutral-500 dark:text-neutral-400">Voltar</Text>
        </Pressable>

        <View className="mt-6 gap-6">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Perfil</Text>

          <View className="gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <View className="gap-1">
              <Text className="text-xs uppercase tracking-wide text-neutral-400">Email</Text>
              <Text className="text-base text-neutral-900 dark:text-neutral-50">{user?.email}</Text>
            </View>

            {criadoEm ? (
              <View className="gap-1">
                <Text className="text-xs uppercase tracking-wide text-neutral-400">
                  Conta criada em
                </Text>
                <Text className="text-base text-neutral-900 dark:text-neutral-50">{criadoEm}</Text>
              </View>
            ) : null}
          </View>

          <Pressable
            onPress={handleSignOut}
            className="items-center rounded-xl border border-red-200 py-3.5 dark:border-red-900"
          >
            <Text className="text-base font-semibold text-red-500">Sair</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
