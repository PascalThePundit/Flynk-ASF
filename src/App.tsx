/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoutes';
import { MainLayout } from './components/MainLayout';

import { Login } from './screens/auth/Login';
import { Register } from './screens/auth/Register';
import { FellowshipForm } from './screens/auth/FellowshipForm';
import { Home } from './screens/main/Home';
import { ChatsList } from './screens/main/ChatsList';
import { ChatRoom } from './screens/main/ChatRoom';
import { BibleReader } from './screens/main/Bible';
import { Profile } from './screens/main/Profile';
import { Notifications } from './screens/main/Notifications';

// Admin Screens
import { AdminDashboard } from './screens/admin/AdminDashboard';
import { VerifyMembers } from './screens/admin/VerifyMembers';
import { ManageForums } from './screens/admin/ManageForums';
import { AllMembers } from './screens/admin/AllMembers';

// Splash Screen Logic
const Splash = () => {
  const navigate = useNavigate();
  const { currentUser, userProfile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (!currentUser) {
        navigate('/login', { replace: true });
      } else if (!userProfile || !userProfile.formFilled) {
        navigate('/fellowship-form', { replace: true });
      } else if (userProfile && userProfile.formFilled) {
        navigate('/', { replace: true });
      }
    }, 2800); // Slightly longer for premium reveal

    return () => clearTimeout(timer);
  }, [navigate, currentUser, userProfile, loading]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F2F2F7] dark:bg-[#000000] overflow-hidden relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-gold/10 blur-[120px] rounded-full" />
      
      <div className="relative z-10 flex flex-col items-center animate-reveal">
        <div className="w-24 h-24 bg-white dark:bg-[#1C1C1E] rounded-[2rem] shadow-2xl flex items-center justify-center mb-8 animate-float">
          <span className="text-4xl font-extrabold text-brand tracking-tighter" style={{ fontFamily: 'Syne, sans-serif' }}>F</span>
        </div>
        
        <h1 className="text-6xl font-extrabold text-navy dark:text-white uppercase tracking-[0.25em] font-logo mb-3">
          FLYNK
        </h1>
        <div className="flex items-center gap-3">
          <div className="h-px w-8 bg-gray-300 dark:bg-gray-800" />
          <p className="text-gray-400 dark:text-gray-500 font-bold tracking-[0.4em] uppercase text-[10px]">ASF FUTO</p>
          <div className="h-px w-8 bg-gray-300 dark:bg-gray-800" />
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="absolute bottom-16 flex flex-col items-center gap-4">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div 
              key={i} 
              className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" 
              style={{ animationDelay: `${i * 0.15}s` }} 
            />
          ))}
        </div>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-50">Initializing Core</p>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/splash" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Fellowship Form (Requires Auth, but incomplete profile) */}
          <Route path="/fellowship-form" element={
             <div className="bg-white min-h-screen">
                <FellowshipForm />
             </div>
          } />

          {/* Protected Routes (Member/Forum Head) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/chats" element={<ChatsList />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/bible" element={<BibleReader />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/verify" element={<VerifyMembers />} />
                <Route path="/admin/forums" element={<ManageForums />} />
                <Route path="/admin/members" element={<AllMembers />} />
              </Route>
            </Route>

            {/* Sub-routes without bottom nav (Full screen) */}
            <Route path="/chats/:roomId" element={<ChatRoom />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/splash" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
