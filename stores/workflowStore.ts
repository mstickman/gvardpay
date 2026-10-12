import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NetworkName } from '../constants/config';
import { BlockType, RunRecord, Workflow } from '../services/workflows/types';
import { makeBlock, newId, salaryTemplate } from '../services/workflows/blocks';
import { runWorkflow, StepCallback } from '../services/workflows/engine';

const WORKFLOWS_KEY = 'gvardpay_workflows';
const RUNS_KEY = 'gvardpay_workflow_runs';
const MAX_RUNS = 100;

interface WorkflowState {
  workflows: Workflow[];
  runs: RunRecord[];
  loaded: boolean;

  load: () => Promise<void>;
  createWorkflow: (kind: 'empty' | 'salary') => string;
  renameWorkflow: (id: string, name: string) => void;
  setActive: (id: string, active: boolean) => void;
  deleteWorkflow: (id: string) => void;
  addBlock: (id: string, type: BlockType) => void;
  updateBlock: (id: string, blockId: string, config: any) => void;
  removeBlock: (id: string, blockId: string) => void;
  moveBlock: (id: string, blockId: string, dir: -1 | 1) => void;
  run: (id: string, opts: { manual: boolean; network: NetworkName }, onStep?: StepCallback) => Promise<RunRecord>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => {
  const persist = () => {
    const { workflows, runs } = get();
    AsyncStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows)).catch(() => {});
    AsyncStorage.setItem(RUNS_KEY, JSON.stringify(runs)).catch(() => {});
  };

  const patch = (id: string, fn: (w: Workflow) => Workflow) => {
    set((s) => ({ workflows: s.workflows.map((w) => (w.id === id ? fn(w) : w)) }));
    persist();
  };

  return {
    workflows: [],
    runs: [],
    loaded: false,

    load: async () => {
      try {
        const [w, r] = await Promise.all([AsyncStorage.getItem(WORKFLOWS_KEY), AsyncStorage.getItem(RUNS_KEY)]);
        set({
          workflows: w ? JSON.parse(w) : [],
          runs: r ? JSON.parse(r) : [],
          loaded: true,
        });
      } catch {
        set({ loaded: true });
      }
    },

    createWorkflow: (kind) => {
      const wf: Workflow = {
        id: newId(),
        name: kind === 'salary' ? 'Выплата зарплаты' : 'Новый сценарий',
        active: false,
        blocks: kind === 'salary' ? salaryTemplate() : [],
        createdAt: Date.now(),
      };
      set((s) => ({ workflows: [wf, ...s.workflows] }));
      persist();
      return wf.id;
    },

    renameWorkflow: (id, name) => patch(id, (w) => ({ ...w, name })),
    setActive: (id, active) => patch(id, (w) => ({ ...w, active })),

    deleteWorkflow: (id) => {
      set((s) => ({ workflows: s.workflows.filter((w) => w.id !== id) }));
      persist();
    },

    addBlock: (id, type) => patch(id, (w) => ({ ...w, blocks: [...w.blocks, makeBlock(type)] })),

    updateBlock: (id, blockId, config) =>
      patch(id, (w) => ({
        ...w,
        blocks: w.blocks.map((b) => (b.id === blockId ? { ...b, config } : b)),
      })),

    removeBlock: (id, blockId) => patch(id, (w) => ({ ...w, blocks: w.blocks.filter((b) => b.id !== blockId) })),

    moveBlock: (id, blockId, dir) =>
      patch(id, (w) => {
        const i = w.blocks.findIndex((b) => b.id === blockId);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= w.blocks.length) return w;
        const blocks = [...w.blocks];
        [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
        return { ...w, blocks };
      }),

    run: async (id, opts, onStep) => {
      const wf = get().workflows.find((w) => w.id === id);
      if (!wf) throw new Error('Сценарий не найден');
      const record = await runWorkflow(wf, opts, onStep);
      set((s) => ({
        runs: [record, ...s.runs].slice(0, MAX_RUNS),
        workflows: s.workflows.map((w) =>
          w.id === id && record.status === 'success' ? { ...w, lastRunAt: record.startedAt } : w,
        ),
      }));
      persist();
      return record;
    },
  };
});
