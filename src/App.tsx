import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import { usePlayerStore } from './store/playerStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import { SettingsPage } from './pages/SettingsPage';
import { BUILT_IN_PLAYLISTS } from './config/playlists';
import DownloadPage from './pages/DownloadPage';
import { PlaygroundLayout } from './pages/Playground/PlaygroundLayout';
import { GeneralView } from './pages/Playground/GeneralView';
import { MoviesView } from './pages/Playground/MoviesView';
import { MovieCategoriesView } from './pages/Playground/MovieCategoriesView';
import { SeriesCategoriesView } from './pages/Playground/SeriesCategoriesView';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { SeriesView } from './pages/Playground/SeriesView';
import { LiveTvView } from './pages/Playground/LiveTvView';
import { DebugConsole } from './components/DebugConsole';
import { useEnvStore } from './store/envStore';
import { VideoPlayer } from './components/VideoPlayer';
import { RemoteEventLogger } from './components/RemoteEventLogger';


function App() {
  const { session, setSession } = useAuthStore();
  const subscribeToLock = usePlayerStore(state => state.subscribeToLock);
  const unsubscribeFromLock = usePlayerStore(state => state.unsubscribeFromLock);
  const isMpvActive = usePlayerStore(state => state.isMpvActive);
  const currentStreamUrl = usePlayerStore(state => state.currentStreamUrl);
  const { initializeEnv } = useEnvStore();

  useEffect(() => {
    initializeEnv();
  }, [initializeEnv]);

  // This hook now manages the subscription's entire lifecycle.
  useEffect(() => {
    if (session) {
      subscribeToLock(session); // User is logged in, create the connection.
    }
    // Cleanup function runs when session becomes null (logout).
    return () => {
      unsubscribeFromLock();
    };
  }, [session, subscribeToLock, unsubscribeFromLock]);

  // Your original Supabase auth listener.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let finalSession = session;

        if (_event === 'SIGNED_IN' && session) {
          const userPlaylists = session.user.user_metadata?.playlists;
          
          if (!userPlaylists || userPlaylists.length === 0) {
            console.log("New user or user with no playlists detected. Adding built-in playlists.");
            
            await supabase.auth.updateUser({
              data: { playlists: BUILT_IN_PLAYLISTS }
            });

            const { data: refreshedSessionData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error("Error refreshing session after adding playlists:", refreshError);
              setSession(null);
              return;
            }
            if (refreshedSessionData.session) {
              console.log("Session refreshed with new playlists.");
              finalSession = refreshedSessionData.session;
            } else {
              console.warn("Refreshed session data was null after adding playlists.");
            }
          }
        }
        
        setSession(finalSession);
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession]);


  return (
    <div className={` ${isMpvActive ? 'bg-transparent' : 'bg-gray-900'} text-white min-h-screen ${isMpvActive ? 'in-mpv-mode' : ''}`}>
      <DebugConsole />
      <RemoteEventLogger />
      <div className={`main-ui ${isMpvActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <Routes>
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />

        <Route path="/playground" element={<ProtectedRoute><PlaygroundLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/playground/general" replace />} />
          <Route path="general" element={<GeneralView />} />
          <Route path="movies" element={<MoviesView />} />
          <Route path="movies-categories" element={<MovieCategoriesView />} />
          <Route path="series-categories" element={<SeriesCategoriesView />} />
          <Route path="dev" element={<PlaygroundPage />} />
          <Route path="series" element={<SeriesView />} />
          <Route path="livetv" element={<LiveTvView />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
      </div>

      {currentStreamUrl && <VideoPlayer />}
    </div>
  );
}

export default App;