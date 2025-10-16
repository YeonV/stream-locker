import { useHotkeys } from 'react-hotkeys-hook';
import { useDebugStore, type LogEntry } from '../store/debugStore';
import { FiX, FiTrash2, FiAlertTriangle, FiInfo, FiXCircle } from 'react-icons/fi';

const LogLevelIndicator = ({ level }: { level: LogEntry['level'] }) => {
  switch (level) {
    case 'error':
      return <FiXCircle className="text-red-500 flex-shrink-0" />;
    case 'warn':
      return <FiAlertTriangle className="text-yellow-500 flex-shrink-0" />;
    case 'info':
      return <FiInfo className="text-blue-500 flex-shrink-0" />;
    default:
      return <span className="text-gray-500 flex-shrink-0">{'>'}</span>;
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

export const DebugConsole = () => {
  const { isOpen, logs, clearLogs, toggleConsole } = useDebugStore();

  useHotkeys('ctrl+alt+d', () => toggleConsole(), { preventDefault: true });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full h-full max-w-4xl max-h-[80vh] bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl flex flex-col">
        <header className="flex items-center justify-between p-3 border-b border-gray-700 flex-shrink-0">
          <h2 className="font-mono text-lg font-bold">In-App Console</h2>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500 font-mono">Toggle: Ctrl+Alt+D</span>
            <button
              onClick={clearLogs}
              className="p-2 text-gray-400 hover:bg-gray-700 rounded-full"
              title="Clear Console"
            >
              <FiTrash2 size={18} />
            </button>
            <button
              onClick={() => toggleConsole()}
              className="p-2 text-gray-400 hover:bg-gray-700 rounded-full"
              title="Close Console"
            >
              <FiX size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 font-mono text-sm">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className={`flex items-start space-x-3 py-1 border-b border-gray-800 ${getLevelColorClass(log.level)}`}
              >
                <span className="text-gray-600">{log.timestamp}</span>
                <LogLevelIndicator level={log.level} />
                <pre className="whitespace-pre-wrap break-words w-full">{log.message}</pre>
              </div>
            ))
          )}
        </main>
      </div>
    </div>
  );
};