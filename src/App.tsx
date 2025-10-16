import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import SettingsPage from './pages/SettingsPage';
import { BUILT_IN_PLAYLISTS } from './config/playlists';
import DownloadPage from './pages/DownloadPage';

// Import the new layout and all the view components
import { PlaygroundLayout } from './pages/Playground/PlaygroundLayout';
import { GeneralView } from './pages/Playground/GeneralView';
import { MoviesView } from './pages/Playground/MoviesView';
import { MovieCategoriesView } from './pages/Playground/MovieCategoriesView';
import { SeriesCategoriesView } from './pages/Playground/SeriesCategoriesView';
import { PlaygroundPage } from './pages/PlaygroundPage';
import { SeriesView } from './pages/Playground/SeriesView';
// You will create SeriesView and LiveTVView later
// import { SeriesView } from './pages/Playground/SeriesView'; 
import { LiveTvView } from './pages/Playground/LiveTvView';
import { DebugConsole } from './components/DebugConsole';

function App() {
  const { setSession } = useAuthStore();

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
    <div className="bg-gray-900 text-white min-h-screen">
      <DebugConsole />
      <Routes>
        {/* --- Public Routes --- */}
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* --- Root Redirect --- */}
        {/* Users going to "/" will be automatically sent to "/dashboard" */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* --- Protected App Routes --- */}
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />

        {/* --- Playground Routes --- */}
        <Route path="/playground" element={<PlaygroundLayout />}>
          <Route index element={<Navigate to="/playground/general" replace />} />
          <Route path="general" element={<GeneralView />} />
          <Route path="movies" element={<MoviesView />} />
          <Route path="movies-categories" element={<MovieCategoriesView />} />
          <Route path="series-categories" element={<SeriesCategoriesView />} />
          <Route path="dev" element={<PlaygroundPage />} />
          {/* Add these back when you create the components */}
          <Route path="series" element={<SeriesView />} />
          <Route path="livetv" element={<LiveTvView />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;