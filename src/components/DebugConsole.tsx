import { useHotkeys } from 'react-hotkeys-hook';
import { useDebugStore, type NewLogEntry as LogEntry } from '../store/debugStore';
import { FiX, FiTrash2, FiSearch, FiAlertTriangle, FiInfo, FiXCircle } from 'react-icons/fi';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo, type JSX } from 'react';
import ReactJson from 'react-json-view';

const LogLevelIndicator = ({ level }: { level: LogEntry['level'] }) => {
  switch (level) {
    case 'error': return <FiXCircle className="text-red-500 flex-shrink-0" />;
    case 'warn': return <FiAlertTriangle className="text-yellow-500 flex-shrink-0" />;
    case 'info': return <FiInfo className="text-blue-500 flex-shrink-0" />;
    default: return <span className="text-gray-500 flex-shrink-0">{'>'}</span>;
  }
};
const getLevelColorClass = (level: LogEntry['level']): string => {
  switch (level) {
    case 'error': return 'text-red-400';
    case 'warn': return 'text-yellow-400';
    case 'info': return 'text-blue-400';
    default: return 'text-gray-300';
  }
};
const formatForDisplay = (args: unknown[]): { content: JSX.Element | string; searchableString: string } => {
  const searchableParts: string[] = [];
  const displayParts: (JSX.Element | string)[] = [];
  args.forEach((arg, index) => {
    if (typeof arg === 'string') {
      searchableParts.push(arg);
      displayParts.push(arg);
    } else if (arg instanceof Error) {
      const errorString = arg.stack || arg.message;
      searchableParts.push(errorString);
      displayParts.push(errorString);
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        const jsonString = JSON.stringify(arg);
        searchableParts.push(jsonString);
        displayParts.push(
          <ReactJson
            key={index}
            src={arg}
            theme="monokai"
            iconStyle="circle"
            collapsed={1}
            style={{ backgroundColor: 'transparent' }}
            displayDataTypes={false}
            name={false}
          />
        );
      } catch {
        const unserializable = '[Unserializable Object]';
        searchableParts.push(unserializable);
        displayParts.push(unserializable);
      }
    } else {
      const simpleString = String(arg);
      searchableParts.push(simpleString);
      displayParts.push(simpleString);
    }
  });
  const content = <>{displayParts.map((part, i) => <span key={i}>{part} </span>)}</>;
  return { content, searchableString: searchableParts.join(' ') };
};


export const DebugConsole = () => {
  const { isOpen, logs, filterTerm, clearLogs, toggleConsole, setFilterTerm } = useDebugStore();

  useHotkeys('ctrl+alt-d', () => toggleConsole(), { preventDefault: true });
  
    const filteredLogs = useMemo(() => {
    if (!filterTerm) return logs;
    const lowerCaseFilter = filterTerm.toLowerCase();
    return logs.filter(log => {
      const { searchableString } = formatForDisplay(log.message);
      return searchableString.toLowerCase().includes(lowerCaseFilter);
    });
  }, [logs, filterTerm]);
  
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  if (import.meta.env.DEV || !isOpen) {
    return null;
  }
  
  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-4xl max-h-[80vh] bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
        <header className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
          <h2 className="font-mono text-lg font-bold">In-App Console</h2>
          <div className="relative flex-1 mx-4">
            <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md pl-10 pr-4 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-mono">Toggle: Ctrl+Alt+D</span>
            <button onClick={clearLogs} className="p-2 text-gray-400 hover:bg-gray-700 rounded-full" title="Clear Console"><FiTrash2 size={18} /></button>
            <button onClick={toggleConsole} className="p-2 text-gray-400 hover:bg-gray-700 rounded-full" title="Close Console"><FiX size={20} /></button>
          </div>
        </header>

        <main ref={parentRef} className="flex-1 overflow-y-auto font-mono text-sm">
          {filteredLogs.length === 0 ? (
            <p className="p-3 text-gray-500">No logs match your filter...</p>
          ) : (
            <div
              className="relative w-full"
              style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
            >
              {virtualItems.map(virtualItem => {
                const log = filteredLogs[virtualItem.index];
                if (!log) return null;
                const { content } = formatForDisplay(log.message);
                return (
                  <div
                    key={log.id}
                    data-index={virtualItem.index}
                    ref={rowVirtualizer.measureElement}
                    className="absolute top-0 left-0 w-full"
                    style={{
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <div
                      className={`flex items-start space-x-3 p-2 border-b border-gray-800 h-full ${getLevelColorClass(log.level)}`}
                    >
                      <span className="text-gray-600 pt-1">{log.timestamp}</span>
                      <div className="pt-1"><LogLevelIndicator level={log.level} /></div>
                      <div className="whitespace-pre-wrap break-words w-full">{content}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};