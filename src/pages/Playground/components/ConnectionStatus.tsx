import type { Profile } from '../../../types/playlist';

interface ConnectionStatusProps {
  profile: Profile | null;
}

export const ConnectionStatus = ({ profile }: ConnectionStatusProps) => {
  if (!profile) {
    return null; // Don't render anything if there's no profile
  }

  const { status, active_cons, max_connections } = profile.user_info;
  const is_active = status.toLowerCase() === 'active';

  return (
    <div className="p-6 bg-background-secondary rounded-lg border border-border-primary">
      <h2 className="text-xl font-bold mb-4">Connection Info</h2>
      <div className="flex justify-between items-center text-sm">
        <div className="flex flex-col gap-2">
          <span className="text-text-secondary">Status:</span>
          <span className="text-text-secondary">Active Connections:</span>
        </div>
        <div className="flex flex-col gap-2 items-end font-mono">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${is_active ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={is_active ? 'text-green-400' : 'text-red-400'}>{status}</span>
          </div>
          <span>{active_cons} / {max_connections}</span>
        </div>
      </div>
    </div>
  );
};