import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { session, loading } = useAuthStore();

  if (loading) {
    // While we're checking for a session, show a loading screen.
    // This prevents the dashboard from rendering prematurely.
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p> 
      </div>
    );
  }

  if (!session) {
    // Now that we're done loading and there's no session, redirect.
    return <Navigate to="/login" replace />;
  }

  // We are done loading and a session exists. Render the children.
  return <>{children}</>;
};

export default ProtectedRoute;