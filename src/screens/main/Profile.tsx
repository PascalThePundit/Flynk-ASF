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
  Pencil, X, Check, MapPin, BookOpen, Phone,
} from 'lucide-react';
import type { Post } from '../../types';

type AvatarStage = 'idle' | 'generating' | 'uploading' | 'done';

// ─── Edit Profile Modal ─────────────────────────────────────────────────────
interface EditModalProps {
  initial: { bio: string; department: string; level: string; phone: string };
  onClose: () => void;
  onSave: (data: { bio: string; department: string; level: string; phone: string }) => Promise<void>;
}

const EditModal: React.FC<EditModalProps> = ({ initial, onClose, onSave }) => {
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

  const inputCls = "w-full bg-[#F8F9FA] dark:bg-[#1C2128] rounded-2xl px-4 py-3 text-sm font-medium text-[#0A1628] dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D4A843] transition";

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#161B22] w-full max-w-lg rounded-t-[2rem] md:rounded-[2rem] p-6 space-y-5 shadow-2xl border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display">Edit Profile</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <X size={18} className="text-[#0A1628] dark:text-gray-300" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 150))}
              rows={3}
              placeholder="Tell the fellowship about yourself..."
              className={inputCls + " resize-none"}
            />
            <p className="text-right text-[10px] text-gray-400 dark:text-gray-500 mt-1">{bio.length}/150</p>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Department</label>
            <input
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="e.g. Computer Science"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Level</label>
              <input
                value={level}
                onChange={e => setLevel(e.target.value)}
                placeholder="e.g. 300 Level"
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1.5">Phone</label>
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="08xxxxxxxxx"
                className={inputCls}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628] font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#D4A843] hover:text-[#0A1628] dark:hover:bg-yellow-400 transition-colors disabled:opacity-60"
        >
          {saving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <><Check size={18} /> Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
};

// ─── Avatar with AI Generation ──────────────────────────────────────────────
interface AvatarUploadProps {
  avatarUrl: string | null;
  name: string;
  badgeStatus: string;
  uid: string;
  onAvatarUpdated: (url: string) => void;
}

const AvatarUpload: React.FC<AvatarUploadProps> = ({ avatarUrl, name, badgeStatus, uid, onAvatarUpdated }) => {
  const [stage, setStage] = useState<AvatarStage>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setStage('generating');

    try {
      const url = await generateAndUploadAvatar(file, uid, s => {
        if (s === 'uploading') setStage('uploading');
        if (s === 'done') setStage('done');
      });

      await updateDoc(doc(db, 'users', uid), { avatarUrl: url });
      onAvatarUpdated(url);
      setPreviewUrl(null);
      setStage('idle');
    } catch (err) {
      console.error('Avatar update failed:', err);
      setPreviewUrl(null);
      setStage('idle');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      URL.revokeObjectURL(objectUrl);
    }
  };

  const displayUrl = previewUrl || avatarUrl;
  const isGenerating = stage === 'generating' || stage === 'uploading';

  return (
    <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className={cn(
        'w-28 h-28 md:w-36 md:h-36 rounded-full border-4 overflow-hidden shadow-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative transition-all',
        badgeStatus === 'gold' ? 'avatar-gold-ring border-[#D4A843]' : 'border-white dark:border-[#161B22]'
      )}>
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Avatar"
            className={cn('w-full h-full object-cover', isGenerating && 'blur-sm scale-110')}
          />
        ) : (
          <span className="text-5xl font-extrabold text-gray-300 dark:text-gray-600 font-display select-none">
            {name.charAt(0).toUpperCase()}
          </span>
        )}

        {isGenerating && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 rounded-full gap-1">
            <Sparkles size={22} className="text-[#D4A843] spin-slow" />
            <span className="text-white text-[9px] font-bold text-center px-2 leading-tight">
              {stage === 'generating' ? 'Generating...' : 'Uploading...'}
            </span>
          </div>
        )}
      </div>

      {!isGenerating && (
        <div className="absolute bottom-1 right-1 w-9 h-9 bg-[#D4A843] rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-[#161B22] group-hover:scale-110 transition-transform">
          <Camera size={16} className="text-white" />
        </div>
      )}
    </div>
  );
};

// ─── Main Profile Screen ────────────────────────────────────────────────────
export const Profile: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showEdit, setShowEdit] = useState(false);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, snap => {
      setUserPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });
  }, [currentUser]);

  const handleLogout = () => signOut(auth);

  const isBirthdayToday = () => {
    if (!userProfile?.birthday) return false;
    const b = new Date(userProfile.birthday);
    const t = new Date();
    return b.getDate() === t.getDate() && b.getMonth() === t.getMonth();
  };

  const handleSaveProfile = async (data: { bio: string; department: string; level: string; phone: string }) => {
    if (!currentUser) return;
    await updateDoc(doc(db, 'users', currentUser.uid), {
      bio: data.bio || null,
      department: data.department || null,
      level: data.level || null,
      phone: data.phone || null,
    });
  };

  if (!userProfile) return null;

  const avatarUrl = localAvatarUrl ?? userProfile.avatarUrl;

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] pb-28 md:pb-8 page-enter">
      {showEdit && (
        <EditModal
          initial={{
            bio: userProfile.bio || '',
            department: userProfile.department || '',
            level: userProfile.level || '',
            phone: userProfile.phone || '',
          }}
          onClose={() => setShowEdit(false)}
          onSave={handleSaveProfile}
        />
      )}

      {/* Mobile header */}
      <div className="md:hidden bg-white dark:bg-[#161B22] px-6 py-5 sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display tracking-tight">Profile</h1>
        <button
          onClick={handleLogout}
          className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
        >
          <LogOut size={18} />
        </button>
      </div>

      <div className="p-4 md:p-6 space-y-4 md:mt-6">

        {/* ── Profile Card ── */}
        <div className="bg-white dark:bg-[#161B22] rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800">
          {/* Cover strip */}
          <div className="h-24 md:h-32 bg-gradient-to-br from-[#0A1628] via-[#122040] to-[#0A1628] relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #D4A843 0%, transparent 60%)' }} />
          </div>

          <div className="px-6 pb-6 -mt-14 md:-mt-18 flex flex-col items-center">
            {isBirthdayToday() && (
              <div className="text-4xl mb-1 animate-bounce">👑</div>
            )}

            <AvatarUpload
              avatarUrl={avatarUrl}
              name={userProfile.name}
              badgeStatus={userProfile.badgeStatus}
              uid={userProfile.uid}
              onAvatarUpdated={url => setLocalAvatarUrl(url)}
            />

            <div className="mt-4 flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display">{userProfile.name}</h2>
              <UserBadge status={userProfile.badgeStatus} role={userProfile.role} isForumHead={userProfile.isForumHead} />
            </div>

            {userProfile.bio && (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-2 max-w-xs leading-relaxed">{userProfile.bio}</p>
            )}

            {/* Stats */}
            <div className="flex gap-10 mt-5 mb-4">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100">{userPosts.length}</div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Posts</div>
              </div>
              <div className="w-px bg-gray-100 dark:bg-gray-800" />
              <div className="text-center">
                <div className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100">{userProfile.forumIds?.length || 0}</div>
                <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Forums</div>
              </div>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-[#0A1628] dark:border-gray-600 text-[#0A1628] dark:text-gray-300 font-bold text-sm hover:bg-[#0A1628] hover:text-white dark:hover:bg-gray-700 dark:hover:text-white transition-all group"
            >
              <Pencil size={14} className="group-hover:text-[#D4A843] transition-colors" />
              Edit Profile
            </button>

            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
              <Sparkles size={10} className="text-[#D4A843]" />
              Tap avatar to upload — AI will generate your portrait
            </p>
          </div>
        </div>

        {/* ── Info Chips ── */}
        {(userProfile.department || userProfile.level || userProfile.phone) && (
          <div className="flex flex-wrap gap-3">
            {userProfile.department && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#161B22] rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-800 shadow-sm">
                <MapPin size={15} className="text-[#D4A843]" />
                <span className="text-sm font-bold text-[#0A1628] dark:text-gray-100">{userProfile.department}</span>
              </div>
            )}
            {userProfile.level && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#161B22] rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-800 shadow-sm">
                <BookOpen size={15} className="text-[#D4A843]" />
                <span className="text-sm font-bold text-[#0A1628] dark:text-gray-100">{userProfile.level}</span>
              </div>
            )}
            {userProfile.phone && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#161B22] rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-800 shadow-sm">
                <Phone size={15} className="text-[#D4A843]" />
                <span className="text-sm font-bold text-[#0A1628] dark:text-gray-100">{userProfile.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* ── Posts Grid ── */}
        <div className="bg-white dark:bg-[#161B22] rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-gray-800">
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Posts</span>
            <div className="flex gap-2">
              <button
                onClick={() => setView('grid')}
                className={cn('p-2 rounded-xl transition', view === 'grid' ? 'bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628]' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1C2128]')}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn('p-2 rounded-xl transition', view === 'list' ? 'bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628]' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1C2128]')}
              >
                <Layers size={16} />
              </button>
            </div>
          </div>

          {userPosts.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-[#1C2128] rounded-full flex items-center justify-center mx-auto mb-3">
                <Grid className="text-gray-200 dark:text-gray-700" size={28} />
              </div>
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No posts yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Share something with the fellowship</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-3 md:grid-cols-4 gap-0.5 p-0.5">
              {userPosts.map(post => (
                <div
                  key={post.id}
                  className="aspect-square bg-gray-50 dark:bg-[#1C2128] overflow-hidden relative cursor-pointer hover:opacity-90 transition-opacity"
                >
                  {post.mediaUrl ? (
                    <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-[10px] text-gray-500 dark:text-gray-400 font-medium text-center leading-tight bg-[#F8F9FA] dark:bg-[#1C2128]">
                      {post.content.slice(0, 60)}
                    </div>
                  )}
                  {post.likes?.length > 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/50 rounded-full px-1.5 py-0.5 text-white text-[9px] font-bold flex items-center gap-0.5">
                      ♥ {post.likes.length}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {userPosts.map(post => (
                <div key={post.id} className="p-4 flex gap-3">
                  {post.mediaUrl && (
                    <img src={post.mediaUrl} alt="Post" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed line-clamp-3">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      {post.likes?.length > 0 && (
                        <span className="text-[10px] text-red-400 font-bold">♥ {post.likes.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Logout (desktop) ── */}
        <div className="hidden md:block">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-4 bg-white dark:bg-[#161B22] rounded-3xl border border-gray-100 dark:border-gray-800 text-red-500 dark:text-red-400 font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full shadow-sm"
          >
            <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <LogOut size={16} />
            </div>
            Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};
