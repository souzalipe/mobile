import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { Chip } from '@/components/chip';
import { useCategorias } from '@/hooks/use-categorias';
import { dataParaIso, formatarDataBR, proximaDataVencimento } from '@/lib/date-utils';
import type { Conta, FrequenciaConta } from '@/types/database';

export type ContaFormOutput = {
  nome: string;
  categoria_id: string | null;
  valor_estimado: number | null;
  recorrente: boolean;
  frequencia: FrequenciaConta;
  dia_vencimento: number | null;
  data_vencimento: string | null;
  dias_antecedencia: number | null;
};

const FREQUENCIAS: { value: Exclude<FrequenciaConta, 'unica'>; label: string }[] = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

type ContaFormProps = {
  contaInicial?: Conta;
  onSalvar: (dados: ContaFormOutput) => Promise<string | null>;
  onExcluir?: () => Promise<void>;
};

export function ContaForm({ contaInicial, onSalvar, onExcluir }: ContaFormProps) {
  const { categorias } = useCategorias();

  const [nome, setNome] = useState(contaInicial?.nome ?? '');
  const [categoriaId, setCategoriaId] = useState<string | null>(contaInicial?.categoria_id ?? null);
  const [valorTexto, setValorTexto] = useState(
    contaInicial?.valor_estimado != null ? String(contaInicial.valor_estimado).replace('.', ',') : ''
  );
  const [recorrente, setRecorrente] = useState(contaInicial?.recorrente ?? true);
  const [frequencia, setFrequencia] = useState<Exclude<FrequenciaConta, 'unica'>>(
    contaInicial && contaInicial.frequencia !== 'unica' ? contaInicial.frequencia : 'mensal'
  );
  const [diaVencimentoTexto, setDiaVencimentoTexto] = useState(
    contaInicial?.dia_vencimento != null ? String(contaInicial.dia_vencimento) : ''
  );
  const [dataVencimento, setDataVencimento] = useState<string | null>(
    contaInicial?.data_vencimento ?? null
  );
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [usarAntecedenciaPadrao, setUsarAntecedenciaPadrao] = useState(
    contaInicial ? contaInicial.dias_antecedencia === null : true
  );
  const [diasAntecedenciaTexto, setDiasAntecedenciaTexto] = useState(
    contaInicial?.dias_antecedencia != null ? String(contaInicial.dias_antecedencia) : '3'
  );

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function onChangeData(event: DateTimePickerEvent, selecionada?: Date) {
    if (Platform.OS === 'android') setMostrarPicker(false);
    if (event.type === 'set' && selecionada) {
      setDataVencimento(dataParaIso(selecionada));
    }
  }

  async function handleSalvar() {
    setErro(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return setErro('Informe um nome para a conta.');

    let valorEstimado: number | null = null;
    if (valorTexto.trim()) {
      const normalizado = Number(valorTexto.replace(/\./g, '').replace(',', '.'));
      if (!Number.isFinite(normalizado) || normalizado < 0) return setErro('Valor estimado inválido.');
      valorEstimado = normalizado;
    }

    let diaVencimento: number | null = null;
    let dataVencimentoFinal: string | null = null;

    if (recorrente) {
      const dia = Number(diaVencimentoTexto);
      if (!Number.isInteger(dia) || dia < 1 || dia > 31) {
        return setErro('Informe o dia do vencimento (1 a 31).');
      }
      diaVencimento = dia;
      // se o dia mudou (ou é conta nova), recalcula a próxima ocorrência
      dataVencimentoFinal =
        contaInicial?.dia_vencimento === dia && contaInicial?.data_vencimento
          ? contaInicial.data_vencimento
          : proximaDataVencimento(dia);
    } else {
      if (!dataVencimento) return setErro('Selecione a data de vencimento.');
      dataVencimentoFinal = dataVencimento;
    }

    let diasAntecedencia: number | null = null;
    if (!usarAntecedenciaPadrao) {
      const dias = Number(diasAntecedenciaTexto);
      if (!Number.isInteger(dias) || dias < 0) return setErro('Dias de antecedência inválidos.');
      diasAntecedencia = dias;
    }

    setSalvando(true);
    const erroSalvar = await onSalvar({
      nome: nomeLimpo,
      categoria_id: categoriaId,
      valor_estimado: valorEstimado,
      recorrente,
      frequencia: recorrente ? frequencia : 'unica',
      dia_vencimento: diaVencimento,
      data_vencimento: dataVencimentoFinal,
      dias_antecedencia: diasAntecedencia,
    });
    setSalvando(false);

    if (erroSalvar) setErro(erroSalvar);
  }

  return (
    <ScrollView contentContainerClassName="gap-6 px-6 py-4" keyboardShouldPersistTaps="handled">
      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Nome</Text>
        <TextInput
          value={nome}
          onChangeText={setNome}
          placeholder="Ex: Conta de Luz - Light"
          placeholderTextColor="#9ca3af"
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
        />
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {categorias.map((categoria) => (
            <Chip
              key={categoria.id}
              label={categoria.nome}
              color={categoria.cor}
              selected={categoriaId === categoria.id}
              onPress={() => setCategoriaId(categoria.id === categoriaId ? null : categoria.id)}
            />
          ))}
        </ScrollView>
      </View>

      <View className="gap-1.5">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Valor estimado (opcional)
        </Text>
        <TextInput
          value={valorTexto}
          onChangeText={setValorTexto}
          keyboardType="decimal-pad"
          placeholder="R$ 0,00"
          placeholderTextColor="#9ca3af"
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
        />
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Conta recorrente
        </Text>
        <Switch value={recorrente} onValueChange={setRecorrente} />
      </View>

      {recorrente ? (
        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Frequência
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {FREQUENCIAS.map((opcao) => (
                <Chip
                  key={opcao.value}
                  label={opcao.label}
                  selected={frequencia === opcao.value}
                  onPress={() => setFrequencia(opcao.value)}
                />
              ))}
            </ScrollView>
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Dia do vencimento
            </Text>
            <TextInput
              value={diaVencimentoTexto}
              onChangeText={setDiaVencimentoTexto}
              keyboardType="number-pad"
              placeholder="Ex: 10"
              maxLength={2}
              placeholderTextColor="#9ca3af"
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
            />
          </View>
        </View>
      ) : (
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Data de vencimento
          </Text>
          <Pressable
            onPress={() => setMostrarPicker(true)}
            className="rounded-xl border border-neutral-300 px-4 py-3 dark:border-neutral-700"
          >
            <Text className="text-base text-neutral-900 dark:text-neutral-50">
              {dataVencimento ? formatarDataBR(dataVencimento) : 'Selecionar data'}
            </Text>
          </Pressable>
          {mostrarPicker ? (
            <View>
              <DateTimePicker
                value={dataVencimento ? new Date(`${dataVencimento}T12:00:00`) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={onChangeData}
              />
              {Platform.OS === 'ios' ? (
                <Pressable onPress={() => setMostrarPicker(false)} className="items-end py-2">
                  <Text className="text-sm font-medium text-neutral-500">Concluído</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      )}

      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Usar antecedência padrão (configurações)
          </Text>
          <Switch value={usarAntecedenciaPadrao} onValueChange={setUsarAntecedenciaPadrao} />
        </View>

        {!usarAntecedenciaPadrao ? (
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Avisar com quantos dias de antecedência
            </Text>
            <TextInput
              value={diasAntecedenciaTexto}
              onChangeText={setDiasAntecedenciaTexto}
              keyboardType="number-pad"
              placeholder="Ex: 3"
              placeholderTextColor="#9ca3af"
              className="rounded-xl border border-neutral-300 px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-50"
            />
          </View>
        ) : null}
      </View>

      {erro ? <Text className="text-sm text-red-500">{erro}</Text> : null}

      <Pressable
        onPress={handleSalvar}
        disabled={salvando}
        className="items-center rounded-xl bg-neutral-900 py-3.5 disabled:opacity-40 dark:bg-white"
      >
        <Text className="text-base font-semibold text-white dark:text-neutral-900">
          {salvando ? 'Salvando…' : 'Salvar'}
        </Text>
      </Pressable>

      {onExcluir ? (
        <Pressable
          onPress={onExcluir}
          disabled={salvando}
          className="items-center rounded-xl border border-red-200 py-3.5 dark:border-red-900"
        >
          <Text className="text-base font-semibold text-red-500">Excluir conta</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
