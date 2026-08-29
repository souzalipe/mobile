import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const CHAVE_DEVICE_ID = 'contas-em-dia:device-id';

function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Identificador estável por instalação do app (não precisa ser o ID real
 * do hardware — só serve para diferenciar devices do mesmo usuário). */
async function getOrCreateDeviceId(): Promise<string> {
  const existente = await AsyncStorage.getItem(CHAVE_DEVICE_ID);
  if (existente) return existente;

  const novo = uuidV4();
  await AsyncStorage.setItem(CHAVE_DEVICE_ID, novo);
  return novo;
}

export type ResultadoRegistroPush =
  | { status: 'registrado'; token: string }
  | { status: 'sem_permissao' }
  | { status: 'nao_suportado'; motivo: string };

/** Pede permissão e obtém o Expo Push Token do device. Não grava no
 * Supabase — isso fica a cargo de quem chamar (precisa do user_id). */
export async function registrarPushToken(): Promise<ResultadoRegistroPush> {
  if (!Device.isDevice) {
    return { status: 'nao_suportado', motivo: 'Push notifications exigem um device físico.' };
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const permissaoAtual = await Notifications.getPermissionsAsync();
  let status = permissaoAtual.status;
  if (status !== 'granted') {
    const pedido = await Notifications.requestPermissionsAsync();
    status = pedido.status;
  }

  if (status !== 'granted') {
    return { status: 'sem_permissao' };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    return {
      status: 'nao_suportado',
      motivo: 'Projeto ainda não foi configurado no EAS (rode "eas init" — ver Etapa 7).',
    };
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return { status: 'registrado', token };
}

export { getOrCreateDeviceId };
