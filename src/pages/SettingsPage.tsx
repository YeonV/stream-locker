import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom';

interface Playlist {
  id: string;
  name: string;
  url: string;
}

const SettingsPage = () => {
  const { session } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const userMetadata = session?.user?.user_metadata;
    if (userMetadata?.playlists) {
      setPlaylists(userMetadata.playlists);
    }
  }, [session]);

  const updateUserMetadata = async (updatedPlaylists: Playlist[]) => {
    setLoading(true);
    setMessage('');
    
    const { error } = await supabase.auth.updateUser({
      data: { playlists: updatedPlaylists }
    });

    setLoading(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Update successful!');
      setPlaylists(updatedPlaylists);
      // Force a session refresh to ensure the entire app has the latest data
      await supabase.auth.refreshSession();
    }
  };

  const handleAddPlaylist = () => {
    if (!newName.trim() || !newUrl.trim()) {
      setMessage('Please provide a name and a URL.');
      return;
    }
    const newPlaylist: Playlist = { id: uuidv4(), name: newName, url: newUrl };
    const updatedPlaylists = [...playlists, newPlaylist];
    updateUserMetadata(updatedPlaylists);
    setNewName('');
    setNewUrl('');
  };

  const handleDeletePlaylist = (idToDelete: string) => {
    const updatedPlaylists = playlists.filter(p => p.id !== idToDelete);
    updateUserMetadata(updatedPlaylists);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Playlists</h1>
        <Link to="/" className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700">
          &larr; Back to Player
        </Link>
      </div>

      {/* List of existing playlists */}
      <div className="space-y-4 mb-8">
        {playlists.length > 0 ? (
          playlists.map(playlist => (
            <div key={playlist.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
              <div>
                <p className="font-semibold">{playlist.name}</p>
                <p className="text-sm text-gray-400 truncate">{playlist.url}</p>
              </div>
              <button
                onClick={() => handleDeletePlaylist(playlist.id)}
                disabled={loading}
                className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-400">You haven't added any playlists yet.</p>
        )}
      </div>

      {/* Form to add a new playlist */}
      <div className="p-6 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Add New Playlist</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Playlist Name (e.g., Main Provider)"
            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
          />
          <input
            type="text"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="M3U Playlist URL"
            className="w-full px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-md"
          />
          <button
            onClick={handleAddPlaylist}
            disabled={loading}
            className="w-full md:w-auto px-4 py-2 font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Playlist'}
          </button>
        </div>
        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default SettingsPage;