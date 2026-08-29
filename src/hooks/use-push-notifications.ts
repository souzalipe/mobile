import type { Session } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { getOrCreateDeviceId, registrarPushToken } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

/** Registra (ou atualiza) o Expo Push Token deste device em
 * push_subscriptions assim que há uma sessão autenticada. Silencioso em
 * caso de falha (sem permissão, simulador, projeto EAS ainda não
 * configurado) — push é um "extra", não deve travar o app. */
export function usePushNotifications(session: Session | null) {
  useEffect(() => {
    if (!session) return;

    let cancelado = false;

    (async () => {
      const resultado = await registrarPushToken();
      if (cancelado || resultado.status !== 'registrado') return;

      const deviceId = await getOrCreateDeviceId();
      const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;

      await supabase.from('push_subscriptions').upsert(
        {
          user_id: session.user.id,
          expo_push_token: resultado.token,
          device_id: deviceId,
          platform,
        },
        { onConflict: 'user_id,device_id' }
      );
    })();

    return () => {
      cancelado = true;
    };
  }, [session]);
}
