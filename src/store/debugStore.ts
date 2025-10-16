import { create } from 'zustand';

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: string;
}

interface DebugStoreState {
  logs: LogEntry[];
  isOpen: boolean;
  addLog: (level: LogEntry['level'], args: unknown[]) => void;
  clearLogs: () => void;
  toggleConsole: () => void;
}

const formatMessage = (args: unknown[]): string => {
  return args
    .map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.stack || arg.message;
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return '[Unserializable Object]';
      }
    })
    .join(' ');
};

export const useDebugStore = create<DebugStoreState>((set, get) => ({
  logs: [],
  isOpen: false,
  addLog: (level, args) => {
    const newLog: LogEntry = {
      id: Date.now() + Math.random(), // Simple unique ID
      timestamp: new Date().toLocaleTimeString(),
      level,
      message: formatMessage(args),
    };
    set({ logs: [newLog, ...get().logs] });
  },
  clearLogs: () => set({ logs: [] }),
  toggleConsole: () => set(state => ({ isOpen: !state.isOpen }))
}));