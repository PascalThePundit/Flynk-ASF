import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { UserBadge } from '../../components/ui/UserBadge';
import { cn } from '../../lib/utils';
import { generateAndUploadAvatar } from '../../lib/avatarGenerator';
import {
  LogOut, Grid, Layers, Camera, Sparkles,
  Pencil, X, Check, MapPin, BookOpen, Phone, Settings, Calendar
} from 'lucide-react';
import type { Post } from '../../types';

type AvatarStage = 'idle' | 'generating' | 'uploading' | 'done';

const EditModal: React.FC<{
  initial: { bio: string; department: string; level: string; phone: string };
  onClose: () => void;
  onSave: (data: { bio: string; department: string; level: string; phone: string }) => Promise<void>;
}> = ({ initial, onClose, onSave }) => {
  const [bio, setBio] = useState(initial.bio);
  const [department, setDepartment] = useState(initial.department);
  const [level, setLevel] = useState(initial.level);
  const [phone, setPhone] = useState(initial.phone);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ bio, department, level, phone });
    setSaving(false);
    onClose();
  };

  const inputCls = "w-full bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[1.2rem] px-5 py-3.5 text-sm font-medium text-navy dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-xl animate-reveal">
      <div className="bg-[#F2F2F7] dark:bg-black w-full max-w-lg rounded-t-[2.5rem] md:rounded-[2.5rem] p-8 space-y-6 shadow-2xl border-t border-white/20">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-black text-navy dark:text-white font-display tracking-tight">Edit Identity</h2>
          <button onClick={onClose} className="w-10 h-10 rounded-full glass flex items-center justify-center hover:bg-white/90 transition-all active-scale">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Biography</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 150))}
              rows={3}
              placeholder="Your testimony or fellowship role..."
              className={inputCls + " resize-none"}
            />
            <p className="text-right text-[10px] font-bold text-gray-400 mt-1.5">{bio.length}/150</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Dept</label>
              <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. CSC" className={inputCls} />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 px-1">Phone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="08xxxxxxxxx" className={inputCls} />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-brand text-white font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-2 shadow-2xl shadow-brand/20 hover:bg-brand/90 transition-all disabled:opacity-60 active-scale"
        >
          {saving ? <span className="animate-pulse">Saving Profile...</span> : <><Check size={20} strokeWidth={3} /> Save Identity</>}
        </button>
      </div>
    </div>
  );
};

export const Profile: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showEdit, setShowEdit] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [stage, setStage] = useState<AvatarStage>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(collection(db, 'posts'), where('userId', '==', currentUser.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => {
      setUserPosts(snap.docs.map(d => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return { 
          id: d.id, 
          ...data,
          createdAt: data.createdAt?.toMillis?.() || Date.now()
        } as Post;
      }));
    }, (error) => {
      console.error("Profile posts listener error:", error);
    });
  }, [currentUser]);

  const handleAvatarUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setStage('generating');
    try {
      const url = await generateAndUploadAvatar(file, currentUser.uid, s => setStage(s as AvatarStage));
      await updateDoc(doc(db, 'users', currentUser.uid), { avatarUrl: url });
      setLocalAvatarUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setStage('idle');
    }
  };

  const isBirthdayToday = () => {
    if (!userProfile?.birthday) return false;
    const b = new Date(userProfile.birthday);
    const t = new Date();
    return b.getDate() === t.getDate() && b.getMonth() === t.getMonth();
  };

  if (!userProfile) return null;
  const displayAvatar = localAvatarUrl || userProfile.avatarUrl;

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black pb-32 md:pb-8 animate-reveal">
      {showEdit && (
        <EditModal
          initial={{ bio: userProfile.bio || '', department: userProfile.department || '', level: userProfile.level || '', phone: userProfile.phone || '' }}
          onClose={() => setShowEdit(false)}
          onSave={async (d) => { await updateDoc(doc(db, 'users', userProfile.uid), d); }}
        />
      )}

      {/* Profile Header */}
      <div className="md:hidden glass px-6 py-6 sticky top-0 z-20 border-b border-white/20 flex justify-between items-center">
        <h1 className="text-2xl font-black text-navy dark:text-white tracking-tighter">Identity</h1>
        <button onClick={() => signOut(auth)} className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 transition active-scale">
          <LogOut size={18} />
        </button>
      </div>

      <div className="p-4 md:p-8 space-y-6">
        {/* Premium Profile Card */}
        <div className="glass dark:bg-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/40 dark:border-white/5 relative">
          <div className="h-32 md:h-44 bg-gradient-to-br from-brand via-navy to-brand relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 animate-pulse" style={{ backgroundImage: 'radial-gradient(circle at 20% 150%, gold 0%, transparent 50%)' }} />
            {/* Abstract iOS shapes */}
            <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute bottom-4 left-10 w-32 h-32 bg-brand/30 rounded-full blur-3xl" />
          </div>

          <div className="px-6 pb-10 -mt-16 flex flex-col items-center relative z-10">
            <div className="relative group active-scale" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpdate} />
              <div className={cn(
                "w-32 h-32 md:w-40 md:h-40 rounded-[2.8rem] border-[6px] border-[#F2F2F7] dark:border-black overflow-hidden shadow-2xl transition-all relative",
                userProfile.badgeStatus === 'gold' && "gold-glow border-gold/50"
              )}>
                {displayAvatar ? (
                  <img src={displayAvatar} alt="Identity" className={cn("w-full h-full object-cover", stage !== 'idle' && "blur-md scale-110")} />
                ) : (
                  <div className="w-full h-full bg-navy text-white flex items-center justify-center text-5xl font-black">
                    {userProfile.name.charAt(0)}
                  </div>
                )}
                {stage !== 'idle' && (
                  <div className="absolute inset-0 bg-brand/40 flex flex-col items-center justify-center text-white p-4">
                     <Sparkles className="w-8 h-8 animate-spin mb-1" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-center">{stage === 'generating' ? 'AI Painting' : 'Uploading'}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <Camera size={24} className="text-white" />
                </div>
              </div>
              {isBirthdayToday() && <div className="absolute -top-4 -right-2 text-4xl animate-bounce">👑</div>}
            </div>

            <div className="mt-6 flex flex-col items-center">
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-black text-navy dark:text-white tracking-tighter">{userProfile.name}</h2>
                <UserBadge status={userProfile.badgeStatus} role={userProfile.role} isForumHead={userProfile.isForumHead} size={20} />
              </div>
              <p className="text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] mt-1">{userProfile.email}</p>
            </div>

            {userProfile.bio && (
              <div className="mt-4 glass-dark rounded-[1.5rem] px-6 py-3.5 max-w-sm border border-white/10">
                <p className="text-sm text-white/90 font-medium text-center leading-relaxed">{userProfile.bio}</p>
              </div>
            )}

            {/* Stats Row */}
            <div className="flex gap-12 mt-8">
              <Stat value={userPosts.length} label="Words Shared" />
              <div className="w-px h-8 bg-gray-200 dark:bg-white/10" />
              <Stat value={userProfile.forumIds?.length || 0} label="Forums" />
            </div>

            <button
              onClick={() => setShowEdit(true)}
              className="mt-8 flex items-center gap-3 px-8 py-3.5 rounded-full glass border-navy/10 dark:border-white/10 text-navy dark:text-white font-black text-sm active-scale hover:bg-white dark:hover:bg-white/5 transition-all"
            >
              <Pencil size={16} />
              Edit Profile
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {userProfile.department && <InfoChip icon={<MapPin size={16} />} text={userProfile.department} label="Department" />}
          {userProfile.level && <InfoChip icon={<BookOpen size={16} />} text={userProfile.level} label="Level" />}
          {userProfile.phone && <InfoChip icon={<Phone size={16} />} text={userProfile.phone} label="Phone" />}
        </div>

        {/* Posts Area */}
        <div className="glass rounded-[2.5rem] shadow-xl border border-white/40 dark:border-white/5 overflow-hidden">
          <div className="flex items-center justify-between px-8 py-6 border-b border-black/5 dark:border-white/5">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Post History</span>
            <div className="flex gap-2">
              <button onClick={() => setView('grid')} className={cn("p-2 rounded-xl transition-all active-scale", view === 'grid' ? "bg-navy text-white shadow-lg" : "text-gray-400 hover:bg-gray-100")}>
                <Grid size={18} />
              </button>
              <button onClick={() => setView('list')} className={cn("p-2 rounded-xl transition-all active-scale", view === 'list' ? "bg-navy text-white shadow-lg" : "text-gray-400 hover:bg-gray-100")}>
                <Layers size={18} />
              </button>
            </div>
          </div>

          {userPosts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4 animate-reveal">
               <div className="w-16 h-16 glass rounded-full flex items-center justify-center opacity-40">
                  <Grid size={24} />
               </div>
               <p className="text-sm font-black text-gray-400">Silence in the archives.</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-3 gap-0.5 p-0.5">
              {userPosts.map(post => (
                <div key={post.id} className="aspect-square bg-white/50 dark:bg-white/2 relative overflow-hidden group cursor-pointer">
                  {post.mediaUrl ? (
                    <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-[9px] font-bold text-gray-400 text-center leading-relaxed">
                      {post.content.slice(0, 60)}...
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-black text-xs gap-1.5">
                    ♥ {post.likes?.length || 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {userPosts.map(post => (
                <div key={post.id} className="p-5 flex gap-4 animate-reveal">
                  {post.mediaUrl && <img src={post.mediaUrl} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0 shadow-md" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-3 leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-3 mt-3 text-[10px] font-black text-gray-400 uppercase tracking-tight">
                       {new Date(post.createdAt).toLocaleDateString()}
                       <span className="text-brand">♥ {post.likes?.length || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Logout */}
        <button onClick={() => signOut(auth)} className="hidden md:flex items-center justify-center gap-3 w-full p-5 bg-white dark:bg-white/5 rounded-[2.5rem] border border-white/40 dark:border-white/5 text-red-500 font-black text-sm active-scale hover:bg-red-500 hover:text-white transition-all shadow-xl">
           <LogOut size={18} />
           Terminate Session
        </button>
      </div>
    </div>
  );
};

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <span className="text-2xl font-black text-navy dark:text-white tracking-tighter">{value}</span>
    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</span>
  </div>
);

const InfoChip: React.FC<{ icon: React.ReactNode; text: string; label: string }> = ({ icon, text, label }) => (
  <div className="glass dark:bg-white/5 rounded-ios-inner p-4 border border-white/40 dark:border-white/5 shadow-lg group hover:scale-[1.02] transition-transform">
    <div className="text-brand mb-2 group-hover:animate-float">{icon}</div>
    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-sm font-black text-navy dark:text-white truncate">{text}</p>
  </div>
);
