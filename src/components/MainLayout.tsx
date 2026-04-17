import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';
import { Home as HomeIcon, MessageCircle, BookOpen, User, ShieldAlert, X, Bell, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn, getNextSabbathTimes } from '../lib/utils';
import { PostCreation } from './ui/PostCreation';

export const MainLayout: React.FC = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);
  const [showPostCreation, setShowPostCreation] = useState(false);

  useEffect(() => {
    // 1. Request Notification Permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // 2. Setup periodic check
    const checkTimer = setInterval(() => {
      const now = new Date();
      // Check Sabbath Start (Friday 6:00 PM)
      if (now.getDay() === 5 && now.getHours() === 18 && now.getMinutes() === 0) {
        showLocalNotification("🌅 Sabbath is here!", "Time to put the world on pause and just BE. See you on the flip side of sundown, Saturday! 🕊️");
      }

      // Check Sabbath End (Saturday 6:00 PM)
      if (now.getDay() === 6 && now.getHours() === 18 && now.getMinutes() === 0) {
        showLocalNotification("🌟 Sabbath's over!", "You've been spiritually recharged — now go be the light the world needs! Welcome back 🔥");
      }

      // Check Birthdays at 9:00 AM
      if (now.getHours() === 9 && now.getMinutes() === 0 && userProfile?.birthday) {
        const bday = new Date(userProfile.birthday);
        if (bday.getDate() === now.getDate() && bday.getMonth() === now.getMonth()) {
          showLocalNotification("👑 Happy Birthday!", "Today is your special day! The ASF FUTO fellowship wishes you a blessed year ahead! 🥳");
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkTimer);
  }, [userProfile]);

  const showLocalNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    setNotification({ title, body });
  };

  return (
    <div className="flex bg-white min-h-screen">
      {showPostCreation && <PostCreation onClose={() => setShowPostCreation(false)} />}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[240px] lg:w-[280px] h-screen sticky top-0 border-r border-gray-100 p-6 z-40 bg-white">
        <Link to="/" className="mb-10 px-3">
          <h1 className="text-2xl font-extrabold text-[#0A1628] uppercase tracking-[0.2em]" style={{ fontFamily: 'Syne, sans-serif' }}>
            FLYNK
          </h1>
        </Link>

        <nav className="flex-1 space-y-2">
          <SidebarItem to="/" icon={<HomeIcon size={24} />} label="Home" />
          <SidebarItem to="/chats" icon={<MessageCircle size={24} />} label="Messages" />
          <SidebarItem to="/notifications" icon={<Bell size={24} />} label="Notifications" />
          <SidebarItem to="/bible" icon={<BookOpen size={24} />} label="Library" />
          <SidebarItem to="/profile" icon={<User size={24} />} label="Profile" />
          {isAdmin && (
            <SidebarItem to="/admin" icon={<ShieldAlert size={24} />} label="Admin" />
          )}

          <div className="pt-8">
             <button 
               onClick={() => setShowPostCreation(true)}
               className="flex items-center gap-4 px-4 py-4 w-full bg-[#0A1628] text-white rounded-2xl shadow-xl shadow-[#0A1628]/10 hover:bg-[#D4A843] transition-all group font-bold"
             >
                <PlusCircle size={24} className="text-[#D4A843] group-hover:text-white transition-colors" />
                <span>Create Post</span>
             </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex justify-center bg-[#F8F9FA] md:bg-white relative">
        <div className="w-full max-w-2xl bg-[#F8F9FA] min-h-screen relative flex flex-col md:border-x md:border-gray-100 shadow-none">
          
          {/* On-Screen Notification Alert */}
          {notification && (
            <div className="fixed md:absolute top-6 left-6 right-6 z-[100] bg-[#0A1628] text-white p-5 rounded-3xl shadow-2xl animate-in slide-in-from-top-12 border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-extrabold text-[#D4A843] uppercase tracking-widest text-xs">{notification.title}</h3>
                <button onClick={() => setNotification(null)}><X size={16} className="text-white/40" /></button>
              </div>
              <p className="text-sm font-medium leading-relaxed">{notification.body}</p>
            </div>
          )}

          <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
            <Outlet />
          </main>

          {/* Mobile Bottom Navigation */}
          <div className="md:hidden fixed bottom-6 w-full px-6 z-50 pointer-events-none">
            <nav className="bg-[#0A1628] rounded-[2rem] shadow-xl px-2 py-2 flex justify-between items-center pointer-events-auto">
              <MobileNavItem to="/" icon={<HomeIcon strokeWidth={2.5} size={22} />} />
              <MobileNavItem to="/chats" icon={<MessageCircle strokeWidth={2.5} size={22} />} />
              
              <NavLink
                to="/bible"
                className={({ isActive }) =>
                  cn(
                    "relative flex items-center justify-center w-14 h-14 bg-[#D4A843] rounded-full shadow-lg transform -translate-y-4 transition-transform active:scale-95",
                    isActive ? "ring-4 ring-yellow-100" : ""
                  )
                }
              >
                <BookOpen strokeWidth={2.5} size={24} className="text-white" />
              </NavLink>

              <MobileNavItem to="/notifications" icon={<Bell strokeWidth={2.5} size={22} />} />
              <MobileNavItem to="/profile" icon={<User strokeWidth={2.5} size={22} />} />
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string }> = ({ to, icon, label }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group",
          isActive ? "bg-[#0A1628] text-white" : "text-gray-500 hover:bg-gray-50 hover:text-[#0A1628]"
        )
      }
    >
      {({ isActive }) => (
        <>
          <div className={cn("transition-transform group-hover:scale-110", isActive ? "text-[#D4A843]" : "")}>
            {icon}
          </div>
          <span className="font-bold text-sm tracking-tight">{label}</span>
        </>
      )}
    </NavLink>
  );
};

const MobileNavItem: React.FC<{ to: string; icon: React.ReactNode }> = ({ to, icon }) => {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative flex items-center justify-center p-3 rounded-2xl transition-all duration-300",
          isActive ? "text-[#D4A843] bg-white/10" : "text-gray-400 hover:text-white"
        )
      }
    >
      {({ isActive }) => (
        <>
          {icon}
          {isActive && (
            <div className="absolute bottom-1 w-1 h-1 rounded-full bg-[#D4A843]" />
          )}
        </>
      )}
    </NavLink>
  );
};

