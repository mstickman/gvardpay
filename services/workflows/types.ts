export type BlockType = 'trigger' | 'calc' | 'compliance' | 'payment' | 'notify' | 'ledger';

export interface TriggerConfig {
  mode: 'monthly' | 'manual';
  dayOfMonth: number; // 1–28
  hour: number; // 0–23
}
export interface CalcConfig {
  amount: number;
  currency: 'SOL' | 'USD' | 'KZT';
}
export interface ComplianceConfig {
  maxUsd: number;
  allowedAddresses: string; // через пробел, запятую или перенос; пусто = без списка
}
export interface PaymentConfig {
  token: 'SOL' | 'USDC' | 'USDT';
  recipient: string;
  amount: number; // запасная сумма, если в цепочке нет блока расчёта
}
export interface NotifyConfig {
  message: string;
}
export type LedgerConfig = Record<string, never>;

export interface ConfigByType {
  trigger: TriggerConfig;
  calc: CalcConfig;
  compliance: ComplianceConfig;
  payment: PaymentConfig;
  notify: NotifyConfig;
  ledger: LedgerConfig;
}

export interface WorkflowBlock<T extends BlockType = BlockType> {
  id: string;
  type: T;
  config: ConfigByType[T];
}

export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  blocks: WorkflowBlock[];
  createdAt: number;
  lastRunAt?: number;
}

export interface RunStep {
  blockId: string;
  type: BlockType;
  status: 'ok' | 'fail';
  message: string;
}

export interface RunRecord {
  id: string;
  workflowId: string;
  workflowName: string;
  startedAt: number;
  manual: boolean;
  status: 'success' | 'failed';
  steps: RunStep[];
  payment?: { token: string; amount: number; to: string; signature: string };
  notifications: string[];
  error?: string;
}
