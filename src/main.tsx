import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom' 
import App from './App'
import './index.css'
import { useDebugStore } from './store/debugStore';

const originalConsole = { ...console };
const { addLog } = useDebugStore.getState();

console.log = (...args: unknown[]) => {
  originalConsole.log(...args);
  addLog('log', args);
};
console.warn = (...args: unknown[]) => {
  originalConsole.warn(...args);
  addLog('warn', args);
};
console.error = (...args: unknown[]) => {
  originalConsole.error(...args);
  addLog('error', args);
};
console.info = (...args: unknown[]) => {
  originalConsole.info(...args);
  addLog('info', args);
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  // <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>,
)