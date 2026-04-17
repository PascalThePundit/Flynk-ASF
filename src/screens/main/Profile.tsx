import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { UserBadge } from '../../components/ui/UserBadge';
import { LogOut, Settings, Hash, Award, MapPin } from 'lucide-react';
import { format } from 'date-fns';

export const Profile: React.FC = () => {
  const { userProfile } = useAuth();

  const handleLogout = () => {
    signOut(auth);
  };

  const isBirthdayToday = () => {
    if (!userProfile?.birthday) return false;
    const bday = new Date(userProfile.birthday);
    const today = new Date();
    return bday.getDate() === today.getDate() && bday.getMonth() === today.getMonth();
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="bg-white px-6 py-6 pb-4 sticky top-0 z-20 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-[#0A1628] font-display tracking-tight">Profile</h1>
        <button className="p-2 hover:bg-gray-50 rounded-full transition">
          <Settings className="w-6 h-6 text-[#0A1628]" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-bl-full -mr-10 -mt-10" />

          <div className="flex flex-col items-center relative z-10">
            <div className="relative">
              {isBirthdayToday() && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>
              )}
              <div className={`w-28 h-28 rounded-full border-4 ${userProfile.badgeStatus === 'gold' ? 'border-[#D4A843]' : 'border-white'} overflow-hidden shadow-lg mb-4 bg-gray-100 flex items-center justify-center`}>
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-extrabold text-gray-300 font-display">{userProfile.name.charAt(0)}</span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-extrabold text-[#0A1628] font-display">{userProfile.name}</h2>
              <UserBadge status={userProfile.badgeStatus} role={userProfile.role} isForumHead={userProfile.isForumHead} />
            </div>
            <p className="text-sm font-medium text-gray-500 mb-4">{userProfile.email}</p>

            {userProfile.bio && (
              <p className="text-center text-sm text-gray-700 bg-gray-50 p-4 rounded-2xl w-full">
                {userProfile.bio}
              </p>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
           {userProfile.department && (
             <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
               <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                 <MapPin className="w-4 h-4" />
               </div>
               <div>
                  <div className="text-xs font-bold text-gray-400 uppercase">Department</div>
                  <div className="font-bold text-[#0A1628]">{userProfile.department}</div>
               </div>
             </div>
           )}
           {userProfile.level && (
             <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-2">
               <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                 <Award className="w-4 h-4" />
               </div>
               <div>
                  <div className="text-xs font-bold text-gray-400 uppercase">Level</div>
                  <div className="font-bold text-[#0A1628]">{userProfile.level}</div>
               </div>
             </div>
           )}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-5 bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-red-200 hover:bg-red-50 text-red-600 transition-all group font-bold"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </div>
        </button>
      </div>
    </div>
  );
};
