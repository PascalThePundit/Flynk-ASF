import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Bell, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserBadge } from '../../components/ui/UserBadge';
import { formatDistanceToNow } from 'date-fns';
import type { Post, Story } from '../../types';

export const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<Record<string, Story[]>>({});

  useEffect(() => {
    // Listen to feed posts
    const pQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
    const unsubPosts = onSnapshot(pQuery, (snap) => {
      setPosts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });

    // Listen to active stories (simplified locally for now: we'll filter out expired clientside)
    const sQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsubStories = onSnapshot(sQuery, (snap) => {
      const now = Date.now();
      const allStories = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Story))
        .filter(s => s.expiresAt > now); // Filter active 24h stories
      
      setStories(allStories);

      // Group by user
      const grouped: Record<string, Story[]> = {};
      allStories.forEach(story => {
        if (!grouped[story.userId]) grouped[story.userId] = [];
        grouped[story.userId].push(story);
      });
      setGroupedStories(grouped);
    });

    return () => { unsubPosts(); unsubStories(); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-16">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-[#0A1628] uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
          FLYNK
        </h1>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
          <Bell className="w-6 h-6 text-[#0A1628]" />
          {/* Notification dot placeholder */}
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>

      {/* Stories Bar */}
      <div className="bg-white py-4 border-b border-gray-100">
        <div className="flex gap-4 overflow-x-auto px-4 snap-x pb-2 scrollbar-hide">
          {/* Create Story Button */}
          <div className="flex flex-col items-center gap-1 shrink-0 snap-start">
            <div className="relative w-16 h-16 rounded-full p-[2px] bg-gray-200">
              <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden relative">
                 {userProfile?.avatarUrl ? (
                   <img src={userProfile.avatarUrl} alt="Me" className="w-full h-full object-cover" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-100 text-xl font-bold text-gray-400">
                     {userProfile?.name?.charAt(0) || 'U'}
                   </div>
                 )}
                 <div className="absolute bottom-0 right-0 bg-[#D4A843] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    <Plus className="w-3 h-3 text-white" />
                 </div>
              </div>
            </div>
            <span className="text-[10px] font-medium text-gray-500">Your Story</span>
          </div>

          {/* Render active story groupings */}
          {Object.entries(groupedStories).map(([userId, userStories]) => {
            const latestStory = userStories[0];
            // Determine if the current user has seen all these stories
            // We simulate it by checking if our UID is in the viewers array of the latest one
            const hasSeenAll = userProfile && latestStory.viewers?.includes(userProfile.uid);
            
            return (
              <div key={userId} className="flex flex-col items-center gap-1 shrink-0 snap-start cursor-pointer">
                <div className={`relative w-16 h-16 rounded-full p-[2px] ${hasSeenAll ? 'bg-gray-200' : 'bg-gradient-to-tr from-[#D4A843] to-[#0A1628]'}`}>
                  <div className="w-full h-full rounded-full bg-white border-2 border-white overflow-hidden bg-gray-100">
                     {latestStory.userAvatar ? (
                       <img src={latestStory.userAvatar} alt={latestStory.userName} className="w-full h-full object-cover" />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                         {latestStory.userName.charAt(0)}
                       </div>
                     )}
                  </div>
                </div>
                <span className="text-[10px] font-medium text-gray-900 truncate w-16 text-center">
                  {latestStory.userName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Feed */}
      <div className="flex-1 space-y-4 pt-2">
        {posts.length === 0 ? (
          <div className="text-center py-20 px-6">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-bold text-[#0A1628] mb-1">Welcome to FLYNK</h3>
            <p className="text-sm text-gray-500">The feed is practically empty! Follow forums or create the first post.</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} className="bg-white border-y border-gray-100 py-4">
              {/* Post Header */}
              <div className="flex items-center px-4 mb-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 mr-3">
                  {post.userAvatar ? (
                    <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-gray-400 text-sm">
                      {post.userName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[#0A1628] text-sm">{post.userName}</span>
                    <UserBadge status={post.userBadge} />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                  </span>
                </div>
              </div>

              {/* Post Content */}
              {post.mediaUrl ? (
                <div className="w-full bg-gray-50 aspect-square mb-3">
                  <img src={post.mediaUrl} alt="Post media" className="w-full h-full object-cover" />
                </div>
              ) : null}
              
              <div className="px-4 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>

              {/* Action Bar */}
              <div className="px-4 mt-4 flex items-center gap-4 border-t border-gray-50 pt-3">
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors">
                   <svg fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                   </svg>
                   <span className="text-xs font-bold">{post.likes?.length || 0}</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating Create Post Button */}
      <button className="fixed bottom-20 right-4 w-14 h-14 bg-[#0A1628] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-opacity-90 active:scale-95 transition-all z-30">
        <Plus className="w-6 h-6" />
      </button>

    </div>
  );
};
