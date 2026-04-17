import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { Loader2, ArrowRight } from 'lucide-react';

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
      navigate('/'); 
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found') {
        setError('Authentication is not enabled in Firebase yet. Please enable Email/Password in your Firebase Console.');
      } else {
        setError(err.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 py-12 selection:bg-[#D4A843] selection:text-white relative overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-50 z-0"></div>
      
      <div className="w-full max-w-sm mx-auto relative z-10 flex-1 flex flex-col justify-center">
        <div className="mb-12">
          <h1 className="text-[2.5rem] leading-tight font-extrabold text-[#0A1628] font-display mb-3">
            Welcome<br/>Back.
          </h1>
          <p className="text-gray-500 font-medium">Log in to connect with ASF FUTO.</p>
        </div>

        {error && <div className="px-4 py-3 mb-6 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-2xl">{error}</div>}
        {message && <div className="px-4 py-3 mb-6 text-sm font-medium text-green-600 bg-green-50 border border-green-100 rounded-2xl">{message}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full px-5 py-4 bg-[#F8F9FA] text-[#0A1628] font-medium rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#D4A843] focus:bg-white placeholder:text-gray-400 transition-all duration-300"
            />
            
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-5 py-4 bg-[#F8F9FA] text-[#0A1628] font-medium rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#D4A843] focus:bg-white placeholder:text-gray-400 transition-all duration-300"
            />
          </div>

          <div className="flex justify-end pb-2">
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-sm font-bold text-[#0A1628] hover:text-[#D4A843] transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-between py-4 px-6 rounded-2xl shadow-lg shadow-[#0A1628]/10 text-base font-bold text-white bg-[#0A1628] hover:bg-[#11233D] active:scale-[0.98] outline-none disabled:opacity-70 transition-all duration-300 group"
          >
            <span>{loading ? 'Logging in...' : 'Log In'}</span>
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ArrowRight className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
        </form>

        <div className="mt-auto pt-10 pb-6 text-center">
          <p className="text-sm font-medium text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-[#D4A843] hover:text-[#0A1628] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

