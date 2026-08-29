import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { session } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Contas em Dia
        </Text>
        <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
          Logado como {session?.user.email}. O dashboard chega na Etapa 4.
        </Text>

        <View className="mt-4 flex-row gap-3">
          <Link href="/contas" asChild>
            <Pressable className="rounded-xl bg-neutral-900 px-5 py-2.5 dark:bg-white">
              <Text className="text-base font-semibold text-white dark:text-neutral-900">
                Minhas contas
              </Text>
            </Pressable>
          </Link>

          <Link href="/perfil" asChild>
            <Pressable className="rounded-xl border border-neutral-300 px-5 py-2.5 dark:border-neutral-700">
              <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-50">
                Perfil
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
