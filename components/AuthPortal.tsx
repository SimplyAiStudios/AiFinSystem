
import React, { useState } from 'react';
import { UserIcon, LoaderIcon } from './icons';

interface AuthPortalProps {
  onLogin: (username: string) => void;
}

const AuthPortal: React.FC<AuthPortalProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);

    // Simulated auth logic with localStorage
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('fintracks_users') || '{}');
      
      if (isRegistering) {
        if (users[username]) {
          setError('User already exists');
          setIsLoading(false);
          return;
        }
        users[username] = { password, transactions: [] };
        localStorage.setItem('fintracks_users', JSON.stringify(users));
        onLogin(username);
      } else {
        const user = users[username];
        if (!user || user.password !== password) {
          setError('Invalid username or password');
          setIsLoading(false);
          return;
        }
        onLogin(username);
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-600/10 pointer-events-none"></div>
      
      <div className="max-w-md w-full bg-white/80 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-teal-500 to-blue-600 rounded-2xl shadow-lg mb-4">
            <UserIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800">FINTRACKS AI</h1>
          <p className="text-slate-500 font-medium">Secure Financial Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-bold text-rose-500 text-center animate-shake">{error}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center justify-center"
          >
            {isLoading ? <LoaderIcon className="animate-spin h-5 w-5" /> : (isRegistering ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <button
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm font-bold text-teal-600 hover:text-teal-700"
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
          </button>
        </div>

        <p className="mt-8 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold">
          Simply AI Technology © 2024
        </p>
      </div>
    </div>
  );
};

export default AuthPortal;
