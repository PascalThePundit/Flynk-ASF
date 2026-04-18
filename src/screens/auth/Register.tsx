import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Loader2, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    birthday: '',
    phone: '',
    department: '',
    level: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!formData.birthday) {
      setError('Birthday is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const bdayDate = new Date(formData.birthday);

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        avatarUrl: null,
        forumIds: [],
        badgeStatus: 'none',
        isForumHead: false,
        forumHeadOf: null,
        birthday: bdayDate.getTime(),
        formFilled: false,
        duesPaid: false,
        role: 'member',
        fcmToken: null,
        createdAt: serverTimestamp(),
        phone: formData.phone || null,
        department: formData.department || null,
        level: formData.level || null,
        bio: null,
      });

      navigate('/fellowship-form');
    } catch (err: any) {
      if (err.code === 'auth/configuration-not-found') {
        setError('Authentication is not enabled in Firebase. Please enable Email/Password first.');
      } else {
        setError(err.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const inputCls = "w-full px-5 py-4 bg-[#F8F9FA] dark:bg-[#1C2128] text-[#0A1628] dark:text-gray-100 font-medium rounded-2xl border-2 border-transparent focus:outline-none focus:border-[#D4A843] focus:bg-white dark:focus:bg-[#21262D] placeholder:text-gray-400 dark:placeholder:text-gray-600 transition-all duration-300";

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#0D1117] overflow-y-auto px-6 py-12 selection:bg-[#D4A843] selection:text-white relative">
      <div className="w-full max-w-sm mx-auto relative z-10 space-y-8">
        <div>
          <h1 className="text-4xl leading-tight font-extrabold text-[#0A1628] dark:text-gray-100 font-display mb-2">
            Join Us.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Create your Flynk account today.</p>
        </div>

        {error && (
          <div className="px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <input name="name" type="text" required placeholder="Full Name"
            value={formData.name} onChange={handleChange} className={inputCls} />
          <input name="email" type="email" required placeholder="Email Address"
            value={formData.email} onChange={handleChange} className={inputCls} />

          <div className="grid grid-cols-2 gap-4">
            <input name="password" type="password" required placeholder="Password"
              value={formData.password} onChange={handleChange} className={inputCls} />
            <input name="confirmPassword" type="password" required placeholder="Confirm"
              value={formData.confirmPassword} onChange={handleChange} className={inputCls} />
          </div>

          <div className="bg-[#F8F9FA] dark:bg-[#1C2128] rounded-2xl p-4 border-2 border-transparent focus-within:border-[#D4A843] focus-within:bg-white dark:focus-within:bg-[#21262D] transition-all duration-300">
            <label className="block text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Birthday</label>
            <input
              name="birthday" type="date" required
              value={formData.birthday} onChange={handleChange}
              className="w-full bg-transparent text-[#0A1628] dark:text-gray-100 font-medium outline-none"
            />
          </div>

          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-6 mb-2 pl-2">Optional Specs</div>

          <input name="phone" type="tel" placeholder="Phone Number"
            value={formData.phone} onChange={handleChange} className={inputCls} />

          <div className="grid grid-cols-2 gap-4">
            <input name="department" type="text" placeholder="Dept (e.g. CSC)"
              value={formData.department} onChange={handleChange} className={inputCls} />
            <select name="level" value={formData.level} onChange={handleChange}
              className={inputCls + " appearance-none"}>
              <option value="" disabled>Level</option>
              <option value="100 Level">100 Lvl</option>
              <option value="200 Level">200 Lvl</option>
              <option value="300 Level">300 Lvl</option>
              <option value="400 Level">400 Lvl</option>
              <option value="500 Level">500 Lvl</option>
            </select>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-between py-4 px-6 mt-6 rounded-2xl shadow-lg shadow-[#0A1628]/10 text-base font-bold text-white bg-[#0A1628] dark:bg-[#D4A843] dark:text-[#0A1628] hover:bg-[#D4A843] hover:text-[#0A1628] dark:hover:bg-yellow-400 active:scale-[0.98] outline-none disabled:opacity-70 transition-all duration-300 group"
          >
            <span>{loading ? 'Creating...' : 'Create Account'}</span>
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                <ArrowRight className="w-4 h-4" />
              </div>
            )}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pt-4 pb-8">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#D4A843] hover:text-[#0A1628] dark:hover:text-gray-100 transition-colors">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};
