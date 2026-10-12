import { useCallback, useEffect, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWalletStore } from '../../stores/walletStore';
import { useWorkflowStore } from '../../stores/workflowStore';
import { planSummary } from './blocks';
import { isDue } from './schedule';

// «Позже» на сегодня: не спрашивать про тот же сценарий в тот же день ещё раз.
const snoozed = new Set<string>();

/**
 * Автозапуск «по дате»: при открытии приложения и при возврате в него смотрит,
 * не пора ли выполнить сценарий. Деньги молча НЕ отправляются — только
 * предложение с подтверждением. В фоне, при закрытом приложении, ничего не работает.
 */
export const useAutoRun = () => {
  const { loaded, load, workflows, run } = useWorkflowStore();
  const publicKey = useWalletStore((s) => s.publicKey);
  const refreshBalances = useWalletStore((s) => s.refreshBalances);
  const network = useSettingsStore((s) => s.network);
  const asking = useRef(false);

  useEffect(() => {
    if (!loaded) load();
  }, []);

  const check = useCallback(() => {
    if (!loaded || !publicKey || asking.current) return;
    const now = new Date();
    const due = workflows.find((w) => isDue(w, now) && !snoozed.has(`${w.id}:${now.toDateString()}`));
    if (!due) return;

    asking.current = true;
    const key = `${due.id}:${now.toDateString()}`;
    Alert.alert(
      'Пора выполнить сценарий',
      `«${due.name}» по расписанию на сегодня.\n\n${planSummary(due)}`,
      [
        { text: 'Позже', style: 'cancel', onPress: () => { snoozed.add(key); asking.current = false; } },
        {
          text: 'Выполнить',
          onPress: async () => {
            try {
              const rec = await run(due.id, { manual: false, network });
              if (rec.status === 'success') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Сценарий выполнен', rec.notifications.join('\n') || `«${due.name}»`);
              } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Сценарий остановлен', rec.error || '');
              }
              refreshBalances();
            } catch (e: any) {
              Alert.alert('Ошибка', e?.message || 'Не удалось выполнить сценарий');
            } finally {
              asking.current = false;
            }
          },
        },
      ],
      { cancelable: false },
    );
  }, [loaded, publicKey, workflows, network]);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    return () => sub.remove();
  }, [check]);
};
