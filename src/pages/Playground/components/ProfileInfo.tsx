// Define a type for the prop we'll pass to this component

import type { Profile } from "../../../types/playlist";

interface ProfileInfoProps {
  profile: Profile;
}

// Helper function to format Unix timestamps (which are strings in the JSON)
const formatTimestamp = (timestamp: string) => {
  const date = new Date(parseInt(timestamp, 10) * 1000);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

export const ProfileInfo = ({ profile }: ProfileInfoProps) => {
  const { user_info, server_info } = profile;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* User Info Card */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">User Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Username:</span>
            <span className="font-mono">{user_info.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`font-semibold ${user_info.status === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
              {user_info.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Expires:</span>
            <span>{formatTimestamp(user_info.exp_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Connections:</span>
            <span>{user_info.active_cons} / {user_info.max_connections}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Formats:</span>
            <span className="font-mono">{user_info.allowed_output_formats.join(', ')}</span>
          </div>
        </div>
      </div>

      {/* Server Info Card */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Server Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Server Time:</span>
            <span>{server_info.time_now}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Timezone:</span>
            <span>{server_info.timezone}</span>
          </div>
        </div>
      </div>
    </div>
  );
};