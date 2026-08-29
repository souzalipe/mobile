import { Modal, Pressable, Text, TextInput, View } from 'react-native';

import type { Conta } from '@/types/database';

type MarcarPagaModalProps = {
  conta: Conta | null;
  valorTexto: string;
  onChangeValor: (texto: string) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
};

export function MarcarPagaModal({
  conta,
  valorTexto,
  onChangeValor,
  onCancelar,
  onConfirmar,
}: MarcarPagaModalProps) {
  return (
    <Modal visible={!!conta} transparent animationType="fade" onRequestClose={onCancelar}>
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full gap-4 rounded-2xl bg-white p-5 dark:bg-neutral-900">
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            Marcar “{conta?.nome}” como paga
          </Text>
          <TextInput
            value={valorTexto}
            onChangeText={onChangeValor}
            keyboardType="decimal-pad"
            placeholder="Valor pago (R$)"
            placeholderTextColor="#9ca3af"
            autoFocus
            className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
          />
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancelar}
              className="flex-1 items-center rounded-xl border border-neutral-300 py-3 dark:border-neutral-700"
            >
              <Text className="text-neutral-700 dark:text-neutral-300">Cancelar</Text>
            </Pressable>
            <Pressable
              onPress={onConfirmar}
              className="flex-1 items-center rounded-xl bg-neutral-900 py-3 dark:bg-white"
            >
              <Text className="font-semibold text-white dark:text-neutral-900">Confirmar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
