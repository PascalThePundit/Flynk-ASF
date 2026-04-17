import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth, db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { UserBadge } from '../../components/ui/UserBadge';
import { LogOut, Settings, Award, MapPin, Grid, Layers } from 'lucide-react';
import type { Post } from '../../types';

export const Profile: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (!currentUser) return;
    
    const q = query(
      collection(db, 'posts'), 
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setUserPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    return () => unsub();
  }, [currentUser]);

  const handleLogout = () => {
    signOut(auth);
  };

  const isBirthdayToday = () => {
    if (!userProfile?.birthday) return false;
    const bday = new Date(userProfile.birthday);
    const today = new Date();
    return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      {/* Header */}
      <div className="bg-white px-6 py-6 pb-4 sticky top-0 z-20 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-[#0A1628] font-display tracking-tight">Profile</h1>
        <button className="p-2 hover:bg-gray-50 rounded-full transition">
          <Settings className="w-6 h-6 text-[#0A1628]" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-10 -mt-10" />

          <div className="flex flex-col items-center relative z-10">
            <div className="relative">
              {isBirthdayToday() && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
              )}
              <div className={`w-24 h-24 rounded-full border-4 ${userProfile.badgeStatus === 'gold' ? 'border-[#D4A843]' : 'border-white'} overflow-hidden shadow-lg mb-4 bg-gray-100 flex items-center justify-center`}>
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-extrabold text-gray-300 font-display">{userProfile.name.charAt(0)}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-extrabold text-[#0A1628] font-display">{userProfile.name}</h2>
              <UserBadge status={userProfile.badgeStatus} role={userProfile.role} isForumHead={userProfile.isForumHead} />
            </div>
            <p className="text-xs font-bold text-gray-400 mb-4">{userProfile.email}</p>

            <div className="flex gap-8 mb-6">
               <div className="text-center">
                 <div className="text-lg font-extrabold text-[#0A1628]">{userPosts.length}</div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Posts</div>
               </div>
               <div className="text-center">
                 <div className="text-lg font-extrabold text-[#0A1628]">{userProfile.forumIds?.length || 0}</div>
                 <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Forums</div>
               </div>
            </div>

            {userProfile.bio && (
              <p className="text-center text-sm text-gray-600 leading-relaxed max-w-[280px]">
                {userProfile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats & Tools */}
        <div className="grid grid-cols-2 gap-3">
           {userProfile.department && (
             <div className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><MapPin size={14} /></div>
               <span className="text-xs font-bold text-[#0A1628] truncate">{userProfile.department}</span>
             </div>
           )}
           <button 
             onClick={handleLogout}
             className="bg-white p-4 rounded-3xl border border-gray-100 flex items-center gap-3 text-red-500 font-bold text-xs"
           >
             <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center"><LogOut size={14} /></div>
             Logout
           </button>
        </div>

        {/* Posts Grid */}
        <div className="bg-white rounded-t-[2.5rem] mt-4 min-h-[400px]">
          <div className="flex justify-center gap-12 border-b border-gray-50 py-4">
             <button onClick={() => setView('grid')} className={cn("p-2 transition-all", view === 'grid' ? "text-[#0A1628] border-b-2 border-[#0A1628]" : "text-gray-300")}><Grid size={20} /></button>
             <button onClick={() => setView('list')} className={cn("p-2 transition-all", view === 'list' ? "text-[#0A1628] border-b-2 border-[#0A1628]" : "text-gray-300")}><Layers size={20} /></button>
          </div>

          {userPosts.length === 0 ? (
            <div className="py-20 text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Grid className="text-gray-200" />
               </div>
               <p className="text-sm font-bold text-gray-400">No posts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-[2px] p-[2px]">
               {userPosts.map(post => (
                 <div key={post.id} className="aspect-square bg-gray-100 overflow-hidden relative group">
                    {post.mediaUrl ? (
                      <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-[10px] text-gray-400 font-medium overflow-hidden">
                        {post.content}
                      </div>
                    )}
                 </div>
               ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
