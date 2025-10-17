import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import type { Playlist } from '../types/playlist'; // Import our new types
import PlaylistDisplay from '../components/PlaylistDisplay';

const SettingsPage = () => {
  const { session } = useAuthStore();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // State for the form
  const [formType, setFormType] = useState<'m3u' | 'xtream'>('m3u');
  const [formName, setFormName] = useState('');
  // M3U fields
  const [formM3uUrl, setFormM3uUrl] = useState('');
  // Xtream fields
  const [formServerUrl, setFormServerUrl] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  // Common field
  const [formEpgUrl, setFormEpgUrl] = useState('');

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
    let newPlaylist: Playlist;
    if (formType === 'm3u') {
      if (!formName.trim() || !formM3uUrl.trim()) return setMessage('Name and URL are required for M3U.');
      newPlaylist = {
        id: uuidv4(),
        type: 'm3u',
        name: formName,
        url: formM3uUrl,
        epgUrl: formEpgUrl,
      };
    } else { // Xtream
      if (!formName.trim() || !formServerUrl.trim() || !formUsername.trim()) return setMessage('Name, Server URL, and Username are required for Xtream.');
      newPlaylist = {
        id: uuidv4(),
        type: 'xtream',
        name: formName,
        serverUrl: formServerUrl,
        username: formUsername,
        password: formPassword,
        epgUrl: formEpgUrl,
      };
    }
    const updatedPlaylists = [...playlists, newPlaylist];
    updateUserMetadata(updatedPlaylists);
    // Reset form
    setFormName(''); setFormM3uUrl(''); setFormServerUrl(''); setFormUsername(''); setFormPassword(''); setFormEpgUrl('');
  };

  const handleDeletePlaylist = (idToDelete: string) => {
    const updatedPlaylists = playlists.filter(p => p.id !== idToDelete);
    updateUserMetadata(updatedPlaylists);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manage Playlists</h1>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          &larr; Go Back
        </button>
      </div>

      {/* List of existing playlists */}
      <div className="space-y-4 mb-8">
        {playlists.length > 0 ? (
          playlists.map(playlist => (
            // --- THIS IS THE ONLY PART THAT CHANGES ---
            <PlaylistDisplay
              key={playlist.id}
              playlist={playlist}
              onDelete={handleDeletePlaylist}
              isLoading={loading}
            />
            // --- END OF CHANGE ---
          ))
        ) : (
          <p className="text-gray-400">You haven't added any playlists yet.</p>
        )}
      </div>
      
      {/* Form to add a new playlist */}
      <div className="p-6 bg-gray-800 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Add New Playlist</h2>
        
        {/* Type Toggle */}
        <div className="flex bg-gray-700 rounded-md p-1 mb-4">
          <button onClick={() => setFormType('m3u')} className={`flex-1 py-2 text-sm rounded-md ${formType === 'm3u' ? 'bg-blue-600' : ''}`}>M3U Playlist</button>
          <button onClick={() => setFormType('xtream')} className={`flex-1 py-2 text-sm rounded-md ${formType === 'xtream' ? 'bg-blue-600' : ''}`}>Xtream Codes</button>
        </div>

        {/* Common Name Input */}
        <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Playlist Name" className="w-full px-3 py-2 text-white bg-gray-700 rounded-md mb-4"/>

        {/* Conditional Form Fields */}
        {formType === 'm3u' ? (
          <input type="text" value={formM3uUrl} onChange={(e) => setFormM3uUrl(e.target.value)} placeholder="M3U Playlist URL" className="w-full px-3 py-2 text-white bg-gray-700 rounded-md mb-4"/>
        ) : (
          <div className="space-y-4 mb-4">
            <input type="text" value={formServerUrl} onChange={(e) => setFormServerUrl(e.target.value)} placeholder="Server URL (e.g., http://provider.com:8080)" className="w-full px-3 py-2 text-white bg-gray-700 rounded-md"/>
            <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="Username" className="w-full px-3 py-2 text-white bg-gray-700 rounded-md"/>
            <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Password (optional)" className="w-full px-3 py-2 text-white bg-gray-700 rounded-md"/>
          </div>
        )}
        
        {/* Optional EPG URL */}
        <input type="text" value={formEpgUrl} onChange={(e) => setFormEpgUrl(e.target.value)} placeholder="Optional EPG URL" className="w-full px-3 py-2 text-white bg-gray-700 rounded-md mb-4"/>

        <button onClick={handleAddPlaylist} disabled={loading} className="w-full md:w-auto px-4 py-2 font-semibold text-white bg-green-600 rounded-md">Add Playlist</button>
        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default SettingsPage;