import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Link, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/chip';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { CanalNotificacao } from '@/types/database';

const CANAIS: { value: CanalNotificacao; label: string }[] = [
  { value: 'push', label: 'Push' },
  { value: 'email', label: 'Email' },
  { value: 'ambos', label: 'Ambos' },
];

const PADRAO = {
  dias_antecedencia_padrao: 3,
  canal_notificacao: 'push' as CanalNotificacao,
  horario_envio: '09:00:00',
  notificar_dia_vencimento: true,
  notificar_atraso: true,
};

function horaParaDate(hora: string): Date {
  const [h, m] = hora.split(':').map(Number);
  const data = new Date();
  data.setHours(h, m, 0, 0);
  return data;
}

function dateParaHora(data: Date): string {
  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}:00`;
}

function formatarHoraBR(hora: string): string {
  const [h, m] = hora.split(':');
  return `${h}:${m}`;
}

export default function ConfiguracoesScreen() {
  const { session } = useAuth();

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [diasAntecedenciaTexto, setDiasAntecedenciaTexto] = useState(
    String(PADRAO.dias_antecedencia_padrao)
  );
  const [canal, setCanal] = useState<CanalNotificacao>(PADRAO.canal_notificacao);
  const [horario, setHorario] = useState(PADRAO.horario_envio);
  const [notificarVencimento, setNotificarVencimento] = useState(PADRAO.notificar_dia_vencimento);
  const [notificarAtraso, setNotificarAtraso] = useState(PADRAO.notificar_atraso);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);

  const [testeLocalStatus, setTesteLocalStatus] = useState<string | null>(null);
  const [testeRemotoStatus, setTesteRemotoStatus] = useState<string | null>(null);
  const [testandoRemoto, setTestandoRemoto] = useState(false);

  useEffect(() => {
    if (!session) return;

    supabase
      .from('preferencias_usuario')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDiasAntecedenciaTexto(String(data.dias_antecedencia_padrao));
          setCanal(data.canal_notificacao);
          setHorario(data.horario_envio);
          setNotificarVencimento(data.notificar_dia_vencimento);
          setNotificarAtraso(data.notificar_atraso);
        }
        setCarregando(false);
      });
  }, [session]);

  function onChangeHorario(event: DateTimePickerEvent, selecionado?: Date) {
    if (Platform.OS === 'android') setMostrarPicker(false);
    if (event.type === 'set' && selecionado) {
      setHorario(dateParaHora(selecionado));
    }
  }

  async function handleSalvar() {
    if (!session) return;
    setErro(null);
    setSalvo(false);

    const dias = Number(diasAntecedenciaTexto);
    if (!Number.isInteger(dias) || dias < 0) {
      setErro('Dias de antecedência inválidos.');
      return;
    }

    setSalvando(true);
    const { error } = await supabase.from('preferencias_usuario').upsert(
      {
        user_id: session.user.id,
        dias_antecedencia_padrao: dias,
        canal_notificacao: canal,
        horario_envio: horario,
        notificar_dia_vencimento: notificarVencimento,
        notificar_atraso: notificarAtraso,
      },
      { onConflict: 'user_id' }
    );
    setSalvando(false);

    if (error) {
      setErro(error.message);
      return;
    }
    setSalvo(true);
  }

  async function handleTesteLocal() {
    setTesteLocalStatus(null);
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      setTesteLocalStatus('Permissão de notificação negada.');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: { title: 'Contas em Dia', body: 'Notificação de teste local 👋' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2 },
    });
    setTesteLocalStatus('Agendada — deve aparecer em ~2 segundos.');
  }

  async function handleTesteRemoto() {
    setTestandoRemoto(true);
    setTesteRemotoStatus(null);

    const { data, error } = await supabase.functions.invoke('enviar-notificacoes');
    setTestandoRemoto(false);

    setTesteRemotoStatus(error ? `Erro: ${error.message}` : JSON.stringify(data));
  }

  if (carregando) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white dark:bg-neutral-950">
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-950">
      <View className="flex-row items-center gap-3 px-6 pt-4">
        <Pressable onPress={() => router.back()} className="py-2">
          <Text className="text-base text-neutral-500 dark:text-neutral-400">Voltar</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          Configurações
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-6 px-6 py-4" keyboardShouldPersistTaps="handled">
        <Link href="/config/categorias" asChild>
          <Pressable className="flex-row items-center justify-between rounded-xl border border-neutral-200 px-4 py-3.5 dark:border-neutral-800">
            <Text className="text-base text-neutral-900 dark:text-neutral-50">
              Gerenciar categorias
            </Text>
            <Text className="text-neutral-400">›</Text>
          </Pressable>
        </Link>

        <View className="gap-4">
          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            NOTIFICAÇÕES
          </Text>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Antecedência padrão (dias)
            </Text>
            <Text className="text-xs text-neutral-400">
              Usada por contas que não têm um valor próprio definido.
            </Text>
            <TextInput
              value={diasAntecedenciaTexto}
              onChangeText={setDiasAntecedenciaTexto}
              keyboardType="number-pad"
              maxLength={3}
              className="w-24 rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Canal de notificação
            </Text>
            <View className="flex-row gap-2">
              {CANAIS.map((opcao) => (
                <Chip
                  key={opcao.value}
                  label={opcao.label}
                  selected={canal === opcao.value}
                  onPress={() => setCanal(opcao.value)}
                />
              ))}
            </View>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Horário de envio
            </Text>
            <Pressable
              onPress={() => setMostrarPicker(true)}
              className="w-32 rounded-xl border border-neutral-300 px-4 py-3 dark:border-neutral-700"
            >
              <Text className="text-base text-neutral-900 dark:text-neutral-50">
                {formatarHoraBR(horario)}
              </Text>
            </Pressable>
            {mostrarPicker ? (
              <View>
                <DateTimePicker
                  value={horaParaDate(horario)}
                  mode="time"
                  is24Hour
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onChangeHorario}
                />
                {Platform.OS === 'ios' ? (
                  <Pressable onPress={() => setMostrarPicker(false)} className="items-end py-2">
                    <Text className="text-sm font-medium text-neutral-500">Concluído</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="flex-1 pr-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Notificar no dia do vencimento
            </Text>
            <Switch value={notificarVencimento} onValueChange={setNotificarVencimento} />
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="flex-1 pr-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Notificar quando atrasada
            </Text>
            <Switch value={notificarAtraso} onValueChange={setNotificarAtraso} />
          </View>
        </View>

        {erro ? <Text className="text-sm text-red-500">{erro}</Text> : null}
        {salvo ? <Text className="text-sm text-emerald-600">Preferências salvas.</Text> : null}

        <Pressable
          onPress={handleSalvar}
          disabled={salvando}
          className="items-center rounded-xl bg-neutral-900 py-3.5 disabled:opacity-40 dark:bg-white"
        >
          <Text className="text-base font-semibold text-white dark:text-neutral-900">
            {salvando ? 'Salvando…' : 'Salvar preferências'}
          </Text>
        </Pressable>

        <View className="gap-3">
          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            TESTAR NOTIFICAÇÕES
          </Text>

          <Pressable
            onPress={handleTesteLocal}
            className="items-center rounded-xl border border-neutral-300 py-3 dark:border-neutral-700"
          >
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              Testar notificação local
            </Text>
          </Pressable>
          {testeLocalStatus ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">{testeLocalStatus}</Text>
          ) : null}

          <Pressable
            onPress={handleTesteRemoto}
            disabled={testandoRemoto}
            className="items-center rounded-xl border border-neutral-300 py-3 disabled:opacity-40 dark:border-neutral-700"
          >
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-50">
              {testandoRemoto ? 'Executando…' : 'Rodar verificação de contas agora'}
            </Text>
          </Pressable>
          {testeRemotoStatus ? (
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">{testeRemotoStatus}</Text>
          ) : null}
          <Text className="text-xs text-neutral-400">
            Dispara agora a mesma checagem que roda 1x por dia: avisa por push sobre contas
            atrasadas, vencendo hoje ou perto do vencimento.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
