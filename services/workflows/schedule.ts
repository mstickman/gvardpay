import { TriggerConfig, Workflow } from './types';

/**
 * Пора ли запускать сценарий автоматически (при открытии приложения).
 * monthly: сегодня нужный день, час уже наступил, в этом месяце ещё не запускался.
 */
export const isDue = (w: Workflow, now: Date = new Date()): boolean => {
  if (!w.active) return false;
  const trigger = w.blocks.find((b) => b.type === 'trigger');
  if (!trigger) return false;
  const c = trigger.config as TriggerConfig;
  if (c.mode !== 'monthly') return false;
  if (now.getDate() !== c.dayOfMonth) return false;
  if (now.getHours() < c.hour) return false;
  if (w.lastRunAt) {
    const last = new Date(w.lastRunAt);
    if (last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth()) return false;
  }
  return true;
};
