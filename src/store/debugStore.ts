import { create } from 'zustand';

export interface LogEntry {
  id: number;
  timestamp: string;
  level: 'log' | 'warn' | 'error' | 'info';
  message: unknown[];
}

interface DebugStoreState {
  logs: LogEntry[];
  isOpen: boolean;
  filterTerm: string;
  addLog: (level: LogEntry['level'], args: unknown[]) => void;
  clearLogs: () => void;
  toggleConsole: () => void;
  setFilterTerm: (term: string) => void;
}

export const formatMessage = (args: unknown[]): string => {
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
  filterTerm: '', // NEW: Initialize as empty
  
  addLog: (level, args) => {
    // This is NOT the place for filtering. We always store ALL logs.
    const newLog: LogEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString(),
      level,
      // Change: We now store the raw args, not the formatted string.
      // This is for react-json-view. We will format on-the-fly for search.
      message: args, // STORE THE RAW ARGS
    };
    set({ logs: [newLog, ...get().logs] });
  },
  
  clearLogs: () => set({ logs: [] }),
  toggleConsole: () => set(state => ({ isOpen: !state.isOpen })),
  setFilterTerm: (term) => set({ filterTerm: term }), // NEW: The setter action
}));

// We need to re-export the LogEntry type but with the message type changed
export type NewLogEntry = Omit<LogEntry, 'message'> & { message: unknown[] };