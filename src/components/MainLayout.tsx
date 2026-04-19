import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home as HomeIcon, MessageCircle, BookOpen, User, ShieldAlert, X, Bell, PlusSquare, Moon, Sun, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';
import { PostCreation } from './ui/PostCreation';

export const MainLayout: React.FC = () => {
  const { userProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isAdmin = userProfile?.role === 'admin';
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
  const [showPostCreation, setShowPostCreation] = useState(false);

  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    const getSundown = () => ({ hours: 18, minutes: 15 });

    const checkTimer = setInterval(() => {
      const now = new Date();
      const sundown = getSundown();
      
      if (now.getDay() === 5 && now.getHours() === sundown.hours && now.getMinutes() === sundown.minutes) {
        trigger('🌅 Sabbath is here!', "Time to put the world on pause and just BE. See you on the flip side of sundown, Saturday! 🕊️");
      }
      if (now.getDay() === 6 && now.getHours() === sundown.hours && now.getMinutes() === sundown.minutes) {
        trigger('🌟 Sabbath\'s over!', "You've been spiritually recharged — now go be the light the world needs! Welcome back 🔥");
      }
      
      if (now.getHours() === 9 && now.getMinutes() === 0 && userProfile?.birthday) {
        const b = new Date(userProfile.birthday);
        const t = new Date();
        if (b.getDate() === t.getDate() && b.getMonth() === t.getMonth()) {
          trigger('👑 Happy Birthday!', `Today is your special day! The ASF FUTO fellowship wishes you a blessed year ahead, ${userProfile.name.split(' ')[0]}! 🥳`);
        }
      }
    }, 60_000);

    return () => clearInterval(checkTimer);
  }, [userProfile]);

  const trigger = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
    setNotification({ title, body });
  };

  const navItems = [
    { to: '/', icon: <HomeIcon size={20} />, label: 'Home' },
    { to: '/chats', icon: <MessageCircle size={20} />, label: 'Messages' },
    { to: '/notifications', icon: <Bell size={20} />, label: 'Alerts' },
    { to: '/bible', icon: <BookOpen size={20} />, label: 'Library' },
    { to: '/profile', icon: <User size={20} />, label: 'Profile' },
    ...(isAdmin ? [{ to: '/admin', icon: <ShieldAlert size={20} />, label: 'Admin' }] : []),
  ];

  return (
    <div className="flex bg-[#F2F2F7] dark:bg-black min-h-screen selection:bg-brand selection:text-white">
      {showPostCreation && <PostCreation onClose={() => setShowPostCreation(false)} />}

      {/* ── Desktop Premium Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] h-screen sticky top-0 glass border-r border-white/20 z-40">
        {/* iOS style Header */}
        <div className="px-8 pt-12 pb-10">
          <Link to="/" className="flex flex-col gap-1 group">
            <span className="text-3xl font-extrabold text-navy dark:text-white tracking-tighter font-logo group-hover:text-brand transition-colors">
              FLYNK
            </span>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
               <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-[0.3em] uppercase">ASF FUTO</p>
            </div>
          </Link>
        </div>

        {/* User Card */}
        {userProfile && (
          <Link to="/profile" className="mx-4 mb-10 p-4 rounded-ios-inner glass border-white/40 dark:border-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all group flex items-center gap-3 active-scale">
            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-lg group-hover:shadow-brand/20 transition-all border-2 border-white">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand flex items-center justify-center text-white font-black text-xl">
                  {userProfile.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-navy dark:text-white truncate">{userProfile.name.split(' ')[0]}</p>
              <p className="text-[10px] text-gray-400 font-bold truncate tracking-tight">{userProfile.email}</p>
            </div>
          </Link>
        )}

        <nav className="flex-1 px-4 space-y-1.5">
          {navItems.map(item => (
            <SidebarItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Bottom Panel */}
        <div className="p-6 space-y-3">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-4 w-full p-4 rounded-ios-inner bg-white/40 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-bold text-xs transition-all hover:bg-white dark:hover:bg-white/10 active-scale"
          >
            {theme === 'dark' ? <Sun size={16} className="text-gold animate-reveal" /> : <Moon size={16} className="animate-reveal" />}
            {theme === 'dark' ? 'Light Appearance' : 'Dark Appearance'}
          </button>
          
          <button
            onClick={() => setShowPostCreation(true)}
            className="flex items-center justify-center gap-3 w-full p-5 bg-brand text-white rounded-[1.5rem] font-black text-sm shadow-2xl shadow-brand/20 active-scale hover:bg-brand/90 transition-all"
          >
            <PlusSquare size={18} />
            Share Word
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex justify-center relative">
        <div className="w-full max-w-2xl min-h-screen relative flex flex-col">

          {/* Dynamic Island Style Notification */}
          {notification && (
            <div className="fixed top-6 inset-x-0 flex justify-center z-[100] px-6">
              <div className="glass-dark px-6 py-4 rounded-[2.5rem] shadow-2xl flex items-center gap-4 max-w-sm animate-reveal border border-white/20">
                <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center shrink-0 shadow-lg">
                   <Sparkles size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-black text-brand text-[10px] uppercase tracking-widest mb-0.5">{notification.title}</h3>
                  <p className="text-xs font-medium text-white/90 leading-tight truncate">{notification.body}</p>
                </div>
                <button onClick={() => setNotification(null)} className="text-white/30 hover:text-white transition">
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          <main className="flex-1 pb-32 md:pb-8">
            <Outlet />
          </main>

          {/* ── iOS 26 Floating Dock (Mobile Nav) ── */}
          <div className="md:hidden fixed bottom-8 inset-x-6 z-50">
            <nav className="glass rounded-[2.5rem] shadow-2xl px-3 py-2.5 flex items-center justify-between border border-white/30 dark:border-white/10">
              <MobileNavItem to="/" icon={<HomeIcon size={22} />} />
              <MobileNavItem to="/chats" icon={<MessageCircle size={22} />} />

              {/* Central Primary Action */}
              <button
                onClick={() => setShowPostCreation(true)}
                className="w-14 h-14 bg-brand rounded-full flex items-center justify-center shadow-2xl shadow-brand/30 active-scale animate-reveal"
              >
                <PlusSquare size={24} className="text-white" strokeWidth={2.5} />
              </button>

              <MobileNavItem to="/bible" icon={<BookOpen size={22} />} />
              <MobileNavItem to="/profile" icon={<User size={22} />} />
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      cn(
        'flex items-center gap-4 px-5 py-4 rounded-ios-inner transition-all duration-300 group font-bold text-sm active-scale',
        isActive
          ? 'bg-brand text-white shadow-xl shadow-brand/20 translate-x-1'
          : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'
      )
    }
  >
    {({ isActive }) => (
      <>
        <span className={cn('transition-transform duration-300 group-hover:scale-110', isActive ? 'text-white' : 'text-gray-400 group-hover:text-brand')}>
          {icon}
        </span>
        <span className="tracking-tight">{label}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
      </>
    )}
  </NavLink>
);

const MobileNavItem: React.FC<{ to: string; icon: React.ReactNode }> = ({ to, icon }) => (
  <NavLink
    to={to}
    end={to === '/'}
    className={({ isActive }) =>
      cn(
        'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 active-scale',
        isActive ? 'text-brand bg-brand/10' : 'text-gray-400 hover:text-navy dark:hover:text-white'
      )
    }
  >
    {icon}
  </NavLink>
);
