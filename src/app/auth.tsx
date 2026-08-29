import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

type Modo = 'entrar' | 'cadastrar';

export default function AuthScreen() {
  const [modo, setModo] = useState<Modo>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const emailValido = /\S+@\S+\.\S+/.test(email.trim());
  const podeSubmeter = emailValido && senha.length >= 6 && !loading;

  async function handleSubmit() {
    if (!podeSubmeter) return;
    setLoading(true);
    setErro(null);
    setMensagem(null);

    if (modo === 'entrar') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });
      if (error) setErro(traduzErro(error.message));
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
      });
      if (error) {
        setErro(traduzErro(error.message));
      } else if (!data.session) {
        // projeto com confirmação de email obrigatória
        setMensagem('Conta criada! Verifique seu email para confirmar antes de entrar.');
      }
      // se data.session vier preenchido, o AuthProvider detecta e navega sozinho
    }

    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-1 justify-center px-6 gap-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="gap-1">
            <Text className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
              Contas em Dia
            </Text>
            <Text className="text-base text-neutral-500 dark:text-neutral-400">
              {modo === 'entrar' ? 'Entre para ver suas contas.' : 'Crie sua conta gratuita.'}
            </Text>
          </View>

          <View className="gap-3">
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="voce@exemplo.com"
                placeholderTextColor="#9ca3af"
                className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
              />
            </View>

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Senha
              </Text>
              <TextInput
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
                placeholder="mínimo 6 caracteres"
                placeholderTextColor="#9ca3af"
                className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
              />
            </View>
          </View>

          {erro ? <Text className="text-sm text-red-500">{erro}</Text> : null}
          {mensagem ? <Text className="text-sm text-emerald-600">{mensagem}</Text> : null}

          <Pressable
            onPress={handleSubmit}
            disabled={!podeSubmeter}
            className="items-center rounded-xl bg-neutral-900 py-3.5 disabled:opacity-40 dark:bg-white"
          >
            {loading ? (
              <ActivityIndicator color={Platform.OS === 'ios' ? '#fff' : undefined} />
            ) : (
              <Text className="text-base font-semibold text-white dark:text-neutral-900">
                {modo === 'entrar' ? 'Entrar' : 'Criar conta'}
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setModo(modo === 'entrar' ? 'cadastrar' : 'entrar');
              setErro(null);
              setMensagem(null);
            }}
            className="items-center py-2"
          >
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {modo === 'entrar' ? 'Não tem conta? Criar agora' : 'Já tem conta? Entrar'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function traduzErro(mensagem: string): string {
  if (mensagem.includes('Invalid login credentials')) return 'Email ou senha incorretos.';
  if (mensagem.includes('User already registered')) return 'Já existe uma conta com esse email.';
  if (mensagem.includes('Password should be at least')) return 'Senha muito curta (mínimo 6 caracteres).';
  return mensagem;
}
