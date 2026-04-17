import React, { useEffect, useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home as HomeIcon, MessageCircle, BookOpen, User, ShieldAlert, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn, getNextSabbathTimes } from '../lib/utils';

export const MainLayout: React.FC = () => {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';
  const [notification, setNotification] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    // 1. Request Notification Permission
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    // 2. Setup periodic check
    const checkTimer = setInterval(() => {
      const now = new Date();
      const { Friday, Saturday } = getNextSabbathTimes();

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
    <div className="flex justify-center bg-gray-100 min-h-screen">
      <div className="w-full max-w-md bg-[#F8F9FA] shadow-2xl relative flex flex-col min-h-screen overflow-hidden">
        
        {/* On-Screen Notification Alert */}
        {notification && (
          <div className="absolute top-6 left-6 right-6 z-[100] bg-[#0A1628] text-white p-5 rounded-3xl shadow-2xl animate-in slide-in-from-top-12 border border-white/10">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-extrabold text-[#D4A843] uppercase tracking-widest text-xs">{notification.title}</h3>
              <button onClick={() => setNotification(null)}><X size={16} className="text-white/40" /></button>
            </div>
            <p className="text-sm font-medium leading-relaxed">{notification.body}</p>
          </div>
        )}

        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>

        <div className="absolute bottom-6 w-full px-6 z-50 pointer-events-none">
          <nav className="bg-[#0A1628] rounded-[2rem] shadow-xl px-2 py-2 flex justify-between items-center pointer-events-auto">
            <NavItem to="/" icon={<HomeIcon strokeWidth={2.5} size={22} />} />
            <NavItem to="/chats" icon={<MessageCircle strokeWidth={2.5} size={22} />} />
            
            {/* Center prominent button for Bible */}
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

            <NavItem to="/profile" icon={<User strokeWidth={2.5} size={22} />} />
            {isAdmin && (
              <NavItem to="/admin" icon={<ShieldAlert strokeWidth={2.5} size={22} />} />
            )}
          </nav>
        </div>
      </div>
    </div>
  );
};

const NavItem: React.FC<{ to: string; icon: React.ReactNode }> = ({ to, icon }) => {
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
