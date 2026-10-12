import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { requestAirdrop } from '../../services/solana/connection';
import { useWalletStore } from '../../stores/walletStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { NetworkName } from '../../constants/config';
import { checkNode, checkWebSocket, normalizeRpcUrl } from '../../services/solana/rpcUrl';

interface LogLine {
  text: string;
  kind: 'in' | 'out' | 'err';
}

/**
 * Плавающая dev-консоль поверх всего приложения — заменяет тестовую
 * кнопку "Пополнить". Команды:
 *   add <сумма>        — airdrop SOL (devnet/localnet)
 *   balance            — текущий баланс SOL
 *   address            — полный адрес кошелька
 *   network <имя>      — переключить сеть (devnet/localnet/mainnet)
 *   rpc                — адрес локального узла и проверка связи
 *   rpc <адрес>        — задать адрес локального узла (192.168.1.23:8899)
 *   help               — список команд
 *
 * Добавить новую команду — один case в handleCommand ниже.
 */
export const DebugConsole: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [log, setLog] = useState<LogLine[]>([{ text: 'Дев-консоль. Введите help для списка команд.', kind: 'out' }]);

  const { publicKey, solBalance, refreshBalances } = useWalletStore();
  const { network, setNetwork, localRpcUrl, setLocalRpcUrl } = useSettingsStore();

  const print = (text: string, kind: LogLine['kind'] = 'out') => {
    setLog((prev) => [...prev, { text, kind }]);
  };

  const handleCommand = async (raw: string) => {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();

    switch (cmd) {
      case 'help':
        print('add <сумма> — airdrop SOL');
        print('balance — текущий баланс SOL');
        print('address — адрес кошелька');
        print('network <devnet|localnet|mainnet> — сменить сеть');
        print('rpc — адрес локального узла и проверка связи');
        print('rpc <адрес> — задать адрес локального узла');
        break;

      case 'add': {
        const amount = parseFloat(parts[1]);
        if (!amount || amount <= 0) {
          print('Использование: add <сумма>, например add 5', 'err');
          return;
        }
        if (!publicKey) {
          print('Кошелёк ещё не готов', 'err');
          return;
        }
        try {
          print(`Запрашиваю airdrop ${amount} SOL на ${network}...`);
          await requestAirdrop(publicKey, Math.round(amount * 1e9));
          await refreshBalances();
          print(`Готово: +${amount} SOL`);
        } catch (e: any) {
          print(e.message || 'Ошибка airdrop', 'err');
        }
        break;
      }

      case 'balance':
        print(`${solBalance} SOL`);
        break;

      case 'address':
        print(publicKey || 'адрес не найден');
        break;

      case 'network': {
        const target = parts[1] as NetworkName;
        if (!['devnet', 'localnet', 'mainnet'].includes(target)) {
          print('Использование: network devnet|localnet|mainnet', 'err');
          return;
        }
        setNetwork(target);
        print(`Сеть переключена на ${target}`);
        break;
      }

      case 'rpc': {
        if (parts[1]) {
          const n = normalizeRpcUrl(parts[1]);
          if (!n.ok) {
            print(n.error, 'err');
            return;
          }
          await setLocalRpcUrl(n.url);
          print(`Адрес локального узла: ${n.url}`);
          if (network === 'localnet') refreshBalances();
        } else {
          print(`Локальный узел: ${localRpcUrl}`);
        }
        const url = parts[1] ? (normalizeRpcUrl(parts[1]) as any).url : localRpcUrl;
        const [http, ws] = await Promise.all([checkNode(url), checkWebSocket(url)]);
        print(`${http.ok ? 'OK' : 'ОШИБКА'} HTTP: ${http.message}`, http.ok ? 'out' : 'err');
        print(`${ws.ok ? 'OK' : 'ОШИБКА'} ${ws.message}`, ws.ok ? 'out' : 'err');
        break;
      }

      case '':
        break;

      default:
        print(`Неизвестная команда: ${cmd}. Наберите help.`, 'err');
    }
  };

  const onSubmit = () => {
    if (!input.trim()) return;
    print(input, 'in');
    handleCommand(input);
    setInput('');
  };

  return (
    <>
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)}>
        <Text style={styles.fabText}>⌨</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Dev-консоль</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Text style={styles.closeText}>Закрыть</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.logBox} contentContainerStyle={{ paddingVertical: 8 }}>
              {log.map((l, i) => (
                <Text
                  key={i}
                  style={[
                    styles.logLine,
                    l.kind === 'in' && styles.logIn,
                    l.kind === 'err' && styles.logErr,
                  ]}
                >
                  {l.kind === 'in' ? `> ${l.text}` : l.text}
                </Text>
              ))}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="add 5"
                placeholderTextColor={Colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={onSubmit}
                returnKeyType="go"
              />
              <TouchableOpacity style={styles.runBtn} onPress={onSubmit}>
                <Text style={styles.runBtnText}>Выполнить</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 0.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  fabText: { fontSize: 18, color: Colors.textSecondary },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  panel: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 16,
    maxHeight: '60%',
  },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  panelTitle: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  closeText: { color: Colors.accent, fontSize: 13, fontWeight: '500' },
  logBox: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 10,
    minHeight: 120,
    marginBottom: 10,
  },
  logLine: { color: Colors.textSecondary, fontSize: 12, fontFamily: 'monospace', marginBottom: 3 },
  logIn: { color: Colors.textPrimary, fontWeight: '500' },
  logErr: { color: Colors.error },
  inputRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 13,
    fontFamily: 'monospace',
  },
  runBtn: { backgroundColor: Colors.accent, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  runBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
});
