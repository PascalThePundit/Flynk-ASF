import React, { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot, limit,
  doc, updateDoc, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Bell, Plus, Heart, MessageCircle, Share2, Sparkles, Send } from 'lucide-react';
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
  const { userProfile, currentUser } = useAuth();
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
    // STEP 3: Guard — do not run if not logged in
    if (!currentUser) return;

    const pq = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribePosts = onSnapshot(
      pq, 
      (snap) => {
        setPosts(snap.docs.map(d => {
          const data = d.data({ serverTimestamps: 'estimate' });
          return { 
            id: d.id, 
            ...data,
            createdAt: data.createdAt?.toMillis?.() || Date.now() 
          } as Post;
        }));
      },
      (error) => {
        // STEP 3: Error handler as the third argument
        console.error('Home posts listener error:', error.code, error.message);
      }
    );

    const sq = query(collection(db, 'stories'), orderBy('createdAt', 'desc'));
    const unsubscribeStories = onSnapshot(
      sq, 
      (snap) => {
        const now = Date.now();
        const active = snap.docs
          .map(d => {
            const data = d.data({ serverTimestamps: 'estimate' });
            return { 
              id: d.id, 
              ...data, 
              createdAt: data.createdAt?.toMillis?.() || Date.now() 
            } as Story;
          })
          .filter(s => s.expiresAt > now);
        setStories(active);
        const grouped: Record<string, Story[]> = {};
        active.forEach(s => {
          if (!grouped[s.userId]) grouped[s.userId] = [];
          grouped[s.userId].push(s);
        });
        setGroupedStories(grouped);
      },
      (error) => {
        console.error('Home stories listener error:', error.code, error.message);
      }
    );

    // STEP 3: Cleanup on unmount or when user changes
    return () => {
      unsubscribePosts();
      unsubscribeStories();
    };
  }, [currentUser]);

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
    <div className="min-h-screen bg-[#F2F2F7] dark:bg-black flex flex-col pb-32 md:pb-8 animate-reveal">
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
      <div className="md:hidden glass px-6 py-5 flex items-center justify-between sticky top-0 z-20 border-b border-white/20">
        <div className="flex flex-col">
          <span className="text-2xl font-black text-navy dark:text-white tracking-tighter font-logo">FLYNK</span>
          <span className="text-[9px] font-bold text-brand uppercase tracking-[0.3em] -mt-1">ASF FUTO</span>
        </div>
        <Link to="/notifications" className="relative w-10 h-10 glass rounded-full flex items-center justify-center active-scale">
          <Bell className="w-5 h-5 text-navy dark:text-white" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand rounded-full ring-2 ring-white dark:ring-black" />
        </Link>
      </div>

      {/* ── Stories Bar ── */}
      <div className="py-6 overflow-hidden">
        <div className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-hide snap-x">
          {/* Create story */}
          <div
            onClick={() => setShowStoryCreation(true)}
            className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer group active-scale"
          >
            <div className="relative w-16 h-16 rounded-[1.8rem] bg-white dark:bg-[#1C1C1E] shadow-xl p-1 group-hover:shadow-brand/20 transition-all border border-white">
              {userProfile?.avatarUrl ? (
                <img src={userProfile.avatarUrl} alt="Me" className="w-full h-full rounded-[1.5rem] object-cover" />
              ) : (
                <div className="w-full h-full rounded-[1.5rem] bg-brand flex items-center justify-center text-white text-2xl font-black">
                  {userProfile?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-brand rounded-full flex items-center justify-center border-2 border-white dark:border-black shadow-lg">
                <Plus className="w-3 h-3 text-white" strokeWidth={4} />
              </div>
            </div>
            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-tighter">My Word</span>
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
                className="flex flex-col items-center gap-2 shrink-0 snap-start cursor-pointer active-scale"
              >
                <div className={cn(
                  'w-16 h-16 rounded-[1.8rem] p-[2px] shadow-xl transition-all',
                  hasSeenAll
                    ? 'bg-gray-200 dark:bg-white/10'
                    : 'bg-gradient-to-tr from-brand via-brand/60 to-gold'
                )}>
                  <div className="w-full h-full rounded-[1.6rem] bg-white dark:bg-black p-[2px] overflow-hidden">
                    {latest.userAvatar ? (
                      <img src={latest.userAvatar} alt={latest.userName} className="w-full h-full rounded-[1.4rem] object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-[1.4rem] bg-gray-100 dark:bg-white/5 flex items-center justify-center text-xl font-black text-gray-400">
                        {latest.userName.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-black text-navy dark:text-white uppercase tracking-tighter truncate w-16 text-center">
                  {latest.userName.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Feed ── */}
      <div className="flex-1 px-4 md:px-0 space-y-4 pb-20">
        {posts.length === 0 ? (
          <div className="text-center py-20 px-6 animate-reveal">
            <div className="w-24 h-24 glass rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <Sparkles className="w-10 h-10 text-brand animate-pulse" />
            </div>
            <h3 className="font-black text-navy dark:text-white text-xl mb-2 font-display">Quiet in the Fellowship</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[240px] mx-auto leading-relaxed">The feed is waiting for your testimony. Be the light today.</p>
            <button
              onClick={() => setShowPostCreation(true)}
              className="mt-8 px-8 py-4 bg-brand text-white font-black rounded-2xl text-sm shadow-xl shadow-brand/20 active-scale"
            >
              Share a Word
            </button>
          </div>
        ) : (
          posts.map(post => {
            const liked = userProfile ? post.likes?.includes(userProfile.uid) : false;
            return (
              <article key={post.id} className="glass dark:bg-white/5 md:rounded-[2.5rem] rounded-[2rem] border border-white/40 dark:border-white/5 shadow-xl overflow-hidden animate-reveal group">
                {/* Post Header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 border border-white shadow-sm">
                      {post.userAvatar ? (
                        <img src={post.userAvatar} alt={post.userName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-brand/10 flex items-center justify-center font-black text-brand text-sm">
                          {post.userName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-navy dark:text-white text-sm tracking-tight">{post.userName}</span>
                        <UserBadge status={post.userBadge} />
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                        {formatDistanceToNow(post.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Media Content */}
                {post.mediaUrl && (
                  <div className="px-3 pb-3">
                    <div className="w-full aspect-square md:aspect-video overflow-hidden rounded-[1.8rem] shadow-inner relative group-hover:scale-[1.01] transition-transform duration-500">
                      <img src={post.mediaUrl} alt="PostContent" className="w-full h-full object-cover" />
                    </div>
                  </div>
                )}

                {/* Text Content */}
                {post.content && (
                  <div className="px-6 pb-4 text-sm text-gray-700 dark:text-gray-200 leading-[1.6] font-medium">
                    {post.content}
                  </div>
                )}

                {/* Premium Actions Bar */}
                <div className="flex items-center gap-2 px-4 py-4 border-t border-black/5 dark:border-white/5 bg-white/30 dark:bg-white/2">
                  <button
                    onClick={() => handleLike(post)}
                    disabled={likingId === post.id}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-full font-black text-xs transition-all active-scale',
                      liked
                        ? 'text-red-500 bg-red-500/10'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                    )}
                  >
                    <Heart size={18} className={cn('transition-all', liked && 'fill-red-500')} />
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 font-black text-xs transition-all active-scale">
                    <MessageCircle size={18} />
                  </button>

                  <button className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-brand transition-all ml-auto active-scale">
                    <Send size={18} />
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Desktop FAB (Optional but kept for quick access) */}
      <button
        onClick={() => setShowPostCreation(true)}
        className="hidden md:flex fixed bottom-10 right-10 w-16 h-16 bg-brand text-white rounded-full shadow-2xl shadow-brand/40 items-center justify-center hover:scale-110 active:scale-90 transition-all z-30"
      >
        <Plus className="w-7 h-7" strokeWidth={3} />
      </button>
    </div>
  );
};