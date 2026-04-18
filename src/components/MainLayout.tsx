import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home as HomeIcon, MessageCircle, BookOpen, User, ShieldAlert, X, Bell, PlusSquare, Moon, Sun } from 'lucide-react';
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

    const checkTimer = setInterval(() => {
      const now = new Date();
      if (now.getDay() === 5 && now.getHours() === 18 && now.getMinutes() === 0) {
        trigger('🌅 Sabbath is here!', "Time to put the world on pause and just BE. See you on the flip side of sundown, Saturday! 🕊️");
      }
      if (now.getDay() === 6 && now.getHours() === 18 && now.getMinutes() === 0) {
        trigger('🌟 Sabbath\'s over!', "You've been spiritually recharged — now go be the light the world needs! Welcome back 🔥");
      }
      if (now.getHours() === 9 && now.getMinutes() === 0 && userProfile?.birthday) {
        const b = new Date(userProfile.birthday);
        const t = new Date();
        if (b.getDate() === t.getDate() && b.getMonth() === t.getMonth()) {
          trigger('👑 Happy Birthday!', "Today is your special day! The ASF FUTO fellowship wishes you a blessed year ahead! 🥳");
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
    { to: '/', icon: <HomeIcon size={22} strokeWidth={2} />, label: 'Home' },
    { to: '/chats', icon: <MessageCircle size={22} strokeWidth={2} />, label: 'Messages' },
    { to: '/notifications', icon: <Bell size={22} strokeWidth={2} />, label: 'Alerts' },
    { to: '/bible', icon: <BookOpen size={22} strokeWidth={2} />, label: 'Library' },
    { to: '/profile', icon: <User size={22} strokeWidth={2} />, label: 'Profile' },
    ...(isAdmin ? [{ to: '/admin', icon: <ShieldAlert size={22} strokeWidth={2} />, label: 'Admin' }] : []),
  ];

  const mobileNavItems = [
    { to: '/', icon: <HomeIcon size={22} strokeWidth={2.5} /> },
    { to: '/chats', icon: <MessageCircle size={22} strokeWidth={2.5} /> },
  ];
  const mobileNavRight = [
    { to: '/notifications', icon: <Bell size={22} strokeWidth={2.5} /> },
    { to: '/profile', icon: <User size={22} strokeWidth={2.5} /> },
  ];

  return (
    <div className="flex bg-[#F8F9FA] dark:bg-[#0D1117] min-h-screen">
      {showPostCreation && <PostCreation onClose={() => setShowPostCreation(false)} />}

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex flex-col w-[240px] lg:w-[272px] h-screen sticky top-0 bg-white dark:bg-[#161B22] border-r border-gray-100 dark:border-gray-800 z-40">
        {/* Logo */}
        <div className="px-7 pt-8 pb-6">
          <Link to="/" className="block">
            <span
              className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100 tracking-[0.2em] uppercase"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              FLYNK
            </span>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase mt-0.5">ASF FUTO</p>
          </Link>
        </div>

        {/* Avatar quick peek */}
        {userProfile && (
          <Link to="/profile" className="flex items-center gap-3 mx-4 mb-6 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1C2128] transition group">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
              {userProfile.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="me" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#0A1628] to-[#122040] flex items-center justify-center text-white font-extrabold text-base">
                  {userProfile.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-[#0A1628] dark:text-gray-100 truncate">{userProfile.name.split(' ')[0]}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{userProfile.email}</p>
            </div>
          </Link>
        )}

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(item => (
            <SidebarItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-gray-50 dark:border-gray-800 space-y-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1C2128] font-bold text-sm transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} className="text-[#D4A843]" /> : <Moon size={18} />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          {/* Create Post */}
          <button
            onClick={() => setShowPostCreation(true)}
            className="flex items-center gap-3 w-full px-4 py-3.5 bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628] rounded-2xl font-bold text-sm hover:bg-[#D4A843] dark:hover:bg-yellow-400 hover:text-[#0A1628] transition-colors shadow-lg shadow-[#0A1628]/10 group"
          >
            <PlusSquare size={20} className="text-[#D4A843] group-hover:text-[#0A1628] dark:text-[#0A1628]" />
            Create Post
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex justify-center relative">
        <div className="w-full max-w-2xl min-h-screen relative flex flex-col">

          {/* In-app notification banner */}
          {notification && (
            <div className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:w-[360px] z-[100]">
              <div className="bg-[#0A1628] text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10">
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="font-extrabold text-[#D4A843] uppercase tracking-wider text-xs">{notification.title}</h3>
                  <button onClick={() => setNotification(null)} className="text-white/40 hover:text-white transition ml-3 shrink-0">
                    <X size={15} />
                  </button>
                </div>
                <p className="text-sm font-medium leading-relaxed text-white/90">{notification.body}</p>
              </div>
            </div>
          )}

          <main className="flex-1">
            <Outlet />
          </main>

          {/* ── Mobile Bottom Nav (floating pill) ── */}
          <div className="md:hidden fixed bottom-5 inset-x-4 z-50 pointer-events-none">
            <nav className="bg-[#0A1628] dark:bg-[#161B22] rounded-[2rem] shadow-2xl shadow-[#0A1628]/40 px-2 py-1.5 flex items-center justify-between pointer-events-auto border border-transparent dark:border-gray-700">
              {mobileNavItems.map(item => (
                <MobileNavItem key={item.to} to={item.to} icon={item.icon} />
              ))}

              {/* Centre create button */}
              <button
                onClick={() => setShowPostCreation(true)}
                className="w-12 h-12 bg-[#D4A843] rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
              >
                <PlusSquare size={22} className="text-white" strokeWidth={2} />
              </button>

              {mobileNavRight.map(item => (
                <MobileNavItem key={item.to} to={item.to} icon={item.icon} />
              ))}

              {/* Theme toggle in mobile nav */}
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200 text-white/50 hover:text-white/80 active:scale-90"
              >
                {theme === 'dark' ? <Sun size={20} className="text-[#D4A843]" /> : <Moon size={20} />}
              </button>
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
        'flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 group font-bold text-sm',
        isActive
          ? 'bg-[#0A1628] text-white shadow-lg shadow-[#0A1628]/10'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1C2128] hover:text-[#0A1628] dark:hover:text-gray-100'
      )
    }
  >
    {({ isActive }) => (
      <>
        <span className={cn('transition-colors', isActive ? 'text-[#D4A843]' : 'group-hover:text-[#0A1628] dark:group-hover:text-gray-100')}>
          {icon}
        </span>
        <span>{label}</span>
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
        'flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-200',
        isActive ? 'text-[#D4A843] bg-white/10' : 'text-white/50 hover:text-white/80'
      )
    }
  >
    {icon}
  </NavLink>
);
