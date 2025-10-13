/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react'; // <-- Import useRef and useCallback
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useStreamLock } from '../hooks/useStreamLock';
import parser from 'iptv-playlist-parser';
import { playVideo } from 'tauri-plugin-videoplayer-api';
import type { Playlist, XtreamPlaylist, Channel, GroupedChannels } from '../types/playlist';
import { ApkLandscapeLayout } from './Dashboard/components/ApkLandscapeLayout';
import { WebAndApkPortraitLayout } from './Dashboard/components/WebAndApkPortraitLayout';

const getOrientation = () => window.screen.orientation.type.split('-')[0];
const useOrientation = () => {
  const [orientation, setOrientation] = useState(getOrientation());
  useEffect(() => {
    const handleOrientationChange = () => setOrientation(getOrientation());
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);
  return orientation;
};

function isXtreamPlaylist(playlist: Playlist): playlist is XtreamPlaylist {
  return playlist.type === 'xtream';
}

const DashboardPage = () => {
  const { session } = useAuthStore();
  const { lockStatus, setIsNativePlayerActive  } = usePlayerStore();
  const { requestLock, stopAndRelease, forceRelease } = useStreamLock();
  
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
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

  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const userPlaylists = session.user.user_metadata.playlists as Playlist[];
      setAvailablePlaylists(userPlaylists);
      if (userPlaylists.length > 0) {
        const lastSelectedId = localStorage.getItem('lastSelectedPlaylistId');
        const isValid = userPlaylists.some(p => p.id === lastSelectedId);
        setSelectedPlaylistId(isValid ? lastSelectedId : userPlaylists[0].id);
      } else {
        setSelectedPlaylistId(null);
      }
    } else {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const fetchAndParsePlaylist = async () => {
      if (!selectedPlaylistId) { setChannels([]); setGroupedChannels({}); setIsLoading(false); setError("No playlist selected."); return; }
      const selectedPlaylist = availablePlaylists.find(p => p.id === selectedPlaylistId);
      if (!selectedPlaylist) { setChannels([]); setGroupedChannels({}); setIsLoading(false); setError("Selected playlist not found."); return; }
      const m3uUrlToFetch: string | null = isXtreamPlaylist(selectedPlaylist) ? `${selectedPlaylist.serverUrl}/get.php?username=${selectedPlaylist.username}&password=${selectedPlaylist.password || ''}&type=m3u_plus&output=ts` : selectedPlaylist.url;
      if (!m3uUrlToFetch) { setError("Could not determine the M3U URL for this playlist."); return; }
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
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndParsePlaylist();
  }, [selectedPlaylistId, availablePlaylists]);

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
    const handleReload = () => {
    // If another device has the lock, force it to release.
    if (usePlayerStore.getState().lockStatus === 'LOCKED_BY_OTHER') {
      forceRelease();
    }
    // Then, reload the local page. The small delay ensures the RPC call is sent.
    setTimeout(() => window.location.reload(), 300);
  };

  const handleChannelClick = (channelUrl: string) => {
    if (lockStatus === 'ACQUIRED') {
      usePlayerStore.getState().playStream(channelUrl);
    } else if (lockStatus === 'AVAILABLE') {
      requestLock();
      sessionStorage.setItem('nextStreamUrl', channelUrl);
    } else {
      alert(`Cannot play channel, lock status is: ${lockStatus}`);
    }
  };

  useEffect(() => {
    if (lockStatus === 'ACQUIRED') {
      const nextUrl = sessionStorage.getItem('nextStreamUrl');
      if (nextUrl) {
        if (apk) {
          // 1. Arm the "tripwire" by setting our flag
          setIsNativePlayerActive(true);
          // 2. Play the native video
          playVideo(nextUrl);
          // 3. Clear the temp item. DO NOT release the lock.
          sessionStorage.removeItem('nextStreamUrl');
        } else {
          // This is the existing, correct web logic
          usePlayerStore.getState().playStream(nextUrl);
          sessionStorage.removeItem('nextStreamUrl');
        }
      }
    }
  }, [lockStatus, apk, setIsNativePlayerActive]);

  const props = {
    apk, isSidebarOpen, setIsSidebarOpen, availablePlaylists, selectedPlaylistId, handleReload, handlePlaylistChange, viewMode, setViewMode, searchTerm, setSearchTerm, isLoading, error, groupedChannels, filteredChannels, handleChannelClick, handleLogout, stopAndRelease, lockStatus,
  };

  if (apk && orientation === 'landscape') {
    return <ApkLandscapeLayout {...props} />;
  }

  return <WebAndApkPortraitLayout {...props} />;
};

export default DashboardPage;