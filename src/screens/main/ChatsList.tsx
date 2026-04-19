import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, ChevronRight, Hash, Users, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Forum } from '../../types';

export const ChatsList: React.FC = () => {
  const { userProfile } = useAuth();
  const [forums, setForums] = useState<Forum[]>([]);

  useEffect(() => {
    const initGeneralChat = async () => {
      try {
        const ref = doc(db, 'chat_rooms', 'general_chat_room');
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            id: 'general_chat_room',
            type: 'general',
            name: 'General Fellowship',
            createdAt: Date.now(),
          });
        }
      } catch (err) {
        console.error('Error initializing general chat', err);
      }
    };
    initGeneralChat();

    if (userProfile?.forumIds && userProfile.forumIds.length > 0) {
      const q = query(collection(db, 'forums'), where('__name__', 'in', userProfile.forumIds));
      const unsub = onSnapshot(q, snap => {
        setForums(snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) } as Forum)));
      }, (error) => {
        console.error("ChatsList listener error:", error);
      });
      return () => unsub();
    } else {
      setForums([]);
    }
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex flex-col pb-32 md:pb-8 animate-reveal">
      {/* Header */}
      <div className="glass px-6 py-8 pb-6 sticky top-0 z-20 border-b border-white/20 flex flex-col gap-6">
        <h1 className="text-4xl font-black text-navy dark:text-white tracking-tighter md:hidden">Messages</h1>

        <div className="relative group">
          <Search className="w-4 h-4 text-gray-400 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-brand transition-colors" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 rounded-[1.2rem] py-3.5 pl-12 pr-4 text-sm font-bold text-navy dark:text-white focus:ring-2 focus:ring-brand/30 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* General Channel Card */}
        <Link
          to="/chats/general_chat_room"
          className="glass dark:bg-white/5 p-5 rounded-[2rem] shadow-xl flex items-center justify-between group active-scale border border-white/40 dark:border-white/5 transition-all"
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-brand to-navy flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                 <h3 className="font-black text-navy dark:text-white text-base tracking-tight">General Fellowship</h3>
                 <Sparkles size={12} className="text-brand animate-pulse" />
              </div>
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-tight">Main ASF FUTO Community</p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full glass border-none flex items-center justify-center text-gray-300 group-hover:text-brand transition-all">
             <ChevronRight size={20} />
          </div>
        </Link>

        <div className="pt-6 px-2">
          <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Your Forums</h2>
        </div>

        {forums.length === 0 ? (
          <div className="text-center py-16 px-6 glass rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10">
            <Hash className="w-8 h-8 text-gray-200 dark:text-white/5 mx-auto mb-3" />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-relaxed">No forums assigned <br/> to your identity yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {forums.map(forum => (
              <Link
                key={forum.id}
                to={`/chats/${forum.id}`}
                className="glass dark:bg-white/5 p-5 rounded-[2rem] shadow-xl flex items-center justify-between group active-scale border border-white/40 dark:border-white/5 transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand">
                    <Hash className="w-6 h-6" strokeWidth={3} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-navy dark:text-white text-base tracking-tight">{forum.name}</h3>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate max-w-[180px] tracking-tight">{forum.description}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 group-hover:text-brand transition-all">
                  <ChevronRight size={18} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
