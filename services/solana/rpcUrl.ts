/**
 * Адрес локального узла (solana-test-validator), который пользователь вводит
 * прямо в приложении. Чистая логика без зависимостей от React Native —
 * поэтому её можно тестировать отдельно.
 */

export const DEFAULT_RPC_PORT = 8899;

export type Normalized = { ok: true; url: string } | { ok: false; error: string };

const HOST_RE = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;
const URL_RE = /^(https?):\/\/([^\/:?#\s]+)(?::(\d{1,5}))?(\/[^\s?#]*)?$/i;

/**
 * Приводит ввод пользователя к виду http://host:port.
 * Принимает «192.168.1.23», «192.168.1.23:8899», «http://192.168.1.23:8899/».
 * Без порта для http подставляет 8899. Встроенный URL не используем: в Hermes он
 * реализован не полностью.
 */
export const normalizeRpcUrl = (input: string): Normalized => {
  let s = (input || '').trim();
  if (!s) return { ok: false, error: 'Введите адрес узла, например 192.168.1.23:8899' };
  if (/\s/.test(s)) return { ok: false, error: 'В адресе не должно быть пробелов' };
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && !/^https?:\/\//i.test(s)) {
    return { ok: false, error: 'Адрес должен начинаться с http:// или https://' };
  }
  if (!/^https?:\/\//i.test(s)) s = 'http://' + s;

  const m = s.match(URL_RE);
  if (!m) return { ok: false, error: 'Не похоже на адрес. Пример: 192.168.1.23:8899' };
  const scheme = m[1].toLowerCase();
  const host = m[2];
  if (!HOST_RE.test(host)) return { ok: false, error: 'Недопустимый адрес хоста' };

  let port = m[3];
  if (port !== undefined) {
    const n = parseInt(port, 10);
    if (!(n >= 1 && n <= 65535)) return { ok: false, error: 'Порт должен быть от 1 до 65535' };
  } else if (scheme === 'http') {
    port = String(DEFAULT_RPC_PORT);
  }

  const path = m[4] && m[4] !== '/' ? m[4].replace(/\/+$/, '') : '';
  return { ok: true, url: `${scheme}://${host}${port ? ':' + port : ''}${path}` };
};

export interface CheckResult {
  ok: boolean;
  message: string;
}

/** getHealth по HTTP: отвечает ли узел вообще. */
export const checkNode = async (url: string, timeoutMs = 4000): Promise<CheckResult> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
      signal: ctrl.signal,
    });
    if (!res.ok) return { ok: false, message: `Узел ответил ошибкой HTTP ${res.status}` };
    let json: any;
    try {
      json = await res.json();
    } catch {
      return { ok: false, message: 'Ответ не похож на Solana-узел' };
    }
    if (json?.result === 'ok') return { ok: true, message: 'Узел отвечает' };
    if (json?.error?.message) return { ok: false, message: `Узел не готов: ${json.error.message}` };
    return { ok: false, message: 'Ответ не похож на Solana-узел' };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { ok: false, message: `Нет ответа за ${Math.round(timeoutMs / 1000)} сек. Проверьте IP, Wi-Fi и firewall` };
    }
    return {
      ok: false,
      message: 'Не удалось подключиться. Проверьте IP, что валидатор запущен с --bind-address 0.0.0.0 и что телефон в той же Wi-Fi сети',
    };
  } finally {
    clearTimeout(timer);
  }
};

/** WebSocket-адрес так же, как его выводит @solana/web3.js: порт HTTP + 1. */
export const toWsUrl = (httpUrl: string): string => {
  const m = httpUrl.match(/^(https?):\/\/([^\/:?#]+)(?::(\d+))?/i);
  if (!m) return httpUrl;
  const secure = m[1].toLowerCase() === 'https';
  const wsPort = m[3] ? String(parseInt(m[3], 10) + 1) : '';
  return `${secure ? 'wss' : 'ws'}://${m[2]}${wsPort ? ':' + wsPort : ''}`;
};

/** Подтверждение транзакций идёт через WebSocket: если порт закрыт, переводы зависают. */
export const checkWebSocket = (httpUrl: string, timeoutMs = 3000): Promise<CheckResult> =>
  new Promise((resolve) => {
    const wsUrl = toWsUrl(httpUrl);
    let done = false;
    let ws: WebSocket | null = null;
    const finish = (r: CheckResult) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        ws?.close();
      } catch {}
      resolve(r);
    };
    const timer = setTimeout(
      () => finish({ ok: false, message: `WebSocket (${wsUrl}) не отвечает: переводы могут зависать на подтверждении` }),
      timeoutMs,
    );
    try {
      ws = new WebSocket(wsUrl);
      ws.onopen = () => finish({ ok: true, message: 'WebSocket доступен' });
      ws.onerror = () =>
        finish({ ok: false, message: `WebSocket (${wsUrl}) недоступен: переводы могут зависать на подтверждении` });
    } catch {
      finish({ ok: false, message: 'WebSocket недоступен' });
    }
  });
