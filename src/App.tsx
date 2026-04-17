/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
        // Either profile not loaded yet (but loading is false, meaning doc missing) 
        // or form not filled - go to form.
        navigate('/fellowship-form', { replace: true });
      } else if (userProfile && userProfile.formFilled) {
        navigate('/', { replace: true });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, currentUser, userProfile, loading]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white">
      <h1 className="text-5xl font-extrabold text-[#0A1628] uppercase tracking-widest animate-pulse font-display" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        FLYNK
      </h1>
      <p className="text-gray-400 font-bold tracking-widest mt-2 uppercase text-xs">ASF FUTO</p>
    </div>
  );
};

export default function App() {
  return (
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
  );
}
