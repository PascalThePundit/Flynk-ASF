import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
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
    const q = query(
      collection(db, `notifications/${currentUser.uid}/items`),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setNotifications(snap.docs.map(d => {
        const data = d.data({ serverTimestamps: 'estimate' });
        return { 
          id: d.id, 
          ...data,
          createdAt: data.createdAt?.toMillis?.() || Date.now()
        } as AppNotification;
      }));
    }, (error) => {
      console.error("Notifications listener error:", error);
    });
    return () => unsub();
  }, [currentUser]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'birthday': return <Star className="text-yellow-500" />;
      case 'sabbath': return <Calendar className="text-blue-500" />;
      case 'verification': return <CheckCircle2 className="text-emerald-500" />;
      default: return <Bell className="text-gray-400 dark:text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] flex flex-col pb-24 md:pb-8 page-enter">
      <div className="bg-white dark:bg-[#161B22] border-b border-gray-100 dark:border-gray-800 p-6 pt-10 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-[#0A1628] dark:text-gray-100 font-display">Notifications</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Stay updated with ASF FUTO</p>
      </div>

      <div className="p-4 space-y-3 flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400 dark:text-gray-600">
            <Bell size={48} className="mb-4" />
            <p className="font-bold">No notifications yet</p>
            <p className="text-sm mt-1">We'll notify you here for birthdays and events!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} className="bg-white dark:bg-[#161B22] p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-800 flex gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-[#1C2128] flex items-center justify-center shrink-0">
                {getIcon(n.type)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-[#0A1628] dark:text-gray-100 text-sm">{n.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{n.body}</p>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-2 block">
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
