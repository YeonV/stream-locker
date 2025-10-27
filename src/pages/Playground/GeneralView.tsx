import { useApiStore } from '../../store/apiStore';
import { DataSyncPanel } from './components/DataSyncPanel';

export const GeneralView = () => {
  const { xtreamApi } = useApiStore();
  

  if (!xtreamApi) {
    return (
       <div className="p-4 sm:p-8">
         <div className="p-6 bg-background-secondary rounded-lg border border-border-primary text-error">
           No active Xtream connection. Select a valid playlist from the header.
         </div>
       </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-8">      
      <DataSyncPanel />     
    </div>
  );
};