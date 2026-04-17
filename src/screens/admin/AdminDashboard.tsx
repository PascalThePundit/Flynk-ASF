import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, query, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, ShieldCheck, Clock, Layers, ChevronRight } from 'lucide-react';
import type { UserProfile, Forum } from '../../types';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalMembers: 0,
    verifiedGold: 0,
    pendingGrey: 0,
    totalForums: 0,
    newThisWeek: 0,
  });

  useEffect(() => {
    // Listen to users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      let total = 0;
      let gold = 0;
      let grey = 0;
      let newUsers = 0;
      
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      snapshot.forEach(doc => {
        const user = doc.data() as UserProfile;
        total++;
        if (user.badgeStatus === 'gold') gold++;
        if (user.badgeStatus === 'grey') grey++;
        
        // Handle Firestore timestamp vs JS timestamp
        let createdAt = 0;
        if (user.createdAt && (user.createdAt as any).seconds) {
           createdAt = (user.createdAt as any).seconds * 1000;
        } else if (typeof user.createdAt === 'number') {
           createdAt = user.createdAt;
        }
        
        if (createdAt > oneWeekAgo) newUsers++;
      });

      setStats(prev => ({ ...prev, totalMembers: total, verifiedGold: gold, pendingGrey: grey, newThisWeek: newUsers }));
    });

    // Listen to forums
    const unsubForums = onSnapshot(collection(db, 'forums'), (snapshot) => {
      setStats(prev => ({ ...prev, totalForums: snapshot.size }));
    });

    return () => {
      unsubUsers();
      unsubForums();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 md:pb-8">
      <div className="bg-white border-b border-gray-100 p-6 pt-10 sticky top-0 z-10 md:rounded-t-[2.5rem] md:mt-6 md:hidden">
        <h1 className="text-2xl font-bold text-[#0A1628]">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Manage fellowship operations</p>
      </div>

      <div className="p-6 space-y-6 md:mt-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg"><Users className="w-4 h-4 text-blue-600" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Total</span>
            </div>
            <div className="text-2xl font-bold text-[#0A1628]">{stats.totalMembers}</div>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-yellow-50 rounded-lg"><ShieldCheck className="w-4 h-4 text-[#D4A843]" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Verified</span>
            </div>
            <div className="text-2xl font-bold text-[#0A1628]">{stats.verifiedGold}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-gray-100 rounded-lg"><Clock className="w-4 h-4 text-gray-500" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Pending</span>
            </div>
            <div className="text-2xl font-bold text-[#0A1628]">{stats.pendingGrey}</div>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-50 rounded-lg"><Layers className="w-4 h-4 text-purple-600" /></div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Forums</span>
            </div>
            <div className="text-2xl font-bold text-[#0A1628]">{stats.totalForums}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#0A1628] mb-4">Quick Actions</h2>
          
          <Link to="/admin/verify" className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50 hover:border-[#D4A843] transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-[#D4A843]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Verify Members</h3>
                <p className="text-xs text-gray-500">Review pending fellowship registrations</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#D4A843] transition-colors" />
          </Link>

          <Link to="/admin/forums" className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50 hover:border-[#D4A843] transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Manage Forums</h3>
                <p className="text-xs text-gray-500">Create, edit, or delete fellowship groups</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#D4A843] transition-colors" />
          </Link>

          <Link to="/admin/members" className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-gray-50 hover:border-[#D4A843] transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#0A1628]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">View All Members</h3>
                <p className="text-xs text-gray-500">Search and view the entire member directory</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#D4A843] transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
};
