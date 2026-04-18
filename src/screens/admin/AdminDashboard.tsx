import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Users, ShieldCheck, Clock, Layers, ChevronRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';

export const AdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalMembers: 0,
    verifiedGold: 0,
    pendingGrey: 0,
    totalForums: 0,
    newThisWeek: 0,
  });

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'users'), snap => {
      let total = 0, gold = 0, grey = 0, newUsers = 0;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      snap.forEach(d => {
        const u = d.data() as UserProfile;
        total++;
        if (u.badgeStatus === 'gold') gold++;
        if (u.badgeStatus === 'grey') grey++;
        const ts = (u.createdAt as any)?.seconds
          ? (u.createdAt as any).seconds * 1000
          : (typeof u.createdAt === 'number' ? u.createdAt : 0);
        if (ts > oneWeekAgo) newUsers++;
      });
      setStats(p => ({ ...p, totalMembers: total, verifiedGold: gold, pendingGrey: grey, newThisWeek: newUsers }));
    });

    const unsub2 = onSnapshot(collection(db, 'forums'), snap => {
      setStats(p => ({ ...p, totalForums: snap.size }));
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] pb-28 md:pb-8 page-enter">

      {/* Header */}
      <div className="bg-[#0A1628] px-6 pt-10 pb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-[#D4A843]/10 -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-1/2 w-32 h-32 rounded-full bg-white/5 -mb-10" />
        <div className="relative z-10">
          <p className="text-[#D4A843] text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1">Admin Panel</p>
          <h1 className="text-2xl font-extrabold text-white font-display">
            Welcome back, {userProfile?.name?.split(' ')[0] || 'Admin'}
          </h1>
          <p className="text-white/50 text-sm mt-1">Manage the ASF FUTO fellowship</p>
        </div>
      </div>

      <div className="px-4 md:px-6 -mt-4 space-y-5">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Users size={20} className="text-blue-500" />}
            bg="bg-blue-50 dark:bg-blue-900/20"
            label="Total Members"
            value={stats.totalMembers}
          />
          <StatCard
            icon={<ShieldCheck size={20} className="text-[#D4A843]" />}
            bg="bg-yellow-50 dark:bg-yellow-900/20"
            label="Gold Verified"
            value={stats.verifiedGold}
            accent
          />
          <StatCard
            icon={<Clock size={20} className="text-orange-500" />}
            bg="bg-orange-50 dark:bg-orange-900/20"
            label="Pending Verify"
            value={stats.pendingGrey}
            badge={stats.pendingGrey > 0}
          />
          <StatCard
            icon={<Layers size={20} className="text-purple-500" />}
            bg="bg-purple-50 dark:bg-purple-900/20"
            label="Forums"
            value={stats.totalForums}
          />
        </div>

        {/* New this week banner */}
        {stats.newThisWeek > 0 && (
          <div className="bg-white dark:bg-[#161B22] rounded-3xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
              <TrendingUp size={20} className="text-green-500" />
            </div>
            <div>
              <p className="font-extrabold text-[#0A1628] dark:text-gray-100 text-sm">
                {stats.newThisWeek} new member{stats.newThisWeek > 1 ? 's' : ''} this week
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">The fellowship is growing!</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div>
          <p className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1">Quick Actions</p>
          <div className="space-y-3">
            <AdminLink
              to="/admin/verify"
              icon={<ShieldCheck size={20} />}
              iconBg="bg-yellow-50 dark:bg-yellow-900/20 text-[#D4A843]"
              title="Verify Members"
              subtitle={`${stats.pendingGrey} pending verification`}
              badgeCount={stats.pendingGrey}
            />
            <AdminLink
              to="/admin/forums"
              icon={<Layers size={20} />}
              iconBg="bg-blue-50 dark:bg-blue-900/20 text-blue-600"
              title="Manage Forums"
              subtitle={`${stats.totalForums} active forum${stats.totalForums !== 1 ? 's' : ''}`}
            />
            <AdminLink
              to="/admin/members"
              icon={<Users size={20} />}
              iconBg="bg-gray-100 dark:bg-gray-800 text-[#0A1628] dark:text-gray-300"
              title="All Members"
              subtitle={`${stats.totalMembers} total registered`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: number;
  accent?: boolean;
  badge?: boolean;
}> = ({ icon, bg, label, value, accent, badge }) => (
  <div className="bg-white dark:bg-[#161B22] rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
    <div className={`w-10 h-10 rounded-2xl ${bg} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <div className={`text-3xl font-extrabold font-display ${accent ? 'text-[#D4A843]' : 'text-[#0A1628] dark:text-gray-100'}`}>
      {value}
    </div>
    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">{label}</p>
    {badge && value > 0 && (
      <div className="absolute top-4 right-4 w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
    )}
  </div>
);

const AdminLink: React.FC<{
  to: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  badgeCount?: number;
}> = ({ to, icon, iconBg, title, subtitle, badgeCount }) => (
  <Link
    to={to}
    className="flex items-center gap-4 bg-white dark:bg-[#161B22] p-4 rounded-3xl border-2 border-transparent dark:border-gray-800 hover:border-[#D4A843] shadow-sm transition-all group"
  >
    <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-extrabold text-[#0A1628] dark:text-gray-100 text-sm font-display">{title}</h3>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
    </div>
    {badgeCount != null && badgeCount > 0 && (
      <div className="w-6 h-6 rounded-full bg-orange-400 text-white text-[10px] font-extrabold flex items-center justify-center shrink-0">
        {badgeCount}
      </div>
    )}
    <ChevronRight size={18} className="text-gray-200 dark:text-gray-700 group-hover:text-[#D4A843] transition-colors shrink-0" />
  </Link>
);
