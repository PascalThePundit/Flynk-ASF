import React, { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, limit,
  doc, updateDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Bell, Plus, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserBadge } from '../../components/ui/UserBadge';
import { StoryCreation } from '../../components/ui/StoryCreation';
import { StoryViewer } from '../../components/ui/StoryViewer';
import { PostCreation } from '../../components/ui/PostCreation';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import type { Post, Story } from '../../types';

export const Home: React.FC = () => {
  const { userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [groupedStories, setGroupedStories] = useState<Record<string, Story[]>>({});
  const [showStoryCreation, setShowStoryCreation] = useState(false);
  const [showPostCreation, setShowPostCreation] = useState(false);
  const [viewingUserStories, setViewingUserStories] = useState<{
    userId: string; userName: string; userAvatar?: string | null;
  } | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  useEffect(() => {
    const pq = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30));
    const unsub1 = onSnapshot(pq, snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    });

    const sq = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsub2 = onSnapshot(sq, snap => {
      const now = Date.now();
      const active = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Story))
        .filter(s => s.expiresAt > now);
      setStories(active);
      const grouped: Record<string, Story[]> = {};
      active.forEach(s => {
        if (!grouped[s.userId]) grouped[s.userId] = [];
        grouped[s.userId].push(s);
      });
      setGroupedStories(grouped);
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const handleLike = async (post: Post) => {
    if (!userProfile || likingId === post.id) return;
    setLikingId(post.id);
    const ref = doc(db, 'posts', post.id);
    const liked = post.likes?.includes(userProfile.uid);
    await updateDoc(ref, {
      likes: liked ? arrayRemove(userProfile.uid) : arrayUnion(userProfile.uid),
    });
    setLikingId(null);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0D1117] flex flex-col pb-28 md:pb-8 page-enter">
      {showStoryCreation && <StoryCreation onClose={() => setShowStoryCreation(false)} />}
      {showPostCreation && <PostCreation onClose={() => setShowPostCreation(false)} />}
      {viewingUserStories && groupedStories[viewingUserStories.userId] && (
        <StoryViewer
          stories={groupedStories[viewingUserStories.userId]}
          userName={viewingUserStories.userName}
          userAvatar={viewingUserStories.userAvatar}
          onClose={() => setViewingUserStories(null)}
        />
      )}

      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-[#161B22] px-5 py-4 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800">
        <span className="text-2xl font-extrabold text-[#0A1628] dark:text-gray-100 tracking-[0.12em]" style={{ fontFamily: 'Syne, sans-serif' }}>
          FLYNK
        </span>
        <Link to="/notifications" className="relative p-2 hover:bg-gray-50 dark:hover:bg-[#1C2128] rounded-full transition">
          <Bell className="w-6 h-6 text-[#0A1628] dark:text-gray-300" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#D4A843] rounded-full ring-2 ring-white dark:ring-[#161B22]" />
        </Link>
      </div>

      {/* ── Stories Bar ── */}
      <div className="bg-white dark:bg-[#161B22] border-b border-gray-100 dark:border-gray-800 py-4">
        <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide snap-x">
          {/* Create story */}
          <div
            onClick={() => setShowStoryCreation(true)}
            className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer group"
          >
            <div className="relative w-[62px] h-[62px] rounded-full bg-gray-100 dark:bg-gray-800 group-hover:ring-2 group-hover:ring-[#D4A843] transition-all">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Me" className="w-full h-full rounded-full object-cover" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0A1628] to-[#122040] flex items-center justify-center text-white text-xl font-extrabold">
                  {userProfile?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 bg-[#D4A843] rounded-full flex items-center justify-center border-2 border-white dark:border-[#161B22] shadow">
                <Plus className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            </div>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 truncate w-[62px] text-center">Your Story</span>
          </div>

          {/* User stories */}
          {Object.entries(groupedStories).map(([userId, userStoryList]) => {
            const list = userStoryList as Story[];
            const latest = list[0];
            const hasSeenAll = userProfile ? list.every(s => s.viewers?.includes(userProfile.uid)) : false;
            return (
              <div
                key={userId}
                onClick={() => setViewingUserStories({ userId, userName: latest.userName, userAvatar: latest.userAvatar })}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start cursor-pointer"
              >
                <div className={cn(
                  'w-[62px] h-[62px] rounded-full p-[2.5px]',
                  hasSeenAll
                    ? 'bg-gray-200 dark:bg-gray-700'
                    : 'bg-gradient-to-tr from-[#D4A843] via-yellow-300 to-[#0A1628]'
                )}>
                  <div className="w-full h-full rounded-full bg-white dark:bg-[#161B22] p-[2px] overflow-hidden">
                    {latest.userAvatar ? (
                      <img src={latest.userAvatar} alt={latest.userName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-lg font-extrabold text-gray-400">
                        {latest.userName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300 truncate w-[62px] text-center">
                  {latest.userName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="flex-1 py-3 space-y-3 md:px-0">
        {posts.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-white dark:bg-[#161B22] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100 dark:border-gray-800">
              <Heart className="w-9 h-9 text-gray-200 dark:text-gray-700" />
            </div>
            <h3 className="font-extrabold text-[#0A1628] dark:text-gray-100 text-lg mb-1 font-display">Nothing here yet</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs mx-auto">The feed is empty. Be the first to share something with the fellowship!</p>
            <button
              onClick={() => setShowPostCreation(true)}
              className="mt-6 px-6 py-3 bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628] font-bold rounded-2xl text-sm hover:bg-[#D4A843] hover:text-[#0A1628] dark:hover:bg-yellow-400 transition-colors"
            >
              Create a Post
            </button>
          </div>
        ) : (
          posts.map(post => {
            const liked = userProfile ? post.likes?.includes(userProfile.uid) : false;
            return (
              <article key={post.id} className="bg-white dark:bg-[#161B22] md:mx-3 md:rounded-[1.75rem] border-y md:border border-gray-100 dark:border-gray-800 shadow-sm">
                {/* Post Header */}
                <div className="flex items-center justify-between px-4 pt-4 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                      {post.userAvatar ? (
                        <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-extrabold text-gray-300 dark:text-gray-600 text-base">
                          {post.userName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[#0A1628] dark:text-gray-100 text-sm font-display">{post.userName}</span>
                        <UserBadge status={post.userBadge} />
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Media */}
                {post.mediaUrl && (
                  <div className="w-full bg-gray-50 dark:bg-gray-900 aspect-square md:aspect-video overflow-hidden md:mx-0 md:rounded-xl md:px-4 mb-3">
                    <img src={post.mediaUrl} alt="Post" className="w-full h-full object-cover md:rounded-xl" />
                  </div>
                )}

                {/* Text content */}
                {post.content && (
                  <div className="px-4 pb-3 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </div>
                )}

                {/* Action bar */}
                <div className="flex items-center gap-1 px-3 py-3 border-t border-gray-50 dark:border-gray-800">
                  <button
                    onClick={() => handleLike(post)}
                    disabled={likingId === post.id}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-sm transition-all active:scale-90',
                      liked
                        ? 'text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1C2128] hover:text-red-400'
                    )}
                  >
                    <Heart size={18} className={cn('transition-all', liked && 'fill-red-500')} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1C2128] hover:text-gray-600 dark:hover:text-gray-300 font-bold text-sm transition-all">
                    <MessageCircle size={18} />
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-[#1C2128] hover:text-gray-600 dark:hover:text-gray-300 font-bold text-sm transition-all ml-auto">
                    <Share2 size={17} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowPostCreation(true)}
        className="md:hidden fixed bottom-24 right-5 w-14 h-14 bg-[#0A1628] dark:bg-[#D4A843] text-white dark:text-[#0A1628] rounded-full shadow-2xl shadow-[#0A1628]/30 flex items-center justify-center hover:bg-[#D4A843] hover:text-[#0A1628] active:scale-95 transition-all z-30"
      >
        <Plus className="w-6 h-6" strokeWidth={2.5} />
      </button>
    </div>
  );
};
