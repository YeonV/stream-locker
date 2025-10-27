import type { Playlist, XtreamPlaylist } from '../../types/playlist';
import { ClosePlaygroundButton } from './components/Header/ClosePlaygroundButton';
import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { CloseSettingsButton } from './components/Header/CloseSettingsButton';
import { FireTvBottomStatus } from './components/Footer/FireTvBottomStatus';
import { useUiContextStore } from '../../store/uiContextStore';
import { FireTvNavigation } from './components/Header/FireTvNavigation';
import { MobileBottomNavi } from './components/Footer/MobileBottomNavi';
import { PlaylistSelector } from './components/Header/PlaylistSelector';
import { DownloadAndroid } from '../../components/Download/DownloadAndroid';
import { SmartStopButton } from '../../components/SmartStopButton';
import { HeaderContainer } from './components/Header/HeaderContainer';
import { CategorySwitch } from './components/Header/CategorySwitch';
import { useFooterStore } from '../../store/footerStore';
import { SettingsButton } from './components/Header/SettingsButton';
import { TopNavigation } from './components/Header/TopNavigation';
import { ConsoleButton } from './components/Header/ConsoleButton';
import { useAuthStore } from '../../store/authStore';
import { LogoutButton } from './components/Header/LogoutButton';
import { useApiStore } from '../../store/apiStore';
import { useEnvStore } from '../../store/envStore';
import { useHotkeys } from 'react-hotkeys-hook'
import { version } from '../../../package.json';

export const PlaygroundLayout = () => {

  const { session } = useAuthStore();
  const { pathname } = useLocation();

  const device = useEnvStore(state => state.device);
  const focusedCoordinate = useUiContextStore(state => state.focusedCoordinate);
  const initializeApi = useApiStore(state => state.initializeApi);
  const setForward = useFooterStore(state => state.setForward);
  const setRewind = useFooterStore(state => state.setRewind);
  const clearApi = useApiStore(state => state.clearApi);
  const setPlay = useFooterStore(state => state.setPlay);

  const [xtreamPlaylists, setXtreamPlaylists] = useState<XtreamPlaylist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [devMode, setDevMode] = useState(false);

  const isSettings = pathname === '/playground/settings'
  const isMoviesSection = pathname.startsWith('/playground/movies');
  const isSeriesSection = pathname.startsWith('/playground/series');

  const handlePlaylistChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPlaylistId(e.target.value);
  };

  useHotkeys(['ctrl+alt+y', 'ctrl+alt+z'], () => setDevMode(!devMode));

  useHotkeys('ArrowDown', (e) => {
    e.preventDefault();
    const isFocusInHeader = (document.activeElement?.closest('#main-nav') !== null);
    if (isFocusInHeader) {
      const mainContent = document.querySelector('main');

      // First, try to find stream-row elements
      const firstRow = mainContent?.querySelector('[data-testid="stream-row"]');
      const firstFocusableElementInRow = firstRow?.querySelector(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusableElementInRow) {
        firstFocusableElementInRow.focus();
      } else {
        // Fall back to general focusable elements
        const firstFocusableElement = mainContent?.querySelector(
          'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (firstFocusableElement) {
          firstFocusableElement.focus();
        }
      }
    }
  }, {
    enableOnFormTags: true,
    enabled: focusedCoordinate === null
  });

  useHotkeys('MediaPlayPause', (e) => {
    e.preventDefault();
    const header = document.querySelector('#main-nav');
    const mainContent = document.querySelector('main');
    // Determine where the focus currently is
    const isFocusInHeader = (document.activeElement?.closest('#main-nav') !== null);

    if (isFocusInHeader) {
      // Move focus to main content
      const firstFocusableElement = mainContent?.querySelector(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    } else {
      // Move focus to header
      const firstFocusableElement = header?.querySelector(
        'a[href], button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }, {
    enableOnFormTags: true
  });

  useEffect(() => {
    setPlay('Toggle Focus');
    setRewind('');
    setForward('');
  }, [setPlay, setRewind, setForward]);

  useEffect(() => {
    if (session?.user?.user_metadata?.playlists) {
      const allPlaylists = session.user.user_metadata.playlists as Playlist[];
      const xtream = allPlaylists.filter(p => p.type === 'xtream') as XtreamPlaylist[];
      setXtreamPlaylists(xtream);
      if (xtream.length > 0) {
        setSelectedPlaylistId(xtream[0].id);
      } else {
        setSelectedPlaylistId(null);
      }
    }
  }, [session]);

  useEffect(() => {
    if (selectedPlaylistId) {
      const selected = xtreamPlaylists.find(p => p.id === selectedPlaylistId);
      if (selected) {
        initializeApi(selected);
      }
    }
  }, [selectedPlaylistId, xtreamPlaylists, initializeApi]);

  useEffect(() => {
    return () => {
      clearApi();
    };
  }, [clearApi]);

  return (
    <div className="h-screen w-screen bg-background-primary text-text-primary flex flex-col">
      <HeaderContainer>
        {isSettings && <h1 className="text-xl font-bold">Settings | Stream Locker v{version}</h1>}
        {!isSettings && device === 'firetv'
          ? <FireTvNavigation />
          : <><TopNavigation xtreamPlaylists={xtreamPlaylists} devMode={devMode} />{(isMoviesSection || isSeriesSection) && <CategorySwitch />}</>
        }

        <div className="ml-auto flex items-center space-x-4">
          {!isSettings && <PlaylistSelector xtreamPlaylists={xtreamPlaylists} selectedPlaylistId={selectedPlaylistId} handlePlaylistChange={handlePlaylistChange} />}
          {(device === 'android' || device === 'firetv' || device === 'androidtv') && <DownloadAndroid />}
          {import.meta.env.PROD && <ConsoleButton />}
          <SmartStopButton />
          {!isSettings && <SettingsButton />}
          {!isSettings && <ClosePlaygroundButton />}
          {isSettings && <LogoutButton />}
          {isSettings && <CloseSettingsButton />}
        </div>
      </HeaderContainer>
      <main className="flex-1 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      {device === 'firetv' && <FireTvBottomStatus />}
      {device !== 'firetv' && <MobileBottomNavi />}
    </div>
  );
};