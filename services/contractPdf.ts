/**
 * "Смарт-контракт" здесь — не ончейн-программа (это отдельная, гораздо
 * более объёмная задача, требующая своего Solana-программы и Anchor),
 * а формализованный PDF-документ по конкретному переводу: кто, кому,
 * сколько, когда, с ончейн-подписью как криптографическим доказательством.
 * По сути — юридически читаемая обёртка вокруг реального ончейн-события.
 */
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { TransactionRecord } from './solana/tokens';

const explorerUrl = (signature: string, network: string): string => {
  if (network === 'localnet') return '';
  const cluster = network === 'mainnet' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
};

const buildHtml = (tx: TransactionRecord, network: string, myAddress: string): string => {
  const date = new Date(tx.timestamp).toLocaleString('ru-RU');
  const counterpartyLabel = tx.type === 'send' ? 'Получатель' : 'Отправитель';
  const counterparty = tx.type === 'send' ? (tx.to || 'не определён') : (tx.from || 'не определён');
  const url = explorerUrl(tx.signature, network);

  return `
  <html>
  <head><meta charset="utf-8" />
  <style>
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 40px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .sub { color: #666; font-size: 12px; margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: top; }
    td.label { color: #666; width: 180px; }
    .amount { font-size: 22px; font-weight: 600; margin: 20px 0; }
    .sig { font-family: monospace; font-size: 11px; word-break: break-all; color: #333; background: #f6f6f6; padding: 10px; border-radius: 6px; }
    .footer { margin-top: 40px; font-size: 10px; color: #999; line-height: 1.6; }
  </style>
  </head>
  <body>
    <h1>Подтверждение перевода</h1>
    <div class="sub">GvardPay · сеть ${network} · сформировано ${new Date().toLocaleString('ru-RU')}</div>

    <div class="amount">${tx.amount} ${tx.token}</div>

    <table>
      <tr><td class="label">Дата операции</td><td>${date}</td></tr>
      <tr><td class="label">Мой адрес</td><td>${myAddress}</td></tr>
      <tr><td class="label">${counterpartyLabel}</td><td>${counterparty}</td></tr>
      <tr><td class="label">Статус</td><td>${tx.status === 'confirmed' ? 'Подтверждено' : tx.status}</td></tr>
      <tr><td class="label">Комиссия сети</td><td>${tx.fee} SOL</td></tr>
    </table>

    <div class="label" style="margin-bottom:6px;font-size:12px;color:#666;">Подпись транзакции (ончейн-доказательство)</div>
    <div class="sig">${tx.signature}</div>

    <div class="footer">
      Этот документ — читаемое представление реальной транзакции в блокчейне Solana,
      не отдельный юридический договор. Подлинность подтверждается указанной подписью
      транзакции, которую можно независимо проверить в блокчейне.
      ${url ? `<br/>Проверить: ${url}` : ''}
    </div>
  </body>
  </html>`;
};

export const generateAndShareContract = async (
  tx: TransactionRecord,
  network: string,
  myAddress: string,
): Promise<void> => {
  const html = buildHtml(tx, network, myAddress);
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Подтверждение перевода' });
  }
};
