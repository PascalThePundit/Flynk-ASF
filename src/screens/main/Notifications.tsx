import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Calendar, Star, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: 'birthday' | 'sabbath' | 'verification' | 'system';
  createdAt: number;
}

export const Notifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    // In a real app, we'd fetch from a notifications collection
    // For this prototype, we'll listen to a mock collection or just show a "Coming soon" if empty
    const q = query(
      collection(db, `notifications/${currentUser.uid}/items`), 
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification)));
    });

    return () => unsub();
  }, [currentUser]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Star className="text-yellow-500" />;
      case 'sabbath': return <Calendar className="text-blue-500" />;
      case 'verification': return <CheckCircle2 className="text-emerald-500" />;
      default: return <Bell className="text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col pb-24 md:pb-8">
      <div className="bg-white border-b border-gray-100 p-6 pt-10 sticky top-0 z-10 md:rounded-t-[2.5rem] md:mt-6">
        <h1 className="text-2xl font-bold text-[#0A1628] font-display">Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Stay updated with ASF FUTO</p>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <Bell size={48} className="mb-4" />
            <p className="font-bold">No notifications yet</p>
            <p className="text-sm">We'll notify you here for birthdays and events!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex gap-4 animate-in fade-in slide-in-from-bottom-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#0A1628] text-sm">{n.title}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{n.body}</p>
                <span className="text-[10px] font-bold text-gray-400 mt-2 block">
                  {formatDistanceToNow(n.createdAt, { addSuffix: true })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
