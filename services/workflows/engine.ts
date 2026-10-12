/**
 * Клиентский движок сценариев: выполняет блоки по порядку, держит общий
 * контекст (сумма, платёж, уведомления). Серверного оркестратора нет:
 * движок запускается только пока приложение открыто.
 *
 * Деньги уходят только через sendSOL / sendSPLToken (у них свой замок от
 * дублей). Здесь добавлен второй замок — один запуск сценария за раз.
 */
import { PublicKey } from '@solana/web3.js';
import { NetworkName } from '../../constants/config';
import { USDC_DEVNET, USDT_DEVNET, USDC_MAINNET, USDT_MAINNET } from '../../constants/tokens';
import { getKztPerUsd, getSolPriceUsd } from '../price';
import { sendSOL, sendSPLToken } from '../solana/tokens';
import { newId } from './blocks';
import {
  CalcConfig,
  ComplianceConfig,
  NotifyConfig,
  PaymentConfig,
  RunRecord,
  RunStep,
  TriggerConfig,
  Workflow,
  WorkflowBlock,
} from './types';

export interface RunOptions {
  manual: boolean;
  network: NetworkName;
}

export type StepCallback = (index: number, status: 'run' | 'ok' | 'fail', message?: string) => void;

interface Ctx {
  blocks: WorkflowBlock[];
  index: number;
  network: NetworkName;
  manual: boolean;
  solPrice: number;
  value?: { usd?: number; sol?: number };
  payment?: { token: string; amount: number; to: string; signature: string };
  notifications: string[];
}

let runLock = false;
export const isWorkflowRunning = (): boolean => runLock;

const short = (a: string) => (a.length > 9 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a);
const round6 = (n: number) => Math.round(n * 1e6) / 1e6;

const assertAddress = (addr: string): void => {
  if (!addr.trim()) throw new Error('Адрес получателя не задан');
  try {
    new PublicKey(addr.trim());
  } catch {
    throw new Error('Адрес получателя некорректен');
  }
};

/** Сумма платежа в единицах выбранного токена с учётом блока расчёта. */
export const resolveAmount = (pay: PaymentConfig, ctx: Pick<Ctx, 'value' | 'solPrice'>): number => {
  const v = ctx.value;
  let amount: number;
  if (pay.token === 'SOL') {
    if (v?.sol !== undefined) amount = v.sol;
    else if (v?.usd !== undefined) {
      if (!ctx.solPrice) throw new Error('Нет курса SOL — не могу пересчитать сумму');
      amount = v.usd / ctx.solPrice;
    } else amount = pay.amount;
  } else {
    if (v?.usd !== undefined) amount = v.usd;
    else if (v?.sol !== undefined) {
      if (!ctx.solPrice) throw new Error('Нет курса SOL — не могу пересчитать сумму');
      amount = v.sol * ctx.solPrice;
    } else amount = pay.amount;
  }
  amount = round6(amount);
  if (!(amount > 0)) throw new Error('Сумма платежа не задана');
  return amount;
};

const nextPayment = (ctx: Ctx): PaymentConfig => {
  const b = ctx.blocks.slice(ctx.index + 1).find((x) => x.type === 'payment');
  if (!b) throw new Error('После этого блока нет блока платежа');
  return b.config as PaymentConfig;
};

const execute = async (block: WorkflowBlock, ctx: Ctx): Promise<string> => {
  switch (block.type) {
    case 'trigger': {
      const c = block.config as TriggerConfig;
      if (ctx.manual) return 'Ручной запуск, проверка даты пропущена';
      return c.mode === 'monthly' ? `Дата совпала: ${c.dayOfMonth}-е число` : 'Запуск разрешён';
    }

    case 'calc': {
      const c = block.config as CalcConfig;
      if (!(c.amount > 0)) throw new Error('Сумма в блоке расчёта не задана');
      if (c.currency === 'SOL') {
        ctx.value = { sol: c.amount };
        return `${c.amount} SOL`;
      }
      if (c.currency === 'USD') {
        ctx.value = { usd: c.amount };
        return `$${c.amount}`;
      }
      const rate = await getKztPerUsd();
      if (!rate) throw new Error('Не удалось получить курс тенге. Проверьте интернет и повторите');
      const usd = Math.round((c.amount / rate) * 100) / 100;
      ctx.value = { usd };
      return `${c.amount.toLocaleString('ru-RU')} ₸ ≈ $${usd} (курс ${rate.toFixed(1)} ₸ за $1)`;
    }

    case 'compliance': {
      const c = block.config as ComplianceConfig;
      const pay = nextPayment(ctx);
      assertAddress(pay.recipient);
      const list = c.allowedAddresses.split(/[\s,;]+/).filter(Boolean);
      if (list.length > 0 && !list.includes(pay.recipient.trim())) {
        throw new Error('Адрес получателя не входит в разрешённый список');
      }
      const amount = resolveAmount(pay, ctx);
      let usd = amount;
      if (pay.token === 'SOL') {
        if (!ctx.solPrice) throw new Error('Нет курса SOL — не могу проверить лимит');
        usd = amount * ctx.solPrice;
      }
      usd = Math.round(usd * 100) / 100;
      if (usd > c.maxUsd) throw new Error(`Сумма $${usd} превышает лимит $${c.maxUsd}`);
      return `Проверка пройдена: $${usd} при лимите $${c.maxUsd}`;
    }

    case 'payment': {
      const c = block.config as PaymentConfig;
      assertAddress(c.recipient);
      const amount = resolveAmount(c, ctx);
      const to = c.recipient.trim();
      let signature: string;
      if (c.token === 'SOL') {
        signature = await sendSOL(to, amount);
      } else {
        if (ctx.network === 'localnet') {
          throw new Error('На Localnet нет готового USDC/USDT — выберите токен SOL');
        }
        const devnet = ctx.network === 'devnet';
        const info =
          c.token === 'USDC' ? (devnet ? USDC_DEVNET : USDC_MAINNET) : devnet ? USDT_DEVNET : USDT_MAINNET;
        signature = await sendSPLToken(to, info.mint, amount, info.decimals);
      }
      ctx.payment = { token: c.token, amount, to, signature };
      return `${amount} ${c.token} → ${short(to)}`;
    }

    case 'notify': {
      const c = block.config as NotifyConfig;
      const base = c.message.trim() || 'Сценарий выполнен';
      const tail = ctx.payment ? ` (${ctx.payment.amount} ${ctx.payment.token} → ${short(ctx.payment.to)})` : '';
      ctx.notifications.push(base + tail);
      return 'Уведомление готово';
    }

    case 'ledger':
      return 'Запись добавлена в журнал';
  }
};

export const runWorkflow = async (
  workflow: Workflow,
  opts: RunOptions,
  onStep?: StepCallback,
): Promise<RunRecord> => {
  if (runLock) throw new Error('Другой сценарий ещё выполняется');
  if (workflow.blocks.length === 0) throw new Error('В сценарии нет блоков');
  runLock = true;

  const record: RunRecord = {
    id: newId(),
    workflowId: workflow.id,
    workflowName: workflow.name,
    startedAt: Date.now(),
    manual: opts.manual,
    status: 'success',
    steps: [],
    notifications: [],
  };

  try {
    const ctx: Ctx = {
      blocks: workflow.blocks,
      index: 0,
      network: opts.network,
      manual: opts.manual,
      solPrice: await getSolPriceUsd(),
      notifications: record.notifications,
    };

    for (let i = 0; i < workflow.blocks.length; i++) {
      const block = workflow.blocks[i];
      ctx.index = i;
      onStep?.(i, 'run');
      const step: RunStep = { blockId: block.id, type: block.type, status: 'ok', message: '' };
      try {
        step.message = await execute(block, ctx);
        record.steps.push(step);
        onStep?.(i, 'ok', step.message);
      } catch (e: any) {
        step.status = 'fail';
        step.message = e?.message || 'Ошибка блока';
        record.steps.push(step);
        record.status = 'failed';
        record.error = step.message;
        onStep?.(i, 'fail', step.message);
        break;
      }
    }
    if (ctx.payment) record.payment = ctx.payment;
    return record;
  } finally {
    runLock = false;
  }
};
