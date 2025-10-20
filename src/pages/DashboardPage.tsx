import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { playVideo } from 'tauri-plugin-videoplayer-api';
import { Dashboard } from './Dashboard/Dashboard';
import { useUiContextStore } from '../store/uiContextStore';
import { useOrientation } from '../hooks/useOrientation';
import type { Playlist, XtreamPlaylist, Channel, GroupedChannels, M3uPlaylist } from '../types/playlist';
import parser from 'iptv-playlist-parser';


function isXtreamPlaylist(playlist: Playlist): playlist is XtreamPlaylist {
  return playlist.type === 'xtream';
}

const DashboardPage = () => {
  const { session } = useAuthStore();
  const { lockStatus, setIsNativePlayerActive } = usePlayerStore();
  const requestLock = usePlayerStore(state => state.requestLock);
  const stopAndRelease = usePlayerStore(state => state.stopAndRelease);
  
  // --- STATE FOR M3U PLAYLISTS ONLY ---
  const [m3uPlaylists, setM3uPlaylists] = useState<M3uPlaylist[]>([]);
  const [hasXtreamPlaylists, setHasXtreamPlaylists] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null); 
  
  const [channels, setChannels] = useState<Channel[]>([]);
  const [groupedChannels, setGroupedChannels] = useState<GroupedChannels>({}); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('flat');
  const [searchTerm, setSearchTerm] = useState('');
  const apk = !!import.meta.env.VITE_APK;
  const orientation = useOrientation();
  console.log('Current orientation:', orientation);
  const setUiContext = useUiContextStore(state => state.setContext);

  useEffect(() => {
    setUiContext({ type: 'livetv-m3u', channels: channels });
  }, [channels, setUiContext]);
  // --- 1. FILTERING LOGIC: Separate M3U from Xtream ---
  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const allPlaylists = session.user.user_metadata.playlists as Playlist[];
      
      const m3u = allPlaylists.filter(p => !isXtreamPlaylist(p));
      const xtream = allPlaylists.filter(isXtreamPlaylist);

      setM3uPlaylists(m3u);
      setHasXtreamPlaylists(xtream.length > 0);

      if (m3u.length > 0) {
        const lastSelectedId = localStorage.getItem('lastSelectedPlaylistId');
        const isValid = m3u.some(p => p.id === lastSelectedId);
        setSelectedPlaylistId(isValid ? lastSelectedId : m3u[0].id);
      } else {
        setSelectedPlaylistId(null);
      }
    } else {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const fetchAndParsePlaylist = async () => {
      if (!selectedPlaylistId) { setChannels([]); setGroupedChannels({}); setIsLoading(false); setError("No M3U playlist selected."); return; }
      const selectedPlaylist = m3uPlaylists.find(p => p.id === selectedPlaylistId);
      if (!selectedPlaylist || isXtreamPlaylist(selectedPlaylist)) { return; }
      
      const m3uUrlToFetch = selectedPlaylist.url;
      setIsLoading(true); setError(null); setChannels([]); setGroupedChannels({});
      try {
        const response = await fetch(m3uUrlToFetch);
        if (!response.ok) throw new Error(`Failed to fetch playlist: ${response.statusText}`);
        const playlistText = await response.text();
        const result = parser.parse(playlistText);
        const formattedChannels = result.items.map(item => ({ name: item.name, url: item.url, logo: item.tvg.logo, group: item.group.title }));
        const grouped = formattedChannels.reduce((acc: GroupedChannels, channel) => { const groupName = channel.group || 'Uncategorized'; if (!acc[groupName]) acc[groupName] = []; acc[groupName].push(channel); return acc; }, {});
        setChannels(formattedChannels);
        setGroupedChannels(grouped);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to parse playlist: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParsePlaylist();
  }, [selectedPlaylistId, m3uPlaylists]);

  const filteredChannels = useMemo(() => {
    if (!searchTerm) return channels;
    return channels.filter(channel => channel.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, channels]); 

const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  const newId = e.target.value;
  setSelectedPlaylistId(newId);
  localStorage.setItem('lastSelectedPlaylistId', newId);
};

  const handleLogout = () => supabase.auth.signOut();
    const handleTakeover = useCallback(() => {
      if (lockStatus === 'LOCKED_BY_OTHER') requestLock();
    }, [lockStatus, requestLock]);

  const handleChannelClick = (channelUrl: string) => {
    if (lockStatus === 'ACQUIRED') { usePlayerStore.getState().playStream(channelUrl); } 
    else if (lockStatus === 'AVAILABLE') { requestLock(); sessionStorage.setItem('nextStreamUrl', channelUrl); } 
    else { alert(`Cannot play channel, lock status is: ${lockStatus}`); }
  };

  useEffect(() => {
    if (lockStatus === 'ACQUIRED') {
      const nextUrl = sessionStorage.getItem('nextStreamUrl');
      if (nextUrl) {
        if (apk) { setIsNativePlayerActive(true); playVideo(nextUrl); sessionStorage.removeItem('nextStreamUrl'); } 
        else { usePlayerStore.getState().playStream(nextUrl); sessionStorage.removeItem('nextStreamUrl'); }
      }
    }
  }, [lockStatus, apk, setIsNativePlayerActive]);

  // --- 2. Pass the filtered M3U playlists and the Playground button flag down ---
  const props = {
    apk, isSidebarOpen, setIsSidebarOpen, 
    m3uPlaylists, // Pass only M3U lists to the dropdown
    hasXtreamPlaylists, // Pass the flag
    selectedPlaylistId, handleTakeover, handlePlaylistChange, viewMode, setViewMode, searchTerm, setSearchTerm, isLoading, error, groupedChannels, filteredChannels, handleChannelClick, handleLogout, stopAndRelease, lockStatus,
  };
  return <Dashboard {...props} />
};

export default DashboardPage;