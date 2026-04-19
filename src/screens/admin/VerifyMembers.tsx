import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { ArrowLeft, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { UserBadge } from '../../components/ui/UserBadge';
import type { UserProfile } from '../../types';

export const VerifyMembers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'verified'>('pending');

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'users')), snapshot => {
      const u = snapshot.docs.map(d => d.data({ serverTimestamps: 'estimate' }) as UserProfile).filter(user => user.formFilled);
      setUsers(u);
    }, (error) => {
      console.error("VerifyMembers listener error:", error);
    });
    return () => unsub();
  }, []);

  const handleVerify = async (uid: string, name: string) => {
    if (window.confirm(`Are you sure you want to grant ${name} the gold tick verification?`)) {
      try {
        await updateDoc(doc(db, 'users', uid), { badgeStatus: 'gold', duesPaid: true });
      } catch (e) {
        console.error('Error verifying:', e);
      }
    }
  };

  const handleRevoke = async (uid: string, name: string) => {
    if (window.confirm(`Revoke verification for ${name}? They will return to grey tick status.`)) {
      try {
        await updateDoc(doc(db, 'users', uid), { badgeStatus: 'grey', duesPaid: false });
      } catch (e) {
        console.error('Error revoking:', e);
      }
    }
  };

  const filteredUsers = users.filter(u => {
    if (activeTab === 'pending' && u.badgeStatus !== 'grey') return false;
    if (activeTab === 'verified' && u.badgeStatus !== 'gold') return false;
    if (searchTerm && !u.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] flex flex-col pb-24 md:pb-8 page-enter">
      {/* Header */}
      <div className="bg-white dark:bg-[#161B22] border-b border-gray-100 dark:border-gray-800 p-4 pt-8 sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/admin" className="p-2 hover:bg-gray-100 dark:hover:bg-[#1C2128] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#0A1628] dark:text-gray-100" />
          </Link>
          <h1 className="text-xl font-bold text-[#0A1628] dark:text-gray-100 font-display">Verify Members</h1>
        </div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-100 dark:bg-[#1C2128] text-[#0A1628] dark:text-gray-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#D4A843] outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>

        <div className="flex gap-4 border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 text-sm font-bold transition-all ${activeTab === 'pending' ? 'text-[#0A1628] dark:text-gray-100 border-b-2 border-[#0A1628] dark:border-gray-100' : 'text-gray-400 dark:text-gray-600'}`}
          >
            Pending (Grey)
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`pb-3 text-sm font-bold transition-all ${activeTab === 'verified' ? 'text-[#D4A843] border-b-2 border-[#D4A843]' : 'text-gray-400 dark:text-gray-600'}`}
          >
            Verified (Gold)
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 dark:text-gray-600 text-sm">
            No members found in this status.
          </div>
        ) : (
          filteredUsers.map(user => (
            <div key={user.uid} className="bg-white dark:bg-[#161B22] p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400 dark:text-gray-500">
                      {user.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{user.name}</h3>
                    <UserBadge status={user.badgeStatus} />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{user.department} • {user.level}</p>
                </div>
              </div>

              <div>
                {activeTab === 'pending' ? (
                  <button
                    onClick={() => handleVerify(user.uid, user.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#D4A843] text-white text-xs font-bold rounded-lg hover:bg-yellow-400 transition-all shadow-sm"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verify
                  </button>
                ) : (
                  <button
                    onClick={() => handleRevoke(user.uid, user.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
