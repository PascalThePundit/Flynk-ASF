import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, MessageCircle, BookOpen, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export const MainLayout: React.FC = () => {
  const { userProfile } = useAuth();
  
  const isAdmin = userProfile?.role === 'admin';

  return (
    <div className="flex justify-center bg-gray-100 min-h-screen">
      <div className="w-full max-w-md bg-[#F8F9FA] shadow-2xl relative flex flex-col min-h-screen overflow-hidden">
        
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>

        <div className="absolute bottom-6 w-full px-6 z-50 pointer-events-none">
          <nav className="bg-[#0A1628] rounded-[2rem] shadow-xl px-2 py-2 flex justify-between items-center pointer-events-auto">
            <NavItem to="/" icon={<Home strokeWidth={2.5} size={22} />} />
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

