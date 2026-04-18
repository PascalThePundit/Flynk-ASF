import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserBadge } from '../../components/ui/UserBadge';
import type { UserProfile } from '../../types';

export const AllMembers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users')), snapshot => {
      setUsers(snapshot.docs.map(d => d.data() as UserProfile));
    });
    return () => unsub();
  }, []);

  const filteredUsers = users.filter(u =>
    !searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] flex flex-col pb-24 md:pb-8 page-enter">
      <div className="bg-white dark:bg-[#161B22] border-b border-gray-100 dark:border-gray-800 p-4 pt-8 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-[#1C2128] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#0A1628] dark:text-gray-100" />
          </Link>
          <h1 className="text-xl font-extrabold text-[#0A1628] dark:text-gray-100 font-display">Directory</h1>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search all members..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8F9FA] dark:bg-[#1C2128] text-[#0A1628] dark:text-gray-100 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-[#D4A843] outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filteredUsers.map(user => (
          <div key={user.uid} className="bg-white dark:bg-[#161B22] p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between hover:border-[#D4A843] dark:hover:border-[#D4A843] transition-all">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0 flex items-center justify-center font-bold text-gray-400 dark:text-gray-500">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : user.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-[#0A1628] dark:text-gray-100 text-sm font-display">{user.name}</h3>
                  <UserBadge status={user.badgeStatus} role={user.role} isForumHead={user.isForumHead} />
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[180px]">{user.email}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
