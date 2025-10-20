import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useEnvStore } from '../store/envStore';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const { engine } = useEnvStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) navigate('/', { replace: true });
  }, [session, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else navigate('/');
  };

  if (session) return null;

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-background-primary text-text-primary">
      <motion.div
        className="w-full max-w-5xl flex flex-col md:flex-row md:items-stretch md:space-x-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* === LEFT COLUMN (Branding + Footer) === */}
        <div className="flex-1 flex flex-col text-center p-8">
          {/* Main Branding Content - Centered */}
          <div className="flex flex-col items-center">
            <motion.img 
              src={logo} 
              alt="Logo" 
              className="w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl" 
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            />
            <h1 className="text-2xl font-bold mt-4 text-text-secondary">
              Guard Your Stream.
            </h1>
            <p className="max-w-md text-sm text-text-tertiary mt-2">
              Prevent account bans from simultaneous streams. Sync playlists across all devices.
            </p>
          </div>
          
          {/* This spacer div pushes the footer to the bottom */}
          <div className="flex-grow" />

          {/* Footer Section - Anchored at the bottom */}
          <footer className="mt-8 text-sm text-text-tertiary">
            <p>
              {engine === 'web' && <Link to="/download" className="hover:text-primary-focus hover:underline">Download App</Link>}
              {engine === 'web' && ' | '}
              Hacked by <a href="https://github.com/YeonV" className="text-primary-focus hover:underline">Blade</a>
            </p>
          </footer>
        </div>

        {/* === RIGHT COLUMN (Login Form) === */}
        <div className="w-full max-w-sm mx-auto md:mx-0 p-8 space-y-4 bg-background-glass rounded-lg shadow-xl border border-border-primary backdrop-blur-sm flex flex-col justify-center">
          <h2 className="text-2xl font-bold text-center">Secure Login</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-text-primary bg-background-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 mt-1 text-text-primary bg-background-secondary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary-focus" required />
            </div>
            <motion.button type="submit" disabled={loading}
              className="w-full py-2.5 font-semibold text-white bg-primary rounded-md hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background-secondary focus:ring-primary-focus"
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {loading ? 'Securing...' : 'Login & Secure'}
            </motion.button>
            {error && <p className="text-sm text-center text-error">{error}</p>}
          </form>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-border-primary"></div>
            <span className="flex-shrink mx-4 text-text-tertiary">OR</span>
            <div className="flex-grow border-t border-border-primary"></div>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-text-secondary">Continue without an account for a local-only experience.</p>
            <button className="w-full mt-2 py-2.5 font-semibold text-text-secondary bg-background-secondary rounded-md border border-border-primary hover:bg-border-primary hover:text-text-primary transition-colors">
              Start Lockless
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;