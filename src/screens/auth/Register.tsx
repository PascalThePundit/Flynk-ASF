import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';
import { Loader2, ArrowRight, Camera, Sparkles, X, User, Mail, Lock, Calendar } from 'lucide-react';
import { generateAndUploadAvatar } from '../../lib/avatarGenerator';
import { cn } from '../../lib/utils';

type AvatarStage = 'idle' | 'generating' | 'uploading' | 'done';

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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarStage, setAvatarStage] = useState<AvatarStage>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
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

      let finalAvatarUrl = null;
      if (avatarFile) {
        try {
          finalAvatarUrl = await generateAndUploadAvatar(avatarFile, user.uid, s => {
            setAvatarStage(s as AvatarStage);
          });
        } catch (err) {
          console.error('Avatar generation failed during registration:', err);
        }
      }

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        avatarUrl: finalAvatarUrl,
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
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const removePhoto = () => {
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const inputCls = "w-full px-6 py-4 bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 backdrop-blur-md rounded-[1.5rem] text-navy dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all placeholder:text-gray-400";

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F2F7] dark:bg-black overflow-y-auto px-6 py-12 selection:bg-brand selection:text-white relative">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />

      <div className="w-full max-w-sm mx-auto relative z-10 animate-reveal">
        <div className="mb-10">
          <h1 className="text-5xl font-extrabold text-navy dark:text-white font-display tracking-tight mb-2">
            Join the <br /> Fellowship.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Step into a new world of faith & connection.</p>
        </div>

        {error && (
          <div className="px-5 py-4 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Premium Avatar Picker */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div 
              onClick={() => !loading && fileRef.current?.click()}
              className={cn(
                "relative w-28 h-28 rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] shadow-2xl flex items-center justify-center cursor-pointer group overflow-hidden transition-all active-scale",
                avatarPreview ? "border-2 border-brand gold-glow" : "border-2 border-dashed border-gray-200 dark:border-gray-800"
              )}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-7 h-7 text-gray-400 group-hover:text-brand transition-colors" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add Photo</span>
                </div>
              )}
              
              {!loading && avatarPreview && (
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}

              {loading && avatarStage === 'generating' && (
                <div className="absolute inset-0 bg-brand/40 backdrop-blur-sm flex items-center justify-center">
                   <Sparkles className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-center max-w-[200px] leading-relaxed">
              Our AI will craft your <span className="text-brand">spiritual portrait</span>
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="relative group">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input name="name" type="text" required placeholder="Full Name"
              value={formData.name} onChange={handleChange} className={cn(inputCls, "pl-12")} />
          </div>

          <div className="relative group">
            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
            <input name="email" type="email" required placeholder="Email Address"
              value={formData.email} onChange={handleChange} className={cn(inputCls, "pl-12")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="relative group">
               <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand transition-colors" />
               <input name="password" type="password" required placeholder="Password"
                 value={formData.password} onChange={handleChange} className={cn(inputCls, "pl-12")} />
            </div>
            <input name="confirmPassword" type="password" required placeholder="Confirm"
              value={formData.confirmPassword} onChange={handleChange} className={inputCls} />
          </div>

          <div className={cn(inputCls, "flex items-center gap-4 px-5")}>
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex-1">
               <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Birthday</label>
               <input
                 name="birthday" type="date" required
                 value={formData.birthday} onChange={handleChange}
                 className="w-full bg-transparent text-navy dark:text-white font-medium outline-none text-sm"
               />
            </div>
          </div>

          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-8 mb-4 pl-2">Extra Specs</div>

          <input name="phone" type="tel" placeholder="Phone Number"
            value={formData.phone} onChange={handleChange} className={inputCls} />

          <div className="grid grid-cols-2 gap-4">
            <input name="department" type="text" placeholder="Dept (e.g. CSC)"
              value={formData.department} onChange={handleChange} className={inputCls} />
            <select name="level" value={formData.level} onChange={handleChange}
              className={cn(inputCls, "appearance-none")}>
              <option value="" disabled>Level</option>
              {['100', '200', '300', '400', '500'].map(l => (
                <option key={l} value={`${l} Level`}>{l} Lvl</option>
              ))}
            </select>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full flex items-center justify-between py-5 px-8 mt-6 rounded-[1.5rem] bg-navy dark:bg-brand text-white font-bold text-sm shadow-2xl active-scale disabled:opacity-70 group"
          >
            <span>
              {loading 
                ? (avatarStage === 'generating' ? 'AI is Painting...' : 'Onboarding...') 
                : 'Create Account'
              }
            </span>
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 pt-10 pb-8">
          Already a member?{' '}
          <Link to="/login" className="font-extrabold text-brand hover:underline underline-offset-4">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};
