import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { v4 as uuidv4 } from 'uuid';
import type { Playlist } from '../types/playlist';
import PlaylistDisplay from '../components/PlaylistDisplay';
import { FiPlus, FiX } from 'react-icons/fi';

export const SettingsPage = () => {
  const { session } = useAuthStore();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);

  // Form state
  const [formType, setFormType] = useState<'m3u' | 'xtream'>('m3u');
  const [formName, setFormName] = useState('');
  const [formM3uUrl, setFormM3uUrl] = useState('');
  const [formServerUrl, setFormServerUrl] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEpgUrl, setFormEpgUrl] = useState('');

  // All handlers remain the same and are correct.
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
      await supabase.auth.refreshSession();
    }
  };

  const handleAddPlaylist = () => {
    let newPlaylist: Playlist;
    if (formType === 'm3u') {
      if (!formName.trim() || !formM3uUrl.trim()) return setMessage('Name and URL are required for M3U.');
      newPlaylist = { id: uuidv4(), type: 'm3u', name: formName, url: formM3uUrl, epgUrl: formEpgUrl };
    } else {
      if (!formName.trim() || !formServerUrl.trim() || !formUsername.trim()) return setMessage('Name, Server URL, and Username are required for Xtream.');
      newPlaylist = { id: uuidv4(), type: 'xtream', name: formName, serverUrl: formServerUrl, username: formUsername, password: formPassword, epgUrl: formEpgUrl };
    }
    const updatedPlaylists = [...playlists, newPlaylist];
    updateUserMetadata(updatedPlaylists);
    setFormName(''); setFormM3uUrl(''); setFormServerUrl(''); setFormUsername(''); setFormPassword(''); setFormEpgUrl('');
    setIsAddFormVisible(false);
  };

  const handleDeletePlaylist = (idToDelete: string) => {
    const updatedPlaylists = playlists.filter(p => p.id !== idToDelete);
    updateUserMetadata(updatedPlaylists);
  };

  return (
    // We remove the top-level div with the title and logout button.
    <div className="p-4 sm:p-8 max-w-4xl mx-auto text-text-primary">
      {/* Main Card for Playlists and Add Form */}
      <div className="p-6 bg-background-secondary rounded-lg border border-border-primary">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Your Playlists</h2>
          {!isAddFormVisible && (
            <button 
              onClick={() => setIsAddFormVisible(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary rounded-md hover:bg-primary-hover"
            >
              <FiPlus /> Add New Playlist
            </button>
          )}
        </div>

        {/* REFINED: The "Add New Playlist" form now appears here, right below the button */}
        {isAddFormVisible && (
          <div className="p-4 mb-4 bg-background-primary rounded-lg border border-border-primary">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Playlist</h3>
              <button 
                onClick={() => setIsAddFormVisible(false)}
                className="p-2 text-text-tertiary hover:bg-background-glass rounded-full"
                title="Cancel"
              >
                <FiX />
              </button>
            </div>
            
            <div className="flex bg-background-secondary rounded-md p-1 mb-4 border border-border-primary">
              <button onClick={() => setFormType('m3u')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${formType === 'm3u' ? 'bg-primary text-white' : 'hover:bg-background-glass'}`}>M3U Playlist</button>
              <button onClick={() => setFormType('xtream')} className={`flex-1 py-2 text-sm rounded-md transition-colors ${formType === 'xtream' ? 'bg-primary text-white' : 'hover:bg-background-glass'}`}>Xtream Codes</button>
            </div>
            <div className="space-y-4">
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Playlist Name" className="w-full px-3 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"/>
              {formType === 'm3u' ? (
                <input type="text" value={formM3uUrl} onChange={(e) => setFormM3uUrl(e.target.value)} placeholder="M3U Playlist URL" className="w-full px-3 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"/>
              ) : (
                <div className="space-y-4 p-4 border border-border-primary rounded-md bg-background-secondary">
                  <input type="text" value={formServerUrl} onChange={(e) => setFormServerUrl(e.target.value)} placeholder="Server URL (e.g., http://provider.com:8080)" className="w-full px-3 py-2 text-text-primary bg-background-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"/>
                  <input type="text" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="Username" className="w-full px-3 py-2 text-text-primary bg-background-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"/>
                  <input type="password" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} placeholder="Password (optional)" className="w-full px-3 py-2 text-text-primary bg-background-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"/>
                </div>
              )}
              <input type="text" value={formEpgUrl} onChange={(e) => setFormEpgUrl(e.target.value)} placeholder="Optional EPG URL" className="w-full px-3 py-2 text-text-primary bg-background-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus"/>
              <button onClick={handleAddPlaylist} disabled={loading} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50">
                <FiPlus /> Add Playlist
              </button>
              {message && <p className={`mt-4 text-sm ${message.startsWith('Error') ? 'text-error' : 'text-primary-focus'}`}>{message}</p>}
            </div>
          </div>
        )}
        
        {/* The list of playlists */}
        <div className="space-y-4">
          {playlists.length > 0 ? (
            playlists.map(playlist => (
              <PlaylistDisplay
                key={playlist.id}
                playlist={playlist}
                onDelete={handleDeletePlaylist}
                isLoading={loading}
              />
            ))
          ) : (
            <p className="text-text-tertiary">You haven't added any playlists yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};