import { ICONS } from '../../constants/icons';
import { BlockType, ConfigByType, Workflow, WorkflowBlock } from './types';

export interface BlockMeta {
  label: string; // тип блока (короткая подпись)
  title: string; // заголовок в цепочке
  icon: any;
  defaults: () => ConfigByType[BlockType];
}

export const BLOCK_ORDER: BlockType[] = ['trigger', 'calc', 'compliance', 'payment', 'notify', 'ledger'];

export const BLOCKS: Record<BlockType, BlockMeta> = {
  trigger: {
    label: 'Триггер',
    title: 'Проверка даты по календарю',
    icon: ICONS.blockTrigger,
    defaults: () => ({ mode: 'monthly', dayOfMonth: 5, hour: 10 }),
  },
  calc: {
    label: 'Расчёт',
    title: 'Расчёт суммы',
    icon: ICONS.blockCalc,
    defaults: () => ({ amount: 100, currency: 'USD' }),
  },
  compliance: {
    label: 'Комплаенс',
    title: 'Проверка получателя',
    icon: ICONS.blockCompliance,
    defaults: () => ({ maxUsd: 2000, allowedAddresses: '' }),
  },
  payment: {
    label: 'Платёж Solana',
    title: 'Выплата на Solana',
    icon: ICONS.blockPayment,
    defaults: () => ({ token: 'SOL', recipient: '', amount: 0 }),
  },
  notify: {
    label: 'Уведомление',
    title: 'Уведомление',
    icon: ICONS.blockNotify,
    defaults: () => ({ message: 'Выплата выполнена' }),
  },
  ledger: {
    label: 'Учёт',
    title: 'Запись в учёт',
    icon: ICONS.blockLedger,
    defaults: () => ({}),
  },
};

const short = (a: string) => (a && a.length > 9 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a || 'адрес не задан');

/** Короткое описание настройки блока для карточки в цепочке. */
export const describeBlock = (b: WorkflowBlock): string => {
  switch (b.type) {
    case 'trigger': {
      const c = b.config as ConfigByType['trigger'];
      return c.mode === 'manual' ? 'Только вручную' : `Каждое ${c.dayOfMonth}-е число, ${String(c.hour).padStart(2, '0')}:00`;
    }
    case 'calc': {
      const c = b.config as ConfigByType['calc'];
      return `${c.amount.toLocaleString('ru-RU')} ${c.currency === 'KZT' ? '₸' : c.currency}`;
    }
    case 'compliance': {
      const c = b.config as ConfigByType['compliance'];
      const list = c.allowedAddresses.trim() ? 'список адресов' : 'без списка адресов';
      return `Лимит $${c.maxUsd.toLocaleString('ru-RU')} · ${list}`;
    }
    case 'payment': {
      const c = b.config as ConfigByType['payment'];
      return `${c.token} · ${short(c.recipient)}`;
    }
    case 'notify':
      return (b.config as ConfigByType['notify']).message || 'Без текста';
    case 'ledger':
      return 'Журнал запусков + PDF-подтверждение';
  }
};

export const newId = (): string => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export const makeBlock = (type: BlockType): WorkflowBlock => ({
  id: newId(),
  type,
  config: BLOCKS[type].defaults(),
});

/** Шаблон «Выплата зарплаты» из мокапа — все шесть блоков, получатель пустой. */
export const salaryTemplate = (): WorkflowBlock[] =>
  BLOCK_ORDER.map((t) => {
    const b = makeBlock(t);
    if (t === 'calc') b.config = { amount: 450000, currency: 'KZT' };
    if (t === 'payment') b.config = { token: 'SOL', recipient: '', amount: 0 };
    return b;
  });

/** Что именно произойдёт при запуске — для окна подтверждения. */
export const planSummary = (w: Workflow): string => {
  const calc = w.blocks.find((b) => b.type === 'calc');
  const pay = w.blocks.find((b) => b.type === 'payment');
  const lines = [`Блоков в цепочке: ${w.blocks.length}`];
  if (pay) {
    const p = pay.config as ConfigByType['payment'];
    const amount = calc ? describeBlock(calc) : p.amount > 0 ? `${p.amount} ${p.token}` : 'сумма не задана';
    lines.push(`Платёж: ${amount} (${p.token}) → ${short(p.recipient)}`);
  } else {
    lines.push('Блока платежа нет, деньги отправлены не будут.');
  }
  return lines.join('\n');
};
