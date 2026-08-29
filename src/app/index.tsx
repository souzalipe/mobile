import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-1 items-center justify-center gap-2 px-6">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Contas em Dia
        </Text>
        <Text className="text-center text-base text-neutral-500 dark:text-neutral-400">
          Etapa 1 concluída: Expo Router + NativeWind + Supabase configurados.
        </Text>
      </View>
    </SafeAreaView>
  );
}
