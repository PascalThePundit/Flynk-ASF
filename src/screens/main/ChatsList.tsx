import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, getDocs, where, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { MessageCircle, Search, ChevronRight, Hash, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { Forum } from '../../types';

export const ChatsList: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [forums, setForums] = useState<Forum[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Make sure General Chat exists
    const initGeneralChat = async () => {
      const ref = doc(db, 'chat_rooms', 'general_chat_room');
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { id: 'general_chat_room', type: 'general', name: 'General Fellowship', createdAt: Date.now() });
      }
    };
    initGeneralChat();

    // Fetch user's joined forums
    if (userProfile?.forumIds && userProfile.forumIds.length > 0) {
      const q = query(collection(db, 'forums'), where('__name__', 'in', userProfile.forumIds));
      const unsub = onSnapshot(q, (snap) => {
        setForums(snap.docs.map(d => ({ id: d.id, ...d.data() } as Forum)));
      });
      return () => unsub();
    }
  }, [userProfile]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <div className="bg-white px-6 py-6 pb-4 sticky top-0 z-20 border-b border-gray-100 flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold text-[#0A1628] font-display tracking-tight">Chats</h1>
        
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search channels..."
            className="w-full bg-[#F8F9FA] border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#D4A843] outline-none transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* General Chat Room always present */}
        <Link 
          to="/chats/general_chat_room" 
          className="bg-white p-4 rounded-3xl shadow-sm shadow-gray-200/50 flex items-center justify-between group hover:border-[#D4A843] border-2 border-transparent transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#D4A843] to-[#0A1628] flex items-center justify-center shadow-md">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-[#0A1628] text-base font-display">General Fellowship</h3>
              <p className="text-sm font-medium text-gray-500">Main ASF FUTO Community</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#D4A843] transition-colors" />
        </Link>

        <div className="pt-4 px-2">
          <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your Forums</h2>
        </div>

        {forums.length === 0 ? (
          <div className="text-center py-10 px-4 text-gray-400 font-medium text-sm">
            You haven't joined any sub-forums yet.
          </div>
        ) : (
          forums.map(forum => (
            <Link 
              key={forum.id} 
              to={`/chats/${forum.id}`}
              className="bg-white p-4 rounded-3xl shadow-sm shadow-gray-200/50 flex items-center justify-between group hover:border-[#D4A843] border-2 border-transparent transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Hash className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0A1628] text-base font-display">{forum.name}</h3>
                  <p className="text-sm font-medium text-gray-500 truncate max-w-[200px]">{forum.description}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                 <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#D4A843] transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
