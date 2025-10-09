import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './components/ProtectedRoute'
import SettingsPage from './pages/SettingsPage';
import { BUILT_IN_PLAYLISTS } from './config/playlists';
import DownloadPage from './pages/DownloadPage'

function App() {
  const { setSession } = useAuthStore()

  useEffect(() => {
    // 1. Initial session check on app load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. Auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        let finalSession = session; // Start with the session from the event

        if (_event === 'SIGNED_IN' && session) {
          const userPlaylists = session.user.user_metadata?.playlists;
          
          if (!userPlaylists || userPlaylists.length === 0) {
            console.log("New user or user with no playlists detected. Adding built-in playlists.");
            
            // Update metadata
            await supabase.auth.updateUser({
              data: { playlists: BUILT_IN_PLAYLISTS }
            });

            // CRITICAL: Refresh the session and use THIS as the final session
            const { data: refreshedSessionData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error("Error refreshing session after adding playlists:", refreshError);
              // Handle this error appropriately, maybe log out user or show a message
              setSession(null); // Force logout on refresh error
              return;
            }
            if (refreshedSessionData.session) {
              console.log("Session refreshed with new playlists.");
              finalSession = refreshedSessionData.session; // Use the refreshed session
            } else {
              console.warn("Refreshed session data was null after adding playlists.");
            }
          }
        }
        
        // Always update the store with the finalSession, ensuring the most up-to-date one is used.
        // This also handles LOGOUT events correctly (finalSession will be null).
        setSession(finalSession);
      }
    );

    return () => subscription.unsubscribe();
  }, [setSession]);


  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <Routes>
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/settings" element={
          <ProtectedRoute><SettingsPage /></ProtectedRoute>
        } />
        <Route 
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  )
}

export default App