import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/lib/auth-context';
import { useCategorias } from '@/hooks/use-categorias';
import { supabase } from '@/lib/supabase';
import type { Categoria } from '@/types/database';

const PALETA = [
  '#378add',
  '#ef9f27',
  '#534ab7',
  '#d4537e',
  '#e24b4a',
  '#639922',
  '#1d9e75',
  '#888780',
  '#eab308',
  '#06b6d4',
];

export default function CategoriasScreen() {
  const { session } = useAuth();
  const { categorias, loading, recarregar } = useCategorias();

  const [modalAberto, setModalAberto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState(PALETA[0]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const categoriasSistema = categorias.filter((c) => c.user_id === null);
  const categoriasProprias = categorias.filter((c) => c.user_id !== null);

  function abrirNova() {
    setCategoriaEditando(null);
    setNome('');
    setCor(PALETA[0]);
    setErro(null);
    setModalAberto(true);
  }

  function abrirEdicao(categoria: Categoria) {
    setCategoriaEditando(categoria);
    setNome(categoria.nome);
    setCor(categoria.cor);
    setErro(null);
    setModalAberto(true);
  }

  async function handleSalvar() {
    if (!session) return;
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErro('Informe um nome.');
      return;
    }

    setSalvando(true);
    const { error } = categoriaEditando
      ? await supabase.from('categorias').update({ nome: nomeLimpo, cor }).eq('id', categoriaEditando.id)
      : await supabase.from('categorias').insert({ nome: nomeLimpo, cor, user_id: session.user.id });
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }

    setModalAberto(false);
    recarregar();
  }

  function handleExcluir(categoria: Categoria) {
    Alert.alert('Excluir categoria', `Excluir "${categoria.nome}"? Contas nessa categoria ficam sem categoria.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('categorias').delete().eq('id', categoria.id);
          recarregar();
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Pressable onPress={() => router.back()} className="py-2">
          <Text className="text-base text-neutral-500 dark:text-neutral-400">Voltar</Text>
        </Pressable>
        <Pressable onPress={abrirNova} className="rounded-full bg-neutral-900 px-4 py-2 dark:bg-white">
          <Text className="text-sm font-semibold text-white dark:text-neutral-900">+ Nova</Text>
        </Pressable>
      </View>

      <Text className="px-6 pb-2 pt-2 text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        Categorias
      </Text>

      {!loading ? (
        <ScrollView contentContainerClassName="gap-6 px-6 pb-6">
          <View className="gap-2">
            <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              MINHAS CATEGORIAS
            </Text>
            {categoriasProprias.length === 0 ? (
              <Text className="text-sm text-neutral-400">
                Você ainda não criou categorias customizadas.
              </Text>
            ) : (
              categoriasProprias.map((categoria) => (
                <View
                  key={categoria.id}
                  className="flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800"
                >
                  <Pressable
                    onPress={() => abrirEdicao(categoria)}
                    className="flex-1 flex-row items-center gap-2"
                  >
                    <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoria.cor }} />
                    <Text className="text-base text-neutral-900 dark:text-neutral-50">
                      {categoria.nome}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => handleExcluir(categoria)} hitSlop={8}>
                    <Text className="text-sm font-medium text-red-500">Excluir</Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>

          <View className="gap-2">
            <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              PADRÃO DO SISTEMA
            </Text>
            {categoriasSistema.map((categoria) => (
              <View
                key={categoria.id}
                className="flex-row items-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 dark:border-neutral-800"
              >
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: categoria.cor }} />
                <Text className="text-base text-neutral-900 dark:text-neutral-50">{categoria.nome}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : null}

      <Modal
        visible={modalAberto}
        transparent
        animationType="fade"
        onRequestClose={() => setModalAberto(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40 px-6">
          <View className="w-full gap-4 rounded-2xl bg-white p-5 dark:bg-neutral-900">
            <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              {categoriaEditando ? 'Editar categoria' : 'Nova categoria'}
            </Text>

            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Nome da categoria"
              placeholderTextColor="#9ca3af"
              autoFocus
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
            />

            <View className="flex-row flex-wrap gap-2">
              {PALETA.map((opcao) => (
                <Pressable
                  key={opcao}
                  onPress={() => setCor(opcao)}
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: opcao,
                    borderWidth: cor === opcao ? 3 : 0,
                    borderColor: '#00000033',
                  }}
                />
              ))}
            </View>

            {erro ? <Text className="text-sm text-red-500">{erro}</Text> : null}

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setModalAberto(false)}
                className="flex-1 items-center rounded-xl border border-neutral-300 py-3 dark:border-neutral-700"
              >
                <Text className="text-neutral-700 dark:text-neutral-300">Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSalvar}
                disabled={salvando}
                className="flex-1 items-center rounded-xl bg-neutral-900 py-3 disabled:opacity-40 dark:bg-white"
              >
                <Text className="font-semibold text-white dark:text-neutral-900">
                  {salvando ? 'Salvando…' : 'Salvar'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
