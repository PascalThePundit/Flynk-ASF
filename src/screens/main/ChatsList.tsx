import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Search, ChevronRight, Hash, Users } from 'lucide-react';
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
        setForums(snap.docs.map(d => ({ id: d.id, ...d.data() } as Forum)));
      });
      return () => unsub();
    } else {
      setForums([]);
    }
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] flex flex-col pb-24 md:pb-0 page-enter">
      {/* Header */}
      <div className="bg-white dark:bg-[#161B22] px-6 py-6 pb-4 sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800 flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display tracking-tight md:hidden">Chats</h1>

        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search channels..."
            className="w-full bg-[#F8F9FA] dark:bg-[#1C2128] text-[#0A1628] dark:text-gray-100 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#D4A843] outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* General chat */}
        <Link
          to="/chats/general_chat_room"
          className="bg-white dark:bg-[#161B22] p-4 rounded-3xl shadow-sm flex items-center justify-between group hover:border-[#D4A843] border-2 border-transparent dark:border-gray-800 dark:hover:border-[#D4A843] transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4A843] to-[#0A1628] flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#0A1628] dark:text-gray-100 text-base font-display">General Fellowship</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Main ASF FUTO Community</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#D4A843] transition-colors" />
        </Link>

        <div className="pt-4 px-2">
          <h2 className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Your Forums</h2>
        </div>

        {forums.length === 0 ? (
          <div className="text-center py-10 px-4 text-gray-400 dark:text-gray-500 font-medium text-sm">
            You haven't joined any sub-forums yet.
          </div>
        ) : (
          forums.map(forum => (
            <Link
              key={forum.id}
              to={`/chats/${forum.id}`}
              className="bg-white dark:bg-[#161B22] p-4 rounded-3xl shadow-sm flex items-center justify-between group hover:border-[#D4A843] border-2 border-transparent dark:border-gray-800 dark:hover:border-[#D4A843] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1628] dark:text-gray-100 text-base font-display">{forum.name}</h3>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{forum.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-[#D4A843] transition-colors" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
