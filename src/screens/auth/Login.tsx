import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Loader2, ArrowRight, Lock, Mail, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/splash');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Enter your email first to reset password');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Reset link sent to your email!');
      setError('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const inputCls = "w-full px-6 py-4 bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-[1.5rem] text-navy dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all placeholder:text-gray-400";

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F2F7] dark:bg-black overflow-hidden relative selection:bg-brand selection:text-white">
      {/* Background elements */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-gold/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-center px-6 relative z-10 animate-reveal">
        <div className="mb-12">
          <div className="w-16 h-16 bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl flex items-center justify-center mb-8 gold-glow">
            <Sparkles className="text-brand w-8 h-8" />
          </div>
          <h1 className="text-5xl font-extrabold text-navy dark:text-white font-display tracking-tight mb-2">
            Welcome <br /> Back.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Continue your fellowship journey.</p>
        </div>

        {error && (
          <div className="px-5 py-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
            {error}
          </div>
        )}

        {message && (
          <div className="px-5 py-4 text-xs font-bold text-green-500 bg-green-500/10 border border-green-500/20 rounded-2xl mb-6">
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input 
              type="email" required placeholder="Email Address"
              value={email} onChange={e => setEmail(e.target.value)} 
              className={cn(inputCls, "pl-12")} 
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input 
              type="password" required placeholder="Password"
              value={password} onChange={e => setPassword(e.target.value)} 
              className={cn(inputCls, "pl-12")} 
            />
          </div>

          <div className="flex justify-end px-2">
            <button 
              type="button" onClick={handleResetPassword}
              className="text-[11px] font-bold text-brand hover:text-navy dark:hover:text-white transition-colors uppercase tracking-widest"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-between py-5 px-8 mt-4 rounded-[1.5rem] bg-brand dark:bg-brand text-white font-bold text-sm shadow-2xl shadow-brand/20 active-scale disabled:opacity-70 group"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mt-12">
          New to the fellowship?{' '}
          <Link to="/register" className="font-extrabold text-brand hover:underline underline-offset-4">
            Create Account
          </Link>
        </p>
      </div>
      
      {/* Footer Branding */}
      <div className="py-8 text-center relative z-10">
        <p className="text-[10px] font-bold text-gray-300 dark:text-gray-700 uppercase tracking-[0.4em]">Flynk &bull; ASF FUTO</p>
      </div>
    </div>
  );
};
